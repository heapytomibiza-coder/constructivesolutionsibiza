
# Architecture Polish: Final Refinements

## Summary

Two targeted adjustments to complete the domain-first restructuring:

1. **Move `evaluatePackRules.ts`** from wizard to jobs domain (correct domain ownership)
2. **Clean up orphaned code** and add architectural guardrails

---

## Analysis

### `evaluatePackRules.ts` - Domain Ownership

| Aspect | Wizard | Jobs |
|--------|--------|------|
| What it does | - | Rule evaluation, safety flags, inspection logic |
| Who uses it | Wizard passes answers | Jobs domain consumes results |
| Future users | - | Admin analytics, matching engine, job cards |
| Conceptual fit | Input collection | Business logic evaluation |

**Verdict**: This is job-domain logic. The wizard collects inputs; the jobs domain evaluates rules.

### `categoryMapping.ts` - Orphaned Code

Search confirms: **zero imports**. This file is unused and can be deleted safely.

### `src/core/` - Current State

Currently contains only a placeholder `index.ts` that re-exports from `domain/scope.ts`. The actual "core" logic lives in:
- `src/guard/` - Access control
- `src/domain/scope.ts` - Platform identity

---

## Changes

### 1. Move `evaluatePackRules.ts` to Jobs Domain

**From:** `src/features/wizard/lib/evaluatePackRules.ts`  
**To:** `src/pages/jobs/lib/evaluatePackRules.ts`

Update exports:

| File | Action |
|------|--------|
| `src/pages/jobs/lib/index.ts` | Add exports for evaluatePackRules |
| `src/features/wizard/lib/index.ts` | Remove evaluatePackRules export |
| `src/features/wizard/index.ts` | Remove evaluatePackRules re-exports |

### 2. Delete Orphaned Code

| File | Action |
|------|--------|
| `src/lib/services/categoryMapping.ts` | Delete (unused) |
| `src/lib/services/` folder | Delete if empty |

### 3. Add Golden Rules to ARCHITECTURE.md

Add a guardrail section at the top to prevent future drift:

```markdown
## Golden Rules

- Domains own their business logic
- Roles do not own business logic  
- UI never talks directly to the database
- `lib/` must be domain-owned or deleted
- If unsure where code goes, ask: "Which domain breaks if this changes?"
```

### 4. Update `src/core/index.ts` Documentation

Change from placeholder to explicit documentation of current state:

```typescript
/**
 * Core Module
 * 
 * Platform fundamentals - permissions, constants, and shared types.
 * Currently implemented via:
 * - src/guard/ (access control)
 * - src/domain/scope.ts (platform identity)
 * 
 * This module will expand when platform-wide invariants are extracted.
 */
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/jobs/lib/evaluatePackRules.ts` | Create (move from wizard) |
| `src/pages/jobs/lib/index.ts` | Add exports |
| `src/features/wizard/lib/index.ts` | Remove export |
| `src/features/wizard/index.ts` | Remove re-exports |
| `src/lib/services/categoryMapping.ts` | Delete |
| `docs/ARCHITECTURE.md` | Add Golden Rules section |
| `src/core/index.ts` | Update documentation |

---

## Verification

After changes:
- [ ] `npm run build` passes
- [ ] Jobs domain can import `evaluateRules` from `@/pages/jobs/lib`
- [ ] No broken imports referencing old wizard path
- [ ] ARCHITECTURE.md has Golden Rules at top

---

## Impact

These refinements:
- Correct domain ownership for rule evaluation logic
- Remove dead code from `lib/services/`
- Add guardrails that prevent future architecture drift
- Document the "reserved" nature of `core/` without premature structure

**Result**: Clean 9/10 architecture ready for admin + payments domains.
