

# Transform Builder Onboarding: "Select Services" → "Unlock Jobs"

## The Core Problem

Current builder service setup feels like **admin** - filling out a form so the platform works. The language ("Select Category", "Check all services you offer") reinforces this.

**Current flow:**
```
Category → Subcategory → Micro → Preferences → Done
"Please configure your profile"
```

**Target flow:**
```
Job Types → Unlock → Preferences → See Matches
"Here's what you can earn - claim it"
```

The goal: **Every tap should feel like unlocking money, not filling forms.**

---

## Implementation Strategy

### Phase 1: Language & Framing Overhaul

| Current Copy | New Copy |
|-------------|----------|
| "Set Up Your Services" | "Unlock Your Job Types" |
| "Select services you offer" | "Choose which jobs you want to receive" |
| "Check all services you offer" | "Unlock job types that match your skills" |
| "Select Category" | "Browse by trade" |
| "Add Services" | "Unlock More" |
| "Continue to Preferences" | "Set Your Priorities" |
| "Add X Service(s)" | "Unlock X Job Type(s)" |
| "Complete Setup" | "Start Receiving Matches" |

### Phase 2: Show Job Intelligence Per Micro

For each micro in the selection list, show **what the builder is actually unlocking**:

```
┌─────────────────────────────────────────────────────────┐
│ ☐  Tap Replacement                                      │
│     ─────────────────────────────────────────────────── │
│     Client provides: photos, location, access, urgency  │
│     💼 3 open jobs  •  ⚡ Usually ASAP                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ☐  Bathroom Fitting                                     │
│     ─────────────────────────────────────────────────── │
│     Client provides: room size, fixtures, style prefs   │
│     💼 7 open jobs  •  📅 Usually flexible timeline     │
└─────────────────────────────────────────────────────────┘
```

**Data sources:**
- **Open jobs count**: Live query from `jobs` table filtered by micro_slug
- **Client provides**: From question pack metadata (already exists)
- **Timing pattern**: Aggregated from jobs `start_timing` column

### Phase 3: Recommended Job Types

Add a "Recommended for you" section at the top of the micro selection:

```
┌─────────────────────────────────────────────────────────┐
│  ⭐ RECOMMENDED FOR PLUMBERS                            │
│                                                         │
│  Based on active demand in Ibiza:                       │
│  • Tap Replacement (8 jobs waiting)                     │
│  • Leak Detection & Repair (5 jobs waiting)             │
│  • Emergency Call-Out (4 jobs waiting)                  │
└─────────────────────────────────────────────────────────┘
```

**Logic:**
1. Query jobs by subcategory for the last 30 days
2. Count per micro_slug
3. Show top 3-5 with highest demand

### Phase 4: Unlock Progress Indicator

Replace generic progress bar with job-focused messaging:

