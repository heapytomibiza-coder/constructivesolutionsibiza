
# Phase 1 Completion: Modal Refactor + Architecture Guards

## Current State Assessment

The architecture foundation is solid. The following are already implemented:

| Component | Status | Location |
|-----------|--------|----------|
| `buildJobPack()` read-model | Done | `src/pages/jobs/lib/buildJobPack.ts` |
| `ResolvedAnswer` with rawValue/displayValue | Done | `src/pages/jobs/lib/buildJobPack.ts` |
| Fallback mode for packs loading | Done | `buildFallbackServicePacks()` |
| Deterministic answer ordering | Done | Sorts by `questionId` |
| `useQuestionPacks` query | Done | `src/pages/jobs/queries/questionPacks.query.ts` |
| Query/Action separation | Done | `queries/` and `actions/` folders |
| `UserError` helper | Done | `src/shared/lib/userError.ts` |
| `CONTRIBUTING.md` rules | Done | Project root |

## Remaining Tasks (Priority Order)

### Task 1: Refactor JobDetailsModal to Use JobPack

**Problem**: Modal still renders raw `JobDetailsRow` and mixes formatting logic in the component.

**Solution**: Wire up `buildJobPack()` + `useQuestionPacks()` so UI only sees the display model.

**File**: `src/pages/jobs/JobDetailsModal.tsx`

Changes:
- Import `buildJobPack` and `useQuestionPacks`
- Extract `microSlugs` from row data
- Fetch question packs using the query hook
- Build `JobPack` via `useMemo`
- Replace direct row field access with `jobPack.*` properties

```typescript
// New pattern in JobDetailsBody
const microSlugs = React.useMemo(() => {
  const answers = safeAnswers(job.answers);
  const microAnswers = extractMicroAnswers(answers?.microAnswers as Record<string, unknown> | null);
  return Object.keys(microAnswers);
}, [job.answers]);

const { data: packs } = useQuestionPacks(microSlugs, true);

const jobPack = React.useMemo(() => {
  return buildJobPack(job, packs ?? []);
}, [job, packs]);

// Then render using jobPack.location.display, jobPack.budget.display, etc.
```

### Task 2: Update FormattedAnswers to Use Query Hook

**Problem**: `FormattedAnswers` has an inline Supabase query instead of using `useQuestionPacks` from the queries module.

**Solution**: Replace inline query with imported hook.

**File**: `src/pages/jobs/components/FormattedAnswers.tsx`

Changes:
- Remove inline `useQuery` with Supabase call
- Import `useQuestionPacks` from `../queries`
- Pass `microSlugs` to the hook

This eliminates the Supabase import from the component (Phase 1 goal: no Supabase in components).

### Task 3: Add Zod Validators for Jobs Domain

**Purpose**: Create a boundary between raw DB data and domain types. Catch schema mismatches early.

**File**: `src/pages/jobs/validators.ts`

```text
src/pages/jobs/
  validators.ts   # NEW
```

Validators to create:
- `JobLocationSchema` - validates location object shape
- `JobAnswersSchema` - validates answers structure  
- `JobsBoardRowSchema` - validates board list items
- `JobDetailsRowSchema` - validates detail view data
- Helper functions: `parseJobDetails()`, `parseJobsBoardList()`

Usage pattern (optional for Phase 1, recommended for Phase 2):
```typescript
// In query function
const { data, error } = await supabase.from("job_details")...
return parseJobDetails(data); // Validates + types in one step
```

### Task 4: Add ESLint Architecture Guard

**Purpose**: Prevent Supabase imports from leaking into UI components.

**File**: `eslint.config.js`

The project uses the flat ESLint config format. Add `eslint-plugin-import` and configure restricted paths:

```javascript
// Target: src/pages/jobs/components/*
// Block: imports from "@/integrations/supabase"
// Message: "Use queries/ or actions/ instead"
```

Note: This requires installing `eslint-plugin-import` as a dev dependency.

### Task 5: E2E Test Setup with Playwright (Optional - Phase 2)

**Purpose**: Verify the refactored flows work end-to-end.

