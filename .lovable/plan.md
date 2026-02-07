
# Comprehensive End-to-End Testing Plan for CS Ibiza

## Overview

This testing plan covers all user flows across the Constructive Solutions Ibiza platform before real user testing. It's organized by **persona** (Guest, Client, Professional) and then by **flow criticality**.

---

## Testing Structure

```text
┌─────────────────────────────────────────────────────────────────┐
│                         CS IBIZA FLOWS                          │
├──────────────────┬──────────────────┬──────────────────────────┤
│      GUEST       │      CLIENT      │      PROFESSIONAL        │
│   (unauthenticated)│   (Asker lane)  │     (Tasker lane)       │
├──────────────────┼──────────────────┼──────────────────────────┤
│ • Homepage       │ • Post Job       │ • Onboarding             │
│ • Services       │ • Draft Resume   │ • Service Setup          │
│ • Professionals  │ • Messages       │ • Dashboard              │
│ • Job Board      │ • Dashboard      │ • Matched Jobs           │
│ • Forum (read)   │ • Assign Pro     │ • Messages               │
│ • Auth (signup)  │ • Complete Job   │ • Forum (write)          │
└──────────────────┴──────────────────┴──────────────────────────┘
```

---

## Phase 1: Public Routes (No Auth Required)

### Test 1.1 — Homepage & Branding
**Route:** `/`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load homepage | Hero with "Bridging the gap between idea and build" |
| 2 | Check trust badges | "Guided process", "Clear communication", "Ibiza-based" |
| 3 | View service categories | 8 category cards visible |
| 4 | Click a category | Navigates to `/services/{slug}` |
| 5 | Switch to Spanish | All copy updates (use language switcher) |
| 6 | Click "Start Your Project" | Navigates to `/post` wizard |
| 7 | Click "Browse Professionals" | Navigates to `/professionals` |

### Test 1.2 — Services Directory
**Route:** `/services` and `/services/:slug`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load `/services` | All 16 categories displayed |
| 2 | Click "Plumbing" | Navigates to `/services/plumbing` |
| 3 | View subcategories | List of subcategory cards (e.g., "Repairs", "Installations") |
| 4 | Click any subcategory card | **AUTO-ADVANCES** to `/post?category=<id>&subcategory=<id>` |
| 5 | Verify wizard lands on Step 3 (Micro) | Step indicator shows correct position |

### Test 1.3 — Job Board (Guest View)
**Route:** `/jobs`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load job board | Stats bar + job listings display |
| 2 | Click a job card | Job details modal opens |
| 3 | Check modal content | Services, Scope, Logistics sections visible |
| 4 | Click "Sign in to message" | Redirects to `/auth?returnUrl=/jobs` |
| 5 | Test filters (if present) | Jobs filter by category/location |

### Test 1.4 — Professionals Directory
**Route:** `/professionals` and `/professionals/:id`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load `/professionals` | Grid of professional cards |
| 2 | Click a professional card | Navigate to profile detail page |
| 3 | Check profile content | Bio, services, portfolio visible |
| 4 | Click "Request Quote" or similar | Redirects to auth or wizard |

### Test 1.5 — Forum (Public Read)
**Route:** `/forum` and `/forum/:categorySlug`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load `/forum` | 4 category cards (Recommendations, Where Can I Find, etc.) |
| 2 | Click a category | Shows posts in that category |
| 3 | Click a post | Post detail page with comments |
| 4 | Try to post new | Redirected to auth |

### Test 1.6 — Static Pages

| Route | Check |
|-------|-------|
| `/how-it-works` | Page loads with content |
| `/contact` | Page loads with form/info |
| Non-existent route (e.g., `/xyz`) | 404 page displays |

---

## Phase 2: Authentication Flows

