# Backend Audit — What We Have vs What We Need

> Audit date: 2026-03-01
> Compared against: Full marketplace blueprint (users, jobs, quotes, payments, disputes, admin)

---

## ✅ WHAT WE ALREADY HAVE (solid foundations)

### Users & Identity
| Blueprint Item | Status | Implementation |
|---|---|---|
| Users table | ✅ Built | `auth.users` (Supabase managed) |
| Profiles | ✅ Built | `profiles` (display_name, phone, attribution) |
| Roles (RBAC) | ✅ Built | `user_roles` (roles array, active_role, suspension fields) |
| Role switching | ✅ Built | `switch_active_role()` RPC with validation |
| Admin allowlist | ✅ Built | `admin_allowlist` + `is_admin_email()` + `has_role()` |
| Suspension system | ✅ Built | `suspended_at/by/reason` on `user_roles` |
| Auto-signup trigger | ✅ Built | `handle_new_user()` — intent-based role assignment |

**Verdict: Phase 1 is DONE.** Auth, roles, permissions, and RLS are production-grade.

---

### Service Taxonomy (Wizard Backbone)
| Blueprint Item | Status | Implementation |
|---|---|---|
| Categories | ✅ Built | `service_categories` (16 locked, with icons, groups, display order) |
| Subcategories | ✅ Built | `service_subcategories` (slug-based, icon support) |
| Micro-categories (services) | ✅ Built | `service_micro_categories` (the actual task types) |
| Question packs (wizard schema) | ✅ Built | `question_packs` (JSON questions per micro_slug, versioned) |
| Search index | ✅ Built | `service_search_index` (materialized view for instant search) |

**Verdict: Phase 2 taxonomy is DONE.** 3-tier category → subcategory → micro with question packs.

---

### Job Posting & Lifecycle
| Blueprint Item | Status | Implementation |
|---|---|---|
| Jobs table | ✅ Built | `jobs` (title, description, answers JSON, budget, location, status, flags) |
| Job answers | ✅ Built | Stored as `answers` JSONB column on jobs (not separate table — simpler) |
| Job files/photos | ✅ Built | `has_photos` flag + photos stored in answers JSON |
| Job status tracking | ✅ Built | `job_status_history` (from/to status, changed_by, metadata) |
| Job board view | ✅ Built | `jobs_board` view (public browsing with PII masking) |
| Job details view | ✅ Built | `job_details` view (owner check via `is_owner`) |
| Matched jobs for pros | ✅ Built | `matched_jobs_for_professional` view (micro-category matching) |
| Job invites | ✅ Built | `job_invites` (job_id, professional_id, status) |
| Job assignment | ✅ Built | `assigned_professional_id` on jobs table |
| Job completion | ✅ Built | `completed_at` + status transitions + `completeJob` action |
| i18n support | ✅ Built | `title_i18n`, `teaser_i18n`, `description_i18n`, `source_lang` |
| Rules engine | ✅ Built | `flags`, `computed_inspection_bias`, `computed_safety` |

**Verdict: Job posting through completion is DONE.** Status machine exists but uses simplified states.

---

### Messaging & Conversations
| Blueprint Item | Status | Implementation |
|---|---|---|
| Conversations | ✅ Built | `conversations` (job_id, client_id, pro_id, last_message tracking) |
| Messages | ✅ Built | `messages` (body, sender_id, message_type, metadata) |
| Conversation participants | ✅ Built | `conversation_participants` (role_in_conversation) |
| Unread tracking | ✅ Built | `get_conversations_with_unread()` RPC |
| Real-time | ✅ Built | Supabase realtime on messages |
| System messages | ✅ Built | `message_type` field supports system/user types |

---

### Notifications
| Blueprint Item | Status | Implementation |
|---|---|---|
| Email queue | ✅ Built | `email_notifications_queue` (event_type, payload, retry logic) |
| Job notifications | ✅ Built | `job_notifications_queue` + `enqueue_job_posted_notification()` |
| Message notifications | ✅ Built | `enqueue_message_notification()` trigger with debounce |
| Pro signup alerts | ✅ Built | `enqueue_pro_signup_notification()` trigger |
| Support ticket alerts | ✅ Built | `enqueue_support_ticket_notification()` trigger |
| Bug report alerts | ✅ Built | `enqueue_bug_report_notification()` trigger |
| Notification preferences | ✅ Built | `notification_preferences` (email_messages, email_digests, etc.) |

---

