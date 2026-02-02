

# Plan: Non-Generic Question Packs - The Core Moat

## Executive Summary

**The Problem:**
- 94 question packs exist in DB
- **78 of 94 (83%) use generic openers** ("Briefly describe what you need for...")
- Only **15 packs are truly trade-aware** (strong packs)
- V1 felt stronger because questions sounded like a real professional on site
- **192 micro-services have no packs at all**

**The Principle:**
> Step 4 is not a form. It is the conversation a good professional would ask before even quoting.

---

## Current State Analysis

### Quality Breakdown
| Metric | Count | Percentage |
|--------|-------|------------|
| Total packs in DB | 94 | 100% |
| Generic opener packs | 78 | 83% |
| Low question count (<5) | 1 | 1% |
| Strong packs (non-generic, 5+ questions) | 15 | 16% |
| Missing entirely | 192 | - |

### Source Files Available (Not Seeded or Seeded Generically)
```
supabase/functions/_shared/
 carpentryQuestionPacks.ts       - 3 hand-crafted + 12 generic
 carpentryQuestionPacksV2.ts     - V2 i18n format (needs normalization)
 constructionQuestionPacks.ts   - mostly generic builders
 electricalQuestionPacks.ts     - mixed quality
 floorsDoorsWindowsQuestionPacks.ts
 gardeningLandscapingQuestionPacks.ts
 handymanQuestionPacks.ts
 hvacQuestionPacks.ts           - mostly generic builders
 kitchenBathroomQuestionPacks.ts
 plumbingQuestionPacks.ts       - 3 hand-crafted emergency packs
 poolSpaQuestionPacks.ts
 transportQuestionPacks.ts
```

### The Quality Difference

**Generic Pack (Current - Weak):**
```
Question 1: "Briefly describe what you need for AC emergency repair"
Question 2: "What type of property is this?"
Question 3: "Which areas are involved?"
...
```

**Trade-Aware Pack (Target - Strong):**
```
Question 1: "Where is the burst pipe located?"
   Options: Kitchen / Bathroom / Utility / Under floor / Outside / Not sure

Question 2: "What best describes the water flow?"
   Options: Slow drip / Steady leak / Fast flow / Spraying / Stopped but damaged

Question 3: "Have you been able to turn off the water?"
   Options: Yes, main stop tap / Yes, local only / Cannot find / Valve stuck / Not tried
```

The second version:
- Sounds like a real plumber asking
- Collects actionable information
- Builds instant trust
- Enables accurate quoting

---

## Phase 1: Define the Quality Standard (Immediate)

### Non-Negotiable Rules for Question Packs

**Banned Phrases:**
- "Briefly describe what you need"
- "Please describe your project"
- "What do you need help with?"
- "Any additional details?"

These phrases exist only as **optional free-text AFTER** real filtering has happened.

**Minimum Pack Standard:**
| Requirement | Threshold |
|-------------|-----------|
| Question count | 5-8 minimum |
| Multiple choice | 70%+ of questions |
| Trade-specific language | Must reference actual work elements |
| Conditionals | 1-2 show_if dependencies |
| Generic openers | FORBIDDEN as primary question |

**The Test:**
> If a professional reads Step 4 and thinks "yeah, that's what I'd ask," it passes.
> If they think "this tells me nothing," it fails.

---

## Phase 2: Pack Quality Audit System

### Add Pack Strength Scoring

Create a simple scoring system for existing and new packs:

| Signal | Points | Description |
|--------|--------|-------------|
| Generic opener | -5 | Contains "describe what you need" |
| Trade-specific terms | +2 | References actual materials, tools, symptoms |
| Conditional logic | +2 | Has show_if dependencies |
| Question count 5-8 | +1 | Optimal range |
| All multiple choice | +1 | No open text as primary |

**Score Categories:**
- Strong: 5+ points
- Acceptable: 2-4 points  
- Weak: 0-1 points
- Failing: Negative score

### Database Query for Audit
```sql
SELECT 
  micro_slug,
  title,
  jsonb_array_length(questions) as q_count,
  CASE 
    WHEN questions::text LIKE '%Briefly describe%' THEN 'WEAK'
    WHEN jsonb_array_length(questions) >= 5 THEN 'STRONG'
    ELSE 'ACCEPTABLE'
  END as quality_tier
FROM question_packs 
WHERE is_active = true
ORDER BY quality_tier, micro_slug;
```

---

## Phase 3: Two-Track Pack Generation

### Track A: Human-Written Packs (Gold Standard)

**Process:**
1. Think like a pro arriving on site
2. Ask: "What do I need to know before I even say yes?"
3. Write 5-8 questions using trade language

