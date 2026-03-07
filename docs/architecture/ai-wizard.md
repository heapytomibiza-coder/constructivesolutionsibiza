# AI Wizard Architecture

**Last updated:** 2026-03-07
**Owner:** Engineering Lead

## Purpose

Document the job wizard's intelligent question system, taxonomy-driven matching, and future AI/agent patterns. This is the platform's core IP.

## Scope

Covers the `CanonicalJobWizard`, question pack system, answer resolution, matching engine, and planned AI enhancements.

## Current State

The wizard is a 7-step flow that transforms unstructured human input into a structured `ProblemCard` (see `src/domain/models.ts`). It uses a 3-tier service taxonomy and dynamic question packs loaded from the database.

## Core Components

### 1. Wizard Steps

Defined in `src/features/wizard/canonical/types.ts`:

| Step | Enum | Purpose |
|------|------|---------|
| 1 | `WizardStep.Category` | Select service category (16 groups) |
| 2 | `WizardStep.Subcategory` | Narrow to subcategory |
| 3 | `WizardStep.Micro` | Select specific micro-task(s) |
| 4 | `WizardStep.Questions` | Answer dynamic question pack |
| 5 | `WizardStep.Logistics` | Location, timing, budget |
| 6 | `WizardStep.Extras` | Photos, notes, description |
| 7 | `WizardStep.Review` | Review and submit |

### 2. Three-Tier Taxonomy

```
service_categories          (e.g., "Plumbing")
  └── service_subcategories (e.g., "Leak Repair")
        └── service_micro_categories (e.g., "Sink Leak Repair")
```

**Tables:**
- `service_categories` — 16 active groups with `slug`, `icon_emoji`, `category_group`
- `service_subcategories` — linked via `category_id`
- `service_micro_categories` — linked via `subcategory_id`, keyed by `slug`

**Search view:** `service_search_index` — denormalized join producing `micro_id`, `micro_slug`, `micro_name`, `subcategory_name`, `category_name`, `search_text`, `has_pack`

### 3. Question Pack System

**Table:** `question_packs`
- Keyed by `micro_slug` (one active pack per micro)
- `questions` column: JSON array of question definitions
- `version` column: pack versioning for iteration
- `metadata` column: optional pack-level config

**Question pack seeding:** `supabase/functions/_shared/` contains 20+ pack definition files organized by trade:
- `electricalQuestionPacks.ts`
- `plumbingQuestionPacks.ts`
- `carpentryQuestionPacksV2.ts`
- `cleaningQuestionPacksV2.ts`
- `gardeningLandscapingQuestionPacksV2.ts`
- `poolSpaQuestionPacksV2.ts`
- `hvacQuestionPacks.ts`
- `kitchenBathroomQuestionPacks.ts`
- etc.

Seeded via `supabase/functions/seedpacks/index.ts`.

**Question types supported:**
- `select` — single choice
- `multi_select` — multiple choice
- `text` — free text
- `number` — numeric input
- `boolean` — yes/no toggle
- Conditional rendering via `show_if` / `dependsOn` fields

### 4. Answer Resolution

**Canonical schema** (from `src/features/wizard/canonical/types.ts`):

```typescript
type WizardAnswers = {
  microAnswers: Record<string, Record<string, unknown>>;
  _pack_source?: 'strong' | 'generic' | 'fallback';
  _pack_slug?: string | null;
  _pack_missing?: boolean;
};
```

- `microAnswers` is keyed by micro slug, containing per-question answers
- `_pack_source` tracks whether a strong pack, generic pack, or fallback was used
- Stored in `jobs.answers` as JSON

**Answer display:** `src/features/wizard/canonical/lib/` contains `answerResolver` utilities that map stored answer keys back to human-readable labels for the review step and job detail pages.

### 5. Wizard Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| `structured` | Taxonomy match found | Full 7-step flow with question packs |
| `custom` | No taxonomy match or user opts out | Freeform: title, description, specs |