### Test 2.1 — Client Signup ("Asker")
**Route:** `/auth`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/auth` | Intent selector appears first |
| 2 | Select "I need work done" (Asker) | Continue button enables |
| 3 | Click Continue | Signup form appears with intent badge |
| 4 | Enter email, phone (optional), password | Fields validate |
| 5 | Submit | Toast "Please check your email" |
| 6 | Confirm email (check inbox) | Email received with magic link |
| 7 | Click link | Redirects to `/auth/callback` → client dashboard |

### Test 2.2 — Professional Signup ("Tasker")
**Route:** `/auth?mode=signup`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "I do the work" (Tasker) | Intent badge shows "Professional" |
| 2 | Complete signup | After email confirm → `/onboarding/professional` |
| 3 | Check `user_roles` table | Contains `['client', 'professional']` |
| 4 | Check `professional_profiles` | Row created with `onboarding_phase: 'not_started'` |

### Test 2.3 — Both Roles Signup
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "Both" | Toast mentions dual access |
| 2 | After email confirm | Lands on client dashboard (default) |
| 3 | Role switcher visible | Can toggle to professional mode |

### Test 2.4 — Sign In (Existing User)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch to "Sign In" tab | Email/password form |
| 2 | Enter valid credentials | Toast "Welcome back!" |
| 3 | Redirects to appropriate dashboard | Based on active role |

### Test 2.5 — Auth with Return URL
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try `/messages` unauthenticated | Redirect to `/auth?returnUrl=%2Fmessages` |
| 2 | Sign in | After auth, lands on `/messages` |

---

## Phase 3: Job Wizard (Critical Path)

### Test 3.1 — Fresh Wizard Start
**Route:** `/post`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load `/post` with no prior state | Step 1 (Category) shows |
| 2 | Universal search bar visible | Can search services |
| 3 | Select a category | Progress to Step 2 (Subcategory) |
| 4 | Select a subcategory | Progress to Step 3 (Micro) |
| 5 | Select micro(s) | Progress to Step 4 (Questions) |
| 6 | Answer questions one-by-one | Auto-advance on single-select |
| 7 | Complete questions | "Questions complete" indicator shows |
| 8 | Click Continue | Progress to Step 5 (Logistics) |
| 9 | Fill location, date, budget | All required fields |
| 10 | Click Continue | Progress to Step 6 (Extras) |
| 11 | Add optional photos/notes | Optional but functional |
| 12 | Click Continue | Progress to Step 7 (Review) |
| 13 | Review "Job Brief" | All sections editable inline |
| 14 | Click "Post to Marketplace" | If not authed → auth checkpoint |
| 15 | After auth | Job created, redirect to dashboard |

### Test 3.2 — Search Entry Point (NEW FIX)
**Route:** `/post` + use ServiceSearchBar

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start at `/post` | Wizard on Category step |
| 2 | Type "sink repair" in search | Results appear |
| 3 | Click a specific result | **Wizard jumps directly to Questions (Step 4)** |
| 4 | `microSlugs` populated | Check questions load correctly |
| 5 | Complete flow to Review | All state preserved |
| 6 | **No draft modal interruption** | Search intent takes priority |

### Test 3.3 — Deep-Link Entry
**Route:** `/post?category=<uuid>&subcategory=<uuid>`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Visit URL with category+subcategory params | Wizard loads at Step 3 (Micro) |
| 2 | No draft modal | Deep-link bypasses draft |
| 3 | Complete flow | All state correctly populated |

### Test 3.4 — Draft Recovery
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start wizard, fill to Step 4 | State saved |
| 2 | Close browser/tab | State persisted |
| 3 | Return to `/post` | Draft modal: "Resume or Start Fresh" |
| 4 | Click "Resume" | Wizard restores at correct step |
| 5 | Click "Start Fresh" | Wizard resets to Step 1 |

### Test 3.5 — Auth Persistence During Wizard
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete wizard to Review (unauthenticated) | "Submit" prompts auth |
| 2 | Complete signup | Return to wizard with state intact |
| 3 | Submit job | Job created successfully |

### Test 3.6 — Direct Mode (Pro Selection)
**Route:** `/post?pro=<uuid>` or toggle on Review

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate with `?pro=<uuid>` | Wizard notes target professional |
| 2 | Complete wizard | Review shows "Direct to [Pro Name]" |
| 3 | Submit | Job marked `is_publicly_listed: false` |
| 4 | Conversation created | Check `conversations` table |

---

## Phase 4: Client Dashboard

### Test 4.1 — Dashboard Access
**Route:** `/dashboard/client`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sign in as client | Dashboard loads |
| 2 | Stats cards visible | Active Jobs, In Progress, Drafts, Messages |
| 3 | Jobs list shows | All user's jobs displayed |
| 4 | Empty state | If no jobs: "Post your first job" CTA |

### Test 4.2 — Job Card Interactions
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click a job card | Job details expand/modal |
| 2 | Assign a professional | Professional selector works |
| 3 | Mark job complete | Completion modal appears |
| 4 | Submit rating | Rating saved, job status updated |

### Test 4.3 — Navigation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Settings icon | Navigate to `/settings` |
| 2 | Click Logout | Sign out, redirect to homepage |
| 3 | Role switcher (if multi-role) | Switch to pro dashboard |

---

## Phase 5: Professional Dashboard & Onboarding

### Test 5.1 — Professional Onboarding Flow
**Route:** `/onboarding/professional`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | New pro user first login | Lands on onboarding page |
| 2 | Progress bar shows | Current step highlighted |
| 3 | Click "Continue" on current step | Navigate to relevant setup |

### Test 5.2 — Service Setup ("Unlock Your Job Types")
**Route:** `/professional/service-setup`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load page | "Unlock Your Job Types" header |
| 2 | Click "Unlock More" | Category selector opens |
| 3 | Select category → subcategory | Micro list appears |
| 4 | Toggle micros to unlock | Pending selection updates |
| 5 | Set preferences (Love/Like/Neutral/Avoid) | Preferences saved |
| 6 | Click "Unlock X Job Types" | Services added to profile |
| 7 | Unlock Progress bar updates | Shows X/5 minimum |
| 8 | Complete setup (5+ services) | "Complete" button enables |
| 9 | Click Complete | `onboarding_phase: 'complete'` saved |

### Test 5.3 — Professional Dashboard
**Route:** `/dashboard/pro`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load dashboard (with services) | Stats: Services, Matched Jobs, Messages |
| 2 | Matched Jobs list | Jobs matching unlocked services |
| 3 | Click a matched job | Details view or navigate |
| 4 | Quick Actions panel | Update Services, Edit Profile, View Messages |
| 5 | Profile Status card | Shows completion checklist |
| 6 | Pending Reviews card | Shows jobs needing rating |

### Test 5.4 — Job Matching Logic
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Unlock "Sink Repair" service | Service saved |
| 2 | Client posts job for "Sink Repair" | Job appears in Matched Jobs |
| 3 | Click "Message" on job | Conversation created |

---

## Phase 6: Messaging System

### Test 6.1 — Messages Page
**Route:** `/messages`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load messages (no conversations) | Empty state with icon |
| 2 | Load messages (with conversations) | Conversation list on left |
| 3 | Click a conversation | Thread loads on right |
| 4 | Send a message | Message appears in thread |
| 5 | Realtime: other party sends | Message appears without refresh |
| 6 | Unread badge | Updates correctly |

### Test 6.2 — Mobile Messages
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load on mobile viewport | List view only |
| 2 | Tap conversation | Full-screen thread |
| 3 | Back button | Returns to list |

---

## Phase 7: Shared Features

### Test 7.1 — Settings Page
**Route:** `/settings`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load settings | Account info displayed |
| 2 | Shows email | Current user's email |
| 3 | Shows mode | "Asker" or "Tasker" |
| 4 | Sign out button | Works correctly |

### Test 7.2 — Language Switching
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click language switcher | ES/EN toggle |
| 2 | Switch to Spanish | All UI chrome updates |
| 3 | Navigate between pages | Language persists |
| 4 | Refresh page | Language still active |

### Test 7.3 — Forum (Authenticated)
**Route:** `/forum/:categorySlug/new`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to new post (authed) | Form appears |
| 2 | Fill title + content | Validation works |
| 3 | Submit | Post created, visible in category |

---

## Phase 8: Edge Cases & Error States

### Test 8.1 — Protected Route Guards
| Route | Attempt | Expected |
|-------|---------|----------|
| `/dashboard/client` | Unauthenticated | Redirect to `/auth` |
| `/dashboard/pro` | Client-only user | Redirect to `/auth` |
| `/messages` | Unauthenticated | Redirect to `/auth` |
| `/auth` | Already authenticated | Redirect to dashboard |

### Test 8.2 — 404 Handling
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/random-page` | 404 page displays |
| 2 | Check navigation | Home link works |

