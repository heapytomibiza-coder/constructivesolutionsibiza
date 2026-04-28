
# Manually post a job for Tom Grimes

Wizard is broken for him, so I'll insert the job directly into the database under his user account. No code changes — just one migration that inserts a single `jobs` row plus the matching `job_micro_links` row. The DB triggers will then fan it out to the matching engine and notification queue exactly as the wizard would.

## Job summary I'll create

| Field | Value |
|---|---|
| **Posted by** | Tom Grimes (`user_id 3959063e-…1f5dd`) |
| **Title** | Outdoor furniture assembly — sofa, sunbed & more |
| **Category** | Handyman & General |
| **Subcategory** | Odd Jobs |
| **Micro** | `general-project` (best fit — flatpack/assembly micro doesn't exist yet under this category) |
| **Area** | San Lorenzo |
| **Description** | "Handyman needed for tomorrow. Outdoor furniture to build and install — sofa, sunbed, etc. Location: San Lorenzo." |
| **Start timing** | `urgent` (he said "tomorrow") |
| **Start date** | Tomorrow (2026-04-29) |
| **Budget** | Open / no specific budget set (he didn't give one — pros will quote) |
| **Status** | `open` |
| **Publicly listed** | `true` (so matched pros can see it) |
| **is_custom_request** | `true` (flagged so we know this didn't come through the wizard) |
| **Highlights** | `['outdoor', 'assembly', 'urgent']` |

## Micro-category note

There is currently **no dedicated "Furniture Assembly" micro under Handyman & General** — that's the same data gap we discussed earlier. The closest correct fit is **`general-project`** under Odd Jobs / General Repairs. I'll use that and put "outdoor furniture assembly — sofa, sunbed" in the title and description so handymen self-select correctly.

## What I'll do

1. **Create one migration** that:
   - Inserts the `jobs` row above (status `open`, publicly listed, urgent timing).
   - Inserts a `job_micro_links` row pointing at `general-project` so the matcher picks it up.
2. **Verify** by querying back: `SELECT id, title, status, area FROM jobs WHERE user_id = '3959063e-…';`
3. **Confirm to Tom** with the job ID and the URL `/jobs/<id>` so he can view/edit it from his client dashboard.

Existing DB triggers will:
- Queue notifications to matched handymen (`job_notifications_queue`).
- Run job-scoring.
- Add it to the public job board feed.

## What I will NOT do

- Not touching wizard code in this task — that's the separate audit fix. This is a one-off rescue for Tom.
- Not setting a budget (he didn't give one — pros will quote a price).
- Not changing taxonomy. The "no Furniture Assembly micro" gap is logged for the next data pass.

## Anything you want changed before I run it?

- **Title** — happy with "Outdoor furniture assembly — sofa, sunbed & more"?
- **Budget** — leave blank, or set a guide range (e.g. €80–€200)?
- **Start date** — tomorrow (29 Apr 2026), confirmed?
- **Visibility** — public on the job board, or invite-only to Tom's saved pros?

If you say "ship it" I'll run with the values above.
