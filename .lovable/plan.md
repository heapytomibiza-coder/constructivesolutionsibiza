

# Dispute Engine — Four Feature Expansion

Four additions: resolution acceptance flow, visual timeline, admin bulk actions, and dispute analytics.

---

## 1. Resolution Acceptance Flow

The `disputes` table already has `resolution_type`, `resolution_description`, `resolution_accepted_at` columns. These are unused in the UI today.

### Database
- New RPC: `rpc_offer_resolution` — admin sets `resolution_type` + `resolution_description`, advances status to `resolution_offered`
- New RPC: `rpc_respond_to_resolution` — party accepts or rejects
  - Accept: sets `resolution_accepted_at`, advances to `resolved`
  - Reject with reason: logs rejection in `dispute_inputs` (type `resolution_rejection`), advances to `escalated`
  - Auth: only `raised_by` or `counterparty_id` can respond

### UI
- **ResolutionBanner** component in `DisputeDetail.tsx` — shown when status is `resolution_offered` or `awaiting_acceptance`
  - Displays proposed resolution type + description
  - Accept / Reject buttons (reject requires reason textarea)
  - Only visible to dispute parties, not admin
- **Admin "Offer Resolution" action** — new option in `DisputeRowActions` dropdown when status is `assessment`
  - Opens dialog with resolution type select + description textarea
  - Calls `rpc_offer_resolution`
- Notification trigger on `resolution_offered` status change (DB trigger → email queue)

---

## 2. Visual Dispute Timeline

Replace the plain text timeline in `DisputeDetail.tsx` with a rich vertical timeline component.

### Data
- `fetchDisputeDetail` already returns `history` (from `dispute_status_history`) and `inputs` — merge both into a unified timeline
- Also include `dispute_ai_events` in the query for analysis events

### UI
- **New component**: `DisputeTimeline.tsx`
  - Vertical line with colored dots per event type
  - Event types: status change, input submitted, evidence uploaded, AI analysis, admin note, deadline nudge
  - Each node shows: timestamp, actor name (from profiles), event description, change source badge (app/automation/rpc)
  - Color-coded: green for progress, amber for waiting, red for escalation, blue for AI, gray for system
- Replace the existing `{history.length > 0 && ...}` block in `DisputeDetail.tsx`

---

## 3. Admin Bulk Actions

### UI Changes to `DisputeQueue.tsx`
- Add checkbox column to table (select individual rows or select all filtered)
- Floating action bar at bottom when rows selected: "X selected" + action buttons
- Bulk actions:
  - **Close Stale** — advances all selected to `closed` (confirm dialog with count)
  - **Batch Escalate** — advances all selected to `escalated` (confirm dialog)
  - Both call `rpc_advance_dispute_status` in sequence per dispute
- Selection state managed with local `useState<Set<string>>`

---

## 4. Dispute Analytics

### Database
- New RPC: `rpc_admin_dispute_analytics` (SECURITY DEFINER, admin + allowlist check)
- Returns:
  - Volume by status (count per status)
  - Volume over time (disputes created per week, last 12 weeks)
  - Avg resolution time (created_at to resolved_at for resolved/closed disputes)
  - Median resolution time
  - Repeat offenders (users with 2+ disputes as raised_by or counterparty, with counts)
  - Top issue types (count per issue type)
  - Escalation rate (escalated / total)

### UI
- **New component**: `DisputeAnalytics.tsx` in `src/pages/admin/sections/disputes/`
- Rendered as a collapsible section above the DisputeQueue table
- Displays:
  - Summary cards: total active, avg resolution days, escalation rate
  - Issue type breakdown (horizontal bar chart using simple div bars)
  - Repeat offenders table (name, dispute count, last dispute date)
- Export to `index.ts`

---

## Files Changed

| File | Action |
|---|---|
| Migration SQL | Create `rpc_offer_resolution`, `rpc_respond_to_resolution`, `rpc_admin_dispute_analytics`, notification trigger for resolution_offered |
| `src/pages/disputes/components/ResolutionBanner.tsx` | Create: accept/reject UI |
| `src/pages/disputes/components/DisputeTimeline.tsx` | Create: visual timeline |
| `src/pages/disputes/components/index.ts` | Update exports |
| `src/pages/disputes/DisputeDetail.tsx` | Add ResolutionBanner, replace timeline section, add ai_events to query |
| `src/pages/disputes/queries/disputes.query.ts` | Add ai_events fetch to detail query |
| `src/pages/admin/sections/disputes/DisputeRowActions.tsx` | Add "Offer Resolution" action |
| `src/pages/admin/sections/disputes/DisputeQueue.tsx` | Add checkbox selection + bulk action bar |
| `src/pages/admin/sections/disputes/DisputeAnalytics.tsx` | Create: analytics dashboard |
| `src/pages/admin/sections/disputes/index.ts` | Export analytics |
| `src/pages/admin/queries/adminDisputes.query.ts` | Add analytics query function |

