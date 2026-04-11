

## Fix Plan: SMTP Authentication Failure & Email Recovery

### Root Cause (Confirmed)
SMTP authentication failing with `535 Incorrect authentication data` against `bream-lon.krystal.uk:465` using `info@constructivesolutionsibiza.com`. The password stored in the `SMTP_PASSWORD` secret is invalid — likely revoked or rotated at the hosting provider (Krystal).

### Damage Assessment

**86 dead-letter notifications** (attempts ≥ 3, permanently failed):

| Event Type | Dead | Impact |
|---|---|---|
| pro_signup | 48 | Welcome emails to new professionals |
| new_message | 16 | **Users not notified of messages** |
| job_match | 15 | Pros not notified of matching jobs |
| welcome | 2 | Welcome emails |
| nudge_onboarding_incomplete | 2 | Onboarding reminders |
| admin_new_job | 1 | Admin notification |
| admin_new_user | 1 | Admin notification |
| job_posted_confirm | 1 | Job confirmation |

The 16 `new_message` failures are the direct cause of "no replies" — clients never knew they had messages.

---

### Step 1: Fix SMTP Credentials (User Action Required)

You need to update the `SMTP_PASSWORD` secret with the correct password from your Krystal hosting panel.

**Check at your hosting provider (Krystal):**
- Log into Krystal → Email → `info@constructivesolutionsibiza.com`
- Check if the password was changed, expired, or the account was locked
- Generate a new password if needed
- I will then prompt you to enter the updated password as a secret

### Step 2: Verify Delivery

After you update the secret:
- Redeploy `send-notifications` edge function
- Invoke the built-in SMTP test endpoint (`?action=test-smtp`) to confirm authentication succeeds
- Confirm a real email arrives in the inbox

### Step 3: Reset Dead-Letter Queue

Run a migration to reset the 86 dead-letter items so they retry:

```sql
UPDATE email_notifications_queue
SET attempts = 0, last_error = 'reset:smtp-fix-20260411'
WHERE sent_at IS NULL AND attempts >= 3;
```

This resets all 86 failed items. The next cron cycle of `send-notifications` will pick them up and retry. The `new_message` items (16) will be processed alongside the rest.

### Step 4: Add SMTP Failure Alerting

Update the `daily-health-check` edge function to:
- **Flag SMTP auth failures specifically** — if the most recent `last_error` contains `535` or `EAUTH`, add a dedicated `🔴 SMTP AUTH FAILURE` line to the health report
- **Threshold alert** — if failed emails > 10 in 24h, escalate to RED status regardless of other metrics

This ensures SMTP failures cannot sit unnoticed for 24+ hours again.

### Step 5: Quantify & Report

After retry completes, query the queue and report:
- How many of the 86 were successfully delivered
- How many remain failed (and why)
- Confirm new incoming messages trigger successful notifications

---

### Sequence

1. **You**: Update SMTP password at Krystal, then enter it as a secret
2. **Me**: Redeploy edge function, run SMTP test, confirm delivery
3. **Me**: Reset dead-letter queue (86 items)
4. **Me**: Add SMTP alerting to daily health check
5. **Me**: Report recovery numbers

### What This Does NOT Touch
- Messaging logic (confirmed working correctly)
- Queue architecture (confirmed working correctly)
- Telegram/WhatsApp notifications (unaffected — still working)
- Resend API (used only by `send-job-notification`, separate path)

