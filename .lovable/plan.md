

# Fix: Single Admin Drawer Provider via Route Layout

## Problem

Right now there are **3 separate `AdminDrawerProvider` instances**, one in each of:

- `AdminDashboard.tsx` (line 22)
- `MetricInsightPage.tsx` (wraps its inner component)
- `UnansweredJobsPage.tsx` (wraps its inner component)

This means drawers mounted in `AdminDashboard` cannot be triggered from insight pages, and vice versa. Cross-linking (job drawer to user drawer) only works within the same provider instance.

## Solution

Create a single `AdminRouteLayout` component that wraps ALL admin routes in `App.tsx`. Then remove per-page provider wrapping from all three files.

## New File

### `src/pages/admin/AdminRouteLayout.tsx`

```tsx
import { Outlet } from "react-router-dom";
import { AdminDrawerProvider } from "./context/AdminDrawerContext";
import { JobDetailDrawer, UserDetailDrawer } from "./components";

export default function AdminRouteLayout() {
  return (
    <AdminDrawerProvider>
      <Outlet />
      <JobDetailDrawer />
      <UserDetailDrawer />
    </AdminDrawerProvider>
  );
}
```

## Modified Files

### 1. `src/App.tsx` (lines 170-178)

Nest all admin routes under a parent route using `AdminRouteLayout`:

```tsx
{/* Admin Dashboard */}
<Route path="/dashboard/admin" element={<AdminRouteLayout />}>
  <Route index element={<AdminDashboard />} />
  <Route path="insights/market-gap" element={<MarketGapPage />} />
  <Route path="insights/funnels" element={<FunnelsPage />} />
  <Route path="insights/pro-performance" element={<ProPerformancePage />} />
  <Route path="insights/pricing" element={<PricingPage />} />
  <Route path="insights/trends" element={<TrendRadarPage />} />
  <Route path="insights/unanswered-jobs" element={<UnansweredJobsPage />} />
  <Route path="insights/repeat-work" element={<RepeatWorkPage />} />
  <Route path="insights/:metricKey" element={<MetricInsightPage />} />
</Route>
```

Add import for `AdminRouteLayout` at the top.

### 2. `src/pages/admin/AdminDashboard.tsx`

Remove:
- `AdminDrawerProvider` wrapper (lines 22, 110)
- `JobDetailDrawer` and `UserDetailDrawer` rendering (lines 108-109)
- Related imports for those components and the provider

The component becomes just the tabs UI -- no provider, no drawers.

### 3. `src/pages/admin/insights/MetricInsightPage.tsx`

Remove:
- The `AdminDrawerProvider` wrapper in the default export
- The `JobDetailDrawer` / `UserDetailDrawer` rendering in the default export
- The split between `MetricInsightPageInner` and the wrapper -- flatten to a single default export

Keep:
- `useAdminDrawer()` usage for `onRowClick`
- The `onRowClick` handler on `DrilldownTable`

### 4. `src/pages/admin/insights/UnansweredJobsPage.tsx`

Same pattern as MetricInsightPage:
- Remove `AdminDrawerProvider` wrapper and drawer rendering from default export
- Flatten `UnansweredJobsPageInner` into the default export
- Keep `useAdminDrawer()` usage for row clicks

### 5. `src/app/routes/registry.ts` (lines 119-130)

Add the missing admin insight route patterns so `getRouteConfig()` works correctly for those paths:

```ts
export const adminRoutes: RouteConfig[] = [
  {
    path: '/dashboard/admin',
    access: 'admin2FA',
    redirectTo: '/auth',
    lane: 'admin',
    titleKey: 'nav.admin',
  },
  { path: '/dashboard/admin/insights/:metricKey', access: 'admin2FA', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/market-gap', access: 'admin2FA', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/funnels', access: 'admin2FA', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/pro-performance', access: 'admin2FA', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/pricing', access: 'admin2FA', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/trends', access: 'admin2FA', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/unanswered-jobs', access: 'admin2FA', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/repeat-work', access: 'admin2FA', redirectTo: '/auth', lane: 'admin' },
];
```

## Result

- One provider, one set of drawers, for all admin surfaces
- Row clicks open drawers from any admin page (tabs, insight workspaces, standalone pages)
- Cross-linking works everywhere (job drawer -> user drawer and back)
- No duplicate provider instances
- Route registry correctly recognizes all admin paths for guards and `getRouteConfig()`

## Files Summary

| File | Action |
|------|--------|
| `src/pages/admin/AdminRouteLayout.tsx` | Create (5 lines) |
| `src/App.tsx` | Nest admin routes under layout parent |
| `src/pages/admin/AdminDashboard.tsx` | Remove provider + drawer mounting |
| `src/pages/admin/insights/MetricInsightPage.tsx` | Remove provider + drawer mounting, flatten |
| `src/pages/admin/insights/UnansweredJobsPage.tsx` | Remove provider + drawer mounting, flatten |
| `src/app/routes/registry.ts` | Add missing admin insight route configs |

