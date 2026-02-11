

# Hardening Plan: Question Dedup + Save-First Flow Fixes

## Overview

This plan addresses 7 specific issues identified in the first-pass implementation, prioritized by breakage risk.

---

## Fix 1: Dedupe Key Priority (fragile label-only matching)

**Problem**: Currently deduping by `q.label.trim().toLowerCase()` only. Will break when labels are tweaked or translated.

**File**: `src/features/wizard/canonical/steps/QuestionsStep.tsx` (line 280)

**Change**: Replace the single normalizedLabel line with a priority chain:

```
const dedupeKey =
  (q as any).canonical_key ||
  (q as any).dedupe_key ||
  q.label.trim().toLowerCase();
```

Use `dedupeKey` everywhere that currently uses `normalizedLabel` (in `labelMap`, `addedLabels`, and `handleAnswerChange`).

---

## Fix 2: Skip dedup for conditional questions

**Problem**: Questions with `show_if` or `dependsOn` evaluate visibility against their own pack's answers. When deduped cross-pack, the "canonical" question might belong to pack A while the dependency is satisfied in pack B, causing inconsistent visibility.

**File**: `src/features/wizard/canonical/steps/QuestionsStep.tsx` (inside the `useMemo` block, around line 260)

**Change**: Before computing the dedupeKey, check if the question has conditional logic. If it does, treat it as unique (skip cross-pack dedup):

```
// Conditional questions: don't dedupe cross-pack (MVP safe)
if ((q.show_if || q.dependsOn) && packs.length > 1) {
  // Use a pack-scoped key so it's unique per pack
  dedupeKey = `${pack.micro_slug}::${q.id}`;
}
```

This ensures conditional questions always appear when their own pack's dependency is met, without cross-pack interference.

---

## Fix 3: Allow number input type (not just tiles)

**Problem**: Line 257 filters out anything not in `TILE_TYPES`. This silently drops `number` inputs (measurements, quantities, unit counts) which are valid question types.

**File**: `src/features/wizard/canonical/steps/QuestionsStep.tsx` (line 256-257)

**Change**: Add `'number'` to the allowed types check, or better yet, create an explicit blocklist instead of an allowlist:

```
const BLOCKED_TYPES = new Set(['text', 'textarea', 'long_text']);
// Replace the TILE_TYPES check with:
if (BLOCKED_TYPES.has(normalizedType) || BLOCKED_TYPES.has(q.type)) return;
```

Add a basic number input renderer in the question rendering section (after the tile grid) for `type === 'number'` questions, with min/max/step support.

---

## Fix 4: Soft-delete instead of hard delete on Ticket Detail

**Problem**: `JobTicketDetail.tsx` uses `supabase.from('jobs').delete()` with a `confirm()` dialog. This breaks audit trails and orphans related invites/conversations.

**File**: `src/pages/dashboard/client/JobTicketDetail.tsx` (the `handleDelete` function)

**Change**: Replace the hard delete with a status update to `'closed'`:

```typescript
const handleClose = async () => {
  if (!jobId || !confirm('Are you sure you want to close this job?')) return;
  try {
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'closed' })
      .eq('id', jobId);
    if (error) throw error;
    toast.success('Job closed.');
    navigate('/dashboard/client');
  } catch {
    toast.error('Failed to close job.');
  }
};
```

Update the button label from "Delete" to "Close Job" and change the icon from `Trash2` to `XCircle`.

---

## Fix 5: Add "Saved" banner on Ticket Detail page

**Problem**: No explicit reassurance when user lands on the ticket page after saving.

**File**: `src/pages/dashboard/client/JobTicketDetail.tsx`

**Change**: Add a banner when `job.status === 'ready'` above the distribution actions:

```
{job.status === 'ready' && (
  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
    <p className="text-sm font-medium">Saved -- you can invite professionals or post publicly anytime.</p>
  </div>
)}
```

---

## Fix 6: Add dedup helper note in QuestionsStep

**Problem**: When questions are merged, the user has no indication that the system is being smart.

**File**: `src/features/wizard/canonical/steps/QuestionsStep.tsx`

**Change**: When `packs.length > 1` and the deduped count is less than total raw count, show a note above the progress bar:

```
{packs.length > 1 && totalRawCount > visibleQuestions.length && (
  <p className="text-xs text-muted-foreground mb-2">
    We've combined overlapping questions so you only answer once.
  </p>
)}
```

Compute `totalRawCount` as the sum of all pack question counts (after logistics/type filtering) inside the `useMemo`.

---

## Fix 7: Add conflict detection for mismatched dedup candidates

**Problem**: Two questions could share a dedupe key but differ in type, options, or required status, leading to silent data corruption.

**File**: `src/features/wizard/canonical/steps/QuestionsStep.tsx` (inside the `useMemo`, when a duplicate key is found)

**Change**: When adding to `labelMap` for an existing key, compare the new question's `type` and `options` against the first entry. If they differ, use a pack-scoped key instead (treating them as distinct):