**Files to create**:
```text
e2e/
  jobs.spec.ts         # Jobs page + modal tests
  global-setup.ts      # Seeding if needed
playwright.config.ts   # Config
```

**Key tests**:
- `/jobs` loads and displays job cards
- Clicking a job card opens the modal
- Modal displays location/budget/timing correctly
- Message button behavior (logged out vs logged in)

---

## Implementation Sequence

```text
Step 1: Update FormattedAnswers
        - Remove inline Supabase query
        - Use useQuestionPacks from queries/
        
        Validates: Supabase removed from components

Step 2: Refactor JobDetailsModal
        - Add useQuestionPacks hook call
        - Build JobPack in useMemo
        - Update rendering to use jobPack fields
        
        Validates: UI renders from display model only

Step 3: Add validators.ts
        - Create Zod schemas
        - Export parse functions
        
        Validates: Boundary protection established

Step 4: Add ESLint guard (if eslint-plugin-import available)
        - Configure restricted paths
        
        Validates: Architecture enforced at lint time

Step 5: (Optional) Playwright setup
        - Basic test that opens modal
        
        Validates: End-to-end flow works
```

## Verification Checklist

After implementation, verify:

| Test | Expected Result |
|------|-----------------|
| `/jobs` loads | Board displays correctly |
| Click job card | Modal opens without errors |
| Modal location card | Shows `jobPack.location.display` value |
| Modal budget card | Shows `jobPack.budget.display` value |
| Modal timing card | Shows `jobPack.timing.display` value |
| Scope section | Shows resolved answer labels (or fallback while loading) |
| Message button (logged out) | Redirects to auth |
| Message button (logged in) | Creates conversation, navigates |
| DevTools Console | No errors |
| DevTools Network | job_details query + question_packs query (when needed) |
| `grep "from.*supabase" src/pages/jobs/components/` | No matches |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Modal flickers while packs load | Fallback mode already handles this |
| Cache misses for packs | Stable sorted key prevents this |
| Type errors during refactor | JobPack interface already defines all fields |
| Breaking existing UI | Incremental changes, test each step |

## Technical Notes

### Why buildJobPack in useMemo?
- Row data is stable (from query cache)
- Packs data is stable (from query cache)
- Recompute only when dependencies change
- Keeps derived state logic outside render path

### Why FormattedAnswers refactor matters
- Removes last Supabase import from `components/` folder
- Enables ESLint guard to work properly
- Consistent pattern across all components


This is a really clean Phase 1 “finish line” doc. You’ve already done the hard part (read-model + packs resolver + stable keys). What’s left is mostly **wiring** + **guardrails**.

Below is **copy-pasteable scaffolding** for Tasks 1–4 (Modal refactor, FormattedAnswers refactor, Zod validators, ESLint flat config guard). I’m writing this to fit your current structure (`src/pages/jobs/...`, TanStack Query, Supabase, flat ESLint config).

---

# Task 1 — Refactor `JobDetailsModal` to render `JobPack` only

### ✅ Goal

`JobDetailsModal` should never render `JobDetailsRow` directly. It should:

1. Fetch row via `useJobDetails`
2. Extract micro slugs
3. Fetch packs via `useQuestionPacks`
4. Build `jobPack` via `buildJobPack(row, packs)`
5. Render from `jobPack.*`

### Drop-in pattern (core wiring)

