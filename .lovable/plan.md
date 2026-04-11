

# Plan: Add QA Operating Schedule to Project Documentation

## What

Create a single new document `docs/qa/QA_OPERATING_SCHEDULE.md` that formalizes the weekly QA cadence, ownership model, and health alert response loop you've defined. This becomes the operational companion to `TRACEABILITY.md` (risk mapping) and `RELEASE_DISCIPLINE.md` (CI/merge policy).

## Why

The project has strong test infrastructure and traceability, but no documented **operating rhythm** — who does what, when, and how failures feed back into the system. This closes that gap.

## What the document will contain

1. **Daily (Automated)** — What CI/cron checks run, what triggers alerts, who responds
2. **Every PR** — What blocks merge, developer responsibility
3. **Post-merge to main** — Full suite confirmation, investigation ownership
4. **Weekly Manual QA (60–90 min)** — The four sections:
   - A: Mobile reality check (375px, toolbar overlap, keyboard, touch targets)
   - B: Core trust flows (signup → post → quote → messaging → status)
   - C: Role and permission enforcement (cross-role blocking)
   - D: "Feels broken" subjective check
   - Output format: ✅ Working / ⚠️ Feels off / ❌ Broken
5. **Pre-release gate** — Mandatory go/no-go checklist (references existing `RELEASE_DISCIPLINE.md`)
6. **Health alert response loop** — 3-step process linking back to `TRACEABILITY.md`
7. **Ownership table** — PR tests, CI failures, daily rotation, weekly QA, health alerts
8. **Feedback rule** — Every bug triggers "what test would have caught this?" and either a new test or a documented exception

## What will NOT change

- No code changes
- No test changes
- Existing docs (`TRACEABILITY.md`, `RELEASE_DISCIPLINE.md`, `ONBOARDING_QA_CHECKLIST.md`) remain unchanged — this document references them, not duplicates them

## Cross-references

- Weekly QA Section A references `ONBOARDING_QA_CHECKLIST.md` for onboarding-specific mobile checks
- Health alert loop references `TRACEABILITY.md` for risk-to-test mapping
- Pre-release gate references `RELEASE_DISCIPLINE.md` for merge policy and CI pipeline

## Deliverable

One file: `docs/qa/QA_OPERATING_SCHEDULE.md`

