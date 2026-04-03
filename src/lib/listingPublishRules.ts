/**
 * LISTING PUBLISH RULES — Single source of truth
 *
 * Mirrors the ONLY DB trigger on service_listings: `validate_service_listing_live`.
 * The older conflicting trigger `enforce_service_listing_publish_gate` (which
 * required hero_image_url) has been dropped.
 *
 * DB contract (for listings created after 2026-03-19):
 *   - display_title required (non-empty)
 *   - short_description required (non-empty)
 *   - At least one enabled pricing item with price_amount > 0
 *
 * Allowed statuses: draft | live | paused
 *   - "paused" is used by both provider self-service and admin take-down.
 *   - Transitioning to "live" re-fires the validation trigger.
 *
 * Client adds hero_image_url as a soft recommendation but not a hard gate,
 * matching the DB trigger which does NOT require it.
 */

export interface ListingPublishInput {
  display_title?: string | null;
  short_description?: string | null;
  hero_image_url?: string | null;
  /** Whether at least one enabled pricing item with price > 0 exists */
  hasPricing: boolean;
  /** Current count of live listings for this provider (optional — skip check if omitted) */
  currentLiveCount?: number;
  /** Tier-based listing limit (optional — skip check if omitted) */
  listingLimit?: number;
}

export interface PublishIssue {
  field: 'display_title' | 'short_description' | 'hero_image_url' | 'pricing';
  severity: 'required' | 'recommended';
  messageKey: string;
}

export interface PublishReadiness {
  canPublish: boolean;
  issues: PublishIssue[];
}

/**
 * Evaluate whether a listing meets publish requirements.
 * Returns structured issues so UI can display specific guidance.
 */
export function evaluateListingReadiness(input: ListingPublishInput): PublishReadiness {
  const issues: PublishIssue[] = [];

  if (!input.display_title?.trim()) {
    issues.push({
      field: 'display_title',
      severity: 'required',
      messageKey: 'publish.missingTitle',
    });
  }

  if (!input.short_description?.trim()) {
    issues.push({
      field: 'short_description',
      severity: 'required',
      messageKey: 'publish.missingDescription',
    });
  }

  if (!input.hasPricing) {
    issues.push({
      field: 'pricing',
      severity: 'required',
      messageKey: 'publish.missingPricing',
    });
  }

  // Hero image is recommended but not required by the DB trigger
  if (!input.hero_image_url) {
    issues.push({
      field: 'hero_image_url',
      severity: 'recommended',
      messageKey: 'publish.missingHeroImage',
    });
  }

  const canPublish = issues.every(i => i.severity !== 'required');

  return { canPublish, issues };
}