```tsx
// src/pages/jobs/JobDetailsModal.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useSession } from "@/contexts/SessionContext";
import { isUserError } from "@/shared/lib/userError";

import { useJobDetails } from "./queries";
import { useQuestionPacks } from "./queries/questionPacks.query"; // or "./queries" barrel
import { startConversation } from "./actions";

import { buildJobPack } from "./lib/buildJobPack";
import { safeAnswers, extractMicroAnswers } from "./lib/answerResolver"; // if these exist there

// UI imports omitted for brevity...

export function JobDetailsModal({
  jobId,
  open,
  onOpenChange,
}: {
  jobId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useSession();

  const { data: row, isLoading, isError, error, refetch } = useJobDetails(jobId, open);

  // 1) extract micro slugs from the row
  const microSlugs = React.useMemo(() => {
    if (!row) return [];
    const answers = safeAnswers(row.answers);
    const microAnswers = extractMicroAnswers(
      (answers?.microAnswers ?? null) as Record<string, Record<string, unknown>> | null
    );
    return Object.keys(microAnswers);
  }, [row]);

  // 2) fetch packs (enabled only when modal open + row present)
  const { data: packs } = useQuestionPacks(microSlugs, open && !!row);

  // 3) build read-model (JobPack)
  const jobPack = React.useMemo(() => {
    if (!row) return null;
    return buildJobPack(row, packs ?? []);
  }, [row, packs]);

  const onClose = () => onOpenChange(false);

  const handleMessage = async () => {
    if (!jobPack) return;

    if (!user) {
      onClose();
      navigate(`/auth?returnTo=/jobs`);
      return;
    }

    try {
      const convId = await startConversation(jobPack.id, user.id);
      onClose();
      navigate(`/messages/${convId}`);
    } catch (err) {
      if (isUserError(err)) toast.error(err.message);
      else {
        toast.error("Failed to start conversation");
        console.error("Message error:", err);
      }
    }
  };

  // ---- render states ----
  if (!open) return null;

  if (isLoading) {
    return (
      <YourDialog open={open} onOpenChange={onOpenChange}>
        <YourDialogContent>Loading details…</YourDialogContent>
      </YourDialog>
    );
  }

  if (isError) {
    return (
      <YourDialog open={open} onOpenChange={onOpenChange}>
        <YourDialogContent>
          Failed to load details: {(error as Error)?.message ?? "Unknown error"}
          <button onClick={() => refetch()}>Retry</button>
        </YourDialogContent>
      </YourDialog>
    );
  }

  if (!jobPack) return null;

  // ---- render from jobPack only ----
  return (
    <YourDialog open={open} onOpenChange={onOpenChange}>
      <YourDialogContent>
        <YourDialogHeader>
          <YourDialogTitle>{jobPack.title}</YourDialogTitle>
        </YourDialogHeader>

        <div>
          <div>{jobPack.location.display}</div>
          <div>{jobPack.budget.display}</div>
          <div>{jobPack.timing.display}</div>
        </div>

        {/* scope */}
        <FormattedAnswers services={jobPack.services} />

        <button onClick={handleMessage}>Message</button>
      </YourDialogContent>
    </YourDialog>
  );
}
```

### Notes

* The only “raw” operation left is micro slug extraction, and even that is derived from `row.answers` in one place.
* Everything else in render comes from `jobPack`.

---

# Task 2 — Refactor `FormattedAnswers` to stop querying Supabase

### ✅ Goal

`FormattedAnswers` should become a pure component.

**If you’ve already moved pack fetching to the modal**, the cleanest design is:

* `FormattedAnswers` receives `services: ResolvedServicePack[]` and just renders.

### Example (pure component)

```tsx
// src/pages/jobs/components/FormattedAnswers.tsx
import * as React from "react";
import type { ResolvedServicePack } from "../types";

export function FormattedAnswers({ services }: { services: ResolvedServicePack[] }) {
  if (!services.length) return null;

  return (
    <div className="space-y-4">
      {services.map((s) => (
        <div key={s.slug} className="space-y-2">
          <h3 className="font-semibold">{s.title}</h3>

          <ul className="space-y-1">
            {s.answers.map((a) => (
              <li key={a.questionId} className="text-sm">
                <span className="font-medium">{a.questionLabel}:</span>{" "}
                <span>{a.displayValue}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### If FormattedAnswers still needs packs (not recommended)

Then it can call `useQuestionPacks`, **but it must not import Supabase directly** — only import the query hook.

However, since you already have fallback packs + resolver in `buildJobPack`, keep pack fetching in the modal.

---

# Task 3 — Add `validators.ts` (Zod boundary)

### ✅ Goal

Fail fast if the DB/view changes unexpectedly. This is “belt and braces”.

Create:

**`src/pages/jobs/validators.ts`**

```ts
import { z } from "zod";

