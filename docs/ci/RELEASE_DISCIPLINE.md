# Release Discipline — CI & Test Policy

**Last updated:** 2026-04-11

## Critical Flows

The following flows are designated **critical** and require full safeguards before any change ships:

| Flow | Why |
|------|-----|
| Professional onboarding | Converts professionals onto the platform |
| Job posting wizard | Core client action — creates marketplace supply |
| Messaging | Trust and engagement between client and professional |
| Payments / holding | Financial integrity and legal compliance |

### What "critical flow" means

Any change to a critical flow **must** satisfy all of the following before merge:

1. **Automated test coverage** — smoke + interaction tests exist and pass
2. **Manual mobile QA** — completed on a real device or emulator at 375px viewport (hard gate — not optional)
3. **Migration handling** — if the change restructures steps or data, users mid-flow must be explicitly handled
4. **Post-release validation (24h)** — within 24 hours of deploy, verify that in-progress users are not blocked

Failure to meet these standards is a **merge blocker**.

---

## Onboarding Test Coverage — Current Status

### What is protected (initial coverage)

| Area | Type | Status |
|------|------|--------|
| Render safety (all steps) | Smoke | ✅ |
| Auth guard (unauthenticated redirect) | Smoke | ✅ |
| Loading states | Smoke | ✅ |
| Phase progression logic (normalizePhase, nextPhase, phaseIndex) | Unit | ✅ |
| Phase regression prevention | Unit | ✅ |
| isPhaseReady threshold | Unit | ✅ |
| canGoLive 4-condition validation | Unit | ✅ |
| Review step render + disabled button | Smoke | ✅ |
| BasicInfoStep render | Smoke | ✅ |
| Regression: user with name+phone but NULL zones | Interaction | ✅ |
| Complete data scenario | Interaction | ✅ |
| Missing phone scenario (no crash) | Interaction | ✅ |
| Phase-to-step mapping validation | Interaction | ✅ |

### What is NOT yet covered (known gaps)

| Area | Type needed | Status |
|------|-------------|--------|
| Full end-to-end completion (save → advance → go-live) | Integration | ❌ |
| Fix flow recovery (Review → Fix missing item → return to Review) | Integration | ❌ |
| Refresh/state persistence across page reload | Integration | ❌ |
| Backfilled user go-live path | Integration | ❌ |
| Mobile layout verification (scroll, viewport, touch) | Browser/Manual | ❌ |

**These gaps require either deeper integration test mocks or real browser-based testing.**
jsdom cannot and will never catch scroll position, viewport visibility, or touch interaction failures.

---

## Mobile QA — Hard Gate

Since the April 2026 onboarding failure was **primarily a mobile issue** (zones below the fold, scroll-dependent elements invisible), the following rule is permanent:

> **Any PR that touches professional onboarding MUST include manual mobile QA at 375px viewport before merge.**

This is not optional. jsdom tests provide logic coverage only — they cannot verify:
- Elements below the fold
- Scroll-dependent visibility
- Touch target sizes
- Collapsible component behavior on small screens
- Form submission with virtual keyboards open

Mobile QA must verify:
- [ ] All required fields visible without scrolling past the submit button
- [ ] Zone picker visible and functional
- [ ] Validation errors visible on screen (not hidden by scroll)
- [ ] Submit button state reflects actual form completeness
- [ ] Review checklist items each independently clickable

---

## Alert Rules

### Onboarding Bottleneck (RED — rate-based)

**Rule:** More than 5 professionals stuck at the **same phase within the last 24 hours**.

**What it detects:** Whether new stuck users are accumulating at a specific step. This is designed to catch systemic issues early, before they become a backlog.

**Logic:** Counts users whose `updated_at` is within the last 24 hours but more than 1 hour ago, grouped by phase. The 1-hour buffer excludes users who are still actively progressing.

**Action:** Same-day investigation via the onboarding funnel page.

### Stuck Onboarding (YELLOW — snapshot)

**Rule:** Any professionals stuck in onboarding for 6+ hours.

**What it detects:** General awareness of the stuck-user backlog. This may include users who abandoned intentionally.

**Action:** Review during the daily check.

### Daily Funnel Check (baseline protection)

Even if no alerts fire, the onboarding funnel **must be checked once per day**.

**Purpose:** Alerts catch spikes and systemic failures. Daily checks catch **slow leaks and gradual drop-off** that never crosses an alert threshold.

**This check should confirm:**

- Step-to-step conversion looks normal
- There is no unexpected drop-off at any step
- There is no small accumulation of stuck users that has not yet triggered an alert

**This protects against both:**

- Sudden failures → caught by alerts
- Gradual degradation → caught by daily review

This is a **lightweight but non-negotiable baseline**.

---

## Build vs Live Responsibility

### Why this exists

The onboarding failure happened because:
- The system was built without full protection
- Nobody was explicitly responsible for checking it live
- Users got stuck and we did not see it early

Saying "we both own it" creates a gap. This section closes that gap by assigning **clear responsibility at specific moments**.

### 1. Build Responsibility (Lovable)

Before any change to a critical flow ships, Lovable is responsible for:

- Implementing the change
- Adding or updating automated tests
- Ensuring validation is strict and visible
- Running through the flow end-to-end before release
- Confirming mobile behaviour at 375px is usable
- Ensuring alerts and tracking are in place

**This must be confirmed explicitly before release.**

### 2. Live Responsibility (Product Owner — Me)

After release, I am responsible for:

