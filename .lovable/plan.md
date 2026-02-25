

## Plan: Implement Lighthouse Monitor (Steps 1–3)

The uploaded PDF is an install guide for a "Lighthouse Monitor" system. It references 3 code files that "Rob will send" — but those files were not uploaded. I have enough detail from the guide to build all 3 steps directly.

Your app already has partial observability (`debugContext.ts`, `ReportProblemButton`, `handleSupabaseError`). This adds a more comprehensive layer: automatic JS error capture, network failure tracking, page view telemetry, and a tester-facing "Report Issue" widget.

---

### Step 1: Create 4 Database Tables (Migration)

Create tables with RLS: authenticated users can INSERT their own events, only admins can SELECT.

**`error_events`** — JS errors, unhandled rejections, console.error
- `id`, `user_id`, `error_type` (runtime | network | console | promise), `message`, `stack`, `url`, `route`, `browser`, `viewport`, `metadata` (jsonb), `created_at`

**`tester_reports`** — Bug reports from the widget
- `id`, `user_id`, `description`, `url`, `route`, `browser`, `viewport`, `context` (jsonb — last errors, network requests, console messages), `status` (open | reviewed | resolved), `created_at`

**`page_views`** — Route visits with load time
- `id`, `user_id`, `url`, `route`, `load_time_ms`, `browser`, `viewport`, `created_at`

**`network_failures`** — Failed fetch requests
- `id`, `user_id`, `request_url`, `method`, `status_code`, `error_message`, `route`, `browser`, `created_at`

RLS policies:
- All 4 tables: `INSERT` where `auth.uid() = user_id`
- All 4 tables: `SELECT` where `has_role(auth.uid(), 'admin') AND is_admin_email()`

---

### Step 2: Create `src/lib/lighthouse-monitor.ts`

A single file that:
- Hooks `window.onerror` and `window.onunhandledrejection` for JS errors
- Monkey-patches `window.fetch` to detect failed requests (status >= 400, timeouts, network errors)
- Hooks `console.error` to capture console-level errors
- Uses the Performance API (`PerformanceNavigationTiming`) to capture page load times
- Tracks route changes via a `setInterval` polling `window.location.pathname`
- Buffers events and flushes to the database in batches (every 5 seconds or 10 events)
- Stores recent errors/requests in memory so the Report widget can attach context
- Exports `initMonitor({ supabase })` and `getMonitorContext()` (for the widget)

Wire into `src/main.tsx`: import and call `initMonitor({ supabase })` before `createRoot`.

---

### Step 3: Create `src/components/ReportIssueWidget.tsx`

A floating button (bottom-right, red) that:
- Opens a slide-up panel with a textarea ("What went wrong?")
- Shows auto-attached context summary (page, browser, error count, request count)
- On submit: writes to `tester_reports` with the description + full context JSON (last 5 errors, last 10 network requests, last 10 console messages)
- Shows success/error toast via Sonner
- Uses existing UI primitives (Button, Sheet or custom panel)

Wire into `src/App.tsx`: render `<ReportIssueWidget />` just before `</BrowserRouter>` so it appears on every page.

---

### Step 4: Dashboard (external HTML — not implemented here)

The guide's Step 4 is an external HTML dashboard file opened locally in a browser. This is outside Lovable's scope — Rob would provide that file separately. However, once tables exist, any admin can query them directly via Lovable Cloud.

---

### Files Changed Summary

| File | Change |
|------|--------|
| New migration | Create 4 tables + RLS policies |
| `src/lib/lighthouse-monitor.ts` | New — error tracking engine |
| `src/components/ReportIssueWidget.tsx` | New — floating report button |
| `src/main.tsx` | Add `initMonitor()` call |
| `src/App.tsx` | Add `<ReportIssueWidget />` |

No changes to existing business logic. The monitor is passive (no UI impact). The widget is additive (floating button, doesn't touch existing layout).

