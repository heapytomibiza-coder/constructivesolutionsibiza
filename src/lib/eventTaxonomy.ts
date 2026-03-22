/**
 * Platform Event Taxonomy — canonical event names.
 * Import and use these constants instead of raw strings
 * to prevent typos and enable autocomplete.
 */
export const EVENTS = {
  // Job lifecycle
  JOB_CREATED: "job_created",
  JOB_POSTED: "job_posted",
  JOB_UPDATED: "job_updated",
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
  WIZARD_STEP_COMPLETED: "wizard_step_completed",
  WIZARD_ABANDONED: "wizard_abandoned",
  WIZARD_COMPLETED: "wizard_completed",

  // Worker
  WORKER_NOTIFIED: "worker_notified",
  WORKER_VIEWED_JOB: "worker_viewed_job",
  WORKER_RESPONDED: "worker_responded",
  WORKER_IGNORED_JOB: "worker_ignored_job",
  WORKER_HIRED: "worker_hired",
  WORKER_COMPLETED_JOB: "worker_completed_job",

  // Conversations
  CONVERSATION_STARTED: "conversation_started",
  MESSAGE_SENT: "message_sent",

  // Quotes
  QUOTE_SUBMITTED: "quote_submitted",
  QUOTE_REVISED: "quote_revised",
  QUOTE_VIEWED: "quote_viewed",

  // Trust
  REVIEW_SUBMITTED: "review_submitted",
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
  ADMIN_VIEWED_INSIGHT: "admin_viewed_insight_panel",
  ADMIN_ARCHIVED_JOB: "admin_archived_job",
  ADMIN_SUSPENDED_USER: "admin_suspended_user",

  // Onboarding
  PRO_ONBOARDING_STARTED: "pro_onboarding_started",
  PRO_ONBOARDING_STEP_COMPLETED: "pro_onboarding_step_completed",
  PRO_ONBOARDING_STEP_ENTERED: "pro_onboarding_step_entered",
  PRO_PROFILE_PUBLISHED: "pro_profile_published",
  ONBOARDING_STEP_FAILED: "onboarding_step_failed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
