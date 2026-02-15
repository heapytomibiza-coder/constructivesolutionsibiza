

# Admin Analytics Deep-Dive: Interactive Insight Workspaces

## Overview

Transform the admin dashboard from static stat tiles into an interactive analytics platform with drilldowns, trend charts, segmentation, and actionable insights. Every metric becomes clickable and opens a rich workspace. Five new "construction leader" insight pages provide market gap analysis, funnel tracking, and performance scoring.

## Current State

- 7-tab admin dashboard: Overview, Health, Users, Jobs, Content, Support, Link Map
- `admin_platform_stats` view provides basic counts (total users, jobs, pros, etc.)
- `admin_health_snapshot()` RPC tracks email queue + daily activity
- All sections show flat tables with filters -- no charts, no trends, no drilldowns
- 9 areas (Ibiza Town, San Antonio, Santa Eulalia, etc.), 9 job categories, 23 jobs, 7 pros, 13 conversations in the database
- No event tracking infrastructure exists yet

## What We'll Build

### Phase 1: Foundation (Database + Event Tracking)

**1a. Analytics Events Table**
New `analytics_events` table to track user behaviour across the platform:
- `user_id`, `role`, `event_name`, `metadata` (JSONB), `created_at`
- Events: `job_wizard_started`, `job_posted`, `conversation_started`, `lead_received`, `pro_signup_completed`, `quote_sent`, etc.
- RPC `track_event()` for safe inserts
- Indexes on `(event_name, created_at)` and `(user_id, created_at)`

**1b. Timeseries RPC: `admin_metric_timeseries`**
Returns bucketed counts for any metric key over a date range with optional area/category filters. Powers all trend charts.

Parameters: `metric_key`, `from_ts`, `to_ts`, `bucket` (hour/day), `area_filter`, `category_filter`

Supported metrics: `open_jobs`, `completed_jobs`, `new_users`, `new_pros`, `conversations`, `support_tickets`, `jobs_posted`

**1c. Drilldown RPC: `admin_metric_drilldown`**
Returns the underlying rows for any metric key with filters and pagination. Powers all drilldown tables.

Parameters: `metric_key`, `from_ts`, `to_ts`, `area_filter`, `category_filter`, `limit_n`, `offset_n`

**1d. Performance Indexes**
- `jobs(status, is_publicly_listed, created_at)`
- `jobs(area, category, created_at)`
- `conversations(created_at)`
- `messages(sender_id, created_at)`
- `professional_services(user_id, micro_id)`

### Phase 2: Frontend Infrastructure

**2a. Metric Registry**
`src/pages/admin/lib/metricRegistry.ts` -- single source of truth for every metric:
- Label, description, default timeframe, icon, drilldown route
- Used by stat tiles, charts, and insight pages

**2b. Shared Hooks**
- `useAdminMetricTimeseries(metric, from, to, bucket, filters)` -- powers trend charts
- `useAdminMetricDrilldown(metric, from, to, filters, pagination)` -- powers row tables
- `useAdminAlerts()` -- fetches attention items with severity

**2c. Reusable Components**
- `MetricTrendChart` -- Recharts line/area chart with 7d/30d/90d toggle
- `DrilldownTable` -- Paginated table with row click to entity detail
- `InsightFilterBar` -- Area, category, date range, export CSV
- `MetricDefinitionTooltip` -- "What does this count?" hover
- `DeltaBadge` -- Shows "+12% vs last week" change indicators

### Phase 3: Clickable Stat Tiles + Insight Workspaces

**3a. Make Every Tile Clickable**
Update `OperatorCockpit.tsx` and `HealthSection.tsx` so every `StatTile` navigates to `/dashboard/admin/insights/:metricKey`

**3b. Metric Insight Page (shared template)**
`src/pages/admin/insights/MetricInsightPage.tsx`

Route: `/dashboard/admin/insights/:metricKey`

Layout:
```text
+----------------------------------+
| [Metric Name]  [Definition ?]    |
| Current: 42    +12% vs last week |
+----------------------------------+
| [7d] [30d] [90d]  [Area v] [Cat v] |
| ~~~~ Trend Chart ~~~~            |
+----------------------------------+
| Drilldown Table                  |
| [row] [row] [row] ...           |
| [Export CSV] [Create Alert]      |
+----------------------------------+
```

Each stat from the Overview and Health tabs gets its own workspace with the chart + filters + underlying rows + actions.

### Phase 4: Five "Construction Leader" Insight Pages

**4a. Demand vs Supply Heatmap (Market Gap Index)**
`src/pages/admin/insights/MarketGapPage.tsx`

- Grid: Areas (rows) x Categories (columns)
- Each cell shows: demand count, supply count, gap score
- Gap score = normalized(demand) - normalized(supply * responsiveness)
- Color-coded: red = shortage, green = well-served
- Click cell to see specific jobs + available pros
- Powered by new RPC `admin_market_gap(from_ts, to_ts)`
- Actionable output: "Recruit plumbers in Santa Eulalia -- gap score 0.82"

**4b. Conversion Funnels**
`src/pages/admin/insights/FunnelsPage.tsx`

Client funnel: Landing -> Start wizard -> Complete steps -> Post job -> Get responses -> Hire -> Complete -> Review

Pro funnel: Sign up -> Select services -> Complete profile -> Receive leads -> Reply -> Get hired -> Complete work

- Horizontal funnel bars with drop-off percentages
- Segment by area, category, device
- Powered by `analytics_events` table
- Actionable: "38% drop-off at step 3 -- simplify attachments"

