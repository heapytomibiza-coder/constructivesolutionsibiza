import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * classify-custom-request
 *
 * Fire-and-forget edge function that classifies a custom job request
 * against the existing 3-tier taxonomy (category → subcategory → micro).
 *
 * Trigger: after job INSERT where is_custom_request = true
 * Output: stored in job_classification_suggestions (admin-reviewed)
 *
 * Guards:
 * - Only runs for is_custom_request = true jobs
 * - Never modifies job columns directly
 * - Suggestion is inert until admin accepts
 */

interface RequestBody {
  job_id: string;
}

interface TaxonomyEntry {
  category_name: string;
  subcategory_name: string;
  micro_name: string;
  micro_slug: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { job_id } = body;

    if (!job_id) {
      return new Response(JSON.stringify({ error: "Missing job_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch job data
    const { data: job, error: fetchErr } = await supabase
      .from("jobs")
      .select("id, title, description, answers, category, area, budget_min, budget_max, budget_type, is_custom_request")
      .eq("id", job_id)
      .single();

    if (fetchErr || !job) {
      console.error("classify-custom-request: job fetch failed", fetchErr);
      return new Response(JSON.stringify({ status: "skipped", reason: "job_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!job.is_custom_request) {
      return new Response(JSON.stringify({ status: "skipped", reason: "not_custom_request" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("classify-custom-request: LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ status: "skipped", reason: "no_api_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch compact taxonomy for classification context
    const { data: taxonomy, error: taxErr } = await supabase
      .from("service_search_index")
      .select("category_name, subcategory_name, micro_name, micro_slug");

    if (taxErr || !taxonomy || taxonomy.length === 0) {
      console.error("classify-custom-request: taxonomy fetch failed", taxErr);
      return new Response(JSON.stringify({ status: "skipped", reason: "taxonomy_unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build compact taxonomy string grouped by category → subcategory → micros
    const taxMap = new Map<string, Map<string, string[]>>();
    for (const t of taxonomy as TaxonomyEntry[]) {
      if (!t.category_name || !t.subcategory_name || !t.micro_name) continue;
      if (!taxMap.has(t.category_name)) taxMap.set(t.category_name, new Map());
      const subMap = taxMap.get(t.category_name)!;
      if (!subMap.has(t.subcategory_name)) subMap.set(t.subcategory_name, []);
      subMap.get(t.subcategory_name)!.push(`${t.micro_name} (${t.micro_slug})`);
    }

    const taxonomyText = Array.from(taxMap.entries())
      .map(([cat, subMap]) => {
        const subs = Array.from(subMap.entries())
          .map(([sub, micros]) => `  ${sub}: ${micros.join(", ")}`)
          .join("\n");
        return `${cat}:\n${subs}`;
      })
      .join("\n\n");

    // Extract custom request details
    const answers = job.answers as Record<string, unknown> | null;
    const custom = answers?.custom as Record<string, unknown> | undefined;

    const jobContext = [
      `Title: ${job.title}`,
      custom?.description ? `Description: ${custom.description}` : job.description ? `Description: ${job.description}` : "",
      custom?.specs ? `Specifications: ${custom.specs}` : "",
      custom?.jobTitle ? `User-provided title: ${custom.jobTitle}` : "",
      job.category ? `User-selected category: ${job.category}` : "",
      job.area ? `Area: ${job.area}` : "",
      job.budget_min && job.budget_max ? `Budget: €${job.budget_min}–€${job.budget_max}` : "",
    ].filter(Boolean).join("\n");

    const MODEL = "google/gemini-2.5-flash-lite";

    const prompt = `You are a taxonomy classifier for a construction and home services marketplace in Ibiza, Spain.

A client submitted a custom/freeform job request that did not fit neatly into the structured wizard. Your task is to classify this request into the platform's existing 3-tier taxonomy.

CUSTOM JOB REQUEST:
${jobContext}

AVAILABLE TAXONOMY (category → subcategory → micro-services with slugs):
${taxonomyText}

INSTRUCTIONS:
1. Analyze the job request and identify which existing taxonomy entries best match.
2. Select ONE category and ONE subcategory that best fits.
3. Select 1-3 micro-services that most closely match the work described.
4. If the request genuinely does not fit any existing taxonomy entry, set confidence below 0.3 and explain why.
5. Do NOT invent categories or micro-services. Only use slugs from the taxonomy above.

Respond using the classify_request function.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          tools: [
            {
              type: "function",
              function: {
                name: "classify_request",
                description: "Classify a custom job request into the existing taxonomy.",
                parameters: {
                  type: "object",
                  properties: {
                    suggested_category_slug: {
                      type: "string",
                      description: "The category name that best fits (use exact category name from taxonomy)",
                    },
                    suggested_subcategory_slug: {
                      type: "string",
                      description: "The subcategory name that best fits (use exact subcategory name from taxonomy)",
                    },
                    suggested_micro_slugs: {
                      type: "array",
                      items: { type: "string" },
                      description: "1-3 micro-service slugs that match (use exact slugs from taxonomy, e.g. 'build-shelving')",
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence score 0.0 to 1.0. Below 0.3 means poor fit.",
                    },
                    reasoning_summary: {
                      type: "string",
                      description: "Brief explanation of why this classification was chosen (max 200 chars).",
                    },
                  },
                  required: [
                    "suggested_category_slug",
                    "suggested_subcategory_slug",
                    "suggested_micro_slugs",
                    "confidence",
                    "reasoning_summary",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "classify_request" } },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("classify-custom-request: AI error", aiResponse.status, errText);
      return new Response(JSON.stringify({ status: "skipped", reason: "ai_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("classify-custom-request: no tool call in response");
      return new Response(JSON.stringify({ status: "skipped", reason: "no_tool_call" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let classification: Record<string, unknown>;
    try {
      classification = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("classify-custom-request: failed to parse tool call arguments");
      return new Response(JSON.stringify({ status: "skipped", reason: "parse_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store suggestion
    const { error: insertErr } = await supabase
      .from("job_classification_suggestions")
      .insert({
        job_id,
        model_name: MODEL,
        suggested_category_slug: classification.suggested_category_slug as string ?? null,
        suggested_subcategory_slug: classification.suggested_subcategory_slug as string ?? null,
        suggested_micro_slugs: (classification.suggested_micro_slugs as string[]) ?? [],
        confidence: classification.confidence as number ?? 0,
        reasoning_summary: typeof classification.reasoning_summary === "string"
          ? (classification.reasoning_summary as string).slice(0, 500)
          : null,
        raw_output: aiData,
      });

    if (insertErr) {
      console.error("classify-custom-request: insert failed", insertErr);
      return new Response(JSON.stringify({ status: "error", reason: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        status: "complete",
        confidence: classification.confidence,
        needs_human_review: (classification.confidence as number) < 0.7,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("classify-custom-request error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
