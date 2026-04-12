

# Multi-Micro Matching + Location/Budget Filtering

## Summary

Three surgical upgrades to the matching engine. No UX changes. No new abstractions. Pure database-layer improvements that make the existing system match more accurately.

---

## What changes and why

### 1. Multi-micro matching via `job_micro_links` junction table

**Problem:** `buildJobInsert` stores only `microSlugs[0]` in `jobs.micro_slug` (line 325). A job selecting "shelving + painting + electrical" only matches professionals registered for the first micro.

**Fix:**
- Create `job_micro_links` table (`job_id uuid`, `micro_slug text`, with composite unique constraint)
- Add a database trigger `on_job_insert_or_update` that reads `answers->'selected'->'microSlugs'` and populates `job_micro_links` automatically — no wizard code changes needed
- Keep `jobs.micro_slug` as-is (first micro, used for display/legacy). `job_micro_links` becomes the canonical matching source
- RLS: public SELECT (same visibility as jobs), no direct INSERT/UPDATE/DELETE by users (trigger-managed)

### 2. Rewrite `matched_jobs_for_professional` view

**Current:** Single-slug join, no location or budget filtering.

**New view logic:**
```text
jobs
  JOIN job_micro_links jml ON jml.job_id = jobs.id
  JOIN service_micro_categories m ON m.slug = jml.micro_slug AND m.is_active
  JOIN professional_services ps ON ps.micro_id = m.id
  JOIN professional_profiles pp ON pp.user_id = ps.user_id
WHERE
  jobs.is_publicly_listed = true
  AND jobs.status = 'open'
  AND ps.user_id = auth.uid()
  -- Location filter: match if pro has no zones set OR job area overlaps pro zones
  AND (pp.service_zones IS NULL OR pp.service_zones = '{}' OR jobs.area = ANY(pp.service_zones))
```

Budget filtering uses `professional_micro_preferences.min_budget_eur`:
```text
  LEFT JOIN professional_micro_preferences pmp
    ON pmp.user_id = ps.user_id AND pmp.micro_id = m.id
  -- Budget filter: match if no pref set OR job max budget >= pro minimum
  AND (pmp.min_budget_eur IS NULL OR pmp.min_budget_eur = 0
       OR jobs.budget_max >= pmp.min_budget_eur
       OR jobs.budget_type = 'tbd')
```

This uses DISTINCT ON to avoid duplicates when a job links to multiple micros the same pro is registered for.

### 3. Backfill trigger + one-time migration

- One-time SQL to populate `job_micro_links` from existing `jobs.answers->'selected'->'microSlugs'` for all open jobs
- Trigger fires on INSERT and UPDATE of `jobs.answers` to keep `job_micro_links` in sync going forward

---

## What does NOT change

- Wizard UI — zero changes
- `buildJobInsert` — still writes `micro_slug` as first slug (backward compat)
- `jobs.answers` JSON structure — untouched
- `professional_matching_scores` view — untouched (it scores pros, not jobs)
- Frontend query code (`matchedJobs.query.ts`) — still reads from `matched_jobs_for_professional`, same columns
- `jobs.micro_slug` column — kept for display, card rendering, legacy queries

---

## Files affected

| Layer | Change |
|-------|--------|
| Migration 1 | Create `job_micro_links` table + RLS + index |
| Migration 2 | Create trigger `sync_job_micro_links` on `jobs` |
| Migration 3 | Backfill `job_micro_links` from existing jobs |
| Migration 4 | Replace `matched_jobs_for_professional` view with multi-micro + location + budget logic |
| No frontend changes | View returns same columns, consumed identically |

---

## Risk mitigation

- View returns same column set → no frontend breakage
- `DISTINCT ON (j.id)` prevents duplicate job rows when a pro matches on multiple micros
- Location filter is permissive (no zones set = match everything) → no pros lose visibility
- Budget filter is permissive (no pref set or TBD budget = match) → no jobs disappear
- Backfill is idempotent (ON CONFLICT DO NOTHING)
- Trigger is lightweight (JSONB array extract + batch upsert)

