

# Fix forwardRef Warnings — Cleanup Plan

## What's happening

React Router v6 and your `App.tsx` are passing refs down through layout wrappers (`RouteGuard`, `PublicOnlyGuard`, `AdminRouteLayout`) to child components that don't accept them. Every function component in the tree that receives an unexpected ref triggers the same warning. Since these are layout-level components, the warning cascades to dozens of children — making it look worse than it is.

## Root cause

The components listed below are plain function components that React Router's `<Outlet />` or parent wrappers try to pass a `ref` to. They need `React.forwardRef` or the ref needs to be dropped.

## Affected components (7 files)

| File | Component | Fix |
|------|-----------|-----|
| `src/shared/components/layout/ScrollToTop.tsx` | `ScrollToTop` | Returns `null` — no DOM node to ref. Just wrap in `forwardRef` returning `null`. |
| `src/shared/components/layout/UrlNormalizer.tsx` | `UrlNormalizer` | Same pattern — returns `null`. |
| `src/guard/RouteGuard.tsx` | `RouteGuard`, `PublicOnlyGuard` | Both return `<Outlet />` or `<Navigate />`. Wrap in `forwardRef`. |
| `src/pages/admin/AdminRouteLayout.tsx` | `AdminRouteLayout` | Wrap default export in `forwardRef`. |
| `src/pages/admin/monitoring/MonitoringPage.tsx` | `MonitoringPage` + `StatCard` | Wrap both in `forwardRef`. |
| `src/components/ui/sonner.tsx` | `Toaster` | Wrap in `forwardRef`. |

## Implementation approach

Each fix is the same 3-line pattern:

```tsx
// Before
function ScrollToTop() { ... }

// After
const ScrollToTop = React.forwardRef<HTMLDivElement>(function ScrollToTop(_props, _ref) {
  // ... same body, ignore ref since there's no DOM node
});
```

For components that return JSX with a root `<div>`, the ref gets forwarded to that div. For components returning `null` or `<Outlet />`, the ref is simply accepted and ignored — which silences the warning without changing behavior.

## What this does NOT change

- No behavior changes
- No new dependencies
- No database changes
- No routing changes

All 7 files will be edited in a single pass.

