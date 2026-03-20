

# Dispute Engine E2E Test Pack — PDF Checklist + In-App QA Dashboard

Two deliverables: a downloadable PDF checklist for team sign-off, and a hidden admin route (`/dashboard/admin/qa/disputes`) for live, repeatable testing with DB verification.

---

## Deliverable 1: PDF Checklist

Generated via a script using `reportlab`, output to `/mnt/documents/dispute-e2e-test-pack.pdf`.

Content structure:
- **Cover page**: "Dispute Engine — E2E Test Pack", date, version
- **Test accounts table**: Client / Professional / Admin with placeholder rows for emails
- **6 test scenarios** each with:
  - Goal statement
  - Numbered steps with checkbox column
  - Expected/Actual/Pass-Fail/Notes table per step
  - DB verification checklist (tables to inspect)
- **Summary sign-off page**: All 6 tests pass/fail, tester signature, date

---

## Deliverable 2: In-App QA Dashboard

### Route & Guard
- New route: `/dashboard/admin/qa/disputes` inside the existing admin layout
- Admin-only (same `AdminRouteLayout` guard as other admin pages)

### Page: `DisputeQADashboard.tsx`

**Section 1 — Test Scenarios Panel**
- Accordion for each of the 6 tests
- Each test shows numbered steps with description
- Steps are read-only reference (not interactive checkboxes — the PDF handles that)

**Section 2 — Live DB Inspector**
- Dropdown to select a dispute (from `rpc_admin_dispute_inbox`)
- Once selected, shows a tabbed view pulling live data:
  - **Status History** — all rows from `dispute_status_history` for this dispute
  - **Inputs** — all `dispute_inputs` rows
  - **Evidence** — all `dispute_evidence` rows  
  - **Analysis** — all `dispute_analysis` rows (highlights `is_current`)
  - **AI Events** — all `dispute_ai_events` rows
  - **Emails** — `email_notifications_queue` rows matching this dispute's ID in payload
- Each tab shows a simple data table with timestamps, sorted chronologically

**Section 3 — Quick Health Checks**
- Automated queries run on page load, shown as pass/fail cards:
  - "No duplicate active analyses" — `SELECT dispute_id, count(*) FROM dispute_analysis WHERE is_current = true GROUP BY dispute_id HAVING count(*) > 1`
  - "No orphaned disputes" — disputes without any `dispute_status_history` entry
  - "No invalid transitions" — status history rows where from_status → to_status isn't in allowed map
  - "All resolved disputes have resolution_accepted_at" — resolved cases with null acceptance timestamp
  - "No stale pending emails" — `email_notifications_queue` with dispute-related events stuck > 1 hour

These checks will be implemented as a single RPC (`rpc_dispute_qa_health_checks`) returning a JSON object with pass/fail for each check.

---

## Files Changed

| File | Action |
|---|---|
| Script (PDF generation) | Run via `lov-exec`, output to `/mnt/documents/` |
| Migration SQL | New `rpc_dispute_qa_health_checks` RPC |
| `src/pages/admin/qa/DisputeQADashboard.tsx` | Create: QA dashboard page |
| `src/App.tsx` | Add route `/dashboard/admin/qa/disputes` |

---

## Technical Details

- PDF uses `reportlab` with the project's brand palette (navy/teal tones from existing UI)
- QA dashboard queries use `supabase.from('dispute_*' as any)` pattern consistent with existing dispute queries
- Health check RPC uses `SECURITY DEFINER` with admin + allowlist gate
- No new dependencies required