**Example Template (Bespoke Shelving):**

| Question | Type | Why It Matters |
|----------|------|----------------|
| Wall type? | Radio: Solid / Stud / Unknown | Determines fixings + weight capacity |
| Approx length? | Radio: <1m / 1-2m / 2-3m / >3m | Scope + material estimate |
| Floor-to-ceiling or mid-height? | Radio | Changes complexity significantly |
| Finish expectation? | Radio: Painted / Natural / Premium | Material + labour cost |
| Space occupied during install? | Radio: Yes / No | Scheduling + dust protection |
| Existing furniture to work around? | Radio | Access complexity |

This pack:
- Eliminates time-wasters
- Instantly frames cost + effort
- Builds client trust

### Track B: AI-Assisted Packs (Scale Mode)

**Hard Constraints for AI Generation:**
1. Prompt MUST include: Trade, Subcategory, Exact micro-service
2. FORBIDDEN: Any "describe your project" opener
3. Minimum: 5 questions
4. 70%+ multiple choice
5. Tone: Practical, on-site, assumptive

**AI Prompt Template:**
```
You are a senior [TRADE] professional in Ibiza. 

A client wants [MICRO-SERVICE]. 

Write 6-8 questions you would ask BEFORE quoting.

Rules:
- NO generic openers like "describe your project"
- Use trade-specific language
- Focus on: scope, access, materials, complexity, urgency
- Each question must help with pricing
- Use radio/checkbox, not open text
- Include at least 1 conditional (show_if)
```

**AI Output Review:**
- Human approves or refines
- Fails auto-validation if banned phrases detected
- Never published without human sign-off

---

## Phase 4: Priority Rewrite List

### Top 20 Commercial Micros for Hand-Crafted Packs

Based on Ibiza market reality (renovation-heavy, high ticket):

**Carpentry (High Emotional Investment):**
1. bespoke-tables
2. sliding-door-wardrobes
3. staircases-handrails
4. shelving-storage-units
5. built-in-cupboards

**Plumbing (Urgent, Budget-Tolerant):**
6. burst-pipe (already strong)
7. sewer-backup (already strong)
8. water-heater-emergency (already strong)
9. tap-installation
10. toilet-repair

**Kitchen & Bathroom (High Revenue):**
11. kitchen-installation
12. bathroom-renovation
13. shower-installation
14. worktop-fitting

**HVAC (Seasonal Demand):**
15. wall-split-ac-installation
16. ac-emergency-repair
17. ducted-ac-installation
18. thermostat-installation

**Electrical (Safety-Critical):**
19. ev-charger-installation
20. fuse-board-upgrade

---

## Phase 5: Implementation Steps

### Step 1: Flag Weak Packs in DB
Add a `quality_tier` column or metadata flag to identify packs needing rewrite.

### Step 2: Rewrite Top 20 Hand-Crafted
Write trade-aware packs for priority micros using Track A process.

### Step 3: Seed Improvements via seedpacks
Use existing edge function with updated pack definitions.

### Step 4: Implement Validation in Seeder
Modify `seedpacks/index.ts` to:
- Reject packs with banned phrases
- Warn if question count < 5
- Log quality score on insert

### Step 5: Add Admin Review UI (V2.1)
Simple dashboard showing:
- Pack quality by category
- Weak packs requiring attention
- Fallback usage percentage

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/seedpacks/index.ts` | Add validation for banned phrases + quality scoring |
| `supabase/functions/_shared/*.ts` | Rewrite generic pack builders to trade-aware versions |
| New: `scripts/audit-pack-quality.ts` | Script to generate quality report |
| Database migration | Optional: Add `quality_tier` column to `question_packs` |

---

## Success Metrics

**V2 Launch (Now):**
- Zero dead ends (fallback works)
- Top 20 commercial packs at "Strong" quality
- Generic packs still functional but flagged for rewrite

**V2.1 (Next Sprint):**
- 80%+ packs at "Strong" or "Acceptable"
- <10% fallback usage
- Pro feedback: "Questions make sense"

**Long-Term:**
- 100% trade-aware packs
- Fallback deprecated per category as coverage reaches 100%
- Competitive moat: 286 micro-specific briefing conversations

---

## Technical Notes

### Why This Is the Moat

Competitors will copy:
- Categories
- UI
- "AI matching" buzzwords

Competitors cannot copy:
- 286 micro-specific, trade-aware briefing conversations
- Built from real jobs
- Continuously refined by response data

This is not software. This is **institutional knowledge**.

### Internal Reframe

Stop calling it: "Questions step"

Call it: **Professional Briefing**

That mindset alone changes how everyone treats it.

