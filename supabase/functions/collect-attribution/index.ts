import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const sessionId = body.session_id;

    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Sanitize inputs
    const sanitize = (v: unknown, maxLen = 500): string | null => {
      if (typeof v !== "string") return null;
      return v.slice(0, maxLen) || null;
    };

    const row = {
      session_id: sessionId,
      landing_url: sanitize(body.landing_url, 2000),
      referrer: sanitize(body.referrer, 2000),
      utm_source: sanitize(body.utm_source, 200),
      utm_medium: sanitize(body.utm_medium, 200),
      utm_campaign: sanitize(body.utm_campaign, 200),
      utm_term: sanitize(body.utm_term, 200),
      utm_content: sanitize(body.utm_content, 200),
      ref: sanitize(body.ref, 200),
      gclid: sanitize(body.gclid, 200),
      fbclid: sanitize(body.fbclid, 200),
      raw_params: typeof body.raw_params === "object" ? body.raw_params : {},
      last_seen_at: new Date().toISOString(),
    };

    // Upsert: first-touch fields preserved on conflict, last-touch updated
    const { error } = await supabase.from("attribution_sessions").upsert(
      row,
      { onConflict: "session_id", ignoreDuplicates: false },
    );

    if (error) {
      console.error("[collect-attribution] upsert error:", error);
      return new Response(JSON.stringify({ error: "Failed to store" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[collect-attribution] error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
