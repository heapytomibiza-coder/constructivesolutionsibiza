-- =========================
-- 1) conversations table
-- =========================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,

  -- Participants: client = job owner, pro = initiator
  client_id uuid not null references auth.users(id) on delete cascade,
  pro_id uuid not null references auth.users(id) on delete cascade,

  -- Denormalized for inbox sorting
  last_message_at timestamptz,
  last_message_preview text,

  created_at timestamptz not null default now(),

  constraint conversations_unique_pair unique (job_id, client_id, pro_id),
  constraint conversations_no_self_chat check (client_id <> pro_id)
);

create index if not exists conversations_client_last_idx
  on public.conversations(client_id, last_message_at desc nulls last);

create index if not exists conversations_pro_last_idx
  on public.conversations(pro_id, last_message_at desc nulls last);

create index if not exists conversations_job_idx
  on public.conversations(job_id);

-- =========================
-- 2) messages table
-- =========================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at asc);

create index if not exists messages_sender_created_idx
  on public.messages(sender_id, created_at desc);

-- =========================
-- 3) last-message trigger
-- =========================
create or replace function public.set_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations c
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.body, 140)
  where c.id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists trg_set_conversation_last_message on public.messages;

create trigger trg_set_conversation_last_message
after insert on public.messages
for each row execute function public.set_conversation_last_message();

-- =========================
-- 4) RLS policies
-- =========================
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversations: participants can read
drop policy if exists conversations_select_participants on public.conversations;
create policy conversations_select_participants
on public.conversations
for select
using (auth.uid() = client_id or auth.uid() = pro_id);

-- Conversations: insert gated (must originate from a valid job; caller must be pro_id)
drop policy if exists conversations_insert_valid on public.conversations;
create policy conversations_insert_valid
on public.conversations
for insert
with check (
  auth.uid() = pro_id
  and exists (
    select 1
    from public.jobs j
    where j.id = job_id
      and j.user_id = client_id
      and j.is_publicly_listed = true
      and j.status = 'open'
  )
);

-- Conversations: participants can update (needed for last_message fields update)
drop policy if exists conversations_update_participants on public.conversations;
create policy conversations_update_participants
on public.conversations
for update
using (auth.uid() = client_id or auth.uid() = pro_id)
with check (auth.uid() = client_id or auth.uid() = pro_id);

-- Messages: participants can read
drop policy if exists messages_select_participants on public.messages;
create policy messages_select_participants
on public.messages
for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (auth.uid() = c.client_id or auth.uid() = c.pro_id)
  )
);

-- Messages: sender must be participant
drop policy if exists messages_insert_sender_participant on public.messages;
create policy messages_insert_sender_participant
on public.messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (auth.uid() = c.client_id or auth.uid() = c.pro_id)
  )
);

-- =========================
-- 5) get-or-create RPC
-- =========================
create or replace function public.get_or_create_conversation(
  p_job_id uuid,
  p_pro_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_conversation_id uuid;
begin
  -- job must be open and publicly listed
  select user_id into v_client_id
  from public.jobs
  where id = p_job_id
    and is_publicly_listed = true
    and status = 'open';

  if v_client_id is null then
    raise exception 'Job not found or not available';
  end if;

  -- caller must be pro
  if auth.uid() <> p_pro_id then
    raise exception 'Not authorized';
  end if;

  -- cannot message your own job
  if auth.uid() = v_client_id then
    raise exception 'Cannot message your own job';
  end if;

  -- existing conversation?
  select id into v_conversation_id
  from public.conversations
  where job_id = p_job_id
    and client_id = v_client_id
    and pro_id = p_pro_id;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  -- create
  insert into public.conversations(job_id, client_id, pro_id)
  values (p_job_id, v_client_id, p_pro_id)
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

-- =========================
-- 6) enable realtime
-- =========================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;