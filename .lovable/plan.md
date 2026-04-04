# Professional Journey Map — Approved 2026-04-04

## Route Structure (canonical)

```
DASHBOARD (hub + sub-pages):
  /dashboard/pro                           — Hub / landing
  /dashboard/pro/jobs                      — My assigned jobs
  /dashboard/pro/job/:jobId                — Single job ticket (pro alias)
  /dashboard/pro/listings                  — My service listings
  /dashboard/pro/listings/:listingId/edit  — Edit single listing
  /dashboard/pro/insights                  — Demand insights

SETUP / CONFIG:
  /onboarding/professional                 — Activation wizard
  /professional/profile                    — Edit profile
  /professional/services                   — Manage service picks
  /professional/priorities                 — Job priority rankings
  /professional/portfolio                  — Portfolio management

SHARED:
  /dashboard/jobs/:jobId                   — Shared job ticket (both roles)
  /messages                                — Messaging
  /settings                                — Account settings
```

## Navigation Rules

- Back buttons → explicit parent route, never navigate(-1)
- "Browse Matching Jobs" → /jobs (public board)
- "My Jobs" → /dashboard/pro/jobs (assigned work)
- All config pages back to /dashboard/pro
- Welcome banner lives on /dashboard/pro only (not listings)

## Legacy Redirects (all active in App.tsx)

| Old path | → New path |
|---|---|
| /dashboard/professional/jobs | /dashboard/pro/jobs |
| /professional/listings | /dashboard/pro/listings |
| /professional/listings/:id/edit | /dashboard/pro/listings/:id/edit |
| /professional/insights | /dashboard/pro/insights |

## Shared vs Pro Job Ticket

Both `/dashboard/jobs/:jobId` and `/dashboard/pro/job/:jobId` render `JobTicketDetail`.
Back path is role-aware: client→/dashboard/client, pro→/dashboard/pro/jobs.
Both routes are intentional — shared for cross-role access, pro alias for consistent pro nav.
