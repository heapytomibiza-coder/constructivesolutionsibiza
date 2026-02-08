

# Update Resend API Key

## Current Issue

The edge function logs show the email system is failing with:
```
API key is invalid (401 validation_error)
```

This means the current `RESEND_API_KEY` secret has expired or been revoked.

## Fix Steps

### Step 1: Update the Secret
I'll request your new Resend API key using the secure secrets tool. This will:
- Replace the existing `RESEND_API_KEY` value
- Automatically make it available to the `send-auth-email` edge function
- No code changes required

### Step 2: Test Email Delivery
After updating, I'll send a test password reset email to verify:
- The API key is valid
- Emails are being delivered
- The reset link works correctly

## What You'll Need

When prompted, paste your new Resend API key. You can get one from:
**https://resend.com/api-keys** → Click "Create API Key"

---

**Technical Note:** Your emails will continue sending from `noreply@csibiza.com` - make sure the `csibiza.com` domain is verified in your Resend dashboard at https://resend.com/domains

