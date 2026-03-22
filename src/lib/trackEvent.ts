import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getLeanAttribution } from "@/lib/attribution";

/**
 * Approved event taxonomy — use ONLY these event names.
 *
 * Job lifecycle:
 *   job_created, job_posted, job_updated, job_viewed,
 *   job_sent_to_workers, job_viewed_by_worker,
 *   job_response_received, job_shortlisted, job_awarded,
 *   job_started, job_completed, job_disputed
 *
 * Wizard:
 *   job_wizard_started, wizard_step_completed,
 *   wizard_abandoned, wizard_completed
 *
 * Worker:
 *   worker_notified, worker_viewed_job, worker_responded,
 *   worker_ignored_job, worker_hired, worker_completed_job
 *
 * Conversations:
 *   conversation_started, message_sent
 *
 * Quotes:
 *   quote_submitted, quote_revised, quote_viewed
 *
 * Trust:
 *   review_submitted, worker_flagged, worker_restricted, client_flagged
 *
 * Payments (future):
 *   payment_intent_created, payment_succeeded, payment_failed,
 *   deposit_paid, refund_issued
 *
 * Listings:
 *   listing_published, listing_paused
 *
 * Admin:
 *   admin_viewed_insight_panel, admin_archived_job,
 *   admin_suspended_user
 *
 * Onboarding:
 *   pro_onboarding_started, pro_onboarding_step_completed,
 *   pro_onboarding_step_entered, pro_profile_published,
 *   onboarding_step_failed
 */

/** Optional structured fields merged into metadata for richer analytics. */
export interface TrackEventFields {
  job_id?: string;
  worker_id?: string;
  client_id?: string;
  category?: string;
  subcategory?: string;
  service?: string;
  job_score?: number;
  worker_score?: number;
}

/**
 * Track a user behaviour event for analytics.
 * Fire-and-forget — errors are logged but not thrown.
 * Auto-injects attribution (session_id, ref, utm_source, utm_campaign).
 *
 * @param eventName  Approved event name from taxonomy above
 * @param role       Actor role
 * @param metadata   Arbitrary extra data (merged after typed fields)
 * @param fields     Optional typed fields for structured analytics
 */
export async function trackEvent(
  eventName: string,
  role: "client" | "professional" | "admin" = "client",
  metadata: Record<string, unknown> = {},
  fields?: TrackEventFields
) {
  try {
    const attribution = getLeanAttribution();
    const enriched = { ...attribution, ...fields, ...metadata };

    await supabase.rpc("track_event", {
      p_event_name: eventName,
      p_role: role,
      p_metadata: enriched as unknown as Json,
    });
  } catch (err) {
    console.warn("[trackEvent] failed:", err);
  }
}
