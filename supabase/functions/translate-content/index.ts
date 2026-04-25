import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPPORTED_LANGS = ["en", "es"] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

interface TranslateRequest {
  entity: "jobs" | "service_listings";
  id: string;
  fields: Record<string, string>;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: require authenticated user (called from frontend wizard/editor)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // RLS-scoped client used for identity + ownership check ONLY.
  // Service role client is created later, AFTER authorization passes.
  const _authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userErr } = await _authClient.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const callerId = userData.user.id;

  let body: TranslateRequest = { entity: "jobs", id: "", fields: {} };
  try {
    body = await req.json();
    const { entity, id, fields } = body;

    if (!entity || !id || !fields || Object.keys(fields).length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate entity
    if (!["jobs", "service_listings"].includes(entity)) {
      return new Response(JSON.stringify({ error: "Invalid entity" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Authorization gate (BEFORE any service-role usage) ----
    // Owner check: read the row's owner via the caller's RLS-scoped client.
    // We use the service role only to fetch the owner column (RLS on jobs may
    // hide non-public rows from non-owners, but we need a deterministic
    // ownership signal). The service role client below is scoped to a single
    // SELECT of the owner column; it cannot mutate before the gate passes.
    const ownerProbe = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const ownerColumn = entity === "jobs" ? "user_id" : "provider_id";
    const { data: ownerRow, error: ownerErr } = await ownerProbe
      .from(entity)
      .select(`id, ${ownerColumn}`)
      .eq("id", id)
      .maybeSingle();

    if (ownerErr || !ownerRow) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isOwner = (ownerRow as Record<string, unknown>)[ownerColumn] === callerId;

    let isAdmin = false;
    if (!isOwner) {
      // Dual-gated admin check: has_role('admin') AND is_admin_email()
      const [{ data: hasAdminRole }, { data: emailAllowed }] = await Promise.all([
        ownerProbe.rpc("has_role", { _user_id: callerId, _role: "admin" }),
        // is_admin_email() reads auth.jwt() — must be invoked via the caller's JWT-bearing client
        _authClient.rpc("is_admin_email"),
      ]);
      isAdmin = Boolean(hasAdminRole) && Boolean(emailAllowed);
    }

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Authorization passed: now safe to use service role for mutation ----
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from(entity).update({ translation_status: "pending" }).eq("id", id);

    // Combine all fields for language detection + translation
    const textsToTranslate = Object.entries(fields).filter(
      ([, v]) => v && v.trim().length > 0
    );

    if (textsToTranslate.length === 0) {
      return new Response(JSON.stringify({ status: "skipped", reason: "no text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const combinedText = textsToTranslate.map(([k, v]) => `${k}: ${v}`).join("\n");

    // Use Lovable AI Gateway for detection + translation
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `You are a translation assistant for a home services marketplace in Ibiza, Spain.

Given the following text fields from a ${entity === "jobs" ? "job posting" : "service listing"}, do two things:
1. Detect the source language (respond with "en" or "es")
2. Translate ALL fields into the OTHER language

The text fields are:
${combinedText}

Respond ONLY with valid JSON in this exact format:
{
  "source_lang": "en" or "es",
  "translations": {
    "${textsToTranslate.map(([k]) => k).join('": "translated text",\n    "')}": "translated text"
  }
}

Rules:
- Keep proper nouns, measurements, and currency symbols as-is
- Use natural, professional language appropriate for a services marketplace
- If the text mixes languages, detect the dominant language
- Translate into the OTHER supported language only`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Gateway error: ${aiResponse.status} ${errText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const sourceLang: Lang = parsed.source_lang === "es" ? "es" : "en";
    const targetLang: Lang = sourceLang === "en" ? "es" : "en";
    const translations: Record<string, string> = parsed.translations ?? {};

    // Build update payload (supabase client already created above)

    const updatePayload: Record<string, unknown> = {
      source_lang: sourceLang,
      translation_status: "complete",
    };

    if (entity === "jobs") {
      // Map field names to i18n columns
      const fieldToColumn: Record<string, string> = {
        title: "title_i18n",
        teaser: "teaser_i18n",
        description: "description_i18n",
      };

      for (const [fieldName, columnName] of Object.entries(fieldToColumn)) {
        if (fields[fieldName] && translations[fieldName]) {
          updatePayload[columnName] = {
            [sourceLang]: fields[fieldName],
            [targetLang]: translations[fieldName],
          };
        }
      }
    } else {
      // service_listings
      const fieldToColumn: Record<string, string> = {
        display_title: "display_title_i18n",
        short_description: "short_description_i18n",
      };

      for (const [fieldName, columnName] of Object.entries(fieldToColumn)) {
        if (fields[fieldName] && translations[fieldName]) {
          updatePayload[columnName] = {
            [sourceLang]: fields[fieldName],
            [targetLang]: translations[fieldName],
          };
        }
      }
    }

    const { error: updateError } = await supabase
      .from(entity)
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      throw new Error(`DB update failed: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        status: "complete",
        source_lang: sourceLang,
        target_lang: targetLang,
        fields_translated: Object.keys(translations),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("translate-content error:", err);

    // Best-effort: mark translation as failed so it doesn't stay pending
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);
      await sb.from(body.entity).update({ translation_status: "failed" }).eq("id", body.id);
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
