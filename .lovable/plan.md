
# Build-First Implementation Plan — Constructive Solutions Ibiza

## Sprint Status

### Sprint 1 ✅ IMPLEMENTED — "Post → Quote → Compare → Hire → Complete → Review"

**Objective**: Complete the full money path on mobile.

**Components built**:
- `ProSummaryCard` — compact pro info (avatar, verified badge, rating)
- `StatusTimeline` — visual job lifecycle progress (required, not optional)
- `QuoteComparisonCard` — mobile-first quote card with accept/message/decline
- `JobTicketQuotes` — quotes received section with "Compare" CTA
- `JobTicketConversations` — linked message threads
- `JobTicketCompletion` — mark job complete CTA (in_progress only)
- `JobTicketReview` — star rating + comment form (completed only)

**Pages built**:
- Quote Comparison View (`/dashboard/jobs/:jobId/compare`) — grid (desktop) / swipeable cards (mobile)
- Job Ticket Detail — refactored with all 4 missing lifecycle sections

**Success metrics**:
- Quote acceptance rate
- Time-to-hire (job posted → quote accepted)
- Review completion rate

**Acceptance test**: A client can complete this full flow on mobile:
post job → receive quote notifications → compare quotes → hire → message → mark complete → leave review

---

### Sprint 2 — Public Trust Pages (Pro Profile → Directory)

**Priority order** (profile closes trust, directory only helps browsing):
1. Professional Profile (`/professionals/:id`) — **build first**
2. Professional Directory (`/professionals`) — build second
3. Portfolio gallery component (before/after)
4. Review breakdown component

**Success metrics**:
- Profile view → contact rate

---

### Sprint 3 — Onboarding Polish + Empty States

- Onboarding motivation screen ("Here's what happens next")
- Empty state variants (no quotes, no conversations, no matches)
- Settings page completion

**Success metrics**:
- Onboarding completion rate
- First-quote-sent rate

---

### Sprint 4 — Service Layer + Marketplace Browse

- Service Listing Detail polish
- Services Directory improvements
- Homepage featured projects (real data)
- For Professionals landing page

**Success metrics**:
- Browse-to-contact rate

---

## Top 10 Wireframes (Approved Order)

1. Homepage ✅
2. Post a Job Wizard ✅
3. Pro Onboarding ✅
4. Job Ticket Detail ✅ (Sprint 1 complete)
5. Quote Comparison View ✅ (Sprint 1 complete)
6. Messages ✅
7. Professional Dashboard ✅
8. Client Dashboard ✅
9. Professional Profile 🟡 (Sprint 2)
10. Service Listing Detail ✅

---

## Phase 1 Email System Cleanup — COMPLETE

### Phase 1A — `send-auth-email` Removed ✅
### Phase 1B — Notification Preferences Expanded ✅
### Phase 1C — Provider Consolidation (Deferred)

---

## Phase 2 — Conversion Nudges — COMPLETE

- `process-nudges` deployed + hourly pg_cron schedule
- 5 nudge types: `draft_stale`, `quotes_pending`, `conversation_stale`, `pro_no_quote`, `review_reminder`
- All nudge events respect `email_project_updates` preference
- 50-item batch safety cap per run
- `review_reminder` targets only the missing side
