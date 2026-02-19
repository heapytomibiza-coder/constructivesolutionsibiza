

# Admin Job Alert System: In-App Realtime + Telegram Push

## Problem
Email notifications for new job posts are unreliable (spam filters, delayed push, Gmail bundling). You need instant, guaranteed alerts when a new job is posted.

## Solution: Two-Layer Alert System

### Layer 1: In-App Realtime Alerts (when you're at your laptop)
- Toast notification + sound ping when a new job is posted
- Works inside the admin dashboard automatically
- Uses the existing notification pattern from `useMessageNotifications`

### Layer 2: Telegram Bot Push (when you're away)
- Instant push to your phone via Telegram
- No approval process, no templates, no cost
- Triggered server-side from the existing `send-job-notification` edge function

---

## Technical Implementation

### Step 1: Enable Realtime on the `jobs` table
Currently only `messages` and `conversations` are on the realtime publication. We need to add `jobs` so the admin UI can detect new inserts instantly.

Database migration:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
```

### Step 2: Add Realtime listener to `useLatestJobs.ts`
Subscribe to `INSERT` events on the `jobs` table. When a new open+listed job arrives:
- Invalidate `["admin", "latest_jobs"]` and `["admin", "jobs"]` queries
- Return the new job payload so the UI layer can alert

### Step 3: Add toast + sound alert in `OperatorCockpit.tsx`
The OperatorCockpit already uses `useLatestJobs` and is the admin landing page -- the best place to detect and show alerts. Add:
- Track the "last seen" job ID via a ref
- When a new job appears that doesn't match the last seen ID: fire a toast with job title/area/category
- Play the existing `/sounds/notify.mp3` sound
- Show browser notification (same pattern as message notifications)

### Step 4: Telegram Bot integration via Edge Function
Add Telegram sending to the existing `send-job-notification` edge function (which already fires on every new job via the queue). After sending the email, also send a Telegram message.

Required new secrets (you'll be prompted to enter these):
- `TELEGRAM_BOT_TOKEN` -- from BotFather
- `TELEGRAM_CHAT_ID` -- your personal chat ID

The Telegram message format:
```
NEW JOB POSTED
-- Title
-- Area | Category
-- Budget
-- Link to job
```

### Step 5: Setup instructions for Telegram (one-time, takes 2 minutes)
1. Open Telegram, search for `@BotFather`
2. Send `/newbot`, name it something like "CS Ibiza Alerts"
3. Copy the bot token (looks like `123456:ABC-DEF...`)
4. Start a chat with your new bot and send any message
5. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` to get your `chat_id`
6. Provide both values when prompted

---

## Files Changed

| File | Change |
|------|--------|
| New migration | Add `jobs` to realtime publication |
| `src/pages/admin/hooks/useLatestJobs.ts` | Add Realtime subscription for job inserts, invalidate queries |
| `src/pages/admin/sections/OperatorCockpit.tsx` | Add new-job detection (ref-based), toast + sound + browser notification |
| `supabase/functions/send-job-notification/index.ts` | Add Telegram message sending after email |

## What You Keep
- Email notifications continue working as backup (existing system untouched)
- WhatsApp copy button on admin dashboard stays
- All existing admin alert infrastructure (operator alerts RPC) unchanged

## Future Options (not in this implementation)
- WhatsApp Cloud API alerts (requires Meta app + template approval)
- Severity-based routing (critical = Telegram + email, low = dashboard only)
- Admin alert history/backlog table

