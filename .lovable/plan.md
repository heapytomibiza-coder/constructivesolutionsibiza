

# Hardening the CS Ibiza System Architecture

## What I Found

After exploring your codebase, I can see you've built a solid foundation with clear patterns. Here's what's working well and what needs hardening:

### Already Strong
1. **Route registry** - Single source of truth in `src/app/routes/registry.ts`
2. **Session management** - `useSessionSnapshot` is the canonical hook
3. **Domain-first structure** - Jobs domain has clean actions/queries/components split
4. **Rules engine** - `evaluatePackRules.ts` for computed flags and safety levels
5. **Wizard as compiler** - `buildJobPayload.ts` transforms messy input into structured schema
6. **Matching algorithm** - `matched_jobs_for_professional` view joins micro_slug → professional_services

### Gaps That Need Hardening

| Gap | Current State | Risk |
|-----|---------------|------|
| **Terminology drift** | UI uses mixed terms (client/professional vs Asker/Tasker) | Brand confusion |
| **ESLint guard scope** | Only covers `src/pages/jobs/components` | Supabase can leak into wizard, messages, etc. |
| **Messages dashboard link** | Hardcoded `/dashboard/client` on line 98 | Pro users see wrong link |
| **No vocabulary lockfile** | Terms scattered across 7 JSON namespaces | Drift over time |
| **No domain model spec** | `JobAnswers` exists but "ProblemCard" abstraction not formalized | Harder to reason about system |

---

## The Plan: Three Layers of Hardening

### Layer 1: Vocabulary System (Language Lockdown)

**Create a canonical lexicon namespace**

Add `public/locales/en/lexicon.json`:
```json
{
  "asker": "Asker",
  "tasker": "Tasker",
  "problem": "Problem",
  "solution": "Solution",
  "askerLane": "Asker Lane",
  "taskerLane": "Tasker Lane",
  "problemBuilder": "Problem Builder",
  "matching": "Finding the right Tasker"
}
```

**Update translation keys to use lexicon**

Replace hardcoded role labels in `common.json`:
```json
"roles": {
  "client": "{{lexicon.asker}}",    // Will become: t('lexicon.asker')
  "professional": "{{lexicon.tasker}}"
}
```

**Files to modify:**
- Create `public/locales/en/lexicon.json` and `public/locales/es/lexicon.json`
- Update `src/i18n/namespaces.ts` to include `lexicon`
- Update `public/locales/en/common.json` role labels
- Update `public/locales/es/common.json` role labels
- Update onboarding copy to use Tasker terminology

---

### Layer 2: Architecture Guards (Logic Lockdown)

**Extend ESLint guard to all UI components**

Current: Only `src/pages/jobs/components` is protected
Target: All of these:

```javascript
// eslint.config.js - expanded zones
{
  files: [
    "src/pages/*/components/**/*.{ts,tsx}",
    "src/features/*/components/**/*.{ts,tsx}",
    "src/shared/components/**/*.{ts,tsx}",
    "src/components/**/*.{ts,tsx}"  // except ui/
  ],
  // ... same no-supabase rule
}
```

**Fix Messages dashboard link**

Line 98 of `Messages.tsx`:
```typescript
// Current (broken for pros)
<Link to="/dashboard/client">

// Fixed (role-aware)
<Link to={activeRole === 'professional' ? '/dashboard/pro' : '/dashboard/client'}>
```

**Files to modify:**
- `eslint.config.js` - Expand guard zones
- `src/pages/messages/Messages.tsx` - Role-aware dashboard link

---

### Layer 3: Domain Model Formalization (System Lockdown)

**Create explicit domain types in `src/domain/`**

Add `src/domain/models.ts`:
```typescript
/**
 * DOMAIN MODEL - The Core Loop
 * 
 * Problem → Asker → CS → Tasker → Solution
 * 
 * These types are the contracts that bind the system together.
 */

// A structured problem (what the wizard compiles into)
export interface ProblemCard {
  id: string;
  asker_id: string;
  
  // What
  micros: {
    ids: string[];
    slugs: string[];
    names: string[];
  };
  answers: Record<string, unknown>;
  
  // Where/When
  logistics: {
    location: LocationSpec;
    timing: TimingSpec;
    budget?: BudgetSpec;
  };
  
  // Computed
  flags: string[];
  inspection_bias?: 'low' | 'medium' | 'high' | 'mandatory';
  safety?: 'green' | 'amber' | 'red';
  
  // State
  status: 'draft' | 'open' | 'assigned' | 'completed' | 'cancelled';
}

// A tasker's capability profile
export interface TaskerProfile {
  user_id: string;
  
  // What they do
  micros: string[];  // micro_ids they've unlocked
  
  // Where they work
  zones: string[];
  
  // Capability signals
  verification: VerificationStatus;
  stats: Record<string, MicroStat>;
  
  // Ready state
  is_live: boolean;
}

// A match between problem and tasker
export interface Match {
  problem_id: string;
  tasker_id: string;
  score: number;
  reasons: string[];  // "Matched because: Plumbing → Sink Leak + near your area"
}
```

**Update ARCHITECTURE.md with Core Loop section**

Add a "Core Loop" section explaining:
```
Problem → Asker → CS → Tasker → Solution

1. Asker describes a problem (wizard compiles it)
2. CS produces a structured ProblemCard
3. CS matches Taskers (score + reasons)
4. Conversation happens in protected channel
5. Assignment and completion
6. Review updates reputation + stats
7. System learns patterns (better matching, better packs)
```

**Files to create/modify:**
- Create `src/domain/models.ts` - Domain type contracts
- Update `docs/ARCHITECTURE.md` - Add Core Loop section
- Update `src/domain/scope.ts` - Add terminology constants

---

## Implementation Priority

### Immediate (This Session)
1. **Fix Messages.tsx dashboard link** - 5 min, unblocks pro users
2. **Expand ESLint guards** - 10 min, prevents future drift

### Short-term (Next Session)
3. **Create lexicon namespace** - 20 min, locks terminology
4. **Update role labels to use lexicon** - 15 min

### Medium-term (Architecture Polish)
5. **Create domain models** - 30 min, formalizes the system
6. **Update ARCHITECTURE.md** - 20 min, new dev onboarding

---

## What This Achieves

| Layer | Before | After |
|-------|--------|-------|
| **Language** | Terms scattered, drift possible | Single lexicon, enforced via i18n |
| **Logic** | Partial ESLint coverage | Full UI protection from Supabase |
| **System** | Implicit domain model | Explicit ProblemCard/TaskerProfile contracts |

This transforms CS Ibiza from "a website with pages" into "a modular system with contracts" - exactly what you described.

---

## Technical Details

### Vocabulary Enforcement (How It Works)

```typescript
// Instead of hardcoding "Professional" anywhere:
const label = t('lexicon.tasker');  // Returns "Tasker"

// i18n preload ensures lexicon is always available
await preloadNamespaces(['common', 'lexicon']);
```

### ESLint Guard (How It Works)

```javascript
// When someone tries to import supabase in a component:
import { supabase } from '@/integrations/supabase/client';
//                    ↑ 
// ESLint error: "Do not import Supabase in UI components. 
//               Use pages/jobs/queries or pages/jobs/actions."
```

### Matching Explainability (Future Enhancement)

The `matched_jobs_for_professional` view already joins correctly. To add explainability:

```sql
-- Add a computed reasons column
SELECT 
  j.*,
  ARRAY[
    'Matched micro: ' || m.name,
    'In your zone: ' || j.area
  ] as match_reasons
FROM jobs j
JOIN professional_services ps ON ...
```

This gives Taskers transparency on *why* they see specific jobs.

