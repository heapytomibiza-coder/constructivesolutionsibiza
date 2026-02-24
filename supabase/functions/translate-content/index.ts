import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_LANGS = ["en", "es"] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

interface TranslateRequest {
  entity: "jobs" | "service_listings";
  id: string;
  fields: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TranslateRequest = await req.json();
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

    // Build update payload
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