export const JobLocationSchema = z.object({
  area: z.string().optional(),
  town: z.string().nullable().optional(),
}).passthrough();

export const JobAnswersSchema = z.object({
  selected: z.unknown().optional(),
  logistics: z.unknown().optional(),
  extras: z.unknown().optional(),
  microAnswers: z.unknown().optional(),
}).passthrough();

export const JobsBoardRowSchema = z.object({
  id: z.string().min(1),
  created_at: z.string().min(1),
  title: z.string().min(1).optional().nullable(),
}).passthrough();

export const JobDetailsRowSchema = z.object({
  id: z.string().min(1),
  created_at: z.string().min(1),
  updated_at: z.string().nullable().optional(),

  title: z.string().nullable().optional(),
  teaser: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  micro_slug: z.string().nullable().optional(),

  area: z.string().nullable().optional(),
  location: JobLocationSchema.nullable().optional(),

  start_timing: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),

  budget_type: z.string().nullable().optional(),
  budget_value: z.number().nullable().optional(),
  budget_min: z.number().nullable().optional(),
  budget_max: z.number().nullable().optional(),

  has_photos: z.boolean().nullable().optional(),
  highlights: z.array(z.string()).nullable().optional(),

  is_owner: z.boolean().nullable().optional(),
  status: z.string().nullable().optional(),

  answers: JobAnswersSchema.nullable().optional(),
}).passthrough();

export type JobDetailsRowDTO = z.infer<typeof JobDetailsRowSchema>;
export type JobsBoardRowDTO = z.infer<typeof JobsBoardRowSchema>;

export function parseJobDetails(input: unknown): JobDetailsRowDTO {
  return JobDetailsRowSchema.parse(input);
}

export function parseJobsBoardList(input: unknown): JobsBoardRowDTO[] {
  return z.array(JobsBoardRowSchema).parse(input);
}
```

### Where to use it (Phase 1 light touch)

In your query functions:

```ts
// inside fetchJobDetails
const raw = data as unknown;
return parseJobDetails(raw) as unknown as JobDetailsRow;
```

If your `JobDetailsRow` already matches, this is safe. If it doesn’t, Zod tells you immediately.

---

# Task 4 — ESLint flat config guard (no Supabase in jobs components)

### ✅ Goal

Architecture enforcement via lint.

You said you use **flat config** (`eslint.config.js`). Great.

## 1) Install plugin

```bash
npm i -D eslint-plugin-import
```

## 2) Add rule to `eslint.config.js`

```js
import importPlugin from "eslint-plugin-import";

export default [
  // ...your existing config blocks...

  {
    files: ["src/pages/jobs/components/**/*.{ts,tsx}"],
    plugins: { import: importPlugin },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/pages/jobs/components",
              from: "./src/integrations/supabase",
              message: "Do not import Supabase in UI components. Use pages/jobs/queries or pages/jobs/actions.",
            },
          ],
        },
      ],
    },
  },
];
```

### Optional: block Supabase in *all* jobs UI (modal too)

Add another block for `src/pages/jobs/**/*` excluding `queries` and `actions`, but keep it Phase 2 if you’re still moving files.

---

# Implementation Sequence (your order is correct)

1. **FormattedAnswers** → pure
2. **JobDetailsModal** → build `jobPack` + render only jobPack
3. **validators.ts** → add parse functions and optionally integrate in queryFns
4. **ESLint guard** → enforce “no Supabase in components”

---

# Final verification (quick + reliable)

Run these after changes:

* `/jobs` loads
* open modal: location/budget/timing display from `jobPack.*.display`
* services show resolved labels (fallback until packs arrive is fine)
* message flow logged out vs logged in
* run:
  `grep -R "from.*supabase" src/pages/jobs/components`
  → **no matches**
* ESLint should fail if someone reintroduces Supabase into components

---

If you paste your current `JobDetailsModal.tsx` (just the render part), I’ll rewrite it directly into the **jobPack-only** version so you don’t spend time chasing missing fields or UI regressions.
