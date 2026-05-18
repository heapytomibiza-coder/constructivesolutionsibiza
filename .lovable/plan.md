# Phased Fix Plan — Flow, Routing, Permissions, Redirects, Navigation

Scope is strictly the issues surfaced in the approved audit + diagrams + Lighthouse doc. No page redesigns, no copy rewrites beyond link targets and query-param names, no new features, no DB changes.

Each phase is independently shippable and revertable. Stop and verify after each phase before starting the next.

---

## Phase 1 — Safe link & redirect string fixes

**Goal:** Kill dead buttons and wrong URLs. Pure string-level changes, zero behavior risk.

**Fixes**
1. `PriceCalculatorPage` link `/post-job` → `/post`.
2. Admin cockpit dead links `/dashboard/admin/users?filter=...` → `/dashboard/admin?tab=users&filter=...` (or remove if no tab exists yet).
3. Admin content links `/community/post/:id` → `/forum/post/:postId`.
4. Forum auth links using `?redirect=` → normalize to `?returnUrl=` to match `RouteGuard` / `buildReturnUrl`.

**Files (expected)**
- `src/pages/prototype/PriceCalculatorPage.tsx`
- `src/pages/admin/**` (OperatorCockpit, ContentPreviewDrawer, ContentSection)
- `src/pages/forum/ForumPost.tsx`, `ForumCategory.tsx`, `ForumNewPost.tsx`

**Risk:** Very low. No guards, no registry, no data writes.

**Test**
- Manual click of each fixed button in preview.
- Logged-out → forum reply → land on `/auth?returnUrl=/forum/...`, return correctly after login.
- `rg "/post-job|/community/post|\?redirect="` returns zero hits in `src/` (other than redirect definitions).

---

## Phase 2 — Registry & guard tightening

**Goal:** Make `RouteGuard` the single source of truth, matching the Lighthouse doc.

**Fixes**
5. **Pro dashboard gate:** `/dashboard/pro` switch `role:professional` → `proReady`. Incomplete pros get sent to `/onboarding/professional` instead of an empty dashboard. `checkAccess` already supports `proReady`.
6. **Shared job ticket ownership:** `/dashboard/jobs/:jobId`, `/invite`, `/compare` stay `access: 'auth'` at the guard, but document the ownership contract in `registry.ts` and verify the in-component participant/owner check is present and consistent. (Backend RLS already enforces; this is belt-and-braces UI.)
7. **Missing registry entry:** Any route mounted in `App.tsx` but absent from `registry.ts` (notably `/jobs/:jobId` if missing, plus `/launch-checklist`). Add them so the guard recognizes them.
8. **Protect `/launch-checklist`:** Flip from `public` → `admin`.
9. **Remove page-level redirects** that duplicate guard logic (e.g. onboarding page doing its own auth redirect). Centralize in `RouteGuard` / `DashboardResolver`.

**Files**
- `src/app/routes/registry.ts`
- `src/App.tsx`
- `src/pages/onboarding/**` (and any other page with a self-redirect surfaced during exploration)
- Read-only verification: `src/guard/RouteGuard.tsx`, `src/guard/access.ts`

**Risk:** Medium. Wrong `isProReady` evaluation could lock a real pro out of `/dashboard/pro`. Mitigation: smoke-test with a fully-onboarded and a half-onboarded pro before merge.

**Test**
- `src/test/smoke/guards.smoke.test.tsx` and `src/test/access.test.ts` pass.
- Manual matrix:
  - Logged out → `/dashboard/pro` → `/auth?returnUrl=/dashboard/pro`.
  - Pro not ready → `/dashboard/pro` → `/onboarding/professional`.
  - Pro ready → `/dashboard/pro` renders.
  - Non-admin → `/launch-checklist` → guard redirect.
  - Client A opens client B's `/dashboard/jobs/:id` → blocked.

---

## Phase 3 — URL family canonicalization

**Goal:** Resolve the `/professional/*` vs `/dashboard/pro/*` vs `/dashboard/professional/*` overlap exactly per the Lighthouse doc.

**Canonical rule (from the doc)**
- `/dashboard/pro/*` = working lane (dashboard, jobs, listings, insights).
- `/professional/*` = setup/profile only (`services`, `profile`, `priorities`).
- `/dashboard/professional/*` = redirect only.
- Legacy `/professional/listings`, `/professional/insights`, `/professional/portfolio`, `/professional/service-setup` = redirect only.
- `/marketplace`, `/marketplace/:listingId` = redirect only to `/services*`.

**Fixes**
- Sweep every `<Link>`, `navigate(...)`, and hard-coded path. Repoint to the canonical family.
- Confirm all legacy redirects are present in `registry.ts`; keep for one release.

