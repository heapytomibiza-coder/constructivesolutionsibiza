import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPPORTED_LANGS = ["en", "es"] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

interface TranslateRequest {
  entity: "jobs" | "service_listings";
  id: string;
  fields: Record<string, string>;
}

function forbiddenResponse(corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: require authenticated user (called from frontend wizard/editor)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return forbiddenResponse(corsHeaders);
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
    return forbiddenResponse(corsHeaders);
  }
  const callerId = userData.user.id;

  let body: TranslateRequest = { entity: "jobs", id: "", fields: {} };
  let authorizationPassed = false;
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

    // ---- Authorization gate (BEFORE any service-role mutation) ----
    //
    // Security reasoning:
    //   * The caller's JWT has already been validated above (callerId is trusted).
    //   * Owner checks use the caller's JWT-scoped client so RLS enforces normal
    //     ownership visibility. The service-role key is not touched until this
    //     gate passes, so unauthorized callers cannot trigger privileged reads
    //     or writes.
    //   * To prevent existence probing, ALL authorization failures
    //     (row missing, row owned by someone else, non-admin caller) collapse
    //     into a single uniform 403 response. Unauthorized callers cannot
    //     distinguish "not found" from "not yours".
    //   * Admin path is dual-gated: has_role('admin') AND is_admin_email().
    const ownerColumn = entity === "jobs" ? "user_id" : "provider_id";

    // Compute admin eligibility and owner visibility in parallel.
    const [
      ownerResult,
      adminRoleResult,
      adminEmailResult,
    ] = await Promise.all([
      _authClient.from(entity).select(`id, ${ownerColumn}`).eq("id", id).maybeSingle(),
      _authClient.rpc("has_role", { _user_id: callerId, _role: "admin" }),
      _authClient.rpc("is_admin_email"), // reads auth.jwt() — must use JWT-bearing client
    ]);

    const isAdmin =
      Boolean(adminRoleResult.data) && Boolean(adminEmailResult.data);

    const ownerRow = ownerResult.data as Record<string, unknown> | null;
    const isOwner =
      !!ownerRow && ownerRow[ownerColumn] === callerId;

    if (!isOwner && !isAdmin) {
      // Uniform 403 — covers: row missing, row not owned by caller,
      // probe error, or insufficient admin gating. No existence leak.
      return forbiddenResponse(corsHeaders);
    }

    authorizationPassed = true;

    // ---- Authorization passed: now safe to use service role for mutation ----
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Admins may not see the target row through RLS. After dual-gated admin
    // authorization passes, this privileged existence check is safe. Missing
    // rows still return the same 403 as not-owned rows to avoid probing.
    if (isAdmin && !ownerRow) {
      const { data: adminVisibleRow } = await supabase
        .from(entity)
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (!adminVisibleRow) {
        return forbiddenResponse(corsHeaders);
      }
    }

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

    // Best-effort: mark translation as failed only after authorization has
    // passed. This prevents pre-auth service-role mutation on malformed or
    // unauthorized requests.
    if (authorizationPassed && ["jobs", "service_listings"].includes(body.entity) && body.id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, supabaseKey);
        await sb.from(body.entity).update({ translation_status: "failed" }).eq("id", body.id);
      } catch (_) { /* ignore */ }
    }

    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