### Professional Profiles & Onboarding
| Blueprint Item | Status | Implementation |
|---|---|---|
| Pro profiles | ✅ Built | `professional_profiles` (bio, rates, availability, zones, verification) |
| Onboarding phases | ✅ Built | `onboarding_phase` with DB check constraint (8 valid phases) |
| Service registration | ✅ Built | `professional_services` (micro_id per pro, notify/searchable flags) |
| Micro preferences | ✅ Built | `professional_micro_preferences` (min_budget, max_distance) |
| Micro stats | ✅ Built | `professional_micro_stats` (completed count, ratings, auto-verification) |
| Verification system | ✅ Built | `verification_status` + admin `verifyProfessional` action |
| Documents | ✅ Built | `professional_documents` (type, file_path, review status) |
| Service listings | ✅ Built | `service_listings` (display_title, hero_image, pricing, gallery) |
| Pricing items | ✅ Built | `service_pricing_items` (label, amount, unit per listing) |
| Listing publish gate | ✅ Built | `enforce_service_listing_publish_gate()` trigger |
| Public listing guard | ✅ Built | `enforce_pro_public_listing_guard()` trigger |

---

### Admin & Operations
| Blueprint Item | Status | Implementation |
|---|---|---|
| Admin dashboard stats | ✅ Built | `admin_platform_stats` view |
| Admin users list | ✅ Built | `admin_users_list` view |
| Admin actions log | ✅ Built | `admin_actions_log` (action_type, target, metadata) |
| User management | ✅ Built | Suspend/unsuspend, verify, role management |
| Job moderation | ✅ Built | Archive, force-complete actions |
| Support inbox | ✅ Built | `support_requests` + `admin_support_inbox` view + events |
| Content moderation | ✅ Built | `removeContent` action for forum posts/replies |
| Health monitoring | ✅ Built | `admin_health_snapshot()` RPC |
| Operator alerts | ✅ Built | `admin_operator_alerts()` RPC (7 alert types) |
| Metric timeseries | ✅ Built | `admin_metric_timeseries()` RPC |
| Metric drilldown | ✅ Built | `admin_metric_drilldown()` RPC (8 metric types) |
| Market gap analysis | ✅ Built | `admin_market_gap()` RPC |
| Unanswered jobs | ✅ Built | `admin_unanswered_jobs()` + `admin_no_pro_reply_jobs()` RPCs |
| Repeat work analysis | ✅ Built | `admin_repeat_work()` RPC |
| Onboarding funnel | ✅ Built | `admin_onboarding_funnel()` RPC |
| Attribution/sources | ✅ Built | `admin_top_sources()` RPC |
| Real-time job alerts | ✅ Built | Realtime listener + sound + browser notifications |

---

### Reviews
| Blueprint Item | Status | Implementation |
|---|---|---|
| Job reviews | ✅ Built | `job_reviews` (rating, comment, reviewer/reviewee roles, visibility) |
| Auto-verification | ✅ Built | `increment_professional_micro_stats()` — auto-promotes verification level |

---

### Analytics & Observability
| Blueprint Item | Status | Implementation |
|---|---|---|
| Analytics events | ✅ Built | `analytics_events` + `track_event()` RPC |
| Page views | ✅ Built | `page_views` (route, load_time_ms, viewport, browser) |
| Error tracking | ✅ Built | `error_events` (error_type, message, stack, route) |
| Network failures | ✅ Built | `network_failures` (status_code, request_url, method) |
| Attribution | ✅ Built | `attribution_sessions` (UTM, referrer, gclid, fbclid) |
| Bug reports | ✅ Built | `tester_reports` (description, context, status) |

---

### Community
| Blueprint Item | Status | Implementation |
|---|---|---|
| Forum categories | ✅ Built | `forum_categories` (slug, icon, sort_order) |
| Forum posts | ✅ Built | `forum_posts` (author, tags, photos, reply_count, view_count) |
| Forum replies | ✅ Built | `forum_replies` (threaded via parent_reply_id) |

---

## ❌ WHAT WE DON'T HAVE (the blueprint gaps)

### 1. Quotes System — ✅ BUILT (Phase 4)
> Pros can submit structured quotes with pricing (fixed/estimate/hourly), scope, exclusions, and revision history.

**Implementation (2026-03-01):**
- `quotes` table with RLS (pro insert/read/update own, client read/update on own jobs, admin full)
- Quote statuses: submitted → revised → accepted → rejected → withdrawn
- Client accepts quote → assigns pro + moves job to `in_progress`
- Realtime enabled for live updates
- Soft deletes added to `forum_posts` and `forum_replies` (deleted_at/deleted_by)
- Full i18n (EN + ES) for all quote UI strings

---

### 2. Structured Payments — NOT BUILT
> No Stripe integration, no payment processing, no milestone payment system.

**Blueprint proposes:**
- `payment_intents` (Stripe integration)
- `payment_ledger` (pending → released → refunded)
- `milestones` (deposit + staged release for construction)

**Do we need it?** 🟡 **DECISION NEEDED**
- Payments through platform = commission revenue but regulatory complexity
- Payments offline = simpler but no monetization control
- **Recommendation:** Start with Stripe Connect in a later phase once job volume justifies it

---