**4c. Pro Performance Dashboard (Response and SLA)**
`src/pages/admin/insights/ProPerformancePage.tsx`

- Pro leaderboard: time-to-first-reply, reply rate, completion rate, avg rating
- Pro Performance Score (weighted composite)
- Flag slow/unresponsive pros
- Identify top performers for badges
- Powered by: `conversations`, `messages`, `professional_micro_stats`, `job_reviews`

**4d. Price Intelligence**
`src/pages/admin/insights/PricingPage.tsx`

- Budget band distribution by category and area
- Average budget ranges per micro-service
- Jobs with no responses (price too low?) vs high-response jobs
- Powered by: `jobs.budget_type/value/min/max` aggregations

**4e. Trend Radar**
`src/pages/admin/insights/TrendRadarPage.tsx`

- Fastest growing categories (this week vs last week)
- Seasonal patterns (month-over-month for each category)
- Anomaly detection ("Electrical jobs up 150% this week in San Antonio")
- New micro-services being requested
- Plain-English insight cards: "Rewiring jobs up 38% week-on-week in Santa Gertrudis"

### Phase 5: Entity Detail Drawers

**5a. Job Detail Drawer**
Click any job row in any admin table to open a side drawer showing:
- Full job details, answers, timeline
- Status history (from `job_status_history`)
- Conversations linked to this job
- Admin actions (force complete, archive, flag)

**5b. User/Pro Detail Drawer**
Click any user row to see:
- Role, signup date, activity summary
- For pros: services scope, performance score, lead metrics, reviews
- Admin actions (verify, suspend, message)

### Phase 6: Alerts Engine + Next Best Action

**6a. Smart Alerts**
New `admin_alerts` table (or computed in RPC):
- "3 jobs posted 2+ hours ago with no pro response"
- "Pro X received 5 leads, replied to 0"
- "Electrical demand spike in San Antonio but 0 active electricians"
- Severity: red/amber/blue
- Actions: acknowledge, assign, snooze

**6b. Next Best Action Panel**
Added to OperatorCockpit, generates plain-English recommendations:
- "Recruit plumbers in Ibiza Town -- gap score 0.82"
- "Wizard drop-off high at Step 3 -- consider simplifying"
- "Auto-nudge pros who haven't replied in 30 minutes"

### Phase 7: Event Instrumentation

Add `trackEvent()` calls throughout existing flows:
- Job wizard: each step started/completed/abandoned
- Pro onboarding: each phase entered/completed
- Messaging: conversation opened, message sent, reply time
- Job lifecycle: posted, viewed by pro, response received, hired, completed, reviewed

---

## Updated Admin Tab Structure

```text
Overview (Operator Cockpit + Next Best Action)
Health (email queue, activity, alerts)
Insights (new tab -- grid of all metric workspaces + 5 leader pages)
Users (existing + entity detail drawer)
Jobs (existing + entity detail drawer)
Content (existing)
Support (existing)
Link Map (existing)
```

## Technical Details

### New Database Objects
- Table: `analytics_events` (with RLS: admin SELECT, authenticated INSERT via RPC)
- RPC: `admin_metric_timeseries()` (SECURITY DEFINER, admin-only)
- RPC: `admin_metric_drilldown()` (SECURITY DEFINER, admin-only)
- RPC: `admin_market_gap()` (SECURITY DEFINER, admin-only)
- RPC: `track_event()` (SECURITY DEFINER, any authenticated user)
- 5 performance indexes

### New Frontend Files
- `src/pages/admin/lib/metricRegistry.ts`
- `src/pages/admin/hooks/useAdminMetricTimeseries.ts`
- `src/pages/admin/hooks/useAdminMetricDrilldown.ts`
- `src/pages/admin/hooks/useAdminAlerts.ts`
- `src/pages/admin/components/MetricTrendChart.tsx`
- `src/pages/admin/components/DrilldownTable.tsx`
- `src/pages/admin/components/InsightFilterBar.tsx`
- `src/pages/admin/components/DeltaBadge.tsx`
- `src/pages/admin/components/EntityDetailDrawer.tsx`
- `src/pages/admin/insights/MetricInsightPage.tsx`
- `src/pages/admin/insights/MarketGapPage.tsx`
- `src/pages/admin/insights/FunnelsPage.tsx`
- `src/pages/admin/insights/ProPerformancePage.tsx`
- `src/pages/admin/insights/PricingPage.tsx`
- `src/pages/admin/insights/TrendRadarPage.tsx`
- `src/pages/admin/sections/InsightsSection.tsx`
- `src/lib/trackEvent.ts`

### Modified Files
- `src/pages/admin/AdminDashboard.tsx` (add Insights tab)
- `src/pages/admin/sections/OperatorCockpit.tsx` (clickable tiles + Next Best Action panel)
- `src/pages/admin/sections/HealthSection.tsx` (clickable tiles)
- `src/pages/admin/sections/JobsSection.tsx` (row click -> drawer)
- `src/pages/admin/sections/UsersSection.tsx` (row click -> drawer)
- `src/pages/admin/hooks/index.ts` (export new hooks)
- `src/app/routes/registry.ts` (add insight sub-routes)
- `src/App.tsx` (add insight page routes)
- Various user-facing pages (add `trackEvent()` calls)

### Build Order
1. Database: `analytics_events` table + RPCs + indexes (foundation)
2. Frontend: metric registry + shared chart/table components
3. Clickable stat tiles + MetricInsightPage template
4. Market Gap + Funnels pages (highest immediate value)
5. Pro Performance + Pricing pages
6. Trend Radar + Alerts Engine
7. Event instrumentation across user flows
8. Entity detail drawers

