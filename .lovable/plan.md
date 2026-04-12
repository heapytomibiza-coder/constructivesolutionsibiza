

# AI Agent Rollout Plan — Constructive Solutions Ibiza

Technical implementation plan for 7 AI agents, grounded in the current production architecture. No redesign. No drift.

---

## Agent-by-Agent Specifications

---

### Agent 1: Job Title/Teaser Generator

**1. Purpose**
- Generates polished `title` and `teaser` from structured wizard answers, replacing the current mechanical concatenation in `buildJobPayload.ts` (lines 280-300)
- Benefits clients (better job cards) and professionals (clearer job scanning)
- Fits existing fire-and-forget pattern (identical to `translate-content`)

**2. Trigger**
- Async, fire-and-forget after job INSERT (same call site as `translate-content` at line 947 of `CanonicalJobWizard.tsx`)
- Back-office only — client never waits for it

**3. Inputs**
- `jobs.answers` JSONB (selected micros, microAnswers, logistics, extras)
- `jobs.category`, `jobs.subcategory`, `jobs.micro_slug`
- `jobs.area`

**4. Output**
- JSON: `{ title: string, teaser: string }`
- Written to existing `jobs.title` and `jobs.teaser` columns via service-role UPDATE
- Also updates `title_i18n`/`teaser_i18n` source-lang entry so translate-content picks up the polished version

**5. Schema impact**
- None. Uses existing columns. Add `ai_generated_title: boolean` column (nullable, default null) for audit/rollback — justified by needing to distinguish AI vs user-written titles.

**6. Safety / guardrails**
- Must never override a user-edited title (check `edit_version > 0` before writing)
- Falls back silently — if AI fails, the mechanical title from `buildJobPayload` remains
- Custom requests (`is_custom_request = true`) use `answers.custom.jobTitle` as-is — agent skips these

**7. Implementation steps**
1. Create `supabase/functions/generate-job-content/index.ts` — edge function using `gemini-2.5-flash-lite` with tool calling to return structured `{ title, teaser }`
2. Migration: `ALTER TABLE jobs ADD COLUMN ai_generated_title boolean DEFAULT null`
3. Add fire-and-forget call in `CanonicalJobWizard.tsx` after the existing `translate-content` call
4. Call order: INSERT → generate-job-content → translate-content (chain the translation after AI title is written)

**8. Recommendation: Build now**

---

### Agent 2: Worker Brief Generator

**1. Purpose**
- Generates a 2-3 sentence professional-facing summary from job answers, giving pros quick context without reading raw wizard data
- Benefits professionals (faster job assessment)
- Same pattern as translate-content

**2. Trigger**
- Async, fire-and-forget, triggered alongside Agent 1 (or chained after it)
- Pro-facing — displayed on job detail view

**3. Inputs**
- `jobs.answers` JSONB
- `jobs.title`, `jobs.area`, `jobs.budget_min`, `jobs.budget_max`, `jobs.flags`, `jobs.computed_safety`
- Micro names from `job_micro_links`

**4. Output**
- Plain text brief (max 300 chars)
- Stored in new `jobs.worker_brief` column

**5. Schema impact**
- `ALTER TABLE jobs ADD COLUMN worker_brief text DEFAULT null` — justified because this is a distinct audience-specific output, not a duplicate of `description`

**6. Safety / guardrails**
- Read-only for professionals — they cannot edit it
- Never replaces `description` — separate display slot
- Fails silently; pro sees standard job details if brief is null

**7. Implementation steps**
1. Migration: add `worker_brief` column
2. Add generation logic to `generate-job-content` edge function (same function as Agent 1, second output field)
3. Display in `JobDetailContent.tsx` in a "Quick Summary" section visible only to authenticated professionals

**8. Recommendation: Build now** (ships with Agent 1 as a single edge function)

---

### Agent 3: Custom Request Classifier

**1. Purpose**
- When `is_custom_request = true`, suggests a taxonomy mapping (category/subcategory/micro) for admin review
- 13 of 48 open jobs are custom requests — prevents taxonomy gaps from growing silently

**2. Trigger**
- Async, on job INSERT where `is_custom_request = true`
- Admin-facing only — suggestion displayed in admin job review

**3. Inputs**
- `jobs.answers.custom.jobTitle`, `jobs.answers.custom.description`, `jobs.answers.custom.specs`
- `jobs.category` (if set)
- Full taxonomy from `service_search_index` view (passed as context to LLM)

**4. Output**
- JSON: `{ suggested_category, suggested_subcategory, suggested_micro_slug, confidence, reasoning }`
- Stored in new `jobs.ai_classification` JSONB column (nullable)
- Admin reviews and can apply or dismiss

**5. Schema impact**
- `ALTER TABLE jobs ADD COLUMN ai_classification jsonb DEFAULT null` — justified as a staging area for admin review, not a duplicate data model

