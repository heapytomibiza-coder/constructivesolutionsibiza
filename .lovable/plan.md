

# V2 MVP Launch Plan: Status Recap & Completion Roadmap

## Executive Summary

The V2 rebuild is **70-80% complete** for MVP functionality. Core architecture is solid, critical paths work end-to-end, and the question pack system is partially seeded. This plan identifies the remaining work required to cross the launch line.

---

## Current State Assessment

### Architecture (DONE)

| Component | Status | Notes |
|-----------|--------|-------|
| Domain-driven structure | Done | `queries/`, `actions/`, `lib/` separation |
| Route guard system | Done | `RouteGuard` + `checkAccess()` |
| Session management | Done | `SessionContext` with roles |
| Wizard state machine | Done | 7-step flow with URL sync |
| Job details read-model | Done | `buildJobPack()` transforms raw data |
| Answer resolver | Done | Labels resolved from question packs |
| Draft persistence | Done | `sessionStorage` + server-side form_sessions |
| Zod validators | Done | `validators.ts` boundary protection |

### Database Schema (DONE)

| Table | Status | RLS |
|-------|--------|-----|
| `jobs` | Done | Yes |
| `conversations` | Done | Yes |
| `messages` | Done | Yes |
| `user_roles` | Done | Yes |
| `professional_profiles` | Done | Yes |
| `professional_services` | Done | Yes |
| `service_categories` | Done | Public read |
| `service_subcategories` | Done | Public read |
| `service_micro_categories` | Done | Public read |
| `question_packs` | Done | Public read |

**Security Note**: 2 linter warnings to address (security definer view, leaked password protection).

### User Flows (Status)

| Flow | Status | Notes |
|------|--------|-------|
| Homepage | Done | Categories grid, CTAs, trust signals |
| Auth (email/password) | Done | Sign in, sign up, email verification |
| Post Job Wizard | Done | 7-step flow, draft recovery |
| Job Board | Done | Filtering, matched jobs toggle |
| Job Details Modal | Done | Renders from `JobPack` read-model |
| Client Dashboard | Done | Stats, job list, messages count |
| Pro Dashboard | Done | Matched jobs, service setup CTA |
| Messages | Done | Realtime, mobile-responsive |
| Professional Onboarding | Done | Service selection by micro |
| **Forum** | **Not Started** | MVP requirement per memory |

---

## Question Pack Coverage

### Current Statistics

| Metric | Value |
|--------|-------|
| **Total micro-services** | 295 |
| **Packs seeded** | 121 |
| **Coverage** | 41% |

### Category Breakdown

| Category | Total Micros | Packs | Coverage | Priority |
|----------|-------------|-------|----------|----------|
| **Electrical** | 32 | 32 | 100% | Completed |
| **Plumbing** | 10 | 10 | 100% | Completed |
| **Construction** | 50 | 41 | 82% | High |
| **HVAC** | 36 | 21 | 58% | High |
| **Carpentry** | 23 | 7 | 30% | Medium |
| **Kitchen & Bathroom** | 15 | 3 | 20% | High |
| Pool & Spa | 12 | 0 | 0% | Low |
| Painting & Decorating | 15 | 0 | 0% | Medium |
| Floors, Doors & Windows | 13 | 0 | 0% | Medium |
| Gardening & Landscaping | 9 | 0 | 0% | Low |
| Transport & Logistics | 15 | 6 | 40% | Low |
| Cleaning | 12 | 0 | 0% | Low |
| Handyman & General | 7 | 1 | 14% | Low |
| Commercial & Industrial | 12 | 0 | 0% | Low |
| Legal & Regulatory | 12 | 0 | 0% | Low |
| Architects & Design | 12 | 0 | 0% | Low |

### Fallback Safety

Services without packs use a "General Briefing" fallback. Users can still post jobs, but briefings are generic. This is acceptable for launch with the "Top 30" commercial services covered.

---

## Gap Analysis: What's Missing for MVP

### CRITICAL (Must Have)

1. **Forum Feature** - Per MVP requirements, forum is a core feature for WhatsApp-first community
2. **Top 30 Pack Coverage** - HVAC, Kitchen & Bathroom, and remaining Construction packs
3. **Security Fixes** - Address 2 linter warnings

### HIGH (Should Have)

4. **Rules Engine Integration** - Evaluate `metadata.rules` to compute inspection flags on job cards
5. **Remaining HVAC Packs** - 15 missing (AC Installation, AC Repair, Boiler services)
6. **Kitchen & Bathroom Packs** - 12 missing

### MEDIUM (Nice to Have)

7. **Carpentry Packs** - 16 missing
8. **Painting & Decorating Packs** - 15 missing (entire category)
9. **WhatsApp Share** - "Share to WhatsApp" on job confirmation

### LOW (Post-Launch)

10. **Remaining Categories** - Pool, Cleaning, Commercial, Legal, etc.

---

## Completion Roadmap

### Phase 1: Critical Path (Launch Blockers)

```text
Week 1, Days 1-2
--------------------------------
Task 1.1: Forum MVP
  - Create forum_categories, forum_posts, forum_replies tables
  - Build /forum route with category list
  - Build /forum/:categorySlug with post list
  - Build /forum/post/:id with thread view
  - Add "New Post" flow
  - RLS: Authenticated users can post, public can read
  
  Acceptance: User can create a forum post, others can reply

Task 1.2: Security Fixes
  - Review security definer view issue
  - Enable leaked password protection
  
  Acceptance: Linter shows 0 errors

Task 1.3: Top 30 Packs - HVAC Completion
  - Seed remaining 15 HVAC packs using lite template
  - Include metadata.rules for inspection flags
  
  Acceptance: HVAC at 100% coverage
```

