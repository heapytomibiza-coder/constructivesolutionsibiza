# QA Traceability — Health Alerts to Test Coverage

> Maps known production risks and health alerts to automated test coverage, remaining gaps, and owners.

## Traceability Table

| Health Alert / Risk | Area | Existing Coverage | New Coverage Added | Test Files | Gaps Remaining | Owner |
|---|---|---|---|---|---|---|
| Failed emails (SMTP 535) | Notifications / edge functions | Edge function smoke only | Manual staging verification + function-level checks | `send-notification` edge function tests, manual checklist | Real delivery path not automated — requires staging SMTP test | Backend |
| Auth/session instability | Auth + route guards | Partial smoke (render, tabs, returnUrl) | Strengthened signup intent, login validation, role redirect, logout, cross-role blocking | `auth-login.interaction`, `auth-signup.interaction`, `guards.smoke`, `access.test` | Full browser redirect chain still needs E2E (real history, real session hydration) | Frontend |
| Wrong-role access | Route guards / permissions | Basic auth + admin guard checks | Expanded cross-role enforcement (SEC-002): client↛pro, pro↛client, admin↛client/pro | `access.test`, `guards.smoke` | Server-side RLS audit still manual; real DB policy enforcement not testable in Vitest | Frontend + Backend |
| Bad quote assignment | Quote acceptance RPC | None | RPC integrity tests verifying `professionalId` excluded from payload (SEC-003) | `quote-accept.interaction`, `rpc-integrity.test` | Full end-to-end assignment with real DB still needs browser/staging test | Backend |
| Messaging access issue | Messages / permissions | Partial render + empty state only | Guest vs authenticated assertions, sign-in-required state | `messaging.interaction`, `messages.smoke` | Participant-level permission E2E still missing; real-time channel tests not in Vitest | Frontend |
| Listings visibility | Professional listings | None | Smoke: empty state, create CTA, role-gated controls | `listings.smoke` | Ownership restriction on edit route needs interaction test; publish gate needs DB-level validation | Frontend + Backend |
| Job management state | Job detail / cancel / tabs | None | Smoke: tab rendering, status display, empty states | `job-management.smoke` | Cancel action state machine, job-not-found fallback need interaction tests | Frontend |
| Settings persistence | User preferences | None | Smoke: heading, sections, save button; Interaction: toggle + save call | `settings.smoke`, `settings.interaction` | Real preference persistence across sessions needs E2E | Frontend |
| Admin data leakage | Admin dashboard | None | Smoke: admin heading visible for admin role, blocked for non-admin | `admin.smoke` | Full admin tab navigation, user search, data isolation need browser E2E | Frontend + Backend |
| Onboarding drop-off | Professional onboarding | Smoke + basic interaction | Existing coverage adequate | `onboarding.smoke`, `onboarding-flow.interaction` | Step validation blocking, deep-link redirect, save-on-refresh need interaction tests | Frontend |
| Job posting integrity | Job wizard / post flow | Render smoke only | Existing coverage adequate for render | `post.smoke`, `wizard-flow.interaction` | Guest auth checkpoint, form validation, duplicate submission prevention need interaction tests | Frontend |

## Coverage Still Outside Vitest

The following risk areas **cannot be meaningfully tested** in Vitest (jsdom) and require browser E2E (Playwright) or manual staging verification:

| Area | Why Not Vitest | Recommended Approach |
|---|---|---|
| Mobile viewport layout | Requires real CSS rendering, viewport simulation, touch events | Playwright with `setViewportSize` or manual device testing |
| Real email delivery | Requires live SMTP connection and mailbox verification | Manual staging test with real credentials |
| Real RLS enforcement | Requires authenticated queries against live Supabase policies | Supabase linter + manual staging queries |
| Full browser redirects | Requires real `window.location`, history API, cookie/session hydration | Playwright E2E with real auth flow |
| Scrolling / overlap / keyboard | Requires real layout engine, focus management, soft keyboard simulation | Manual mobile QA or Playwright visual regression |
| Modal + toolbar overlap (MOB-002) | Requires real stacking context, overflow, and scroll behaviour | Manual mobile QA with screenshot comparison |
| Cross-page messaging flow | Requires navigation between routes with persisted real-time state | Playwright E2E |
| Payment/holding system flows | Requires Stripe test mode + real webhook delivery | Staging E2E with Stripe test keys |

## Reading This Table

- **If a health alert fires**: find its row, check which test files cover it, and check the "Gaps Remaining" column to understand what is NOT yet automated.
- **If a test fails in CI**: trace it back to the health alert row to understand the production risk it represents.
- **If a gap says "needs E2E"**: that area is only protected by manual QA until a Playwright suite is added.

## Status

All current automated tests are passing in CI/local run. Remaining risk areas that require browser E2E or manual staging validation are documented in this file. This table should be updated whenever:

- a new health alert is added
- a new automated test is written
- a production incident reveals an untested path
