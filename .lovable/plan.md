

## Polish Pass: Spanish Copy Fix + Budget Fallback Hardening

Two small, surgical edits. No architectural changes.

---

### 1. Fix Spanish dispatch copy (minor grammar)

**File:** `public/locales/es/jobs.json`

The `broadcastTitle` currently reads "Publicar en bolsa de trabajo" -- missing the article. Update to:

```
"broadcastTitle": "Publicar en la bolsa de trabajo"
```

This is the only string that needs touching. All accents and punctuation are already correct.

---

### 2. Harden budget fallback formatting

**File:** `src/features/wizard/canonical/lib/formatDisplay.ts`

Line 31 currently falls back to `raw.replace(/_/g, ' ')` which would show "under 500" for any unknown value. Add sentence-case normalization so unknown values display cleanly:

**Current (line 31):**
```typescript
return BUDGET_DISPLAY[raw] || raw.replace(/_/g, ' ');
```

**New:**
```typescript
const fallback = raw.replace(/_/g, ' ').trim();
return BUDGET_DISPLAY[raw] || fallback.charAt(0).toUpperCase() + fallback.slice(1);
```

This ensures even unmapped budget values render as "Under 500" instead of "under 500".

---

### Files Changed

| File | Change |
|------|--------|
| `public/locales/es/jobs.json` | Add missing article in `broadcastTitle` |
| `src/features/wizard/canonical/lib/formatDisplay.ts` | Sentence-case fallback for unknown budget values |

