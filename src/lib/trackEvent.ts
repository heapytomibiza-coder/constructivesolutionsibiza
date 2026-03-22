import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getLeanAttribution } from "@/lib/attribution";
import type { EventName } from "@/lib/eventTaxonomy";

/** Re-export for convenience */
export type { EventName } from "@/lib/eventTaxonomy";

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
 * Merge order: attribution < freeform metadata < typed fields.
 * Typed fields are authoritative and cannot be overwritten by metadata.
 *
 * @param eventName  Approved event name from EventName type
 * @param role       Actor role
 * @param metadata   Arbitrary extra data (merged before typed fields)
 * @param fields     Optional typed fields — these win over metadata
 */
export async function trackEvent(
  eventName: EventName,
  role: "client" | "professional" | "admin" = "client",
  metadata: Record<string, unknown> = {},
  fields?: TrackEventFields
) {
  try {
    const attribution = getLeanAttribution();
    // Fields win: attribution < metadata < fields
    const enriched = { ...attribution, ...metadata, ...fields };

    await supabase.rpc("track_event", {
      p_event_name: eventName,
      p_role: role,
      p_metadata: enriched as unknown as Json,
    });
  } catch (err) {
    console.warn("[trackEvent] failed:", err);
  }
}