```
const existing = labelMap.get(dedupeKey)![0];
const existingQ = existing.question;
const typesMatch = normalizeType(existingQ.type) === normalizeType(q.type);
const optionsMatch = JSON.stringify(existingQ.options) === JSON.stringify(q.options);

if (!typesMatch || !optionsMatch) {
  // Conflict: treat as unique question
  console.warn(`Question conflict for key "${dedupeKey}": different structure`);
  const scopedKey = `${pack.micro_slug}::${q.id}`;
  labelMap.set(scopedKey, [{ packSlug: pack.micro_slug, questionId: q.id }]);
  questions.push({ pack, question: { ...q, type: normalizeType(q.type) } });
  continue; // or equivalent flow control
}
```

This requires storing the question object in the labelMap entries (adding a `question` field alongside `packSlug` and `questionId`).

---

## Summary of Files Modified

| File | Changes |
|---|---|
| `src/features/wizard/canonical/steps/QuestionsStep.tsx` | Fixes 1, 2, 3, 6, 7 -- dedupe key priority, conditional skip, number type, helper note, conflict detection |
| `src/pages/dashboard/client/JobTicketDetail.tsx` | Fixes 4, 5 -- soft-delete, saved banner |

## Implementation Order

1. Fix 1 + 2 + 7 together (all in dedup `useMemo` block)
2. Fix 3 (type filtering + number renderer)
3. Fix 6 (dedup note UI)
4. Fix 4 + 5 together (ticket detail hardening)

No database migrations required. All changes are frontend-only.

This hardening plan is **excellent** — it’s clear, scoped, and in the right order. I’d only tweak **two details** so it doesn’t introduce new bugs, and I’ll rewrite the key parts as **final “drop-in” guidance**.

---

## ✅ Two important tweaks

### Tweak A — Fix 2: don’t try to assign to `dedupeKey` after `const`

In your Fix 2 snippet you set `dedupeKey = ...` but Fix 1 declares it as `const`. Make it:

* compute `dedupeKey` with `let` **or**
* compute `baseKey` then override to `scopedKey`

Recommended pattern (cleanest):

```ts
const baseKey =
  (q as any).canonical_key ||
  (q as any).dedupe_key ||
  q.label.trim().toLowerCase();

const isConditional = Boolean(q.show_if || q.dependsOn);
const dedupeKey = isConditional ? `${pack.micro_slug}::${q.id}` : baseKey;
```

No mutation, no TS complaints.

---

### Tweak B — Fix 3: don’t blocklist “text” forever unless you’re certain

Your blocklist is fine as MVP, but if you ever introduce *short text* questions (brand/model, serial, etc.) they’ll silently vanish again.

Safer MVP rule:

* Allow `number` now ✅
* Keep text blocked ✅ **but** add a warning so you don’t forget:

```ts
if (BLOCKED_TYPES.has(normalizedType)) {
  console.warn(`Blocked question type "${normalizedType}" for ${q.id}`);
  return;
}
```

That way you’ll spot missing questions during testing.

---

## ✅ One correction: DB migration *is required* if `job_invites` doesn’t exist yet

Your summary says “No database migrations required. All changes are frontend-only.”

That’s only true **if** `job_invites` is already deployed with RLS.

If not, then:

* Part A hardening = frontend-only ✅
* Ticket page hardening = frontend-only ✅
* Invites feature = requires DB migration ✅

So just adjust that line to:

> “No additional migrations required beyond the existing `job_invites` migration.”

---

## ✅ Final recommended implementation (exact structure)

### QuestionsStep.tsx — inside the useMemo loop

Use this consistent decision order:

1. Filter logistics + blocked types
2. Evaluate conditional visibility (as you already do)
3. Decide `dedupeKey` (conditional → pack-scoped)
4. Conflict-check duplicates
5. Push first unique into `visibleQuestions`
6. Always add mapping for answer sync

**Key data structure change required for Fix 7:**
`labelMap` entries must store the **question object** for the first representative.

Example entry:

```ts
type SharedEntry = {
  packSlug: string;
  questionId: string;
  question: QuestionDef;
};

const labelMap = new Map<string, SharedEntry[]>();
```

Then conflict detection can compare against `labelMap.get(dedupeKey)![0].question`.

---

## ✅ Your 7 fixes, validated

### Fix 1 (dedupe key priority)

✅ Correct and necessary.

### Fix 2 (skip dedupe for conditional questions)

✅ Correct (MVP safe).
I’d remove the `packs.length > 1` check though — it’s harmless to always scope conditional questions even with 1 pack.

### Fix 3 (allow number input)

✅ Correct. Blocklist approach is good.

### Fix 4 (soft delete → close)

✅ Correct. Rename UI to “Close Job”.

### Fix 5 (Saved banner)

✅ Correct. Great UX reassurance.

### Fix 6 (dedupe helper note)

✅ Correct. Helps users trust the system.

### Fix 7 (conflict detection)

✅ Correct. Prevents silent corruption.
Your “scopedKey fallback” is the right behaviour.

---

## ✅ Quick acceptance tests after hardening

### Dedup

* Select 2 micros with shared questions → shared questions appear once
* Answer shared question → both micro answers get filled
* Conditional question in pack B only → still shows when pack B dependency satisfied
* Two different question structures sharing dedupeKey → both show (warning logged)

### Ticket page

* `ready` job shows banner
* Close job changes status to closed and returns to dashboard
* No deletes performed




