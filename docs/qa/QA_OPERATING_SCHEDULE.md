# QA Operating Schedule — Constructive Solutions Ibiza

**Last updated:** 2026-04-11

> Operational companion to [TRACEABILITY.md](./TRACEABILITY.md) (risk mapping) and [RELEASE_DISCIPLINE.md](../ci/RELEASE_DISCIPLINE.md) (CI/merge policy).

---

## 1. Daily (Automated — Staging)

**Runs automatically via CI or cron**

**Goal:** Catch real breakages early, before any user is affected.

### What runs

| Check | Type | Alert on failure |
|---|---|---|
| Auth: login → redirect | Playwright / API | 🔴 Immediate |
| Post Job: create job successfully | Playwright / API | 🔴 Immediate |
| Quote Accept: assign pro successfully | Playwright / API | 🔴 Immediate |
| Messaging: send message appears | Playwright / API | 🔴 Immediate |
| Route Guards: client ↛ pro/admin | Playwright / API | 🔴 Immediate |
| Admin: dashboard loads, non-admin blocked | Playwright / API | 🔴 Immediate |
| Edge Functions: notifications health check | HTTP ping | 🟡 Same-day |
| Edge Functions: Stripe webhook (test mode) | HTTP ping | 🟡 Same-day |

### Output

- **Pass** → no action required
- **Fail** → alert in Slack / email immediately

### Owner

- **Dev on rotation (daily)**

---

## 2. Every PR (Automated — CI)

**Runs on every pull request before merge is allowed.**

### What runs

| Suite | Gate |
|---|---|
| Smoke tests | ❌ Failure = merge blocked |
| Interaction tests | ❌ Failure = merge blocked |
| Access/security tests | ❌ Failure = merge blocked |
| Type check | ❌ Failure = merge blocked |
| Coverage drop | ⚠️ Flagged (recommended) |

### Rules

- Any failure → **PR blocked, no exceptions**
- Coverage drop → flagged for review (optional but recommended)
- See [RELEASE_DISCIPLINE.md](../ci/RELEASE_DISCIPLINE.md) for full CI pipeline details

### Owner

- **Developer who opened the PR**

---

## 3. After Merge to Main

**Runs automatically after merge.**

### What runs

- Full CI suite (smoke → interaction → full)
- Core E2E flows (subset)

### Purpose

Confirm nothing broke when changes were combined.

### Owner

- **System / CI** triggers the run
- **Developer who merged** investigates any failure
- Fix or revert within the same working session

---

## 4. Weekly Manual QA (60–90 minutes)

> **This is the most important missing piece in most test strategies.**
>
> Do this once per week — same day each week. Document results.

---

### Section A: Mobile Reality Check (High Priority)

Test on a real phone or Chrome DevTools at **375px viewport**.

| Check | Status |
|---|---|
| Open job → modal not blocked by toolbar or sticky bar | |
| Accept quote → button visible and tappable | |
| Keyboard open → does not hide CTA or submit button | |
| Toolbar → does not cover content (known issue MOB-002) | |
| Navigation works smoothly between pages | |
| Onboarding steps all visible without scrolling past submit | |

> For onboarding-specific mobile checks, also run the checklist in [ONBOARDING_QA_CHECKLIST.md](./ONBOARDING_QA_CHECKLIST.md) if it exists.

---

### Section B: Core Trust Flows

Run these manually end-to-end:

| # | Flow | Status |
|---|---|---|
| 1 | Sign up as client | |
| 2 | Sign up as professional | |
| 3 | Login redirect (returnUrl preserved) | |
| 4 | Post a job (full wizard) | |
| 5 | Professional sees job in matched list | |
| 6 | Send quote (if enabled) | |
| 7 | Accept quote → job moves to in_progress | |
| 8 | Messaging works both ways (client ↔ pro) | |
| 9 | Job status updates correctly across views | |

---

### Section C: Role & Permission Check

| Check | Status |
|---|---|
| Client cannot access pro dashboard | |
| Client cannot accept someone else's job quote | |
| Pro cannot edit another pro's listings | |
| Non-admin cannot access admin routes | |
| Admin sees correct data in admin dashboard | |
| Role switcher works correctly (header, mobile) | |