**6. Safety / guardrails**
- Never auto-applies classification — admin must explicitly accept
- Never modifies `answers`, `micro_slug`, or `job_micro_links` directly
- If admin accepts, an explicit admin action updates `category`/`subcategory`/`micro_slug` and re-triggers `trg_sync_job_micro_links`

**7. Implementation steps**
1. Create `supabase/functions/classify-custom-request/index.ts`
2. Migration: add `ai_classification` column
3. Add conditional fire-and-forget call in `CanonicalJobWizard.tsx` when `is_custom_request = true`
4. Add classification review UI in admin job detail view

**8. Recommendation: Build next**

---

### Agent 4: Quote Quality Coach

**1. Purpose**
- When a pro submits a quote, provides advisory feedback (missing info, unclear scope, pricing gaps)
- Benefits professionals (better quotes) and clients (more useful responses)

**2. Trigger**
- Synchronous response after pro clicks "Submit Quote" but before final confirmation
- Pro-facing — advisory suggestions displayed in a review step

**3. Inputs**
- Quote fields from `ProposalBuilder.tsx`: `scope_text`, `line_items[]`, `price_fixed`, `exclusions_text`
- Job context: `jobs.answers`, `jobs.title`, `jobs.flags`, `jobs.budget_min/max`

**4. Output**
- JSON: `{ suggestions: Array<{ type: 'missing'|'unclear'|'pricing', message: string }>, overall_quality: 'good'|'needs_attention' }`
- Ephemeral — displayed in UI only, never stored
- Pro can dismiss and submit anyway

**5. Schema impact**
- None. Fully ephemeral.

**6. Safety / guardrails**
- Advisory only — never blocks submission
- Never modifies quote data
- Pro can skip/ignore all suggestions
- Must not add latency > 3s (use `gemini-2.5-flash-lite`)

**7. Implementation steps**
1. Create `supabase/functions/coach-quote/index.ts`
2. Add review step in `ProposalBuilder.tsx` — after pro fills form, before submit, call coach function and display suggestions
3. "Submit anyway" always available

**8. Recommendation: Later** (requires UX design for the coaching UI; not a fire-and-forget pattern)

---

### Agent 5: Smart Budget Suggestion

**1. Purpose**
- At wizard Logistics step, suggests a budget range based on historical data for same micro-services
- Benefits clients (reduces "TBD" budget selections — currently 18 of 48 open jobs have no budget)

**2. Trigger**
- Synchronous, user-facing — called when user reaches Step 5 (Logistics) with micro selections
- Suggestion only, user always overrides

**3. Inputs**
- Selected `microSlugs[]` from wizard state
- `jobs.area` (location)
- Historical: `SELECT avg(budget_min), avg(budget_max), count(*) FROM jobs WHERE micro_slug = ANY($1) AND budget_type != 'tbd' AND status IN ('open','completed')`

**4. Output**
- JSON: `{ suggested_min: number, suggested_max: number, data_points: number, confidence: 'low'|'medium'|'high' }`
- Ephemeral — displayed as helper text in budget selector, never stored

**5. Schema impact**
- None. Pure read + computation.

**6. Safety / guardrails**
- Never pre-fills budget — only shows "Similar jobs: €X – €Y"
- Shows "Not enough data" if `data_points < 3`
- Does not use AI — pure SQL aggregation via RPC function

**7. Implementation steps**
1. Create RPC function `get_budget_suggestion(p_micro_slugs text[], p_area text)` — pure SQL, no AI needed
2. Add query hook `useBudgetSuggestion` in wizard Logistics step
3. Display as muted helper text below budget selector

**8. Recommendation: Build next** (high impact, no AI cost, pure SQL)

---

### Agent 6: Job Quality Gate

**1. Purpose**
- After job submission, scores job quality and flags specific issues (vague scope, missing details, unrealistic budget)
- Benefits admins (prioritize review) and marketplace quality

**2. Trigger**
- Async, on job INSERT — extends the existing `trg_evaluate_pack_rules` pattern
- Admin-facing — score visible in admin job list

**3. Inputs**
- `jobs.title`, `jobs.description`, `jobs.answers`, `jobs.flags`, `jobs.budget_min/max`, `jobs.has_photos`
- Pack rules output (`computed_safety`, `computed_inspection_bias`)

**4. Output**
- JSON: `{ quality_score: number (0-100), issues: Array<{ code: string, severity: string, message: string }> }`
- Stored in existing `jobs.job_score` column (already exists, currently nullable) + new `jobs.quality_issues` JSONB column

**5. Schema impact**
- `ALTER TABLE jobs ADD COLUMN quality_issues jsonb DEFAULT null`
- Uses existing `job_score` column (already in schema)

**6. Safety / guardrails**
- Never blocks job publication — advisory only
- Low scores flag for admin review, not auto-hide
- Must run after `trg_evaluate_pack_rules` to use its outputs
- Must never overwrite `flags[]` or `computed_*` columns

**7. Implementation steps**
1. Create `supabase/functions/score-job-quality/index.ts`
2. Migration: add `quality_issues` column
3. Fire-and-forget call after job INSERT (in `CanonicalJobWizard.tsx`)
4. Display score + issues in admin job detail view
5. Add sortable `job_score` column to admin jobs table

