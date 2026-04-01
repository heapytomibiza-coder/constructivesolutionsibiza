

# Send Onboarding Nudge Email to Incomplete Professionals

## What We're Doing

Sending a professional, branded email to the 46 professionals who haven't completed their onboarding (20 stuck at service_setup, 2 at basic_info, 24 at not_started), encouraging them to finish setting up their profile to start receiving job opportunities.

## Approach

Use the existing email infrastructure — add a new event type `nudge_onboarding_incomplete` to the `send-notifications` edge function, then enqueue one email per incomplete professional into `email_notifications_queue`.

## Changes

### 1. Add email template to `send-notifications` (edge function)

**File: `supabase/functions/send-notifications/index.ts`**

- Add `"nudge_onboarding_incomplete"` to `NUDGE_EVENTS` array (so it's preference-controlled under `email_project_updates`)
- Add a dedicated `buildOnboardingNudgeEmail()` template function with:
  - Subject: "Complete your profile — new opportunities are waiting"
  - Professional, warm tone matching existing brand style (green gradient header)
  - Personalised greeting using `display_name` or business name
  - Clear value proposition: "Clients are posting jobs in your area right now"
  - Phase-aware messaging (if at service_setup: "You're almost there — just finish setting up your services"; if earlier: "Complete your profile to start receiving job matches")
  - CTA button: "Complete Your Profile →" linking to `/onboarding/professional`
- Wire it into `buildEmail()` switch — handle `nudge_onboarding_incomplete` directly (not via the generic nudge payload pattern, since this has its own template)

### 2. Enqueue the emails via `process-nudges` edge function

**File: `supabase/functions/process-nudges/index.ts`**

- Add a new nudge type `onboarding_incomplete` to the TEMPLATES map
- Add logic to query professionals with `onboarding_phase IN ('not_started', 'basic_info', 'service_setup')` and enqueue into `email_notifications_queue` with event_type `nudge_onboarding_incomplete`
- Include user_id, display_name, business_name, and onboarding_phase in the payload

**However** — since this is a one-time nudge (not a recurring cron pattern), a cleaner approach is:

### Alternative (simpler): One-time enqueue via direct DB insert

Instead of modifying the cron-based nudge engine, add the template to `send-notifications` and then use a single SQL insert to enqueue emails for all 46 professionals. This avoids adding complexity to the recurring nudge system for what is essentially a one-off campaign.

**Steps:**
1. Add `buildOnboardingNudgeEmail()` template + wire into `buildEmail()` in `send-notifications`
2. Deploy the updated function
3. Run a single SQL query to enqueue the emails:
   ```sql
   INSERT INTO email_notifications_queue (event_type, recipient_user_id, payload)
   SELECT 'nudge_onboarding_incomplete', pp.user_id, jsonb_build_object(
     'display_name', COALESCE(p.display_name, pp.business_name, 'there'),
     'business_name', pp.business_name,
     'onboarding_phase', pp.onboarding_phase
   )
   FROM professional_profiles pp
   LEFT JOIN profiles p ON p.id = pp.user_id
   WHERE pp.onboarding_phase IN ('not_started', 'basic_info', 'service_setup')
   ```
4. The existing cron job picks them up and sends via SMTP within ~5 minutes

## No frontend changes needed.
## One migration needed: the INSERT query to enqueue emails (run via migration tool after deploy).

