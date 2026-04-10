# Release Discipline — CI & Test Policy

**Last updated:** 2026-04-10

## Test Suite Structure

```
src/test/
├── smoke/              ← Route stability, render safety, state resilience
│   ├── auth             (6 tests)
│   ├── messages         (4 tests)
│   ├── post             (10 tests)
│   ├── dashboard        (6 tests)
│   ├── guards           (9 tests)
│   └── wizard-progression (10 tests)
│
├── interaction/        ← User journey simulations, connected-unit behavior
│   ├── wizard-flow      (9 tests)
│   ├── auth-redirect    (6 tests)
│   └── dashboard-action (4 tests)
│
└── access.test.ts      ← Access control unit tests (8 tests)
```

**Total: 73 tests across 11 files**

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

Smoke tests protect the money routes (`/auth`, `/post`, `/messages`, dashboards).
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
