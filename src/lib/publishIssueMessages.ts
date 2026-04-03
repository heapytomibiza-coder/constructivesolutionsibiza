/**
 * Centralized issue-to-message resolution for publish readiness checks.
 * Keeps fallback copy out of page components.
 *
 * The `t` function is passed in so this stays framework-agnostic.
 */

import type { PublishIssue } from './listingPublishRules';

/** Default fallback messages when i18n keys are missing */
const FALLBACK_MESSAGES: Record<string, string> = {
  'publish.missingTitle': 'A title is required to publish.',
  'publish.missingDescription': 'A description is required to publish.',
  'publish.missingPricing': 'At least one pricing item is required to publish.',
  'publish.missingHeroImage': 'A hero image is recommended.',
  'publish.listingLimitReached': 'You have reached your live listing limit. Upgrade your plan to publish more listings.',
  'publish.portfolioLimitReached': 'You have reached your portfolio limit. Upgrade your plan to add more projects.',
};

/**
 * Resolve a publish issue to a user-friendly message string.
 * Accepts any t()-like function. Falls back to hardcoded copy.
 */
export function resolveIssueMessage(
  issue: PublishIssue,
  t: (key: string, defaultValue: string) => string,
): string {
  return t(issue.messageKey, FALLBACK_MESSAGES[issue.messageKey] ?? issue.field);
}

/**
 * Resolve all required issues to a single joined error string.
 */
export function resolveRequiredIssuesMessage(
  issues: PublishIssue[],
  t: (key: string, defaultValue: string) => string,
): string {
  return issues
    .filter(i => i.severity === 'required')
    .map(i => resolveIssueMessage(i, t))
    .join('. ');
}
