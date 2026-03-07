

## Plan: Notification Opt-in Confirmation + In-App Job Alerts

### What the user wants
1. **Re-enable confirmation**: When a user turns OFF a notification toggle, turning it back ON requires a confirmation dialog (prevents accidental re-enabling).
2. **In-app job alerts**: When the browser tab is open, professionals receive real-time in-app toast alerts about new matching jobs (no email needed — just an in-app notification).

### Changes

#### 1. Settings page — confirmation dialog on re-enable (`Settings.tsx`)
- Import `AlertDialog` from radix
- Wrap the `handleToggle` function: if the new value is `true` (re-enabling), show a confirmation dialog: "Turn on [notification name]? You'll start receiving these alerts again."
- If confirmed, proceed with the mutation. If cancelled, do nothing (toggle stays off).
- Turning OFF remains instant (no confirmation needed).
- Add translation keys for the confirmation dialog text in `en/settings.json` and `es/settings.json`.

#### 2. New hook: `useJobAlerts.ts`
- Subscribe to realtime `INSERT` events on the `jobs` table (where `status = 'open'` and `is_publicly_listed = true`).
- When a new job is inserted, show an in-app toast: "New job: [title]" with a "View" action linking to `/jobs/[id]`.
- Play the existing notification sound.
- Only active for users with the `professional` role.
- Respects the `email_job_matches` preference from `notification_preferences` — if the user has turned off job match notifications, no in-app alert either.

#### 3. Mount `useJobAlerts` in `SessionContext.tsx`
- Call `useJobAlerts(userId, activeRole)` alongside the existing `useMessageNotifications`.

#### 4. Localization updates
- `en/settings.json`: Add `notifications.confirmReEnable`, `notifications.confirmReEnableDesc`, `notifications.confirmYes`, `notifications.confirmCancel`
- `es/settings.json`: Same keys in Spanish

### Files to create/edit
- **Edit**: `src/pages/settings/Settings.tsx` — add AlertDialog for re-enable confirmation
- **Create**: `src/hooks/useJobAlerts.ts` — realtime job alert hook
- **Edit**: `src/contexts/SessionContext.tsx` — mount the new hook
- **Edit**: `public/locales/en/settings.json` + `es/settings.json` — new keys