Mode resolution: `src/features/wizard/canonical/lib/resolveWizardMode.ts`
- `resolveWizardMode()` — determines structured vs custom
- `applySearchResult()` — hydrates wizard state from search selection
- `deriveStepFromState()` — calculates current step from filled state

### 6. Draft Persistence & Resume

- **Hook:** `src/features/wizard/canonical/hooks/useWizardDraft.ts`
- **Storage:** sessionStorage (browser-local, survives page refresh)
- **Auth redirect:** `resume=true` URL param preserves draft across login flow
- **URL sync:** `src/features/wizard/canonical/hooks/useWizardUrlStep.ts` — bidirectional step ↔ URL param sync with `isInitialized` guard to prevent race conditions

### 7. Submission Pipeline

```
WizardState → buildJobInsert() → jobs INSERT → DB trigger → job_notifications_queue
```

- `buildJobInsert()` in `src/features/wizard/canonical/lib/buildJobPayload.ts`
- `buildIdempotencyKey()` prevents duplicate submissions
- `validateWizardState()` pre-flight validation

## Design Decisions

- **Taxonomy-driven, not keyword-driven:** Jobs match to professionals via `micro_slug` ↔ `professional_services.micro_id`, not free-text search. This ensures precision.
- **Question packs are data, not code:** Packs live in the database, not hardcoded. New trades can be added without deploying code.
- **Pack source tracking:** The `_pack_source` field preserves provenance so we can measure question pack coverage and quality.
- **CanonicalJobWizard is immutable core IP:** The wizard component and its types are the most protected code in the platform. Changes require careful review.

## Failure Modes / Risks

- **Missing question pack:** If no pack exists for a micro_slug, wizard falls back to generic questions. `_pack_missing: true` is recorded.
- **Draft loss on browser crash:** sessionStorage doesn't survive browser crashes. Future: server-side draft persistence.
- **Taxonomy gaps:** If a user's need doesn't map to any micro, the `custom` mode captures it as freeform. These custom requests are flagged with `is_custom_request: true` for taxonomy expansion analysis.

## Diagram: Question Pack Resolution

```
User selects micro(s)
        │
        ▼
useQuery('question_packs', { micro_slug })
        │
        ├── Pack found → _pack_source = 'strong'
        │                 Render QuestionPackRenderer
        │
        ├── Generic pack → _pack_source = 'generic'
        │                   Render generic questions
        │
        └── No pack → _pack_source = 'fallback'
                       _pack_missing = true
                       Skip to Logistics step
```

## Future Considerations

### Near-term (Phase 2-3)

- **AI-generated job titles/teasers:** Use answers to auto-generate `title` and `teaser` fields
- **Smart budget suggestions:** Based on historical job data for the same micro
- **Pack quality scoring:** Track completion rates per pack to identify confusing questions

### Medium-term (Agentic patterns)

- **Multi-step prompt pipelines:** Chain LLM calls: raw input → structured extraction → category suggestion → question selection
- **AI job card generation:** Transform wizard answers into polished job descriptions
- **Intelligent matching scoring:** Weight matches by pro stats, zone proximity, response time, and job fit
- **Anomaly detection:** Flag unusual jobs (pricing outliers, safety concerns) before publishing

### Long-term (Agent architecture)

- **Intake agent:** Conversational job posting via chat instead of form wizard
- **Matching agent:** Proactively suggest professionals based on job characteristics
- **Quality agent:** Review completed jobs and trigger appropriate follow-ups
- **Learning loop:** Feed review data back to improve matching scores and question packs

## Related Files

- `src/features/wizard/canonical/` — Complete wizard implementation
- `src/domain/models.ts` — `ProblemCard` contract
- `supabase/functions/_shared/*QuestionPacks*.ts` — Pack definitions
- `supabase/functions/seedpacks/index.ts` — Pack seeding function
- `docs/architecture/data-flows.md` — Job posting sequence diagram
