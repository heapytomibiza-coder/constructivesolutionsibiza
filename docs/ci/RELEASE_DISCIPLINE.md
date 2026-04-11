# Release Discipline — CI & Test Policy

**Last updated:** 2026-04-11

## Critical Flows

The following flows are designated **critical** and require full safeguards before any change ships:

| Flow | Owner | Why |
|------|-------|-----|
| Professional onboarding | Engineering lead | Converts professionals onto the platform |
| Job posting wizard | Engineering lead | Core client action — creates marketplace supply |
| Messaging | Engineering lead | Trust and engagement between client and professional |
| Payments / holding | Engineering lead | Financial integrity and legal compliance |

### What "critical flow" means

Any change to a critical flow **must** satisfy all of the following before merge:

1. **Automated test coverage** — smoke + interaction tests exist and pass
2. **Manual QA checklist** — completed for the specific flow, including mobile (375px)
3. **Migration handling** — if the change restructures steps or data, users mid-flow must be explicitly handled
4. **Post-release validation (24h)** — within 24 hours of deploy, verify that in-progress users are not blocked

Failure to meet these standards is a **merge blocker**.

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
│   └── onboarding       (10 tests) ← NEW
│
├── interaction/        ← User journey simulations, connected-unit behavior
│   ├── wizard-flow      (9 tests)
│   ├── auth-redirect    (6 tests)
│   ├── dashboard-action (4 tests)
│   └── onboarding-flow  (6 tests) ← NEW
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

## Ownership & Accountability

### Flow Ownership

Each critical flow has a designated owner who is accountable for:

- **Health monitoring** — checking funnel metrics at least weekly
- **Regression response** — investigating and resolving test failures within 24h
- **Post-release validation** — confirming no users are blocked after deploys
- **Alert response** — acting on stuck-user alerts within the same working day

### Onboarding Specifically

After the April 2026 incident (20 professionals blocked by NULL zones):

- Onboarding funnel is monitored via `/admin/insights/onboarding-funnel`
- Stuck-user alerts fire automatically if >5 users are stuck at the same phase within 24h
- The admin cockpit surfaces onboarding health metrics on every load
- Any onboarding refactor must include a data migration plan for in-progress users

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

## Pre-Release Checklist for Critical Flows

Before merging any PR that touches a critical flow:

- [ ] All automated tests pass (smoke + interaction)
- [ ] Manual QA completed on mobile (375px viewport)
- [ ] If step/data restructure: migration plan for mid-flow users documented
- [ ] If step/data restructure: backfill script prepared and tested
- [ ] Post-deploy validation scheduled (check within 24h)
- [ ] Error monitoring confirmed working (no `[object Object]` in logs)

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
