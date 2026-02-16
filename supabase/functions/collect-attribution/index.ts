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

    // Step 1: INSERT first-touch (ignore if session already exists via unique constraint)
    const { error: insertErr } = await supabase
      .from("attribution_sessions")
      .insert(firstTouchRow);

    // Ignore unique violation (23505) — first-touch preserved
    if (insertErr && insertErr.code !== "23505") {
      console.error("[collect-attribution] insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to store" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Step 3: Bind user_id if JWT present — use getUser() (canonical in edge functions)
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        anonKey,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user }, error: userErr } = await authClient.auth.getUser();

      if (!userErr && user?.id) {
        const userId = user.id;
        // Bind session to user (only if not already bound)
        await supabase
          .from("attribution_sessions")
          .update({ user_id: userId })
          .eq("session_id", sessionId)
          .is("user_id", null);

        // Build lean attribution for profile
        const leanAttr = {
          session_id: sessionId,
          ref: sanitize(body.ref, 200),
          utm_source: sanitize(body.utm_source, 200),
          utm_medium: sanitize(body.utm_medium, 200),
          utm_campaign: sanitize(body.utm_campaign, 200),
        };

        // Update profile attribution via auth client (RLS-safe)
        const { data: profile } = await authClient
          .from("profiles")
          .select("first_touch_attribution")
          .eq("user_id", userId)
          .single();

        const profileUpdates: Record<string, unknown> = {
          last_touch_attribution: leanAttr,
        };
        if (!profile?.first_touch_attribution) {
          profileUpdates.first_touch_attribution = leanAttr;
        }

        await authClient
          .from("profiles")
          .update(profileUpdates)
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
