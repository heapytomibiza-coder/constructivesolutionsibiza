

# Full System Audit: What's Built, What's Ready, What Needs Work

## Database Tables (32 tables live)

```text
SYSTEM                    TABLE                              STATUS
─────────────────────────────────────────────────────────────────────
Auth & Identity
                          auth.users                         DONE (managed)
                          profiles                           DONE
                          user_roles                         DONE (RBAC + suspension)
                          admin_allowlist                    DONE

Service Taxonomy
                          service_categories                 DONE (16 categories)
                          service_subcategories              DONE
                          service_micro_categories           DONE
                          question_packs                     DONE (versioned JSON)

Jobs & Lifecycle
                          jobs                               DONE (full status machine)
                          job_status_history                 DONE
                          job_invites                        DONE
                          job_notifications_queue            DONE

Quotes (Phase 4)
                          quotes                             DONE (dark-launched)

Messaging
                          conversations                      DONE
                          conversation_participants          DONE
                          messages                           DONE (realtime)

Professional
                          professional_profiles              DONE (rates, zones, verification)
                          professional_services              DONE
                          professional_micro_preferences     DONE
                          professional_micro_stats           DONE (auto-verification)
                          professional_documents             DONE

Service Listings
                          service_listings                   DONE
                          service_pricing_items              DONE
                          service_views                      DONE

Reviews
                          job_reviews                        DONE (single rating)

Support
                          support_requests                   DONE
                          support_request_events             DONE

Notifications
                          email_notifications_queue          DONE
                          notification_preferences           DONE

Analytics & Observability
                          analytics_events                   DONE
                          page_views                         DONE
                          error_events                       DONE
                          network_failures                   DONE
                          attribution_sessions               DONE
                          tester_reports                     DONE

Community
                          forum_categories                   DONE
                          forum_posts                        DONE (soft-delete ready)
                          forum_replies                      DONE (soft-delete ready)

Admin
                          admin_actions_log                  DONE
```

## Database Views (10 views live)

```text
VIEW                               PURPOSE                          STATUS
───────────────────────────────────────────────────────────────────────
admin_platform_stats               Dashboard KPIs                   DONE
admin_support_inbox                Support queue (enriched)          DONE
admin_users_list                   User management                  DONE
job_details                        Job + ownership check            DONE
jobs_board                         Public job browsing              DONE
matched_jobs_for_professional      Micro-match for pros             DONE
professional_matching_scores       Ranked pro matches               DONE
public_professional_details        Public pro profile               DONE
public_professionals_preview       Pro directory listing            DONE
service_listings_browse            Marketplace browse               DONE
service_search_index               Instant search (materialized)    DONE
```

## RPCs / Server Functions (18 live)

```text
FUNCTION                              PURPOSE                       STATUS
───────────────────────────────────────────────────────────────────────
has_role()                            RBAC check                    DONE
is_admin_email()                      Admin allowlist gate          DONE
switch_active_role()                  Role switching                DONE
track_event()                         Analytics                     DONE
create_direct_conversation()          Messaging                    DONE
get_or_create_conversation()          Messaging                    DONE
get_conversations_with_unread()       Unread counts                DONE
get_conversation_counts_for_jobs()    Job conversation stats       DONE
create_draft_service_listings()       Listing scaffolding          DONE
increment_job_edit_version()          Edit tracking                DONE
increment_professional_micro_stats()  Auto-verify on completion    DONE
admin_health_snapshot()               System health                DONE
admin_operator_alerts()               7 alert types                DONE
admin_metric_timeseries()             Time-bucketed metrics        DONE
admin_metric_drilldown()              8 metric deep-dives          DONE
admin_market_gap()                    Supply/demand gaps           DONE
admin_unanswered_jobs()               Stale job detection          DONE
admin_no_pro_reply_jobs()             No-reply detection           DONE
admin_repeat_work()                   Repeat client patterns       DONE
admin_onboarding_funnel()             Pro onboarding tracking      DONE
admin_top_sources()                   Attribution analysis         DONE
```

