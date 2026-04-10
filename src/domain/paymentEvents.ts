/**
 * PAYMENT & DISPUTE EVENT TRACKING
 *
 * Canonical event names for the milestone payment + dispute funnel.
 * Use with trackEvent() to measure whether copy and flow are working.
 */

export const PAYMENT_EVENTS = {
  // ── Project lifecycle ──
  projectCreated: 'project_created',
  projectLocked: 'project_agreement_locked',
  projectCompleted: 'project_completed',

  // ── Milestone funnel ──
  milestoneCreated: 'milestone_created',
  milestoneSetCompleted: 'milestone_set_completed',    // all milestones defined
  milestoneSubmitted: 'milestone_submitted',            // pro marks complete
  milestoneConfirmed: 'milestone_confirmed',            // client approves
  milestoneCorrectionRequested: 'milestone_correction_requested',

  // ── Payment funnel ──
  paymentIntentCreated: 'payment_intent_created',
  paymentAuthorized: 'payment_authorized',
  paymentDropoff: 'payment_dropoff',                    // abandoned checkout
  paymentReleased: 'payment_released',
  paymentPartialRelease: 'payment_partial_release',
  paymentRefunded: 'payment_refunded',

  // ── Dispute funnel ──
  disputePreventionShown: 'dispute_prevention_shown',   // cooling-off prompt
  disputePreventionResolved: 'dispute_prevention_resolved',
  disputeOpened: 'dispute_opened',
  disputeEvidenceUploaded: 'dispute_evidence_uploaded',
  disputeCounterpartyResponded: 'dispute_counterparty_responded',
  disputeAiAnalysisRun: 'dispute_ai_analysis_run',
  disputeResolutionAccepted: 'dispute_resolution_accepted',
  disputeResolved: 'dispute_resolved',
  disputeEscalatedToHuman: 'dispute_escalated_to_human',

  // ── Support signal ──
  supportQuestionAsked: 'support_question_asked',       // track by topic metadata
  faqViewed: 'faq_viewed',
  disputePolicyViewed: 'dispute_policy_viewed',
  termsViewed: 'terms_viewed',
} as const;

export type PaymentEvent = typeof PAYMENT_EVENTS[keyof typeof PAYMENT_EVENTS];
