

# Pack Source Tracking + Analytics - Implementation Plan

## Overview

Add `_pack_source` and `_pack_slug` tracking to job answers so we can:
1. Identify which packs users actually encounter (strong vs generic vs fallback)
2. Build a data-driven rewrite queue based on real demand
3. Monitor pack quality coverage over time

## Current State

| Pack Status | Count | Notes |
|-------------|-------|-------|
| MISSING | 184 | Fall back to `general-project` |
| GENERIC | 78 | Have "briefly describe" opener |
| STRONG | 29 | Trade-aware, 5+ questions |
| FALLBACK | 1 | `general-project` pack itself |

**Total taxonomy:** 292 micro-services

## Implementation Strategy

### Phase 1: Add Pack Tracking to QuestionsStep

**File:** `src/components/wizard/canonical/steps/QuestionsStep.tsx`

After packs are fetched and quality is determined, inject tracking metadata into answers:

```typescript
// After fetchPacks completes and before setLoading(false)
const primarySlug = microSlugs[0] || null;
const usedFallback = parsedPacks.some(p => p.micro_slug === 'general-project');
const primaryPack = parsedPacks.find(p => p.micro_slug === primarySlug);

// Determine pack source
let packSource: 'strong' | 'generic' | 'fallback' = 'fallback';
if (primaryPack && primaryPack.micro_slug !== 'general-project') {
  packSource = getPackQualityTier(primaryPack) === 'strong' ? 'strong' : 'generic';
}

// Inject tracking into answers
onChange({
  ...answers,
  _pack_source: packSource,
  _pack_slug: primarySlug,
  _pack_missing: usedFallback,
});
```

### Phase 2: Update JobAnswers Type

**File:** `src/pages/jobs/types.ts`

Add optional tracking fields:

```typescript
export type JobAnswers = {
  // ... existing fields
  
  // Pack tracking metadata (optional, for analytics)
  _pack_source?: 'strong' | 'generic' | 'fallback';
  _pack_slug?: string | null;
  _pack_missing?: boolean;
};
```

### Phase 3: Preserve Tracking in buildJobPayload

**File:** `src/components/wizard/canonical/lib/buildJobPayload.ts`

Ensure tracking metadata is preserved when building the answers payload:

```typescript
const answersPayload: Json = {
  selected: { ... },
  microAnswers,
  logistics: { ... },
  extras: { ... },
  // Preserve pack tracking metadata
  _pack_source: state.answers._pack_source ?? null,
  _pack_slug: state.answers._pack_slug ?? null,
  _pack_missing: state.answers._pack_missing ?? false,
};
```

### Phase 4: Add Analytics Queries

Once tracking is in place, these queries identify the rewrite queue:

```sql
-- Top fallback slugs (users hitting missing packs)
SELECT answers->>'_pack_slug' AS slug, COUNT(*)
FROM jobs
WHERE answers->>'_pack_source' = 'fallback'
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20;

-- Top generic slugs (users hitting weak packs)
SELECT answers->>'_pack_slug' AS slug, COUNT(*)
FROM jobs
WHERE answers->>'_pack_source' = 'generic'
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20;

-- Pack quality distribution
SELECT 
  answers->>'_pack_source' AS source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pct
FROM jobs
WHERE answers->>'_pack_source' IS NOT NULL
GROUP BY 1
ORDER BY count DESC;
```

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `QuestionsStep.tsx` | Add pack source detection + inject tracking | High |
| `types.ts` | Add optional `_pack_*` fields to JobAnswers | Medium |
| `buildJobPayload.ts` | Preserve tracking fields in payload | High |

## Technical Details

### Pack Source Detection Logic

```typescript
function determinePackSource(
  primarySlug: string | null,
  packs: QuestionPack[]
): { source: 'strong' | 'generic' | 'fallback'; missing: boolean } {
  // No packs or using fallback
  if (!packs.length || packs[0].micro_slug === 'general-project') {
    return { source: 'fallback', missing: true };
  }
  
  // Find the pack for primary slug
  const primaryPack = packs.find(p => p.micro_slug === primarySlug);
  if (!primaryPack) {
    return { source: 'fallback', missing: true };
  }
  
  // Check quality tier
  const tier = getPackQualityTier(primaryPack);
  return { 
    source: tier, 
    missing: tier === 'fallback' 
  };
}
```

### Tracking Injection Point

Add tracking after packs are fetched and quality is determined, within the `fetchPacks` effect in `QuestionsStep.tsx`:

```typescript
useEffect(() => {
  // ... existing pack fetching logic
  
  // After packs are loaded, inject tracking
  if (!loading && packs.length > 0) {
    const primarySlug = microSlugs[0] || null;
    const { source, missing } = determinePackSource(primarySlug, packs);
    
    // Only inject if not already set (prevents infinite loop)
    if (answers._pack_source !== source) {
      onChange({
        ...answers,
        _pack_source: source,
        _pack_slug: primarySlug,
        _pack_missing: missing,
      });
    }
  }
}, [packs, loading, microSlugs]);
```

## Success Criteria

1. **Jobs include tracking metadata**: New jobs have `_pack_source`, `_pack_slug`, `_pack_missing` in answers
2. **Analytics queries work**: Can run the SQL queries above to get pack usage data
3. **No UI changes**: Tracking is invisible to users
4. **No performance impact**: Tracking is injected once per step, not on every render

## QA Checklist

| Test Case | Expected Result |
|-----------|-----------------|
| Submit job with strong pack (e.g., `burst-pipe`) | `_pack_source: "strong"` |
| Submit job with generic pack | `_pack_source: "generic"` |
| Submit job with missing pack | `_pack_source: "fallback"`, `_pack_missing: true` |
| Check job in DB | All three `_pack_*` fields present in answers |

