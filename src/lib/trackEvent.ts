import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/**
 * Track a user behaviour event for analytics.
 * Fire-and-forget — errors are logged but not thrown.
 */
export async function trackEvent(
  eventName: string,
  role: "client" | "professional" | "admin" = "client",
  metadata: Record<string, unknown> = {}
) {
  try {
    await supabase.rpc("track_event", {
      p_event_name: eventName,
      p_role: role,
      p_metadata: metadata as unknown as Json,
    });
  } catch (err) {
    console.warn("[trackEvent] failed:", err);
  }
}
