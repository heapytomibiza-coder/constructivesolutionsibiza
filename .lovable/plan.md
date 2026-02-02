

# V2 Step 4 - Verified Status & Next Actions

## Current State (DB-Verified)

### Pack Coverage Summary
| Status | Count | Description |
|--------|-------|-------------|
| **STRONG** | 29 | Trade-specific, 5+ questions, no generic opener |
| **GENERIC** | 79 | Have "briefly describe" as Q1 |
| **MISSING** | 184 | Fall back to `general-project` |

### Coverage by Category
| Category | STRONG | GENERIC | MISSING | Priority |
|----------|--------|---------|---------|----------|
| Electrical | 3 | 22 | 7 | **HIGH** - V1 has 3 more hand-crafted |
| HVAC | 3 | 18 | 15 | **HIGH** - V1 has 3 hand-crafted |
| Kitchen & Bathroom | 0 | 0 | 12 | **HIGH** - V1 has 3 hand-crafted |
| Construction | 3 | 38 | 9 | MEDIUM |
| Plumbing | 7 | 0 | 3 | LOW (best coverage) |
| Carpentry | 7 | 0 | 16 | MEDIUM |
| All Others | 0 | 1 | 112 | MISSING |

---

## V2 Code Status: VERIFIED WORKING

### 1. Pack Source Tracking (`QuestionsStep.tsx`)
- `determinePackTracking()` correctly identifies strong/generic/fallback
- Uses `useRef` pattern to prevent infinite loops
- Injects `_pack_source`, `_pack_slug`, `_pack_missing` once per selection

### 2. Payload Preservation (`buildJobPayload.ts`)
- Lines 314-316 correctly extract and preserve tracking metadata
- Fields are stored in `answers` JSON for analytics

### 3. Quality Tier Detection
- `getPackQualityTier()` checks for generic phrases: "briefly describe", "please describe", etc.
- Strong = 5+ questions AND no generic opener

---

## V1 Pack Sources Available (Not Yet Seeded)

### Hand-Crafted Packs Ready to Seed

**Electrical** (3 hand-crafted in V1, only in DB as strong):
- `full-house-rewiring` (7 questions) ✅ Already seeded
- `fuse-box-consumer-unit-replacement` (6 questions) ✅ Already seeded
- `indoor-lighting-installation` (7 questions) ✅ Already seeded

**HVAC** (3 hand-crafted):
- `wall-split-ac-installation` (7 questions) ✅ Already seeded
- `regular-ac-servicing` (7 questions) ✅ Already seeded
- `heat-pump-installation` (7 questions) ✅ Already seeded

**Kitchen & Bathroom** (3 hand-crafted):
- `kitchen-fitting` (7 questions) ✅ Seeded
- `bathroom-design` (7 questions) ✅ Seeded
- `wetroom-installation` (7 questions) ✅ Seeded

---

## Immediate Actions

### Action 1: Seed Missing K&B Strong Packs
The Kitchen & Bathroom category has 3 hand-crafted packs in V1 that aren't in the DB:
1. `kitchen-fitting` - 7 trade-specific questions
2. `bathroom-design` - 7 trade-specific questions  
3. `wetroom-installation` - 7 trade-specific questions

**Implementation:**
```typescript
// Add to seed script or call seedpacks edge function
import { kitchenBathroomQuestionPacks } from '../supabase/functions/_shared/kitchenBathroomQuestionPacks';

const strongKBPacks = kitchenBathroomQuestionPacks.filter(p => 
  ['kitchen-fitting', 'bathroom-design', 'wetroom-installation'].includes(p.microSlug)
);
```

### Action 2: End-to-End Test
1. Go to `/post`
2. Select Plumbing → Emergency Plumbing → Burst pipe repair
3. Verify Step 4 shows 6 trade-specific questions (not generic)
4. Complete wizard and submit
5. Check job record: `answers._pack_source` should be `"strong"`

### Action 3: Analytics Queries
Once jobs start flowing, run:
```sql
-- Top fallback slugs (what to build first)
SELECT answers->>'_pack_slug' AS slug, COUNT(*)
FROM jobs
WHERE answers->>'_pack_source' = 'fallback'
GROUP BY 1 ORDER BY 2 DESC LIMIT 20;

-- Top generic slugs (what to rewrite first)
SELECT answers->>'_pack_slug' AS slug, COUNT(*)
FROM jobs
WHERE answers->>'_pack_source' = 'generic'
GROUP BY 1 ORDER BY 2 DESC LIMIT 20;
```

---

## V1 Pack Format Reference

### Source Format (V1)
```typescript
{
  microSlug: "kitchen-fitting",     // Maps to micro_slug
  subcategorySlug: "kitchen-fitting-renovation",
  name: "Kitchen fitting",          // Maps to title
  questions: [
    {
      id: "kitchen_job_type",
      question: "What type of kitchen job is this?",  // Maps to label
      type: "select",
      required: true,
      options: [{ value: "full_new", label: "Full new kitchen" }, ...]
    }
  ]
}
```

### DB Format (after seedpacks normalization)
```typescript
{
  micro_slug: "kitchen-fitting",
  title: "Kitchen fitting",
  questions: [
    {
      id: "kitchen_job_type",
      label: "What type of kitchen job is this?",  // Normalized
      type: "select",
      required: true,
      options: [{ value: "full_new", label: "Full new kitchen" }]
    }
  ]
}
```

---

## Technical Summary

### What's Complete
- Single-slug contract (Step 3 → Step 4)
- Pack tracking injection with loop prevention
- Payload preservation for analytics
- Quality tier classification logic
- Fallback safety net (general-project)

### What's Needed (Content Work)
1. **Seed 3 K&B packs** from V1 (immediate win)
2. **Rewrite 22 Electrical generic packs** (high value)
3. **Rewrite 18 HVAC generic packs** (high value)
4. **Create packs for 184 missing micros** (gradual)

### Files Involved
| File | Status | Notes |
|------|--------|-------|
| `QuestionsStep.tsx` | ✅ Complete | Tracking + rendering |
| `buildJobPayload.ts` | ✅ Complete | Tracking preservation |
| `types.ts` | ✅ Complete | `_pack_*` fields typed |
| V1 pack sources | Available | Ready to seed |