---

### Section D: "Feels Broken" Check

Subjective but critical. Ask:

- Does anything feel confusing to use?
- Are buttons misleading or unclear?
- Are error messages helpful or cryptic?
- Does anything look unfinished or broken?
- Is anything surprisingly slow?

---

### Weekly QA Output Format

For each item, mark one:

- ✅ **Working** — functions correctly
- ⚠️ **Feels off** — works but UX is poor or confusing
- ❌ **Broken** — does not work or blocks the user

File the results in a shared location (Notion, Airtable, or a dated markdown file).

---

## 5. Before Release (Mandatory Go/No-Go)

**This is a hard gate. No release without sign-off.**

### Must test before any production deploy

| Check | Status |
|---|---|
| Auth (signup / login / logout) | |
| Onboarding (pro flow, all steps) | |
| Post job (full wizard) | |
| Accept quote (assignment works) | |
| Messaging (send + receive) | |
| Settings save (preferences persist) | |
| Admin access (loads, non-admin blocked) | |
| Payments / holding system (if active) | |

### Rule

- ❌ **Any failure → no release**
- See [RELEASE_DISCIPLINE.md — Pre-Release Checklist](../ci/RELEASE_DISCIPLINE.md) for the full merge-level checklist

---

## 6. Health Alert Response Loop

> This is where [TRACEABILITY.md](./TRACEABILITY.md) becomes operational.

### When a health alert fires:

**Step 1 — Find it**

Look up the alert in the [Traceability Table](./TRACEABILITY.md#traceability-table). Identify which area it maps to and what existing test coverage exists.

**Step 2 — Ask**

> "Why didn't a test catch this?"

Possible answers:
- No test exists for this path
- Test exists but asserts the wrong thing (shallow)
- Test exists but is mocked past the failure point
- Failure is in a layer Vitest cannot reach (browser, RLS, real delivery)

**Step 3 — Act**

Do exactly **one** of these:

| Action | When |
|---|---|
| Add a new automated test | Failure is testable in Vitest |
| Strengthen an existing test | Test exists but is too shallow |
| Add to weekly manual QA checklist | Failure requires real browser or device |
| Mark as E2E-required in TRACEABILITY.md | Failure needs Playwright or staging |
| Document as known untestable risk | Failure depends on external system (SMTP, Stripe live) |

**Step 4 — Update docs**

Update the relevant row in [TRACEABILITY.md](./TRACEABILITY.md) with the new coverage or gap status.

---

## 7. Ownership Model

| Area | Owner |
|---|---|
| PR tests pass | Developer who opened the PR |
| CI failures after merge | Developer who merged |
| Daily automated failures | Dev on rotation |
| Weekly manual QA | Rotating assignee (or product owner) |
| Health alert response | Assigned by area (see TRACEABILITY.md Owner column) |
| Post-release validation (24h) | Product owner |
| Daily funnel checks after release | Product owner (5 business days) |

---

## 8. The Feedback Rule

> Every bug should trigger this question:
>
> **"What test would have caught this?"**

Then do one of:

1. **Write that test** — and add it to the suite
2. **Document why it cannot be automated** — and add it to the manual QA checklist or TRACEABILITY.md gaps

This is how the QA system gets stronger over time. No bug should pass through the same gap twice.

---

## Cross-References

| Document | Purpose |
|---|---|
| [TRACEABILITY.md](./TRACEABILITY.md) | Maps health alerts → test coverage → gaps |
| [RELEASE_DISCIPLINE.md](../ci/RELEASE_DISCIPLINE.md) | CI pipeline, merge policy, failure policy |
| [ONBOARDING_QA_CHECKLIST.md](./ONBOARDING_QA_CHECKLIST.md) | Onboarding-specific mobile QA checklist |

---

## Status

This schedule is active as of 2026-04-11. It should be reviewed and updated whenever:

- A new critical flow is added to the platform
- A production incident reveals a gap in the schedule
- The team structure or ownership model changes
- New automation (Playwright, cron health checks) is introduced