### 3. Formal Disputes System — NOT BUILT
> We have `support_requests` (tickets) but not a structured dispute resolution system tied to payments.

**Blueprint proposes:**
- `disputes` table (reason_code, evidence, mediation status, resolution)
- Tied to payment milestones (release / refund / partial)

**Do we need it?** 🔴 **Only if payments are on-platform**
- Without structured payments, disputes are just support tickets (which we already have)
- With milestone payments, disputes become critical — must block fund release

---

### 4. Flags / Fraud Detection — NOT BUILT (partially)
> We have `flags` array on jobs (rules engine) but no standalone flags/reports table for users/content.

**Blueprint proposes:**
- `flags` table (entity_type, entity_id, flag_type, reporter, status)
- Flag types: fraud, spam, abusive, duplicate

**Do we need it?** 🟢 **Yes, but low priority**
- Current support_requests partially covers this
- A dedicated flags table would help with automated detection patterns

---

### 5. Soft Deletes — NOT IMPLEMENTED
> Current delete operations are hard deletes (e.g., `removeContent` actually DELETEs forum posts).

**Blueprint recommends:** Soft delete everything (add `deleted_at` columns).

**Do we need it?** 🟢 **Yes, recommended for audit trail**
- Forum content: should soft-delete for moderation review
- Jobs: already use status transitions (effectively soft-delete via `cancelled`/`archived`)
- Users: suspension exists, but no soft-delete on profiles

---

### 6. Rate Limiting — NOT IMPLEMENTED
> No server-side rate limits on job posts/day, quotes/day, login attempts.

**Do we need it?** 🟢 **Yes, add via RLS or edge function middleware**
- Prevents spam job posting
- Prevents abuse of messaging system

---

### 7. Detailed Review Dimensions — PARTIAL
> We have `rating` + `comment` but NOT the multi-dimensional ratings from the blueprint.

**Blueprint proposes:** `communication_rating`, `reliability_rating`, `workmanship_rating`

**Do we need it?** 🟡 **Nice to have**
- Current single rating + comment is fine for MVP
- Multi-dimensional helps pros improve and helps clients compare

---

## 📊 SUMMARY SCORECARD

| Phase | Blueprint Area | Status | Priority |
|---|---|---|---|
| Phase 1 | Auth, Roles, Permissions, Audit | ✅ **DONE** | — |
| Phase 2 | Taxonomy, Wizard, Job Posting | ✅ **DONE** | — |
| Phase 2.5 | Pro Onboarding, Listings, Matching | ✅ **DONE** | — |
| Phase 3 | Messaging, Notifications, Support | ✅ **DONE** | — |
| Phase 3.5 | Admin Ops, Analytics, Monitoring | ✅ **DONE** | — |
| Phase 4 | **Quotes System** | ❌ Not built | 🟡 Decision needed |
| Phase 5 | **Payments / Stripe / Milestones** | ❌ Not built | 🟡 Decision needed |
| Phase 5 | **Disputes (payment-linked)** | ❌ Not built | 🔴 Only with payments |
| Phase 6 | Flags/fraud table | ❌ Not built | 🟢 Low priority |
| Phase 6 | Soft deletes | ❌ Not built | 🟢 Recommended |
| Phase 6 | Rate limiting | ❌ Not built | 🟢 Recommended |
| Phase 6 | Multi-dimensional reviews | 🟡 Partial | 🟢 Nice to have |

---

## 🎯 THE BIG DECISION

Your platform is currently a **matchmaker + lead-gen** model:
> Client posts job → Pros see it → They message → Deal happens offline

The blueprint describes a **full transactional marketplace**:
> Client posts → Pro quotes → Client accepts → Payment through platform → Milestone release

**You're at the fork.** Everything in Phases 1–3.5 is built and solid. The question is:

### Do you want to add on-platform payments?

**If YES:** Build Quotes → Stripe Connect → Milestone Payments → Disputes (Phases 4–5)
**If NO:** Your backend is essentially complete. Focus on UX polish, SEO, and growth.

---

## 💡 MY RECOMMENDATION

1. **Don't build payments yet.** Get job volume first. Payments add massive complexity (Stripe Connect, compliance, refund handling).
2. **Do build a simple Quotes table** — even without payments, letting pros submit structured quotes on-platform (price, scope, timeline) dramatically improves the experience vs. raw messaging.
3. **Do add soft deletes** — cheap insurance for moderation.
4. **Do add rate limiting** — protects against spam as you grow.
5. **Skip disputes and milestone payments** until payments are live.
6. **Skip multi-dimensional reviews** — current system works fine.

### Recommended Next Phase: "Structured Quotes (no payments)"
- `quotes` table (price, scope, timeline, status)
- Quote submission flow for pros
- Quote comparison view for clients
- "Accept quote" → assigns pro to job
- Admin visibility into quotes
