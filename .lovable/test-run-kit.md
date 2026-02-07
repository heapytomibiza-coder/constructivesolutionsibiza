# CS Ibiza — Test Run Kit v1.0

> **Purpose:** End-to-end QA for real-world testing before launch.  
> **Last Updated:** 2026-02-07

---

## 🔐 Test Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Client A | `client.test1@csibiza.test` | `TestPass123!` | Primary client flow testing |
| Client B | `client.test2@csibiza.test` | `TestPass123!` | Authorization isolation tests |
| Pro A (Match) | `pro.match@csibiza.test` | `TestPass123!` | Should match plumbing jobs |
| Pro B (No Match) | `pro.nomatch@csibiza.test` | `TestPass123!` | Should NOT match plumbing jobs |
| Dual-Role | `both.test@csibiza.test` | `TestPass123!` | Role switching + contamination tests |

> ⚠️ **Note:** Create these accounts before testing. Pro accounts need onboarding completed.

---

## 📦 Seed Scenario

### Pro A (should match)
1. Complete onboarding
2. Navigate to `/professional/service-setup`
3. Unlock: **Plumbing → Leak Repairs → Fix leak, Pipe repair**
4. Set preferences to "Love" for sink-related micros

### Pro B (should NOT match)
1. Complete onboarding
2. Navigate to `/professional/service-setup`
3. Unlock: **Painting & Decorating → Interior Painting → Wall painting only**
4. Do NOT unlock any plumbing services

### Client A posts:
- **Job A:** "Sink leak repair" → Should match Pro A
- **Job B:** "Full bathroom renovation" → Should match nobody (unless intended)

---

## 📋 Run Order (Sequential)

Execute in this exact order to avoid state contamination:

```
1. Guest Flows           (no login)
2. Auth Flows            (signup + login tests)
3. Wizard Entry Points   (fresh, search, deep-link)
4. Wizard State Tests    (draft, multi-tab, auth persistence)
5. Client Dashboard      (job management)
6. Pro Dashboard         (matching, messaging)
7. Messaging System      (realtime, mobile)
8. Cross-Role Tests      (dual-role contamination)
9. Authorization Holes   (permission leaks)
10. Mobile + i18n        (ES translations, touch UX)
11. Edge Cases           (race conditions, errors)
```

---

## 🐛 Bug Report Template

```markdown
## Bug Title: [One-line description]

**Account used:** (guest / client / pro / dual-role + email)
**Device + Browser:** (e.g., iPhone 14 Safari, Chrome 120 Windows)
**URL:** 
**Timestamp:** 

### Steps to Reproduce
1. 
2. 
3. 

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Screenshot/Recording
[Attach or link]

### Console Errors (if any)
```
[Paste any red errors from browser console]
```

### Severity
- [ ] 🔴 Blocker (cannot proceed)
- [ ] 🟠 Major (flow broken but workaround exists)
- [ ] 🟡 Minor (cosmetic or edge case)
```

---

## ✅ Go / No-Go Checklist

> **All items must pass before real user testing.**

### Critical Path (MUST PASS)
- [ ] Wizard: `/post` fresh start lands on Category step
- [ ] Wizard: Search entry jumps directly to Questions step
- [ ] Wizard: Deep-link (`?category=&subcategory=`) lands on Micro step
- [ ] Draft modal NEVER interrupts search/deep-link modes
- [ ] Job submit: unauthenticated → auth → returns with state intact
- [ ] Client dashboard shows posted job and can open details
- [ ] Pro receives matched job in dashboard (Job A → Pro A)
- [ ] Pro does NOT receive unmatched job (Job A → Pro B)
- [ ] Messaging works on mobile + desktop
- [ ] Role switching does not mix data

### Security (MUST PASS)
- [ ] Client A cannot view Client B's job via direct URL
- [ ] Pro A cannot access Pro B's conversations
- [ ] Non-admin cannot access admin routes
- [ ] Changing `job_id` or `conversation_id` in URL blocks with 403/redirect

