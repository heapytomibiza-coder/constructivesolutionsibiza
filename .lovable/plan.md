## Objective

Validate the core MVP operational loop using real client/pro accounts and test DB records, **without code or product-logic changes**. Admin UI is inspected via code and database state because admin credentials are unavailable.

## Ground rules

- **No code changes. No product logic changes.** Test accounts and test DB rows may be created where required to complete the MVP loop.
- **Stage 2 is a hard gate.** No seeding occurs until the real admin "Send enquiry" write path is fully reverse-engineered (every table, column, status, trigger, dependent row).
- **Hard fail condition:** If the real admin action cannot be replicated with high confidence, the MVP loop is considered only **partially validated**, and Stage 3/4 results **must not be treated as production-equivalent**. This is reported as the headline verdict, not a footnote.
- **Transactional integrity:** Seeded rows must be inserted in the same order (and where feasible, the same transaction) as production, because unread counters, conversation ordering, timestamps, triggers, notification listeners, and realtime feeds all depend on insertion order.
- All test rows tagged with `[MVP-TEST]` for clean purge after the run.

## Fixed test job

- **Category:** Carpentry
- **Subcategory:** Shelving / fitted storage
- **Micro:** Install fitted shelving (single room)
- **Area:** Ibiza Town
- **Budget:** €800–€1,500
- **Timing:** This week
- **Safety:** Standard / green
- **Custom request:** No
- **Photos:** 1 placeholder

Tests the **clean happy path**, avoiding the custom-classifier and high-risk branches.

## Stages

### Stage 1 — Client signs up + posts job (live)
- Sign up fresh client at `/auth`
- Walk wizard end-to-end with the fixed test job
- Capture screenshots at every step
- **Mobile UX evaluation at 375px on the Review step**, scoring:
  - Scroll fatigue (how many full screens to read it)
  - Repeated information
  - CTA visibility above the fold
  - Cognitive overload (count of distinct visual blocks)
  - Tap-target sizing
- Submit. Confirm `jobs` row + `?posted=1` interstitial
- **Time-to-complete:** record signup → job submitted (wall-clock) and total click count

### Stage 2 — Reverse-engineer admin write path (HARD GATE)
- Read `JobDetailDrawer.tsx`, `ClassificationReviewPanel`, manual-shortlist + "Send enquiry" admin action source
- Produce a **complete write-set spec**:
  - Every table written
  - Every column populated and with what
  - Insertion order
  - Triggers fired (notification queue, counter updates, audit logs)
  - Realtime channels broadcast to
  - Edge functions invoked
  - Email/Telegram side effects
- Cross-check against `docs/architecture/data-flows.md` and DB triggers
- **Confidence rating** (high / medium / low) on whether external seeding can faithfully reproduce this. If low → declare partial validation now and continue only for diagnostic value.

### Stage 2.5 — Seed enquiry (gated on Stage 2 confidence)
- Insert the exact row set in the exact order Stage 2 documented
- Use a single transaction where possible
- Anything **unreachable** from outside the action (edge-function-only side effects, in-process broadcasts) → flagged unverified and counted toward partial-validation verdict

### Stage 3 — Professional receives enquiry (live)
- Sign up fresh pro, complete onboarding to `pro_ready`
- **Time-to-complete:** signup → `pro_ready` (wall-clock + click/screen count)
- Open `/dashboard/pro` → Received Enquiries
- Test viewed / interested / declined; capture each state + DB write
- **Realtime check:** with the client dashboard open in a parallel browser context, confirm whether status changes propagate without a manual refresh. Record: realtime ✓ / refresh-required ✗ / partial.

### Stage 4 — Client sees progress (live)
- On client dashboard, confirm sent / interested / declined counters
- Confirm progress copy is clear and reassuring
- **Realtime check** (mirrors Stage 3): does the client see pro responses without refresh?

## Deliverable per stage

1. What I did
2. Screenshots (with mobile screenshots on Stage 1 Review)
3. ✅ What worked
4. ⚠️ Friction / confusion
5. 🛑 Blockers
6. ✏️ Copy / polish suggestions
7. ⏱️ Time-to-complete + click count (Stages 1, 3)
8. 📡 Realtime verdict (Stages 3, 4)
9. ⚡ Production-path bypasses (Stage 2.5)

## Final report

- **Headline verdict:** Fully validated / **Partially validated** / Not validated — driven by Stage 2 confidence + Stage 2.5 bypasses + realtime results
- **Mobile UX scorecard** for the Review step
- **Onboarding friction summary** (time + clicks for client and pro)
- **Realtime quality signal** (✓/✗/partial across stages)
- Consolidated prioritised list: 🛑 Blocker · ⚠️ Issue · ⚡ Risk · ✨ Polish

## Out of scope
No code/product-logic changes. No payment, dispute, review-loop testing. Admin UI inspected, not interacted with.

## Cleanup
SQL block to purge `[MVP-TEST]` rows + delete the two test auth users.

## Estimated effort
~30–50 tool calls in one continuous pass; full report posted at the end.
