

## Phase 4: Structured Quotes System (No Payments)

This plan adds a complete quotes workflow — pros submit structured proposals, clients compare and accept — upgrading the platform from raw messaging to a professional marketplace experience, without any payment/escrow complexity.

### Scope

**Database (2 migrations)**
**Frontend (new pages, components, actions, queries)**
**i18n (EN + ES keys)**

---

### Technical Detail

#### Migration 1: `quotes` table + RLS + status history trigger

```sql
-- quotes table
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  price_type text NOT NULL DEFAULT 'fixed',        -- fixed | estimate | hourly
  price_fixed numeric,
  price_min numeric,
  price_max numeric,
  hourly_rate numeric,
  time_estimate_days integer,
  start_date_estimate date,
  scope_text text NOT NULL DEFAULT '',
  exclusions_text text,
  status text NOT NULL DEFAULT 'submitted',         -- submitted | revised | accepted | rejected | withdrawn
  revision_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, professional_id, revision_number)
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Pros can insert quotes for jobs they have a conversation on
CREATE POLICY "Pros can insert own quotes" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (
    professional_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.job_id = quotes.job_id AND c.pro_id = auth.uid()
    )
  );

-- Pros can read their own quotes
CREATE POLICY "Pros can view own quotes" ON public.quotes
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

-- Pros can update own quotes (revise/withdraw)
CREATE POLICY "Pros can update own quotes" ON public.quotes
  FOR UPDATE TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- Clients can read all quotes on their jobs
CREATE POLICY "Clients can view quotes on own jobs" ON public.quotes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j WHERE j.id = quotes.job_id AND j.user_id = auth.uid()
    )
  );

-- Clients can update quote status (accept/reject)
CREATE POLICY "Clients can update quote status on own jobs" ON public.quotes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j WHERE j.id = quotes.job_id AND j.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j WHERE j.id = quotes.job_id AND j.user_id = auth.uid()
    )
  );

-- Admins full access
CREATE POLICY "Admins can manage all quotes" ON public.quotes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_admin_email())
  WITH CHECK (has_role(auth.uid(), 'admin') AND is_admin_email());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
```

#### Migration 2: Soft deletes on forum tables

```sql
ALTER TABLE public.forum_posts ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.forum_posts ADD COLUMN deleted_by uuid;
ALTER TABLE public.forum_replies ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.forum_replies ADD COLUMN deleted_by uuid;
```

---

#### Frontend Implementation Steps

1. **Create quote types** — `src/pages/jobs/types.ts` — add `Quote` type matching the DB schema

2. **Create quote query keys + queries** — `src/pages/jobs/queries/quotes.query.ts`
   - `useQuotesForJob(jobId)` — client sees all quotes on their job
   - `useMyQuoteForJob(jobId)` — pro sees their own quote

3. **Create quote actions** — `src/pages/jobs/actions/`
   - `submitQuote.action.ts` — pro submits a new quote
   - `reviseQuote.action.ts` — pro updates their quote (increments revision_number)
   - `acceptQuote.action.ts` — client accepts → sets quote status to `accepted`, rejects others, assigns pro to job, sets job status to `in_progress`
   - `withdrawQuote.action.ts` — pro withdraws their quote

4. **Create QuoteCard component** — `src/pages/jobs/components/QuoteCard.tsx`
   - Renders a single quote: price display (adapts to price_type), scope, exclusions, time estimate, status badge
   - Action buttons contextual to role (Accept/Reject for client, Revise/Withdraw for pro)

5. **Create SubmitQuoteForm component** — `src/pages/jobs/components/SubmitQuoteForm.tsx`
   - Price type selector (fixed/estimate/hourly)
   - Conditional fields based on type
   - Scope + exclusions textareas
   - Time estimate + optional start date

6. **Add QuotesTab to JobDetailsModal** — mount below the existing content or as a tabbed section
   - Client view: list of all quotes with accept/reject actions
   - Pro view: their quote (or submit form if none)

7. **Add "Submit Quote" button** to `JobDetailsActions` for pros (alongside existing "Message" button)

8. **Update `acceptQuote` action** to also call the existing `assignProfessional` logic (set `assigned_professional_id` + status `in_progress`)

9. **Add i18n keys** to `public/locales/en/jobs.json` and `public/locales/es/jobs.json` for all quote UI strings

10. **Update soft-delete logic** in `removeContent.action.ts` — SET `deleted_at`/`deleted_by` instead of DELETE, update forum queries to filter `WHERE deleted_at IS NULL`

---

#### State Machine (enforced in actions, not DB constraints)

```text
Quote:  submitted ──► revised ──► accepted
                  │            │
                  ├──► rejected
                  └──► withdrawn

Job (on quote accept):  open/posted ──► in_progress
```

#### What stays the same
- `assigned_professional_id` on `jobs` table remains as the convenience column (set when quote is accepted)
- No `job_assignments` table yet — overkill without payments
- No rate limiting table yet — defer to Phase 4.1 follow-up
- No flags table yet — defer to Phase 4.2