```
┌─────────────────────────────────────────────────────────┐
│  🔓 2 of 5 job types unlocked                           │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                         │
│  Unlock at least 5 to start receiving matched leads     │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `public/locales/en/onboarding.json` | **Create** | New namespace for onboarding copy |
| `public/locales/es/onboarding.json` | **Create** | Spanish translations |
| `src/i18n/namespaces.ts` | **Modify** | Add 'onboarding' namespace |
| `src/pages/professional/ProfessionalServiceSetup.tsx` | **Modify** | Core UI transformation |
| `src/pages/professional/hooks/useJobTypeStats.ts` | **Create** | Query for open jobs per micro |
| `src/pages/professional/hooks/useRecommendedJobTypes.ts` | **Create** | Query for demand-based recommendations |
| `src/pages/professional/components/JobTypeCard.tsx` | **Create** | New card component showing micro + job intelligence |
| `src/pages/professional/components/UnlockProgress.tsx` | **Create** | Progress indicator focused on job unlocking |
| `src/pages/professional/components/RecommendedJobTypes.tsx` | **Create** | Recommended section component |

---

## Technical Implementation

### 1. Job Type Stats Query

```typescript
// src/pages/professional/hooks/useJobTypeStats.ts
export function useJobTypeStats(microSlugs: string[]) {
  return useQuery({
    queryKey: ['job_type_stats', microSlugs],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('micro_slug, start_timing')
        .in('micro_slug', microSlugs)
        .eq('status', 'open')
        .gte('created_at', thirtyDaysAgo());
      
      // Aggregate: count per micro, most common timing
      return aggregateStats(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 2. Question Pack Metadata

The existing `question_packs` table already contains metadata we can use:

```typescript
// Extract "client provides" from pack questions
function getClientProvides(pack: QuestionPack): string[] {
  return pack.questions
    .filter(q => q.required)
    .map(q => q.label)
    .slice(0, 4); // Top 4 required fields
}
```

### 3. Job Type Card Component

```tsx
// src/pages/professional/components/JobTypeCard.tsx
interface JobTypeCardProps {
  micro: MicroCategory;
  stats?: { openJobs: number; commonTiming: string };
  clientProvides?: string[];
  isSelected: boolean;
  isExisting: boolean;
  onToggle: (checked: boolean) => void;
}

export function JobTypeCard({ micro, stats, clientProvides, isSelected, isExisting, onToggle }: JobTypeCardProps) {
  return (
    <label className="...">
      <Checkbox checked={isSelected || isExisting} disabled={isExisting} onCheckedChange={onToggle} />
      
      <div className="flex-1">
        <span className="font-medium">{micro.name}</span>
        
        {/* Client provides preview */}
        {clientProvides && (
          <p className="text-xs text-muted-foreground mt-1">
            Client provides: {clientProvides.join(', ')}
          </p>
        )}
        
        {/* Job stats */}
        {stats && (
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-primary">
              <Briefcase className="h-3 w-3 inline mr-1" />
              {stats.openJobs} open jobs
            </span>
            <span className="text-muted-foreground">
              {formatTiming(stats.commonTiming)}
            </span>
          </div>
        )}
      </div>
      
      {isExisting && (
        <Badge variant="secondary">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Unlocked
        </Badge>
      )}
    </label>
  );
}
```

### 4. I18n Keys Structure

```json
// public/locales/en/onboarding.json
{
  "title": "Unlock Your Job Types",
  "subtitle": "Choose which jobs you want to receive. The more specific, the better your matches.",
  "trustLine": "Better matching = more quality leads you actually want",
  
  "progress": {
    "unlocked": "{{count}} of {{min}} job types unlocked",
    "hint": "Unlock at least {{min}} to start receiving matched leads",
    "ready": "You're ready to receive matches!"
  },
  
  "browse": {
    "yourTypes": "Your Job Types",
    "empty": "No job types unlocked yet",
    "emptyHint": "Unlock your first job type to get started",
    "unlockMore": "Unlock More"
  },
  
  "steps": {
    "browseByTrade": "Browse by trade",
    "selectType": "Select service type",
    "unlockTypes": "Unlock job types",
    "setPriorities": "Set your priorities"
  },
  
  "micro": {
    "clientProvides": "Client provides:",
    "openJobs": "{{count}} open jobs",
    "timingAsap": "Usually ASAP",
    "timingFlexible": "Usually flexible",
    "timingScheduled": "Usually scheduled"
  },
  
  "recommended": {
    "title": "Recommended for {{trade}}",
    "subtitle": "Based on active demand in Ibiza",
    "jobsWaiting": "{{count}} jobs waiting"
  },
  
  "actions": {
    "selectAll": "Select All",
    "clear": "Clear",
    "continue": "Set Priorities",
    "unlock": "Unlock {{count}} Job Type",
    "unlock_plural": "Unlock {{count}} Job Types",
    "complete": "Start Receiving Matches"
  },
  
  "preferences": {
    "title": "Set Your Priorities",
    "subtitle": "Tell us which jobs you love vs prefer to avoid",
    "setAllTo": "Set all to:",
    "love": "Love it",
    "like": "Like",
    "neutral": "Neutral",
    "avoid": "Avoid"
  }
}
```

---

## Visual Flow Comparison

**Before:**
```
┌─────────────────────────────────────────────┐
│ Set Up Your Services                         │
│ Select services you offer                    │
│                                              │
│ ☐ Tap Replacement                           │
│ ☐ Bathroom Fitting                          │
│ ☐ Emergency Plumbing                        │
│                                              │
│              [Continue to Preferences]       │
└─────────────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────────────┐
│ 🔓 Unlock Your Job Types                     │
│ Choose which jobs you want to receive        │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ⭐ RECOMMENDED FOR PLUMBERS             │ │
│ │ • Tap Replacement (8 jobs waiting)      │ │
│ │ • Leak Detection (5 jobs waiting)       │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ☐  Tap Replacement                      │ │
│ │     Client provides: photos, location   │ │
│ │     💼 8 open  •  ⚡ Usually ASAP        │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ☐  Bathroom Fitting                     │ │
│ │     Client provides: room size, style   │ │
│ │     💼 7 open  •  📅 Usually flexible   │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ 🔓 0 of 5 unlocked                           │
│ ████████████████████████████████████░░░░░░░ │
│                                              │
│              [Set Priorities →]              │
└─────────────────────────────────────────────┘
```

---

## Alignment Payoff

| Before | After |
|--------|-------|
| "Fill in your services" | "Unlock jobs waiting for you" |
| Abstract categories | Concrete job opportunities |
| No feedback until later | Immediate value visibility |
| Setup feels like admin | Setup feels like claiming money |
| Builders skip preferences | Preferences = priority control |

**The Rule Applied:**
> "The system never asks for effort without immediately giving value back."

Every micro now shows:
1. What the builder unlocks (job type)
2. What they'll receive (client provides)
3. How much is waiting (open jobs count)
4. When it typically happens (timing pattern)

---

## Implementation Order

1. **Create i18n namespace** - `onboarding.json` files
2. **Create query hooks** - `useJobTypeStats.ts`, `useRecommendedJobTypes.ts`
3. **Create components** - `JobTypeCard`, `UnlockProgress`, `RecommendedJobTypes`
4. **Update main page** - Transform `ProfessionalServiceSetup.tsx`
5. **Test with real data** - Verify stats show correctly for active micros

