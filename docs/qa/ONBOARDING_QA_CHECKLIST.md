# Onboarding QA Checklist

Repeatable test plan for the professional onboarding wizard. Run before any onboarding-related deploy.

---

## Prerequisites

| Need | How |
|------|-----|
| **New account** | Sign up with a fresh email, select professional role |
| **Existing account** | Use an account mid-onboarding (any phase except `complete`) |
| **Completed account** | Use an account with `onboarding_phase = complete` |
| **Admin access** | Log in as admin to verify Onboarding Health dashboard |
| **DevTools** | Chrome DevTools → Network tab for throttling / request blocking |

---

## Quick-Run Version (Pre-Deploy Minimum)

If you only have time for 3 tests, do these:

1. **Hard Refresh on Every Step** (Test #1)
2. **Review Step Truth Test** (Test #5)
3. **Cold Start — New User** (Test #6)

This combination catches ~80% of real regression issues.

---

## Test Scenarios

### 🔴 Critical

#### Test 1 — Hard Refresh / Session Reload

**Why:** Validates `userNavigatedRef` lock and phase-sync stability.

**Steps:**
1. Navigate to each step: `basic_info` → `service_area` → `services` → `review`
2. At each step, hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)

**Check:**
- [ ] You land on the correct step (not reset to `basic_info`)
- [ ] No jump backwards to a previous step
- [ ] No flicker to wrong step before settling
- [ ] Progress indicator matches the current step

**Pass:** All steps survive refresh without regression.

---

### 🟠 Important

#### Test 2 — Multi-Tab Conflict

**Why:** Real users open multiple tabs constantly.

**Steps:**
1. Open onboarding in Tab A and Tab B
2. In Tab A, complete a step (e.g. add service zones)
3. Switch to Tab B, continue the flow

**Check:**
- [ ] Tab B respects the updated phase from Tab A
- [ ] No data overwriting between tabs
- [ ] User is not sent backwards in Tab B
- [ ] No errors in console

**Pass:** Both tabs remain consistent with DB truth.

---

#### Test 3 — Browser Back / Forward Navigation

**Why:** The flow uses internal state — browser nav can break it.

**Steps:**
1. Move forward two or three steps
2. Hit browser Back button
3. Hit browser Forward button

**Check:**
- [ ] Step remains valid after Back
- [ ] No weird jumps or resets
- [ ] Tracker view does not appear unexpectedly (non-edit mode)
- [ ] Forward returns to expected step

**Pass:** Browser navigation does not corrupt wizard state.

---

### 🟡 Valuable

#### Test 4 — Network Failure During Save

**Why:** Network issues happen, especially on mobile in Ibiza.

**Steps:**
1. Open DevTools → Network tab
2. Start saving zones or services
3. Block the request mid-flight (right-click → Block request URL) or throttle to Offline
4. Attempt to save

**Check:**
- [ ] UI does not advance to next step
- [ ] No false "completion" message
- [ ] User can retry cleanly after reconnecting
- [ ] No partial/corrupt data saved

**Pass:** Failed saves are handled gracefully with no false progress.

---

#### Test 5 — Review Step Truth Test

**Why:** The review step is the final gate — must be 100% accurate.

**Steps:**
1. Complete onboarding fully (all steps done)
2. Go to review step
3. Manually break each requirement one at a time:
   - Remove phone number (edit profile)
   - Remove all service zones
   - Remove all offered services
4. Return to review step after each removal

**Check:**
- [ ] Each missing piece shows as incomplete in review
- [ ] "Fix" link navigates to the correct step
- [ ] After fixing, user returns to review (not restart)
- [ ] Submit button is disabled when requirements are missing

**Pass:** Review step accurately reflects real DB state for every combination.

---

#### Test 6 — Cold Start (Brand New User)

**Why:** Most testing uses existing users with data already in DB.

**Steps:**
1. Create a brand new account
2. Select professional role
3. Go through onboarding from step 1 to completion

**Check:**
- [ ] No `undefined` / `null` crashes
- [ ] No assumptions based on existing DB data
- [ ] Clean progression through all 4 steps
- [ ] Phase updates correctly after each step
- [ ] Review step shows accurate state
- [ ] Submission completes successfully

**Pass:** A completely new user can onboard without errors.

---

#### Test 7 — Slow Network / Mobile Behaviour

**Why:** 90% of traffic is mobile. Ibiza = variable connectivity.

**Steps:**
1. DevTools → Network → Throttle to "Slow 3G"
2. Walk through the entire onboarding flow

**Check:**
- [ ] Loading states are visible (no blank screens)
- [ ] Buttons do not allow double-submit
- [ ] No step skipping due to race conditions
- [ ] All content is readable on mobile viewport (411px)

**Pass:** Flow is usable on slow mobile connections without errors.

---

### 🟢 Nice-to-Have

#### Test 8 — Analytics / Event Integrity

**Why:** Correct events are critical for funnel analysis later.

**Steps:**
1. Open DevTools → Network tab, filter for `analytics` or `track`
2. Walk through onboarding

**Check:**
- [ ] `pro_onboarding_started` fires once on basic_info completion
- [ ] `pro_onboarding_step_completed` fires once per step
- [ ] No duplicate events on refresh
- [ ] Correct step names in event metadata

**Pass:** Each event fires exactly once with correct data.

---

#### Test 9 — Admin Monitoring Validation

**Why:** Ensures Onboarding Health dashboard reflects real state.

**Steps:**
1. Complete a test user fully through onboarding
2. Check admin dashboard → Onboarding Health
3. Remove zones from the test user (direct DB or via UI)
4. Refresh admin dashboard

**Check:**
- [ ] `completed_24h` count increased after completion
- [ ] `no_zones` count increased after zone removal
- [ ] `no_phone` count is accurate
- [ ] `zero_offered_services` count is accurate
- [ ] Phase breakdown matches actual user distribution

**Pass:** Admin metrics match real database state.

---

#### Test 10 — Real-User Walkthrough

**Why:** Exposes UX issues no technical test will find.

**Steps:**
1. Send 1–2 real people through the flow (friends, workers)
2. Do not guide them
3. Observe silently

**Watch for:**
- [ ] Where they hesitate
- [ ] What they misunderstand
- [ ] Where they stop or abandon
- [ ] Any confusion about language or labels
- [ ] Mobile-specific interaction issues

**Pass:** Users complete onboarding without asking for help.

---

## Edit Mode Tests

If changes touch edit mode (`?edit=1`), also verify:

- [ ] Tracker overview appears correctly
- [ ] Each step card is clickable
- [ ] Completing a step returns to tracker (not next step)
- [ ] "Back to Dashboard" button works
- [ ] "Back to Overview" button works
- [ ] Step completion ticks update after saving

---

## Regression Signals

After deploy, monitor these for 24 hours:

| Signal | Where | Alert if |
|--------|-------|----------|
| Stuck phases increasing | Admin → Onboarding Health | Any phase count growing |
| `no_zones` rising | Admin → Onboarding Health | Count > 5 new in 24h |
| Error events on `/onboarding` | `error_events` table | Any new entries |
| Bounce rate on onboarding | Analytics | Spike above 80% |

---

## Version History

| Date | Change |
|------|--------|
| 2026-04-01 | Initial checklist created |
