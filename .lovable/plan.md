

# Bulletproof Email + Onboarding Fixes

## What's Already Working
- `htmlToPlainText()` helper is correctly implemented (the style regex is fine in the actual code)
- Entity decoding covers the essential cases
- Profile auto-insert guard exists in `ServiceAreaStep.tsx`
- RLS policy on `professional_profiles` already has an INSERT policy: `WITH CHECK (auth.uid() = user_id)` -- so the client-side auto-insert will succeed

## What Needs Fixing

### 1. SMTP: Fix plain-text field name (`content` vs `text`)

The `denomailer` library expects `content` for plain text, BUT combining `content` and `html` together may cause the library to produce malformed MIME. The safest approach with denomailer is to use `content` with explicit `mimeContent` parts for multipart/alternative.

However, a simpler and proven fix: switch the send call to pass only `html` and let denomailer handle the MIME structure, OR verify the correct field. Based on denomailer docs, the correct multipart approach is:

```typescript
await client.send({
  from: ...,
  to,
  subject,
  content: plainText,    // This becomes text/plain
  html,                  // This becomes text/html
});
```

This is actually correct as-is. But we should add a test call to verify the output. The plan includes deploying and sending a verification email, then checking Gmail raw source.

### 2. Remaining emoji in email body table cells

The job match email template uses emojis inside HTML table cells (lines 217-219): `📍`, `💶`, `⏱️`. These are safe inside HTML body (UTF-8 encoded in the HTML part), but for maximum compatibility, replace them with text labels.

### 3. Add `console.error` with full object in ServiceAreaStep

The current error handler already has `console.error('Error saving service area:', error)` -- this is correct. No change needed.

---

## Implementation Steps

### Step 1: Verify denomailer send shape
- Confirm that `content` + `html` produces proper `multipart/alternative` by deploying and testing
- If Gmail raw source still shows MIME garbage, switch to using denomailer's explicit content array format

### Step 2: Clean up job match email emojis in table cells
Replace emoji prefixes in the HTML table with plain text labels:
- `📍 Location` becomes `Location`
- `💶 Budget` becomes `Budget`  
- `⏱️ Timing` becomes `Timing`

### Step 3: Deploy and verify
- Deploy the updated edge function
- Trigger a test email
- Confirm in Gmail: clean HTML render, proper subject, multipart/alternative structure

---

## Technical Details

### Files to modify:
- `supabase/functions/send-notifications/index.ts` -- remove emojis from job match HTML table

### No changes needed:
- `ServiceAreaStep.tsx` -- the auto-insert guard and error handling are already correct
- RLS policies -- the INSERT policy already allows `auth.uid() = user_id`
- `htmlToPlainText()` -- the implementation is correct as written

### Verification checklist:
- Gmail renders clean HTML (no raw MIME headers)
- Subject line shows normal text
- Plain text part exists in raw source
- Job match, support ticket, and signup emails all render correctly
- Onboarding proceeds for users with missing profile rows
- Toast shows real error messages (never `[object Object]`)

