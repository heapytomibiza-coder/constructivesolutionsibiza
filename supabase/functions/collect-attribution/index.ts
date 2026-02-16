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

    const firstTouchRow = {
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
    };

    // Step 1: INSERT first-touch (ignore if session already exists)
    await supabase
      .from("attribution_sessions")
      .insert(firstTouchRow)
      .select("id") // needed to not throw on conflict
      .maybeSingle();
    // Ignore conflict error — first-touch preserved

    // Step 2: UPDATE last-touch fields always
    const lastTouchFields: Record<string, unknown> = {
      last_seen_at: new Date().toISOString(),
    };
    // Only update campaign fields if new params are present (not a bare revisit)
    if (body.utm_source || body.utm_medium || body.utm_campaign || body.ref || body.gclid || body.fbclid) {
      lastTouchFields.utm_source = sanitize(body.utm_source, 200);
      lastTouchFields.utm_medium = sanitize(body.utm_medium, 200);
      lastTouchFields.utm_campaign = sanitize(body.utm_campaign, 200);
      lastTouchFields.utm_term = sanitize(body.utm_term, 200);
      lastTouchFields.utm_content = sanitize(body.utm_content, 200);
      lastTouchFields.ref = sanitize(body.ref, 200);
      lastTouchFields.gclid = sanitize(body.gclid, 200);
      lastTouchFields.fbclid = sanitize(body.fbclid, 200);
      lastTouchFields.raw_params = typeof body.raw_params === "object" ? body.raw_params : {};
    }

    const { error: updateErr } = await supabase
      .from("attribution_sessions")
      .update(lastTouchFields)
      .eq("session_id", sessionId);

    if (updateErr) {
      console.error("[collect-attribution] update error:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to store" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Bind user_id if JWT present
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        anonKey,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: claims } = await authClient.auth.getClaims(
        authHeader.replace("Bearer ", ""),
      );
      if (claims?.claims?.sub) {
        const userId = claims.claims.sub as string;
        // Bind session to user
        await supabase
          .from("attribution_sessions")
          .update({ user_id: userId })
          .eq("session_id", sessionId)
          .is("user_id", null); // only if not already bound

        // Update profile attribution
        const leanAttr = {
          session_id: sessionId,
          ref: sanitize(body.ref, 200),
          utm_source: sanitize(body.utm_source, 200),
          utm_medium: sanitize(body.utm_medium, 200),
          utm_campaign: sanitize(body.utm_campaign, 200),
        };

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_touch_attribution")
          .eq("user_id", userId)
          .single();

        const updates: Record<string, unknown> = {
          last_touch_attribution: leanAttr,
        };
        if (!profile?.first_touch_attribution) {
          updates.first_touch_attribution = leanAttr;
        }

        await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", userId);
      }
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
