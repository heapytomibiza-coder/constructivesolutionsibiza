

## Plan: Fix Status Mismatch, Timing Labels, and Remaining Hardcoded Strings

This batch addresses the 8 gotchas raised in the review. All changes are low-risk surface fixes.

---

### 1. Standardize job closure status to `cancelled`

The domain model (`src/domain/models.ts` line 77) defines the canonical status as `cancelled`. `ClientJobCard` already uses `cancelled`. `JobTicketDetail` incorrectly uses `closed`.

**Edit: `src/pages/dashboard/client/JobTicketDetail.tsx`**
- Line 43: Change STATUS_CONFIG key from `closed` to `cancelled` (keep the label as `t('jobTicket.closed')` since "Closed" is the user-facing term).
- Line 115: Change `status: 'closed'` to `status: 'cancelled'`.

---

### 2. Fix hardcoded English in JobTicketDetail

**Edit: `src/pages/dashboard/client/JobTicketDetail.tsx`**
- Line 230: Replace `Up to €${job.budget_max}` with a translated string using a new i18n key `jobTicket.budgetUpTo`.
- Line 310: Replace raw `{invite.status}` with a translated invite status using new i18n keys under `jobTicket.inviteStatus`.
- Line 217: The raw `job.start_timing` display should use the same timing translation keys already defined at `client.timing.*`.

---

### 3. Translate timing labels on Tasker dashboard

**Edit: `src/pages/dashboard/professional/ProDashboard.tsx`**
- Line 311: Replace `job.start_timing.replace(/_/g, ' ')` with a translated lookup using the same `client.timing.*` keys (they're shared timing concepts, not role-specific).

---

### 4. Add missing i18n keys

**Edit: `public/locales/en/dashboard.json`**
- Add `jobTicket.budgetUpTo`: `"Up to €{{max}}"`
- Add `jobTicket.budgetFrom`: `"From €{{min}}"`
- Add `jobTicket.inviteStatus.sent`: `"Sent"`
- Add `jobTicket.inviteStatus.viewed`: `"Viewed"`
- Add `jobTicket.inviteStatus.accepted`: `"Accepted"`
- Add `jobTicket.inviteStatus.declined`: `"Declined"`

**Edit: `public/locales/es/dashboard.json`**
- Add `jobTicket.budgetUpTo`: `"Hasta €{{max}}"`
- Add `jobTicket.budgetFrom`: `"Desde €{{min}}"`
- Add `jobTicket.inviteStatus.sent`: `"Enviada"`
- Add `jobTicket.inviteStatus.viewed`: `"Vista"`
- Add `jobTicket.inviteStatus.accepted`: `"Aceptada"`
- Add `jobTicket.inviteStatus.declined`: `"Rechazada"`

---

### 5. Fix pluralization pattern for replies

The JSON already has `replies_one` and `replies` (which acts as `replies_other`). The current `t()` call in `ClientJobCard` passes a default value string as second arg which can interfere with plural resolution.

**Edit: `src/pages/dashboard/client/components/ClientJobCard.tsx`**
- Change `t('client.replies', '{{count}} replies', { count: ... })` to `t('client.replies', { count: ... })` (remove the default value string so i18next plural resolution works correctly).

---

### 6. Bump i18n cache version

**Edit: `src/i18n/index.ts`**
- Increment queryStringParams version to force fresh translation fetch.

---

### Files Changed Summary

| File | Change |
|------|--------|
| `src/pages/dashboard/client/JobTicketDetail.tsx` | Fix status to `cancelled`, translate budget/timing/invite labels |
| `src/pages/dashboard/professional/ProDashboard.tsx` | Translate timing label |
| `src/pages/dashboard/client/components/ClientJobCard.tsx` | Fix pluralization call |
| `public/locales/en/dashboard.json` | Add budget + invite status keys |
| `public/locales/es/dashboard.json` | Add budget + invite status keys |
| `src/i18n/index.ts` | Bump cache version |

No database changes. No edge function changes. No breaking changes.