- Checking the flow in production within 24 hours
- Reviewing the funnel for step progression and drop-off
- Checking for stuck users
- Verifying alerts are clean
- Flagging abnormal behaviour immediately

### Non-negotiable rule

Any change to a critical flow **must** have:

- ✅ A confirmed Build Responsibility checklist before release
- ✅ A confirmed Live Responsibility check within 24 hours of going live
- ✅ Both roles explicitly assigned with no ambiguity

---

## Responsibility Cadence

| Responsibility | Responsible | Cadence |
|---------------|-------------|---------|
| Respond to bottleneck alerts (red) | Product Owner (Me) | **Same day** |
| Respond to stuck onboarding alerts (yellow) | Product Owner (Me) | **Same day** |
| Daily funnel check (baseline) | Product Owner (Me) | **Daily** |
| Post-release validation after any onboarding change | Product Owner (Me) | **Within 24 hours** |
| Daily funnel checks after an onboarding release | Product Owner (Me) | **Daily for 5 business days** |
| Update test coverage when onboarding logic changes | Lovable | **Before merge** |
| Ensure alerts and tracking are in place | Lovable | **Before merge** |

### What post-release validation means

Within 24 hours of any deploy that touches onboarding:
1. Check the funnel page — are step-to-step drop-offs normal?
2. Check stuck-user counts — is anything accumulating?
3. Check error logs — are onboarding failures readable and actionable?
4. Manually run through onboarding on mobile (375px) to confirm the flow works end-to-end

---

## Test Suite Structure

```
src/test/
├── smoke/              ← Route stability, render safety, state resilience
│   ├── auth             (6 tests)
│   ├── messages         (4 tests)
│   ├── post             (10 tests)
│   ├── dashboard        (6 tests)
│   ├── guards           (9 tests)
│   ├── wizard-progression (10 tests)
│   └── onboarding       (11 tests)
│
├── interaction/        ← User journey simulations, connected-unit behavior
│   ├── wizard-flow      (9 tests)
│   ├── auth-redirect    (6 tests)
│   ├── dashboard-action (4 tests)
│   └── onboarding-flow  (5 tests)
│
└── access.test.ts      ← Access control unit tests (8 tests)
```

**Total: 89 tests across 13 files**

---

## CI Pipeline

### What runs when

| Trigger         | Smoke | Interaction | Type Check | Full Suite |
|-----------------|-------|-------------|------------|------------|
| PR → main       | ✅    | ✅ (after smoke) | ✅      | ❌         |
| Push to main    | ✅    | ✅ (after smoke) | ✅      | ✅         |

### Execution order

```
PR opened/updated:
  ┌─ smoke (parallel with typecheck)
  │     ↓ (must pass)
  └─ interaction
      ↓
  All green → PR mergeable

Push to main:
  ┌─ smoke → interaction → full-suite
  └─ typecheck (parallel)
```

---

## Failure Policy

### 🔴 Smoke failure = BLOCK MERGE

Smoke tests protect the money routes (`/auth`, `/post`, `/messages`, `/onboarding/pro`, dashboards).
If smoke fails, the PR **must not be merged**. No exceptions.

### 🟡 Interaction failure = BLOCK MERGE (investigate)

Interaction tests validate real user journeys. A failure here means
a core flow is broken. Investigate before merging.

### 🟡 Type check failure = BLOCK MERGE

TypeScript errors indicate compile-time breakage that will affect production.

### 🟢 Full suite failure on main = INVESTIGATE IMMEDIATELY

If the full suite fails after merge to main, the team should:
1. Check which test(s) failed
2. Determine if it's a flaky test or a real regression
3. Fix or revert within the same working session

---

## Pre-Release Checklist for Critical Flows

Before merging any PR that touches a critical flow:

- [ ] All automated tests pass (smoke + interaction)
- [ ] **Manual mobile QA completed at 375px viewport** (hard gate)
- [ ] If step/data restructure: migration plan for mid-flow users documented
- [ ] If step/data restructure: backfill script prepared and tested
- [ ] Post-deploy validation scheduled (check within 24h)
- [ ] Error monitoring confirmed working (no `[object Object]` in logs)
- [ ] Funnel page checked — baseline drop-off rates noted pre-deploy

---

## Commands

```bash
# Local development
bun run test                         # all tests
bun run test:smoke                   # smoke only (fast gate)
bun run test:interaction             # interaction only
bun run vitest run src/test --reporter=verbose  # verbose output

# CI (automated)
# See .github/workflows/ci.yml
```

---

## Adding New Tests

### Smoke tests (`src/test/smoke/`)

Add here when:
- New route is created
- New guard behavior is added
- New critical page is introduced

Focus: **does it render, does it not crash, does it handle edge states**

### Interaction tests (`src/test/interaction/`)

Add here when:
- New multi-step user flow is built
- New redirect logic is added
- New dashboard action is introduced

Focus: **does the journey work end-to-end as a connected unit**

### Naming convention

- Smoke: `{route}.smoke.test.tsx`
- Interaction: `{flow}.interaction.test.tsx`

---

## GitHub Branch Protection (Recommended)

Configure in GitHub → Settings → Branches → Branch protection rules:

- **Branch:** `main`
- **Require status checks to pass:** ✅
  - `🚦 Smoke Tests`
  - `🔄 Interaction Tests`
  - `🔍 Type Check`
- **Require branches to be up to date:** ✅
- **Do not allow bypassing:** ✅
