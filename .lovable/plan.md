

# Fix: Duplicate Telegram Job Notifications

## Problem

When a job is posted, **two different database triggers** fire on the same event and each sends a separate Telegram message with a different format:

| Trigger | Queue | Edge Function | Format |
|---|---|---|---|
| `trg_enqueue_job_posted` | `job_notifications_queue` | `send-job-notification` | Detailed (trade breadcrumb, budget, timing, photo) |
| `trg_admin_new_job_notification` | `email_notifications_queue` | `send-notifications` | Compact (title, category · area, admin link) |

The detailed format from `send-job-notification` is the better one — it includes trade hierarchy, budget, timing, photo support, and links to the job detail page.

## Fix

**Remove the Telegram send from `send-notifications` for `admin_new_job` events**, since `send-job-notification` already handles the Telegram alert with a richer format.

### Steps

1. **Migration**: Drop the `trg_admin_new_job_notification` trigger (or modify `enqueue_admin_new_job_notification()` to stop inserting into `email_notifications_queue` for jobs — since the email is also handled by `send-job-notification`). Alternatively, keep the trigger but remove the Telegram path from `send-notifications` for `admin_new_job` events only.

2. **Update `send-notifications/index.ts`**: In the `admin_new_job` message builder, remove the `telegram` field so the function only sends the email for this event type (if email is still desired from this path). This is the safest change — no trigger modification needed.

### Recommended approach (minimal risk)

Edit `send-notifications/index.ts` — in the `buildAdminNewJob` function, remove the `telegram` property from the returned object. This keeps the email path intact but stops the duplicate Telegram message. One line change.

