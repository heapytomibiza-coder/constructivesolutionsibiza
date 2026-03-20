

# Make Dispute Filing Testable End-to-End

## Problem
There's no "Raise Issue" button anywhere in the client or pro dashboard UI. The `/disputes/raise?job=<id>` route works, but you can't get to it without manually typing a URL. This makes the dispute flow untestable from a real user perspective.

## Changes

### 1. Add "Raise Issue" button to ClientJobCard
In `src/pages/dashboard/client/components/ClientJobCard.tsx`:
- Add a "Raise Issue" action button on jobs with status `in_progress` or `completed` (the statuses where disputes make sense — work has started or finished)
- Button navigates to `/disputes/raise?job=${job.id}`
- Uses `AlertTriangle` icon for visual clarity
- Only visible when the job has an `assigned_professional_id` (need a counterparty for a dispute)

### 2. Add "Raise Issue" button to Pro dashboard job cards
Find the pro-side equivalent job card and add the same entry point so professionals can also file disputes. The pro view likely lives in the matched jobs or active jobs section — will check `src/pages/dashboard/pro/` for the right component.

### 3. Add "Raise Issue" link in JobTicketDetail
In `src/pages/dashboard/client/JobTicketDetail.tsx` — the detailed job control centre page — add a secondary action for raising a dispute. This gives users a second natural entry point.

## What this unblocks
- You can log in as a client, go to your dashboard, find a job with an assigned pro, and click "Raise Issue" to enter the full dispute wizard
- The entire flow becomes testable: filing → counterparty response → AI analysis → admin resolution → party acceptance

## Files Changed
| File | Change |
|---|---|
| `src/pages/dashboard/client/components/ClientJobCard.tsx` | Add "Raise Issue" button for `in_progress`/`completed` jobs |
| `src/pages/dashboard/client/JobTicketDetail.tsx` | Add "Raise Issue" action link |
| Pro dashboard job component (TBD) | Add matching entry point for pros |

