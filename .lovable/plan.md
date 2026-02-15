
# Admin Dashboard Clarity Pass

## What's Already Correct (no changes needed)

- StatTile supports onClick + shows ChevronRight -- working
- OperatorCockpit tiles are all clickable and route to insight workspaces -- working
- HealthSection has clickable cards for Jobs Posted Today, Active 24h, Active 7d -- working
- MetricInsightPage resets pagination on filter change -- working
- FunnelsPage has no dead FUNNEL_STEPS code -- clean
- Insights tab cleanly separates "Deep Analytics" from "Metric Workspaces" -- working

## Changes to Make

### 1. Rename "Quick Stats" to "Platform Snapshot" in OperatorCockpit

File: `src/pages/admin/sections/OperatorCockpit.tsx`

Change the heading from "Quick Stats" to "Platform Snapshot" so it reads as an operational summary, not an analytics section.

### 2. Rename InsightsSection headings for clarity

File: `src/pages/admin/sections/InsightsSection.tsx`

- "Deep Analytics" becomes "Decision Pages" -- these are interpretive composite pages
- "Metric Workspaces" stays as-is (it's already clear)

### 3. Add proxy label to Active Users health cards

File: `src/pages/admin/sections/HealthSection.tsx`

The Active Users (24h) and Active Users (7d) cards navigate to `messages_sent`, which is a proxy metric. Add a subtle "(via messages)" hint so admins don't think "messages_sent" is broken when they land there expecting "active users".

### 4. Make Pending/Failed Email cards non-confusing

These two health cards currently have no onClick (correct -- there's no email queue metric workspace). No change needed, but we should add a subtle visual distinction so they don't look broken compared to the clickable cards. Add a small "System metric" label to signal these are diagnostics-only, not drilldown-capable.

---

## Technical Details

### Files modified

- `src/pages/admin/sections/OperatorCockpit.tsx` -- line 197: change heading text
- `src/pages/admin/sections/InsightsSection.tsx` -- line 61: change heading text
- `src/pages/admin/sections/HealthSection.tsx` -- lines 130-167: add proxy hint text to Active Users cards; add "System metric" label to email cards

### Scope

4 small copy/label changes across 3 files. No new components, no database changes, no new routes.