### i18n (MUST PASS)
- [ ] ES language shows no raw translation keys
- [ ] All buttons, toasts, and validation errors translated
- [ ] Wizard steps fully translated in ES

### Mobile (MUST PASS)
- [ ] Sticky wizard buttons don't overlap content
- [ ] Keyboard doesn't cover message input
- [ ] Touch targets are 48px minimum

---

## 🧪 Phase 1: Guest Flows

### Test 1.1 — Homepage
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load `/` | Hero: "Bridging the gap between idea and build" visible within 2s |
| 2 | Check trust badges | 3 badges visible: Clarity First, Aligned Expectations, Trusted Connections |
| 3 | Count category cards | Exactly 8 category cards displayed |
| 4 | Click "Plumbing" card | Navigates to `/services/plumbing` within 500ms |
| 5 | Switch language to ES | Header, buttons, and badges update to Spanish; no English fallbacks |
| 6 | Click "Start Your Project" | Navigates to `/post` |

### Test 1.2 — Services Auto-Advance
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load `/services/plumbing` | Subcategory cards load within 1s |
| 2 | Click "Leak Repairs" | Navigates to `/post?category=<id>&subcategory=<id>&step=micro` |
| 3 | Verify URL | Contains `step=micro` parameter |
| 4 | Verify UI | Step indicator shows "Scope" (Step 3) selected |
| 5 | Refresh page | Still on Micro step; no jump to Category |
| 6 | Click Back | Returns to Services page; no blank screen |
| 7 | Click Forward | Returns to wizard at Micro step |

### Test 1.3 — Job Board (Guest)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load `/jobs` | Stats bar + job cards visible within 2s |
| 2 | Click job card | Details modal opens with Services, Scope, Logistics sections |
| 3 | Click "Sign in to message" | Redirects to `/auth?returnUrl=%2Fjobs` |
| 4 | Verify returnUrl | URL-encoded correctly with `%2F` |

### Test 1.4 — Protected Route Guards
| Route | Attempt | Expected |
|-------|---------|----------|
| `/dashboard/client` | Unauthenticated | Redirect to `/auth?returnUrl=%2Fdashboard%2Fclient` |
| `/dashboard/pro` | Unauthenticated | Redirect to `/auth` |
| `/messages` | Unauthenticated | Redirect to `/auth?returnUrl=%2Fmessages` |
| `/settings` | Unauthenticated | Redirect to `/auth` |
| `/nonexistent` | Any | 404 page with "Return Home" link |

---

## 🧪 Phase 2: Authentication Flows

