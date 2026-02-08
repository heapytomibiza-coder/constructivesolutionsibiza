

# Finalize Search → Wizard Lock-In: Naming Clarity + Rule Consistency

## Summary

Rename the fallback modes for clarity and fix one rule violation where we incorrectly use micro ID instead of slug.

---

## Current State

| Component | Status | Issue |
|-----------|--------|-------|
| `wizardLink.ts` | ⚠️ Naming | Uses `microFallback`/`subcategoryFallback` - confusing names |
| `types.ts` | ⚠️ Rule violation | Line 90 uses `hit.id` as micro param - violates "micro= always slug" |
| `resolveWizardMode.ts` | ✅ Correct | Already enforces full hierarchy for Questions |
| i18n files | ✅ Correct | Already have `universalSearch.type.*` keys |

---

## Changes

### 1. Rename Fallback Modes for Clarity

**File**: `src/lib/wizardLink.ts`

Rename for intent clarity:
- `microFallback` → `microOnly` (we only know micro, nothing else)
- `subcategoryFallback` → `subcategoryOnly` (no category context)

```typescript
export type WizardLinkParams =
  | { mode: "fresh" }
  | { mode: "category"; categoryId: string }
  | { mode: "subcategory"; categoryId: string; subcategoryId: string }
  | { mode: "micro"; categoryId: string; subcategoryId: string; microSlug: string }
  | { mode: "microOnly"; microSlug: string }    // SAFE: lands on micro step
  | { mode: "subcategoryOnly" }                  // SAFE: lands on subcategory step
  | { mode: "direct"; professionalId: string }
  | { mode: "resume" };
```

Update switch cases with clearer comments:

```typescript
case "microOnly":
  // SAFE: We know micro slug but cannot hydrate parents
  // Go to micro step (not questions) so user can confirm selection
  return `${base}?${qp("micro", params.microSlug)}&step=micro`;

case "subcategoryOnly":
  // SAFE: No category context - start fresh at subcategory selection
  return `${base}?step=subcategory`;
```

---

### 2. Fix Rule Violation in `buildWizardUrlFromHit`

**File**: `src/components/search/types.ts`

**Problem**: Line 90 uses `hit.id` as micro param when `microSlug` is missing:
```typescript
// WRONG - violates "micro= always slug" rule
return buildWizardLink({ mode: "microFallback", microSlug: hit.id });
```

**Fix**: If we don't have the slug, we can't safely navigate to micro step - fall back to fresh:

```typescript
case "micro": {
  // Best case: full hierarchy available
  if (hit.categoryId && hit.subcategoryId && hit.microSlug) {
    return buildWizardLink({
      mode: "micro",
      categoryId: hit.categoryId,
      subcategoryId: hit.subcategoryId,
      microSlug: hit.microSlug,
    });
  }

  // Safe case: micro slug only → micro step
  if (hit.microSlug) {
    console.warn("SearchHit micro missing parent IDs, using microOnly");
    return buildWizardLink({ mode: "microOnly", microSlug: hit.microSlug });
  }

  // No slug = no safe navigation → fresh start
  console.warn("SearchHit micro missing microSlug, falling back to fresh");
  return buildWizardLink({ mode: "fresh" });
}
```

Also update subcategory case:

```typescript
case "subcategory": {
  if (!hit.categoryId) {
    console.warn("SearchHit subcategory missing categoryId");
    return buildWizardLink({ mode: "subcategoryOnly" });
  }
  // ... rest unchanged
}
```

---

### 3. Update Resolver to Allow `microOnly` Pattern

**File**: `src/components/wizard/canonical/lib/resolveWizardMode.ts`

The current enforcement (lines 107-109) rejects `step=micro` without `subcategory`:

```typescript
if (requestedStep === WizardStep.Micro && !params.subcategory) {
  return params.category ? WizardStep.Subcategory : WizardStep.Category;
}
```

But we intentionally generate `/post?micro=<slug>&step=micro` for `microOnly` mode.

**Fix**: Allow `step=micro` when `params.micro` exists (the micro confirmation pattern):

```typescript
// ENFORCEMENT: step=micro requires subcategory OR micro param (microOnly pattern)
if (requestedStep === WizardStep.Micro && !params.subcategory && !params.micro) {
  console.warn('[WizardResolver] step=micro requested but no context, falling back');
  return params.category ? WizardStep.Subcategory : WizardStep.Category;
}
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/lib/wizardLink.ts` | Rename modes: `microFallback`→`microOnly`, `subcategoryFallback`→`subcategoryOnly` |
| `src/components/search/types.ts` | Use new mode names; fix ID→slug rule violation |
| `src/components/wizard/canonical/lib/resolveWizardMode.ts` | Allow `microOnly` pattern in enforcement |

---

## Testing Checklist

| Test | Expected |
|------|----------|
| `/post?micro=sink-leak&step=micro` | Lands on Micro step (microOnly pattern works) |
| `/post?micro=sink-leak&step=questions` | Falls back to Category (can't go to questions without parents) |
| `/post?category=X&subcategory=Y&micro=slug&step=questions` | Lands on Questions step |
| Search hit with full hierarchy → click | Questions step |
| Search hit with only microSlug → click | Micro step |
| Search hit missing microSlug → click | Fresh start |

---

## Non-Negotiable Rules (Final)

1. ✅ `micro=` param is **always slug** (never UUID)
2. ✅ Mode names are explicit: `microOnly` = we only know micro
3. ✅ Missing slug = cannot navigate to micro step → fresh
4. ✅ `microOnly` goes to micro step for user confirmation
5. ✅ Full hierarchy required for Questions step
6. ✅ **Micro-only deep links are intentionally unsupported until hydration is implemented**

