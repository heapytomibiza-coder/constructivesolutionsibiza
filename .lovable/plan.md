

# Implementation Plan: Hardening Fixes (4 Minimal Changes)

Based on the architecture analysis, here are four targeted, low-risk fixes ordered by impact. These are mechanical cleanups — no new features, no structural rewrites.

---

## Fix 1: Tighten chunk reload guard (main.tsx)

**Problem**: Current string matching (`Failed to fetch dynamically imported module`, `Loading chunk`, `Loading CSS chunk`) is broad and could false-positive on unrelated errors. No TTL — the flag persists until next successful load.

**Changes**:
- Add a timestamp to the `chunk-reload` sessionStorage value
- Only reload if the last reload attempt was >10 seconds ago (prevents rapid loops from non-chunk errors)
- Keep existing message matching but add a comment documenting browser variance risk

**File**: `src/main.tsx` (lines 19–32)

---

## Fix 2: Add debug logging for monitor flush failures (lighthouse-monitor.ts)

**Problem**: `flush()` catches errors with `console.warn` but provides no structured context. If the table schema drifts or RLS blocks inserts, failures are invisible.

**Changes**:
- In the `catch` block of `flush()`, log the table name that failed and the error code (not just the raw error)
- Gate verbose logging behind `import.meta.env.DEV` to keep production quiet
- No behavioral change — still fire-and-forget

**File**: `src/lib/lighthouse-monitor.ts` (lines 149–152)

---

## Fix 3: Extract admin routes into lazy-loaded chunk (App.tsx)

**Problem**: All 15+ admin page imports are individually lazy-loaded but still listed inline in the 350-line App.tsx. Grouping them into a single lazy boundary reduces both file complexity and gives the bundler a clear split point.

**Changes**:
- Create `src/app/routes/AdminRoutes.tsx` containing the `<Route path="/dashboard/admin">` subtree (lines 314–331)
- In App.tsx, replace the admin block with a single lazy import of `AdminRoutes`
- All admin pages remain lazy — this just moves the declarations

**Files**: New `src/app/routes/AdminRoutes.tsx`, edit `src/App.tsx`

---

## Fix 4: Document provider ownership (comment only)

**Problem**: Providers are split between `main.tsx` (ErrorBoundary, Suspense) and `App.tsx` (QueryClient, BrowserRouter, SessionProvider, TooltipProvider). This is actually correct — infra in main, app in App — but undocumented.

**Changes**:
- Add a brief ownership comment block at the top of both `main.tsx` and `App.tsx` clarifying the split
- No code changes, just documentation

**Files**: `src/main.tsx`, `src/App.tsx`

---

## What this does NOT include

- E2E test authoring (separate effort, needs Playwright setup)
- Full route registry rewrite
- i18n changes (it's fully implemented, not a placeholder)