### Test 2.1 — Client Signup
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/auth` | Intent selector shows 3 options |
| 2 | Click "I'm a Client" | Card highlights; Continue enables |
| 3 | Click Continue | Form shows with "Client" badge |
| 4 | Enter invalid email | Red error: "Invalid email address" |
| 5 | Enter valid email + password | Submit button enables |
| 6 | Submit | Toast: "Please check your email to confirm your account" |
| 7 | Check `user_roles` table | Row exists with `roles: ['client']`, `active_role: 'client'` |

### Test 2.2 — Professional Signup
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "I'm a Professional" | Continue enables |
| 2 | Complete signup | After email confirm → `/onboarding/professional` |
| 3 | Check `user_roles` | `roles: ['client', 'professional']`, `active_role: 'professional'` |
| 4 | Check `professional_profiles` | Row with `onboarding_phase: 'not_started'` |

### Test 2.3 — Auth Callback Edge Cases
| Scenario | Expected Result |
|----------|-----------------|
| Magic link in Instagram in-app browser | Auth completes; redirect works |
| Expired magic link (>24h old) | Error toast; redirect to `/auth` |
| Click magic link twice | First succeeds; second shows "already confirmed" |
| Close tab during auth callback | No orphaned session state |

### Test 2.4 — Return URL Preservation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Visit `/messages` unauthenticated | Redirect to `/auth?returnUrl=%2Fmessages` |
| 2 | Complete signin | Redirect to `/messages` (not dashboard) |
| 3 | Verify URL | Now at `/messages` |

---

## 🧪 Phase 3A: Wizard Entry Points

### Test 3A.1 — Fresh Start
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Clear localStorage/sessionStorage | No wizard state |
| 2 | Load `/post` | Step 1 (Category) with all 16 categories |
| 3 | Universal search bar | Visible and functional at top |
| 4 | Step indicator | Shows "Category" as current step |

### Test 3A.2 — Search Entry (CRITICAL FIX)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load `/post` | Category step |
| 2 | Type "sink repair" in search | Results dropdown within 500ms |
| 3 | Click specific result | **Jumps directly to Questions (Step 4)** |
| 4 | Verify URL | Contains `?step=questions` |
| 5 | Verify state | `microSlugs` populated; questions render within 1s |
| 6 | **NO draft modal** | Search intent overrides draft |
| 7 | Complete to Review | All state preserved correctly |

### Test 3A.3 — Deep-Link Entry
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Visit `/post?category=<uuid>&subcategory=<uuid>` | Lands on Step 3 (Micro) |
| 2 | **NO draft modal** | Deep-link overrides draft |
| 3 | Verify step indicator | "Scope" (Step 3) highlighted |
| 4 | Select micro → Continue | Proceeds to Questions normally |

### Test 3A.4 — Direct Mode (?pro=)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Visit `/post?pro=<uuid>` | Wizard notes target professional |
| 2 | Complete wizard to Review | Shows "Direct to [Pro Name]" badge |
| 3 | Submit | Job created with `is_publicly_listed: false` |
| 4 | Check `conversations` | Row created with pro_id and job_id |

---

## 🧪 Phase 3B: Wizard State Integrity

### Test 3B.1 — Draft Recovery
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start wizard, complete to Step 4 | State auto-saves |
| 2 | Close browser completely | State persisted |
| 3 | Reopen `/post` | Modal: "Resume your project?" with Resume/Start Fresh |
| 4 | Click Resume | Wizard restores at Step 4 with all answers |
| 5 | Repeat: Click Start Fresh | Wizard resets to Step 1 |

### Test 3B.2 — Auth Persistence During Wizard
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete wizard to Review (unauthenticated) | Submit triggers auth |
| 2 | Complete signup | Return to wizard with ALL state intact |
| 3 | Verify answers | All question answers still populated |
| 4 | Submit | Job created successfully |

### Test 3B.3 — Multi-Tab Torture Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open `/post` in Tab A | Start wizard |
| 2 | Open `/post` in Tab B | Draft modal or fresh start |
| 3 | Complete wizard in Tab A | Job posted |
| 4 | Tab B: try to submit same data | Error or blocked; no duplicate job |

### Test 3B.4 — Rapid Navigation Test
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click subcategory (auto-advance) | Navigates to Micro |
| 2 | Immediately click Back | Returns to Subcategory; no blank |
| 3 | Click Forward | Returns to Micro correctly |
| 4 | Refresh 3x rapidly | Step remains stable |

---

## 🧪 Phase 4: Client Dashboard

### Test 4.1 — Dashboard Access & Stats
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sign in as Client A | Dashboard loads within 2s |
| 2 | Stats cards | Active Jobs, In Progress, Drafts, Messages with correct counts |
| 3 | Jobs list | All client's jobs displayed with status badges |
| 4 | Empty state (new user) | "Post your first job" CTA visible |

### Test 4.2 — Job Card Actions
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click job card | Details expand/modal with full info |
| 2 | Click "Assign Professional" | Selector shows only conversation participants |
| 3 | Assign a pro | Status updates to "in_progress"; pro notified |
| 4 | Click "Mark Complete" | Completion modal appears |
| 5 | Submit rating (1-5 stars) | Rating saved; job status → "completed" |

---

## 🧪 Phase 5: Professional Dashboard & Matching

### Test 5.1 — Onboarding Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sign in as new pro | Lands on `/onboarding/professional` |
| 2 | Progress bar | Shows current step |
| 3 | Complete each step | Phase updates in `professional_profiles` |

### Test 5.2 — Service Setup
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load `/professional/service-setup` | "Unlock Your Job Types" header |
| 2 | Click "Unlock More" | Category selector opens |
| 3 | Select category → subcategory | Micro list appears |
| 4 | Toggle 5+ micros | Pending selection updates |
| 5 | Set preference (Love/Avoid) | Preference UI updates |
| 6 | Click "Unlock X Job Types" | Services saved; progress bar updates |
| 7 | Complete setup | `onboarding_phase: 'complete'` |

### Test 5.3 — Job Matching Logic
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Pro A unlocks "Fix leak" | Service saved |
| 2 | Client posts "Sink leak repair" | Job created |
| 3 | Pro A dashboard | Job appears in "Matched Jobs" |
| 4 | Pro B dashboard | Job does NOT appear (no matching services) |
| 5 | Pro A clicks "Message" | Conversation created; redirects to `/messages` |

---

## 🧪 Phase 6: Messaging System

### Test 6.1 — Thread Operations
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load `/messages` (no conversations) | Empty state with icon |
| 2 | Load with conversations | List on left; most recent first |
| 3 | Click conversation | Thread loads on right within 500ms |
| 4 | Send message | Message appears in thread within 1s |
| 5 | Other party sends | Message appears without refresh within 3s |
| 6 | Unread badge | Updates correctly when new messages arrive |
| 7 | Scroll behavior | New messages keep scroll pinned to bottom |

### Test 6.2 — Mobile Messages
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load on mobile (390px width) | List view only |
| 2 | Tap conversation | Full-screen thread |
| 3 | Keyboard opens | Input stays visible; not covered |
| 4 | Back button | Returns to list |

---

## 🧪 Phase 7: Authorization Holes (SECURITY)

### Test 7.1 — Resource Isolation
| Test | Steps | Expected |
|------|-------|----------|
| Job isolation | Client A opens Client B's job URL | 403 or redirect; no data shown |
| Conversation isolation | Pro A opens Pro B's conversation URL | 403 or redirect |
| Message send spoof | Try to send message with wrong sender_id | Rejected; auth.uid() enforced |
| Admin route access | Non-admin visits `/admin/*` | 403 or 404 |

### Test 7.2 — URL Parameter Tampering
| Test | Steps | Expected |
|------|-------|----------|
| Change job_id in URL | Modify `/dashboard/client?job=<other-id>` | No access to other user's job |
| Change conversation_id | Modify `/messages/<other-id>` | Redirect or error |
| Modify pro_id in assign | Try assigning non-participant pro | Rejected by participant guard |

---

## 🧪 Phase 8: Cross-Role Tests (Dual-Role Users)

### Test 8.1 — Role Switching
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sign in as dual-role user | Default dashboard (based on active_role) |
| 2 | Click role switcher | Switch between Client/Pro dashboards |
| 3 | Verify nav updates | Nav items change for role |
| 4 | Verify stats update | Dashboard stats are role-specific |
| 5 | Refresh page | Active role persists |

### Test 8.2 — Dual-Role Contamination (KILLER TEST)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As dual-role, post job as client | Job created with user as owner |
| 2 | Switch to pro mode | Dashboard shows matched jobs |
| 3 | Verify own job NOT in matches | Cannot match own job (unless intended) |
| 4 | Switch back to client | Job stats still correct |
| 5 | Verify no data leakage | Pro stats don't show in client view |

---

## 🧪 Phase 9: i18n Completeness

### Test 9.1 — Spanish Translation Audit
| Page | Check for |
|------|-----------|
| `/post` wizard (all steps) | No English fallbacks; all buttons translated |
| `/dashboard/client` | Stats labels, buttons, empty states |
| `/dashboard/pro` | All sections translated |
| `/messages` | Empty state, input placeholder, send button |
| Toast messages | Error/success toasts in Spanish |
| Validation errors | Form errors in Spanish |

### Test 9.2 — Language Persistence
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch to ES | UI updates |
| 2 | Navigate to 5+ pages | Language persists |
| 3 | Refresh | Still in Spanish |
| 4 | Sign out → Sign in | Language preference preserved |

---

## 🧪 Phase 10: Mobile & Touch UX

### Test 10.1 — Touch Targets
| Element | Expected |
|---------|----------|
| Radio options | 48px minimum height |
| Checkboxes | 48px touch target |
| Wizard nav buttons | 48px height; full-width on mobile |
| Service cards | Easy to tap without mis-taps |

### Test 10.2 — Sticky Footer (Wizard)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open wizard on iPhone | Footer sticky at bottom |
| 2 | Scroll content | Footer stays; content scrolls |
| 3 | Check safe-area | No overlap with home indicator |
| 4 | Keyboard opens | Footer adjusts or hides appropriately |

### Test 10.3 — iOS-Specific
| Test | Expected |
|------|----------|
| File upload (wizard extras) | Camera + gallery picker works |
| Magic link in Instagram browser | Auth completes successfully |
| Safari autofill | Works for email/password |

---

## 🧪 Phase 11: Edge Cases & Race Conditions

### Test 11.1 — Wrong-Step Bug (KILLER TEST)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | From `/services/:slug` click subcategory | Auto-advance to wizard |
| 2 | Verify URL | Contains `step=micro` |
| 3 | Verify UI | Actually showing Micro step (not Category) |
| 4 | Refresh | Still on Micro step |
| 5 | Click Back | Returns to Services page |
| 6 | Click Forward | Returns to wizard at Micro step |

### Test 11.2 — Rapid Click Tests
| Test | Expected |
|------|----------|
| Click category 3x rapidly | Single navigation; no stacking |
| Click Continue during save | Debounced; no duplicate saves |
| Click Back immediately after auto-advance | Returns to previous step correctly |

### Test 11.3 — Error Recovery
| Scenario | Expected |
|----------|----------|
| Network fails during job submit | Toast error; state preserved; can retry |
| Network fails during message send | Error shown; message not lost |
| Session expires mid-wizard | Redirect to auth with returnUrl |

---

## 📊 Database Verification Queries

Run after testing to verify data integrity:

```sql
-- Verify user roles
SELECT user_id, roles, active_role FROM user_roles WHERE user_id = '<user_id>';

-- Verify professional profile
SELECT user_id, onboarding_phase, verification_status, services_count 
FROM professional_profiles WHERE user_id = '<user_id>';

-- Verify professional services
SELECT ps.user_id, smc.name, ps.status, ps.notify
FROM professional_services ps
JOIN service_micro_categories smc ON ps.micro_id = smc.id
WHERE ps.user_id = '<user_id>';

-- Verify job matching (should show Pro A, not Pro B)
SELECT * FROM matched_jobs_for_professional 
WHERE professional_user_id = '<pro_a_user_id>';

-- Verify no duplicate jobs
SELECT title, COUNT(*) FROM jobs 
WHERE user_id = '<client_user_id>' 
GROUP BY title HAVING COUNT(*) > 1;

-- Verify conversation participants
SELECT c.id, c.client_id, c.pro_id, j.title
FROM conversations c
JOIN jobs j ON c.job_id = j.id
WHERE c.client_id = '<user_id>' OR c.pro_id = '<user_id>';
```

---

## 🚀 Launch Readiness Sign-Off

| Reviewer | Date | Status |
|----------|------|--------|
| QA Lead | | ☐ Pass / ☐ Fail |
| Dev Lead | | ☐ Pass / ☐ Fail |
| Product Owner | | ☐ Pass / ☐ Fail |

**Notes:**
