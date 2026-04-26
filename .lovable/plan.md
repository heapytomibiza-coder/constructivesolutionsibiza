## Track 3B Refinement — Suggestion Quality (Non-Regressive)

Replace `public.generate_job_classification_suggestions(uuid)` only. No schema, table, trigger, RLS, matching-engine, or `job_micro_links` changes.

### Behavior contract (in priority order)

1. **No-overwrite guard** — if a suggestion row already exists for the job, return the latest `suggested_micro_slugs` and do nothing.
2. **Direct text-match pass** — current behavior preserved (job text vs. micro slug/name).
3. **Curated keyword map** — preserved as currently live, with two refinements:
   - `leak` group tightened: only `fix-leak`, `burst-pipe`, `pipe-repair`, `ac-leak-detection-repair` (no broad `%water%` slug expansion).
   - All other groups unchanged: drain, burst pipe, pipe, toilet, sink, shower, tap, bathroom, boiler.
4. **Category/subcategory fallback** — preserved.
5. **Alphabetical "first active micro" safety fallback** — **REMOVED**. Jobs with no match will be saved with an empty `suggested_micro_slugs` array.
6. **Hard cap of 5** — preserved.
7. **`reasoning_summary`** — populated on insert (column already exists, nullable). Examples: `"text-match"`, `"keyword: drain"`, `"category fallback"`, `"no match"`.
8. **`model_name = 'heuristic-v1'`** — preserved.

### Test plan (live verification, no new test data)

After applying:

1. Confirm function exists and signature unchanged.
2. Generate-and-inspect on real custom jobs without existing suggestions:
   - A job whose text matches a keyword group → expect curated slug(s).
   - A job whose text matches none but has a `category`/`subcategory` → expect category fallback slugs.
   - A job that matches neither → expect empty array + `reasoning_summary = 'no match'`.
3. Confirm previously generated rows (`Drain blocked`, `Desk & Cabinets`, `Perspex`) are untouched.

### Out of scope

- Auto-applying suggestions to jobs.
- Modifying `job_micro_links`, matching logic, triggers, RLS.
- Changing the table schema.
- Replacing or deleting any existing suggestion rows.

### Technical notes

- Function body uses static SQL (no `EXECUTE`) since the schema columns we depend on (`model_name`, `reasoning_summary`, `accepted_at`) are already confirmed present in this database.
- `model_name` column is `NOT NULL` — insert always sets `'heuristic-v1'`.
- `reasoning_summary` is nullable but will always be populated for traceability.
- All slug picks are validated to exist and be active in `public.service_micro_categories` before being added to the result.
- Result deduplicated and capped to 5.

### Reporting after apply

Migration applied: YES/NO
Verification passed: YES/NO
Examples tested (with returned slugs):
- keyword-match job
- category-fallback job
- no-match job
Errors/blockers:
SAFE TO DEPLOY: YES/NO