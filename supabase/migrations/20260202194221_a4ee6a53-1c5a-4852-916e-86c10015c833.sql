-- Recreate job_details view with explicit boolean expression
drop view if exists public.job_details;

create view public.job_details
with (security_invoker = true)
as
select
  j.id,
  j.created_at,
  j.updated_at,
  j.status,
  j.title,
  j.description,
  j.teaser,
  j.highlights,
  j.category,
  j.subcategory,
  j.micro_slug,
  j.area,
  j.location,
  j.budget_type,
  j.budget_value,
  j.budget_min,
  j.budget_max,
  j.start_timing,
  j.start_date,
  j.has_photos,
  j.answers,
  j.is_publicly_listed,
  (auth.uid() is not null and auth.uid() = j.user_id) as is_owner
from public.jobs j
where j.is_publicly_listed = true;

grant select on public.job_details to authenticated;