## Edge Functions (8 deployed)

```text
FUNCTION                    PURPOSE                          STATUS
───────────────────────────────────────────────────────────────────
ping                        Health check                     DONE
send-auth-email             Custom auth emails               DONE
send-job-notification       Pro match alerts                 DONE
send-notifications          Email digest dispatch            DONE
collect-attribution         UTM binding on sign-in           DONE
translate-content           Auto i18n for jobs               DONE
update-user-email           Email change flow                DONE
backfill-translations       Batch translation                DONE
seedpacks / seed-electrical Question pack seeding            DONE
```

## Frontend Actions (write operations)

```text
ACTION                        DOMAIN          STATUS
───────────────────────────────────────────────────────
messageJob                    Jobs            DONE
completeJob                   Jobs            DONE
submitReview                  Jobs            DONE
assignProfessional            Jobs            DONE
awardProStats                 Jobs            DONE
submitQuote                   Quotes          DONE (dark)
reviseQuote                   Quotes          DONE (dark)
acceptQuote                   Quotes          DONE (dark)
withdrawQuote                 Quotes          DONE (dark)
archiveJob                    Admin           DONE
forceCompleteJob              Admin           DONE
suspendUser                   Admin           DONE
verifyProfessional            Admin           DONE
removeContent                 Admin           DONE (soft-delete)
assignSupportTicket           Admin           DONE
joinSupportThread             Admin           DONE
updateSupportStatus           Admin           DONE
createSupportRequest          Messages        DONE
```

## Access Control & Security

```text
LAYER                         IMPLEMENTATION                   STATUS
───────────────────────────────────────────────────────────────────
Auth                          Supabase Auth (email + OAuth)     DONE
RBAC                          has_role() + user_roles table     DONE
Route guards                  RouteGuard + PublicOnlyGuard      DONE
Rollout gates                 RolloutGate + domain/rollout.ts   DONE
Admin gate                    is_admin_email() + allowlist      DONE
RLS on all tables             Per-table policies                DONE
Role switching                switch_active_role() RPC          DONE
Suspension                    suspended_at/by/reason fields     DONE
Pro readiness gate            isPhaseReady + servicesCount      DONE
```

## i18n

```text
NAMESPACES (EN + ES)          STATUS
───────────────────────────────────
auth, common, dashboard       DONE
forum, jobs, legal, lexicon   DONE
messages, micros, onboarding  DONE
professional, questions       DONE
settings, wizard              DONE
Category/taxonomy translations DONE
```

---

## WHAT'S NOT BUILT

```text
FEATURE                        PRIORITY    WHEN TO BUILD
───────────────────────────────────────────────────────────
Payments / Stripe Connect      DEFER       After job volume justifies it
Escrow ledger / milestones     DEFER       Only with payments
Formal disputes (payment)      DEFER       Only with escrow
Flags/reports table            LOW         Week 9 (Phase 3)
Rate limiting (server)         MEDIUM      Week 8 (safety rails)
Multi-dimensional reviews      LOW         Nice-to-have, current works
Job splitting toggle           MEDIUM      Dedicated follow-up
```

## ROLLOUT READINESS SUMMARY

**Phases 1-4 (backend) are complete.** The platform has:
- 32 tables, 10+ views, 18+ RPCs, 8 edge functions
- Full RBAC + RLS on every table
- Complete job lifecycle: post → match → message → assign → complete → review
- Quotes system dark-launched (activate at `founding-members` phase)
- Admin ops center with 7 alert types, 8 metric drilldowns, support inbox
- Bilingual i18n (EN/ES) across 14 namespaces
- Analytics pipeline: events, page views, errors, network failures, attribution

**Current rollout phase:** `pipe-control` (core loop only)

**To activate next features:** Change `CURRENT_ROLLOUT` in `src/domain/rollout.ts` from `pipe-control` to `founding-members` to unlock the professional directory and quotes system.