**8. Recommendation: Later** (depends on having enough job volume to calibrate scoring thresholds)

---

### Agent 7: Stalled Conversation Intervention

**1. Purpose**
- Enhances existing `conversation_stale` nudge with AI-generated contextual messages instead of static templates
- Benefits clients and pros (more relevant follow-up nudges)

**2. Trigger**
- Cron-based — extends existing `process-nudges` edge function (runs every 15 min)
- Back-office only

**3. Inputs**
- `nudge_type = 'conversation_stale'` candidates from `get_pending_nudges()` RPC
- `jobs.title`, `jobs.answers`, `jobs.area`
- Last message timestamp from conversation

**4. Output**
- Contextual nudge `subject` and `body` text replacing the static `TEMPLATES.conversation_stale` template
- Written to `email_notifications_queue` (existing pattern)

**5. Schema impact**
- None. Uses existing nudge infrastructure entirely.

**6. Safety / guardrails**
- Falls back to static template if AI fails
- Same deduplication via `nudge_log` unique index — no risk of double-sending
- Must not increase nudge frequency — same cron schedule, same candidate query

**7. Implementation steps**
1. Modify `process-nudges/index.ts` — for `conversation_stale` type, call AI Gateway to generate contextual subject/body before enqueueing
2. Add fallback: if AI call fails or times out (>2s), use existing static template
3. No frontend changes

**8. Recommendation: Do not build yet** (static templates are working; AI nudges add cost per nudge with unclear ROI until nudge engagement is measured)

---

## Summary Tables

### A. Ranked Agents

| Rank | Agent | Classification | Risk | Effort |
|------|-------|---------------|------|--------|
| 1 | Job Title/Teaser Generator | Build now | Low | Small |
| 2 | Worker Brief Generator | Build now | Low | Small (ships with #1) |
| 3 | Smart Budget Suggestion | Build next | Low | Small (pure SQL) |
| 4 | Custom Request Classifier | Build next | Medium | Medium |
| 5 | Quote Quality Coach | Later | Low | Medium (UX design needed) |
| 6 | Job Quality Gate | Later | Medium | Medium (calibration needed) |
| 7 | Stalled Conversation Intervention | Do not build yet | Low | Small (but unclear ROI) |

### B. Recommended First 3

1. **Job Title/Teaser + Worker Brief** — single edge function, two outputs, fire-and-forget, immediate impact on every job
2. **Smart Budget Suggestion** — pure SQL RPC, no AI cost, reduces TBD budgets, improves matching
3. **Custom Request Classifier** — AI-powered but admin-gated, prevents taxonomy drift

### C. Rollout Order

```text
Phase 1 (immediate)
  ├── Migration: add ai_generated_title, worker_brief columns
  ├── Edge function: generate-job-content
  └── Frontend: fire-and-forget call + worker brief display

Phase 2 (next sprint)
  ├── RPC: get_budget_suggestion
  ├── Hook: useBudgetSuggestion
  └── Frontend: budget helper in wizard Step 5

Phase 3 (following sprint)
  ├── Migration: add ai_classification column
  ├── Edge function: classify-custom-request
  └── Frontend: admin classification review UI

Phase 4 (when volume justifies)
  ├── Edge function: coach-quote
  ├── Frontend: quote review step in ProposalBuilder
  ├── Migration: add quality_issues column
  └── Edge function: score-job-quality
```

### D. Schema Changes Required

| Column | Table | Type | Phase | Justification |
|--------|-------|------|-------|---------------|
| `ai_generated_title` | `jobs` | `boolean DEFAULT null` | 1 | Distinguish AI vs user titles for audit/rollback |
| `worker_brief` | `jobs` | `text DEFAULT null` | 1 | Distinct audience-specific output, not a duplicate of description |
| `ai_classification` | `jobs` | `jsonb DEFAULT null` | 3 | Staging area for admin-reviewed taxonomy suggestions |
| `quality_issues` | `jobs` | `jsonb DEFAULT null` | 4 | Structured issue list for admin quality dashboard |

No new tables. No new views. No changes to existing columns.

### E. Risks / Conflicts

| Risk | Severity | Mitigation |
|------|----------|------------|
| Agent 1 overwrites user-edited title | High | Guard: skip if `edit_version > 0` |
| Translation runs before AI title is ready | Medium | Chain: generate-job-content completes → then fire translate-content |
| AI classification auto-applied without admin review | High | Schema: `ai_classification` is inert JSONB; explicit admin action required to apply |
| Quote coach adds latency to submission flow | Medium | Hard timeout 3s; "Submit anyway" always available |
| Budget suggestion shows misleading ranges with low data | Low | Suppress when `data_points < 3` |
| No conflicts with `trg_evaluate_pack_rules`, `trg_sync_job_micro_links`, or `matched_jobs_for_professional` | — | All agents write to separate columns; none modify protected fields |

