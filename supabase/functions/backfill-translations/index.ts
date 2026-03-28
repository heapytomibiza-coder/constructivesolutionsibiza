import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending service listings (batch of 20 at a time)
    const { data: listings, error: fetchErr } = await supabase
      .from("service_listings")
      .select("id, display_title, short_description")
      .or("translation_status.eq.pending,source_lang.is.null,display_title_i18n.eq.{}")
      .limit(5);

    if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`);
    if (!listings || listings.length === 0) {
      return new Response(
        JSON.stringify({ status: "done", message: "No pending listings" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; status: string; error?: string }[] = [];

    for (const listing of listings) {
      try {
        const fields: Record<string, string> = {};
        if (listing.display_title?.trim()) fields.display_title = listing.display_title;
        if (listing.short_description?.trim()) fields.short_description = listing.short_description;

        if (Object.keys(fields).length === 0) {
          // No text to translate, mark as skipped
          await supabase
            .from("service_listings")
            .update({ translation_status: "skipped", source_lang: "en" })
            .eq("id", listing.id);
          results.push({ id: listing.id, status: "skipped" });
          continue;
        }

        // Call AI for translation
        const combinedText = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("\n");

        const prompt = `You are a translation assistant for a home services marketplace in Ibiza, Spain.
Given the following text fields from a service listing, do two things:
1. Detect the source language (respond with "en" or "es")
2. Translate ALL fields into the OTHER language

The text fields are:
${combinedText}

Respond ONLY with valid JSON:
{
  "source_lang": "en" or "es",
  "translations": {
    ${Object.keys(fields).map(k => `"${k}": "translated text"`).join(",\n    ")}
  }
}

Rules:
- Keep proper nouns, measurements, and currency symbols as-is
- Use natural, professional language appropriate for a services marketplace`;

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
          throw new Error(`AI error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content ?? "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Failed to parse AI response");

        const parsed = JSON.parse(jsonMatch[0]);
        const sourceLang = parsed.source_lang === "es" ? "es" : "en";
        const targetLang = sourceLang === "en" ? "es" : "en";
        const translations: Record<string, string> = parsed.translations ?? {};

        const updatePayload: Record<string, unknown> = {
          source_lang: sourceLang,
          translation_status: "complete",
        };

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

        const { error: updateErr } = await supabase
          .from("service_listings")
          .update(updatePayload)
          .eq("id", listing.id);

        if (updateErr) throw new Error(`DB update: ${updateErr.message}`);
        results.push({ id: listing.id, status: "complete" });
      } catch (err) {
        // Mark as failed so we don't retry forever
        await supabase
          .from("service_listings")
          .update({ translation_status: "failed" })
          .eq("id", listing.id);
        results.push({ id: listing.id, status: "failed", error: (err as Error).message });
      }
    }

    const remaining = (listings.length === 5) ? "more remaining — call again" : "batch complete";

    return new Response(
      JSON.stringify({ status: "ok", processed: results.length, remaining, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("backfill error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