**Files**
- `src/app/routes/registry.ts`
- `src/shared/components/layout/**` (nav, role switcher)
- `src/pages/dashboard/professional/**`, `src/pages/professional/**`
- `src/hooks/useRoleSwitch.ts`, `src/app/routes/nav.ts` (if hardcoded labels point at wrong family)

**Risk:** Medium. Many call sites. Mitigation: `rg` sweep + smoke tests + manual pro lane walk.

**Test**
- `rg "/professional/(listings|insights|portfolio|service-setup)" src` only matches redirect definitions.
- `rg "/marketplace" src` only matches redirect definitions.
- Smoke: `listings.smoke`, `dashboard.smoke`, `onboarding.smoke`, `messages.smoke` all green.
- Manual: complete onboarding → `/dashboard/pro?welcome=1`; edit listing → URL `/dashboard/pro/listings/:id/edit`.

---

## Phase 4 — Navigation surface cleanup

**Goal:** Match the "Simplified MVP Architecture" nav lists in the Lighthouse doc.

**Fixes**
- Public nav: `Home, Services, How it works, Jobs, Sign in, Post job, Join as pro` only.
- Client nav: `Dashboard, Post job, My jobs, Messages, Settings`.
- Pro nav: `Dashboard, Available jobs, My jobs, Services/listings, Messages, Settings`.
- Admin nav: `Admin, Monitoring, Insights` (other admin sections live as tabs inside `/dashboard/admin`).
- Hide from primary nav until rollout/MVP-ready: `/pricing`, `/reputation`, `/for-professionals`, `/dashboard/pro/insights`, `/prototype/*`, forum write entries.
- Add `minRollout` to `/prototype/*` so guests don't land on them.
- Confirm every nav surface is derived from `getVisibleNavModel` — kill any hardcoded nav arrays found.

**Files**
- `src/app/routes/registry.ts` (rollout flags, nav metadata)
- `src/shared/components/layout/PublicNav.tsx`, `MobileNav.tsx`, `RoleSwitchPanel.tsx`
- `src/app/routes/nav.ts` (read-only verification)

**Risk:** Low. Visual-only at the nav layer; no guard changes.

**Test**
- Logged-out visitor sees only the public nav above.
- Client logged in sees only client nav (+ shared).
- Pro logged in sees only pro nav (+ shared).
- `/prototype/*` direct hit → guard fallback when rollout inactive.

---

## Phase 5 — Post-action return destinations

**Goal:** Align action-completion routing with the Lighthouse "Action Completion Returns" table. Navigation targets only — no UI redesign.

**Fixes**
- Post-publish success → `/dashboard/jobs/:jobId/invite` (verify and remove any mock-match interstitial routing).
- Invite send → `/dashboard/jobs/:jobId`.
- Quote accept → `/dashboard/jobs/:jobId` or `/messages/:id`.
- Pro onboarding complete → `/dashboard/pro?welcome=1`.
- Forum post created → `/forum/post/:postId`.
- Admin detail back → `/dashboard/admin?tab=<section>`.
- `DashboardResolver`: verify it matches the priority order in the doc (returnUrl → pending → admin → pro(ready/onboarding) → client → `/`).

**Files**
- `src/pages/jobs/**` (post-submit success / invite handoff)
- `src/pages/onboarding/**` (completion navigate)
- `src/pages/forum/**` (post-create navigate)
- `src/pages/dashboard/DashboardResolver.tsx`
- `src/guard/decideAuthLanding.ts` (if present)

**Risk:** Low. Navigation-target changes only.

**Test**
- Post a real job end-to-end → land on invite screen, not a mock summary.
- Complete onboarding → land on `/dashboard/pro?welcome=1`.
- Accept quote → land on related job ticket or thread.
- Admin insight detail → back button returns to admin with correct tab.

---

## Explicitly out of scope

- Page redesigns, copy rewrites, new components.
- New features, new tables, new RPCs.
- Admin internal IA beyond linking to `?tab=...` placeholders.
- Dispute UX (stays rollout-gated per the doc).
- Reputation/pricing marketing pages (stay hidden per the doc).

---

## Sequencing & gate criteria

```text
Phase 1 → verify → Phase 2 → verify → Phase 3 → verify → Phase 4 → verify → Phase 5 → verify
```

Each phase ends with: smoke tests green + a 5-minute manual walk of the affected lane in preview. No next phase until the current one is signed off.

---

## One question to answer before Phase 1 starts

**`/launch-checklist`** — Phase 2 protects it as admin. Confirm: keep as admin-only, or remove entirely from `App.tsx`? Either is one line; just need your call.
