

# UTM / Referral Attribution Tracking — Proper Architecture

## Overview

Implement a full attribution pipeline that captures where users come from (WhatsApp groups, Instagram bio, ads) and ties that source data to signups, job posts, and analytics events. No Google Analytics dependency — all data lives in your own database.

## What You Get

- Know which WhatsApp group or Instagram link actually produces jobs (not just clicks)
- Track source-to-signup-to-post conversion per channel
- Admin visibility into top-performing referral sources
- Future-proof for paid ads (gclid, fbclid) without schema changes

---

## Architecture

### 1. Database Changes

**New table: `attribution_sessions`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (pk) | auto-generated |
| session_id | text (unique) | Client-generated stable ID stored in localStorage |
| landing_url | text | First URL the user hit |
| referrer | text | `document.referrer` (sanitized) |
| utm_source | text | e.g. `whatsapp`, `instagram` |
| utm_medium | text | e.g. `group`, `bio`, `dm` |
| utm_campaign | text | e.g. `portinatx_builders` |
| utm_term | text | nullable |
| utm_content | text | nullable |
| ref | text | Simple override: `?ref=wa_group_1` |
| gclid | text | nullable, future Google Ads |
| fbclid | text | nullable, future Meta Ads |
| raw_params | jsonb | All query params (safety net) |
| user_id | uuid | nullable, set on auth bind |
| first_seen_at | timestamptz | default now() |
| last_seen_at | timestamptz | default now() |

RLS: INSERT for anon (via edge function), SELECT for admin only, no direct client writes.

**Add columns to `profiles`:**
- `first_touch_attribution` (jsonb, nullable)
- `last_touch_attribution` (jsonb, nullable)

**Add column to `jobs`:**
- `attribution` (jsonb, nullable)

### 2. Client-Side: Attribution Capture Hook

New file: `src/hooks/useAttribution.ts`

Responsibilities:
- On first app load, generate a stable `session_id` (UUID) and store in `localStorage` under key `csibiza_sid`
- Parse URL for `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `ref`, `gclid`, `fbclid`
- Capture `document.referrer` and `window.location.href`
- Only fire the "collect" call when attribution params are present OR on first-ever visit (no existing `csibiza_sid`)
- Store parsed attribution in `localStorage` under `csibiza_attr` as JSON for downstream use

This hook mounts once inside `SessionProvider` (alongside `useMessageNotifications`).

### 3. Server-Side: Edge Function `collect-attribution`

New file: `supabase/functions/collect-attribution/index.ts`

- Accepts POST with session data
- Upserts into `attribution_sessions` (on conflict `session_id`)
- First-touch fields only written on INSERT; last-touch fields updated on every call
- No JWT required (anonymous visitors need this)
- Rate-limited by session_id (upsert naturally deduplicates)

### 4. Auth Bind: Attach Attribution to User on Signup/Login

Inside `useSessionSnapshot` — on `SIGNED_IN` event:
- Read `csibiza_sid` from localStorage
- Call a small helper that updates `attribution_sessions.user_id` and writes `profiles.first_touch_attribution` / `last_touch_attribution`
- This is a fire-and-forget call (no UX blocking)

### 5. Job Creation: Attach Attribution to Jobs

In `buildJobInsert` (`src/features/wizard/canonical/lib/buildJobPayload.ts`):
- Read current attribution from `localStorage` (`csibiza_attr`)
- Add it to the job insert payload as the `attribution` jsonb column
- Lightweight: just `{ ref, utm_source, utm_medium, utm_campaign, session_id }`

### 6. Analytics Events: Enrich with Source

In `trackEvent` (`src/lib/trackEvent.ts`):
- Auto-inject `session_id`, `ref`, `utm_source`, `utm_campaign` into the metadata object
- Keeps events lean but joinable to full attribution data

### 7. Admin Insights: Top Sources View

New section in the admin dashboard (or new insight page):
- Query `attribution_sessions` joined with `profiles` and `jobs`
- Show: source, signups count, jobs posted count, conversion rate
- Filterable by date range

---

## File Touchpoints

| File | Change |
|------|--------|
| `supabase/functions/collect-attribution/index.ts` | NEW - edge function |
| `supabase/config.toml` | Add `[functions.collect-attribution]` with `verify_jwt = false` |
| `src/hooks/useAttribution.ts` | NEW - capture + collect hook |
| `src/lib/attribution.ts` | NEW - parse/read/write helpers |
| `src/contexts/SessionContext.tsx` | Mount `useAttribution` hook |
| `src/hooks/useSessionSnapshot.ts` | On SIGNED_IN, call attribution bind |
| `src/lib/trackEvent.ts` | Auto-inject attribution fields into metadata |
| `src/features/wizard/canonical/lib/buildJobPayload.ts` | Read attribution from localStorage, add to job payload |
| DB migration | Create `attribution_sessions` table, add columns to `profiles` and `jobs` |

## Implementation Order

1. DB migration (table + columns)
2. `src/lib/attribution.ts` (pure helpers: parse, read, write localStorage)
3. `supabase/functions/collect-attribution/index.ts` (edge function)
4. `src/hooks/useAttribution.ts` (mount in SessionProvider)
5. Auth bind logic in `useSessionSnapshot.ts`
6. Enrich `trackEvent` and `buildJobInsert`
7. Admin "Top Sources" insight page

## Link Strategy (Ready to Use)

Once deployed, share links like:

```text
https://constructivesolutionsibiza.lovable.app/post?ref=wa_portinatx_group
https://constructivesolutionsibiza.lovable.app/?utm_source=whatsapp&utm_medium=group&utm_campaign=builders_ibiza
https://constructivesolutionsibiza.lovable.app/?ref=ig_bio
```

No additional setup needed — the system captures automatically on landing.

