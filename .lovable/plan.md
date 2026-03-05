

## Constructive Solutions Ibiza -- Architecture Pack

This is a documentation deliverable, not a code change. I will create a single comprehensive architecture document at `docs/ARCHITECTURE_PACK.md` that serves as the master blueprint.

### What it covers (5 sections)

**Section 1 -- Swimlane User Journeys**
Four lanes: Public, Client (Asker), Professional (Tasker), System. Traces every journey from landing to completion using the actual routes and components that exist today. Clearly marks what is live now (`pipe-control`) versus gated behind future rollout phases.

**Section 2 -- Route Map by Lane**
Every route from `App.tsx` and `registry.ts`, tagged with: lane, access rule, guard, rollout gate, and entry points. Grouped by Public / Auth / Client / Professional / Admin / Shared.

**Section 3 -- Feature-to-Page Matrix**
The missing piece. A table mapping every page to: the feature systems it uses, the DB tables/views it touches, and what data it creates or changes. Built from actual component imports and query files.

**Section 4 -- Job Lifecycle State Machine**
Formal state machine using the canonical statuses from `job-status-state-machine` memory: `draft` -> `posted` -> `in_review` -> `live` -> `locked` -> `in_progress` -> `completed` -> `cancelled` -> `disputed`. Plus quote states and who controls each transition.

**Section 5 -- Data Spine**
Core tables grouped by system (Identity, Taxonomy, Jobs, Messaging, Quotes, Reviews, Admin), showing relationships through `job_id`, `user_id`, `professional_id`.

### Rollout awareness
Each section clearly marks items as:
- **LIVE** (pipe-control phase)
- **GATED** (founding-members, service-layer, etc.)
- **PLANNED** (not yet built: payments, escrow, disputes)

### File created
- `docs/ARCHITECTURE_PACK.md` -- single source of truth, versioned in repo

This is a Markdown document with ASCII tables and text diagrams. No code changes to the application.

