import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getLeanAttribution } from "@/lib/attribution";

/**
 * Track a user behaviour event for analytics.
 * Fire-and-forget — errors are logged but not thrown.
 * Auto-injects attribution (session_id, ref, utm_source, utm_campaign).
 */
export async function trackEvent(
  eventName: string,
  role: "client" | "professional" | "admin" = "client",
  metadata: Record<string, unknown> = {}
) {
  try {
    const attribution = getLeanAttribution();
    const enriched = { ...attribution, ...metadata };

    await supabase.rpc("track_event", {
      p_event_name: eventName,
      p_role: role,
      p_metadata: enriched as unknown as Json,
    });
  } catch (err) {
    console.warn("[trackEvent] failed:", err);
  }
}
