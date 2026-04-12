/**
 * Platform Event Taxonomy — canonical event names.
 * Import and use these constants instead of raw strings
 * to prevent typos and enable autocomplete.
 *
 * ALL trackEvent() calls MUST use an EventName value.
 */
export const EVENTS = {
  // Job lifecycle
  JOB_CREATED: "job_created",
  JOB_POSTED: "job_posted",
  JOB_UPDATED: "job_updated",
  JOB_EDITED: "job_edited",
  JOB_VIEWED: "job_viewed",
  JOB_SENT_TO_WORKERS: "job_sent_to_workers",
  JOB_VIEWED_BY_WORKER: "job_viewed_by_worker",
  JOB_RESPONSE_RECEIVED: "job_response_received",
  JOB_SHORTLISTED: "job_shortlisted",
  JOB_AWARDED: "job_awarded",
  JOB_STARTED: "job_started",
  JOB_COMPLETED: "job_completed",
  JOB_DISPUTED: "job_disputed",

  // Wizard
  JOB_WIZARD_STARTED: "job_wizard_started",
  JOB_WIZARD_STEP_COMPLETED: "job_wizard_step_completed",
  JOB_WIZARD_STEP_VIEWED: "job_wizard_step_viewed",
  WIZARD_STEP_COMPLETED: "wizard_step_completed",
  WIZARD_ABANDONED: "wizard_abandoned",
  WIZARD_COMPLETED: "wizard_completed",
  JOB_WIZARD_ABANDONED: "job_wizard_abandoned",
  JOB_POST_SUBMIT_ATTEMPT: "job_post_submit_attempt",
  JOB_POST_SUBMIT_AUTH_REDIRECT: "job_post_submit_auth_redirect",
  JOB_POST_SUBMIT_FAIL: "job_post_submit_fail",
  CUSTOM_REQUEST_SUBMITTED: "custom_request_submitted",

  // Wizard resilience
  WIZARD_STEP_TIMEOUT: "wizard_step_timeout",
  WIZARD_STEP_FALLBACK: "wizard_step_fallback",
  WIZARD_STEP_EMPTY: "wizard_step_empty",
  WIZARD_AUTO_SKIP: "wizard_auto_skip",
  WIZARD_RETRY_PRESSED: "wizard_retry_pressed",

  // Worker
  WORKER_NOTIFIED: "worker_notified",
  WORKER_VIEWED_JOB: "worker_viewed_job",
  WORKER_RESPONDED: "worker_responded",
  WORKER_IGNORED_JOB: "worker_ignored_job",
  WORKER_HIRED: "worker_hired",
  WORKER_COMPLETED_JOB: "worker_completed_job",
  HIRE_INITIATED: "hire_initiated",

  // Conversations
  CONVERSATION_STARTED: "conversation_started",
  MESSAGE_SENT: "message_sent",

  // Quotes
  QUOTE_SUBMITTED: "quote_submitted",
  QUOTE_REVISED: "quote_revised",
  QUOTE_VIEWED: "quote_viewed",
  QUOTE_WITHDRAWN: "quote_withdrawn",
  QUOTE_ACCEPTED: "quote_accepted",
  QUOTE_DECLINED: "quote_declined",
  QUOTE_COMPARISON_VIEWED: "quote_comparison_viewed",

  // Reviews
  REVIEW_SUBMITTED: "review_submitted",
  REVIEW_POST_CLICKED: "review_post_clicked",
  REVIEW_STEP_ENTERED: "review_step_entered",

  // Trust
  WORKER_FLAGGED: "worker_flagged",
  WORKER_RESTRICTED: "worker_restricted",
  CLIENT_FLAGGED: "client_flagged",

  // Payments (future)
  PAYMENT_INTENT_CREATED: "payment_intent_created",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",
  DEPOSIT_PAID: "deposit_paid",
  REFUND_ISSUED: "refund_issued",

  // Listings
  LISTING_PUBLISHED: "listing_published",
  LISTING_PAUSED: "listing_paused",

  // Admin
  ADMIN_OPENED_INSIGHT_PANEL: "admin_opened_insight_panel",
  ADMIN_ARCHIVED_JOB: "admin_archived_job",
  ADMIN_SUSPENDED_USER: "admin_suspended_user",
  ADMIN_VERIFIED_PROFESSIONAL: "admin_verified_professional",
  ADMIN_FORCE_COMPLETED_JOB: "admin_force_completed_job",

  // Auth
  LOGIN_STARTED: "login_started",
  LOGIN_FAILED: "login_failed",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_FAILED: "signup_failed",

  // Onboarding
  PRO_ONBOARDING_STARTED: "pro_onboarding_started",
  PRO_ONBOARDING_STEP_COMPLETED: "pro_onboarding_step_completed",
  PRO_ONBOARDING_STEP_ENTERED: "pro_onboarding_step_entered",
  PRO_PROFILE_PUBLISHED: "pro_profile_published",
  ONBOARDING_STEP_FAILED: "onboarding_step_failed",

  // Phase 7 — Conversion & Retention
  REBOOK_CREATED: "rebook_created",
  PRO_SAVED: "pro_saved",
  PRO_UNSAVED: "pro_unsaved",
  NUDGE_SENT: "nudge_sent",
  NUDGE_SUPPRESSED: "nudge_suppressed",
  NUDGE_DRAFT_STALE: "nudge_draft_stale",
  NUDGE_QUOTES_PENDING: "nudge_quotes_pending",
  NUDGE_CONVERSATION_STALE: "nudge_conversation_stale",
  NUDGE_PRO_NO_QUOTE: "nudge_pro_no_quote",
  NUDGE_REVIEW_REMINDER: "nudge_review_reminder",

  // AI Agents — observability
  AGENT_QUOTE_COACH_TRIGGERED: "agent_quote_coach_triggered",
  AGENT_QUOTE_COACH_SUCCESS: "agent_quote_coach_success",
  AGENT_QUOTE_COACH_FAILED: "agent_quote_coach_failed",
  AGENT_BUDGET_SUGGESTION_SHOWN: "agent_budget_suggestion_shown",
  AGENT_BUDGET_SUGGESTION_ACCEPTED: "agent_budget_suggestion_accepted",
  AGENT_BUDGET_SUGGESTION_DISMISSED: "agent_budget_suggestion_dismissed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
