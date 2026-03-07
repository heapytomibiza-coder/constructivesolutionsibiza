# ADR-002: Taxonomy-Driven Matching

**Status:** Accepted
**Date:** 2025-Q1
**Decision maker:** Founder / Engineering Lead

## Context

The platform needs to match client job posts to relevant professionals. Two approaches were considered:

1. **Keyword/full-text search** — Flexible but imprecise. Pros would get irrelevant matches ("plumber" matching "plumbing supplies store").
2. **Taxonomy-driven matching** — Structured 3-tier hierarchy where jobs and pros register against the same micro-categories.

## Decision

Use a 3-tier service taxonomy (`category → subcategory → micro`) as the matching backbone.

```
service_categories (16)
  └── service_subcategories
        └── service_micro_categories
              ↕
        professional_services (pro registers micro_ids)
              ↕
        jobs (job records micro_slug)
              ↕
        matched_jobs_for_professional (DB view joins them)
```

## Consequences

### Positive
- **Precision:** A plumber registered for "sink-leak-repair" only sees sink leak jobs, not general plumbing supply queries
- **Structured question packs:** Each micro can have its own question pack, producing richer job data
- **Matching is a DB view:** No application-level matching code. `matched_jobs_for_professional` is a simple JOIN that Postgres optimizes
- **Pro preferences:** `professional_micro_preferences` allows per-micro config (min budget, max distance)
- **Analytics:** Clean category/subcategory/micro dimensions for admin insights

### Negative
- **Taxonomy maintenance:** Adding new trades requires DB seeding. Can't self-serve (admin-only)
- **Coverage gaps:** If a job doesn't fit any micro, it falls to `custom` mode with no structured matching
- **Rigidity:** Real-world services don't always fit neat hierarchies (a "bathroom renovation" spans plumbing, tiling, electrical)

### Mitigations
- `custom` mode captures unmatched jobs with `is_custom_request: true` — these are analyzed to expand the taxonomy
- Multi-micro selection in wizard: a job can select multiple micros, matching to pros with any of them
- `service_search_index` view includes `search_text` for future hybrid search
- Taxonomy expansion tracked via `_pack_missing` flag on wizard submissions

## Related
- `docs/architecture/ai-wizard.md` — Question pack system built on taxonomy
- `src/domain/models.ts` — `ProblemCard.micros` contract
- `docs/architecture/data-flows.md` — Matching flow diagram
