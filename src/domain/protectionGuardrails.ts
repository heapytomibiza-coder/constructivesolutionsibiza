/**
 * PAYMENT-PROTECTION GUARDRAILS
 *
 * Hard rules for the first live phase of milestone payments.
 * These caps and defaults reduce risk while we collect clean data.
 */

export const PROTECTION_GUARDRAILS = {
  /** Maximum total project value allowed through the platform (EUR) */
  maxProjectValueEur: 35_000,

  /** Minimum number of milestones required per project */
  minMilestones: 2,

  /** Maximum number of milestones allowed per project */
  maxMilestones: 10,

  /** Default final retention percentage (applied automatically) */
  defaultRetentionPercent: 10,

  /** Minimum final retention percentage (user cannot go below) */
  minRetentionPercent: 5,

  /** Maximum final retention percentage */
  maxRetentionPercent: 15,

  /** Maximum single milestone value (EUR) — above this, split required */
  maxSingleMilestoneEur: 15_000,

  /** Project value threshold above which manual review is required (EUR) */
  manualReviewThresholdEur: 20_000,

  /** All disputes are human-reviewed during beta, even if AI assists */
  alwaysHumanReviewDisputes: true,

  /** Maximum days for the resolution process */
  resolutionMaxDays: 28,

  /** Hours before auto-progression on non-response */
  autoProgressionHours: 72,

  /** Hours for evidence reminder nudge */
  evidenceReminderHours: 24,

  /** Hours for response warning before auto-progression */
  responseWarningHours: 48,
} as const;

export type ProtectionGuardrails = typeof PROTECTION_GUARDRAILS;