### Test 8.3 — Database Errors
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Simulate network failure | Toast error appears |
| 2 | Loading states | Spinners show appropriately |

---

## Testing Checklist (Quick Reference)

### Guest Flow
- [ ] Homepage loads with new copy
- [ ] All 16 service categories accessible
- [ ] Job board viewable
- [ ] Professional directory works
- [ ] Forum readable (not writable)
- [ ] Language switch works

### Client Flow
- [ ] Signup as "Asker" works
- [ ] Wizard completes end-to-end
- [ ] Search entry point bypasses draft
- [ ] Deep-links work correctly
- [ ] Draft recovery functions
- [ ] Job posts successfully
- [ ] Dashboard shows stats & jobs
- [ ] Messages send/receive
- [ ] Can assign pro to job
- [ ] Can complete job + rate

### Professional Flow
- [ ] Signup as "Tasker" works
- [ ] Onboarding page loads
- [ ] Service setup unlocks micros
- [ ] Preferences save correctly
- [ ] Dashboard shows matched jobs
- [ ] Can message on jobs
- [ ] Profile visible in directory
- [ ] Role switcher works (if dual)

### Cross-Cutting
- [ ] All routes protected correctly
- [ ] 404 page works
- [ ] ES translations complete
- [ ] Mobile responsive on all pages
- [ ] Toasts show for actions
- [ ] Loading states present

---

## Recommended Testing Commands

To systematically test each persona:

**Guest Testing:**
> "Test all public pages as a guest: homepage, /services, /services/plumbing, /jobs, /professionals, /forum, /how-it-works, /contact. Verify content loads and navigation works."

**Client Testing:**
> "Sign up as a new client (Asker), complete the job wizard from /post, verify draft recovery, post a job, view it on dashboard, send a message to a professional."

**Professional Testing:**
> "Sign up as a new professional (Tasker), complete onboarding, unlock 5+ job types in service setup, verify dashboard shows matched jobs, respond to a job message."

**Cross-Flow Testing:**
> "As a dual-role user (both), switch between client and pro dashboards, verify data is correct for each mode, test role switcher functionality."

---

## Database Verification Queries

After testing, verify data integrity:

```sql
-- Check user roles
SELECT * FROM user_roles WHERE user_id = '<user_id>';

-- Check professional profile
SELECT * FROM professional_profiles WHERE user_id = '<user_id>';

-- Check professional services
SELECT * FROM professional_services WHERE user_id = '<user_id>';

-- Check jobs
SELECT id, title, status, is_publicly_listed FROM jobs WHERE client_id = '<user_id>';

-- Check conversations
SELECT * FROM conversations WHERE client_id = '<user_id>' OR professional_id = '<user_id>';
```
