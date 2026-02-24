

## Plan: Debugging & Observability Toolkit

Add 4 features that turn "it's weird" into actionable evidence: a build stamp, a debug context store, a centralized error handler with visible toasts, and a "Report a Problem" button.

---

### 1. Build Stamp Component

**New file: `src/shared/components/layout/BuildStamp.tsx`**

A tiny component that reads `VITE_APP_VERSION`, `VITE_GIT_SHA`, and `VITE_BUILD_TIME` from `import.meta.env` and renders them as a discreet line of text (e.g. `v0.1.0 · abc1234`). Defaults gracefully to "dev" / "local" when env vars are absent.

**Edit: `src/shared/components/layout/PublicFooter.tsx`**

Import `BuildStamp` and render it below the existing copyright line, inside the same footer container.

**Edit: `src/vite-env.d.ts`**

Extend the `ImportMetaEnv` interface to declare `VITE_APP_VERSION`, `VITE_GIT_SHA`, `VITE_BUILD_TIME` so TypeScript is happy.

---

### 2. Debug Context Store

**New file: `src/lib/debugContext.ts`**

A lightweight in-memory store (plain object, no React state) with two exports:
- `setLastSupabaseError(err)` -- saves the most recent error object (message, code, details, hint)
- `getDebugContext()` -- returns the current debug snapshot

No dependencies, no React. Used by the error handler and the report button.

---

### 3. Centralized Supabase Error Handler

**New file: `src/lib/supabaseErrorHandler.ts`**

Exports `handleSupabaseError(error, context?)` which:
1. Calls `setLastSupabaseError(error)` to capture it
2. Maps common error codes to user-friendly messages (PGRST301 = "Permission denied", 23505 = "Duplicate entry", etc.)
3. Shows a Sonner `toast.error()` with the context label and mapped message
4. Logs the full error to console for devs

This does NOT replace existing error handling -- it's a utility teams can adopt incrementally. No existing files are modified for this; it's opt-in.

---

### 4. "Report a Problem" Button

**New file: `src/shared/components/ReportProblemButton.tsx`**

A small text-link button (styled with `text-xs text-muted-foreground`) that, when clicked:
1. Assembles a JSON payload: current URL, build info, auth state (logged in, user ID, active role), browser/device info, current language, and `getDebugContext()` (last Supabase error)
2. Copies it to clipboard via `navigator.clipboard.writeText()`
3. Shows a Sonner success toast confirming it was copied

Props: accepts `user` and `activeRole` from `useSession()`.

**Edit: `src/shared/components/layout/PublicFooter.tsx`**

Import `ReportProblemButton` and render it next to the copyright line. It reads session context to populate auth info. For unauthenticated users, auth fields show as null (still useful for route + build + browser).

---

### 5. i18n Keys

**Edit: `public/locales/en/common.json`**

Add under a `"debug"` namespace:
- `"reportProblem"`: "Report a problem"
- `"reportCopied"`: "Debug info copied to clipboard"

**Edit: `public/locales/es/common.json`**

Add:
- `"reportProblem"`: "Reportar un problema"
- `"reportCopied"`: "Info de depuración copiada"

---

### Files Changed Summary

| File | Action |
|------|--------|
| `src/vite-env.d.ts` | Edit -- add env type declarations |
| `src/lib/debugContext.ts` | Create |
| `src/lib/supabaseErrorHandler.ts` | Create |
| `src/shared/components/layout/BuildStamp.tsx` | Create |
| `src/shared/components/ReportProblemButton.tsx` | Create |
| `src/shared/components/layout/PublicFooter.tsx` | Edit -- add BuildStamp + ReportProblemButton |
| `public/locales/en/common.json` | Edit -- add debug keys |
| `public/locales/es/common.json` | Edit -- add debug keys |

No database changes. No edge function changes. No breaking changes to existing error handling.