### Phase 2: Pack Coverage (Quality Bar)

```text
Week 1, Days 3-4
--------------------------------
Task 2.1: Kitchen & Bathroom Completion
  - Seed 12 remaining packs
  - Use established Gold Standard patterns
  
  Acceptance: Kitchen & Bathroom at 100%

Task 2.2: Construction Gap Fill
  - Seed 9 remaining Construction packs
  
  Acceptance: Construction at 100%

Task 2.3: Rules Engine UI Integration
  - Create evaluateRules(answers, rules) utility
  - Display inspection flags on job cards
  - Show "Quote subject to inspection" badges
  
  Acceptance: Flags visible on jobs from Electrical/Plumbing
```

### Phase 3: Polish & Launch Prep

```text
Week 2, Days 1-2
--------------------------------
Task 3.1: Carpentry Pack Batch
  - 16 lite packs following established patterns
  
Task 3.2: Painting & Decorating Pack Batch
  - 15 lite packs (new category contract)

Task 3.3: WhatsApp Share
  - Add share button to job confirmation
  - Generate shareable link/message

Task 3.4: End-to-End Testing
  - Full wizard flow for each seeded category
  - Job details rendering verification
  - Message flow testing
  
  Acceptance: All critical paths work without errors
```

---

## Technical Implementation Details

### Forum Schema (Task 1.1)

```sql
-- forum_categories
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- forum_posts
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES forum_categories(id),
  author_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  reply_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- forum_replies
CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES forum_replies(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- Public read, authenticated write
CREATE POLICY "Public can read posts" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated can create posts" ON forum_posts FOR INSERT 
  WITH CHECK (auth.uid() = author_id);
```

### Rules Evaluator (Task 2.3)

```typescript
// src/lib/evaluatePackRules.ts

type PackRule = {
  id: string;
  when: { questionId: string; op: "eq" | "in"; value: unknown };
  add_flags: string[];
  set?: { 
    inspection_bias?: "low" | "medium" | "high" | "mandatory"; 
    safety?: "green" | "amber" | "red" 
  };
};

export function evaluateRules(
  answers: Record<string, unknown>, 
  rules: PackRule[]
) {
  const flags = new Set<string>();
  let inspection_bias: string | undefined;
  let safety: string | undefined;

  for (const rule of rules ?? []) {
    const value = answers[rule.when.questionId];
    const hit =
      (rule.when.op === "eq" && value === rule.when.value) ||
      (rule.when.op === "in" && Array.isArray(rule.when.value) && 
       rule.when.value.includes(value));

    if (hit) {
      rule.add_flags?.forEach(f => flags.add(f));
      if (rule.set?.inspection_bias) inspection_bias = rule.set.inspection_bias;
      if (rule.set?.safety) safety = rule.set.safety;
    }
  }

  return { 
    flags: Array.from(flags), 
    inspection_bias, 
    safety 
  };
}
```

### Lite Pack Template (for batch seeding)

```typescript
// Template for generating remaining packs
const litePackTemplate = {
  version: 1,
  is_active: true,
  metadata: {
    category_contract: "category_slug",
    inspection_bias: "medium",
    scope_unit: "items",
    rules: []
  },
  questions: [
    // Q1: Task identification (trade-specific)
    { id: "q_01_task", label: "What do you need?", type: "radio", required: true, options: [] },
    // Q2: Scope quantification  
    { id: "q_02_scope", label: "How many/much?", type: "radio", required: true, options: [] },
    // Q3: Property context
    { id: "q_03_property", label: "Property type", type: "radio", required: true, options: [] },
    // Q4: Existing condition
    { id: "q_04_existing", label: "Current situation", type: "radio", required: true, options: [] },
    // Q5: Access/method
    { id: "q_05_access", label: "Access details", type: "radio", required: true, options: [] },
    // Q6: Urgency
    { id: "q_06_urgency", label: "Urgency", type: "radio", required: true, options: [] },
    // Q7: Photos
    { id: "q_07_photos", label: "Upload photos", type: "file", required: false },
    // Q8: Notes
    { id: "q_08_notes", label: "Additional notes", type: "textarea", required: false }
  ]
};
```

---

## Launch Checklist

### Pre-Launch (Must Complete)

- [ ] Forum feature implemented
- [ ] Security linter warnings resolved
- [ ] Top 30 commercial micros have Strong/Acceptable packs
- [ ] Electrical: 32/32 packs (Done)
- [ ] Plumbing: 10/10 packs (Done)
- [ ] HVAC: 36/36 packs
- [ ] Kitchen & Bathroom: 15/15 packs
- [ ] Construction: 50/50 packs
- [ ] End-to-end test: Post job flow
- [ ] End-to-end test: Message flow
- [ ] End-to-end test: Pro matching flow

### Launch Day

- [ ] DNS configured for production domain
- [ ] Publish to production
- [ ] Seed initial forum categories
- [ ] Monitor error logs

### Post-Launch (Week 1)

- [ ] Complete Carpentry packs
- [ ] Complete Painting & Decorating packs
- [ ] WhatsApp share feature
- [ ] Analytics review

---

## Recommended Immediate Actions

1. **Start Forum MVP** - This is the biggest gap and a stated MVP requirement
2. **Run HVAC seeder with remaining packs** - Fastest path to Top 30 coverage
3. **Fix security warnings** - Quick wins
4. **Test full wizard flow for Electrical/Plumbing** - Validate what's already built

The platform is architecturally solid. The remaining work is primarily content (packs) and one feature (forum). With focused execution, this is achievable in 1-2 weeks.

