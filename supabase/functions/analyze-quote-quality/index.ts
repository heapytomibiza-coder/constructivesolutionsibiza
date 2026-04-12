/**
 * analyze-quote-quality — Agent 4: Quote Quality Coach
 *
 * Advisory-only edge function that reviews a professional's quote draft
 * against job context and returns structured improvement suggestions.
 *
 * - Never blocks submission
 * - Never stores results
 * - Never modifies quote data
 * - Falls back safely on any failure
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

const SAFE_FALLBACK = {
  quality_score: 0.5,
  issues: [],
  missing_elements: [],
  suggestions: [],
  strengths: [],
  should_warn: false,
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { job_id, quote_text, line_items, exclusions, notes } = await req.json();

    if (!job_id || !quote_text || typeof quote_text !== "string") {
      return new Response(JSON.stringify({ error: "job_id and quote_text required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Cap input to prevent token blowup
    const cappedQuoteText = quote_text.slice(0, 2000);
    const cappedExclusions = exclusions?.slice?.(0, 500) ?? "";
    const cappedNotes = notes?.slice?.(0, 1000) ?? "";

    // Fetch job context
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("title, teaser, worker_brief, answers, flags, computed_safety, computed_inspection_bias, budget_min, budget_max, budget_type")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      console.error("Job fetch failed:", jobErr?.message);
      return new Response(JSON.stringify(SAFE_FALLBACK), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Build line items summary for prompt
    const lineItemsSummary = Array.isArray(line_items)
      ? line_items
          .filter((li: any) => li.description?.trim())
          .map((li: any) => `- ${li.description} (×${li.quantity} @ €${li.unit_price})`)
          .join("\n")
      : "";

    const budgetStr = job.budget_min && job.budget_max
      ? `€${job.budget_min}–€${job.budget_max}`
      : job.budget_min
        ? `From €${job.budget_min}`
        : "Not specified";

    const systemPrompt = `You are reviewing a quote written by a professional for a construction/services job.

Your role is to improve clarity and completeness, not to rewrite or judge style.

JOB CONTEXT:
- Title: ${job.title || "Untitled"}
- Teaser: ${job.teaser || "None"}
- Worker brief: ${job.worker_brief || "None"}
- Budget: ${budgetStr} (${job.budget_type || "unknown"})
- Flags: ${(job.flags || []).join(", ") || "None"}
- Safety: ${job.computed_safety || "Not assessed"}
- Inspection bias: ${job.computed_inspection_bias || "Not assessed"}

QUOTE TEXT:
"${cappedQuoteText}"

LINE ITEMS:
${lineItemsSummary || "None provided"}

EXCLUSIONS:
"${cappedExclusions || "None"}"

ADDITIONAL NOTES:
"${cappedNotes || "None"}"

Instructions:
- Identify unclear or missing elements (pricing, scope, timeline, materials, access)
- Do NOT invent details
- Do NOT rewrite the quote
- Keep suggestions short and practical
- Respect that professionals may choose different styles
- Consider the job context when evaluating completeness`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify(SAFE_FALLBACK), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze this quote and return structured feedback." },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "quote_quality_feedback",
              description: "Return structured quality feedback for a professional quote.",
              parameters: {
                type: "object",
                properties: {
                  quality_score: {
                    type: "number",
                    description: "Overall quality score from 0 to 1",
                  },
                  issues: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of issues found (max 5)",
                  },
                  missing_elements: {
                    type: "array",
                    items: { type: "string" },
                    description: "Elements that are missing from the quote (max 5)",
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Practical improvement suggestions (max 5)",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "What the quote does well (max 5)",
                  },
                  should_warn: {
                    type: "boolean",
                    description: "Whether the quote has significant issues worth warning about",
                  },
                },
                required: ["quality_score", "issues", "missing_elements", "suggestions", "strengths", "should_warn"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "quote_quality_feedback" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("AI gateway error:", status, await aiResponse.text());
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify(SAFE_FALLBACK), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(SAFE_FALLBACK), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response");
      return new Response(JSON.stringify(SAFE_FALLBACK), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let result: any;
    try {
      result = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse tool call arguments");
      return new Response(JSON.stringify(SAFE_FALLBACK), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Clamp and cap output for safety
    const sanitized = {
      quality_score: Math.max(0, Math.min(1, Number(result.quality_score) || 0.5)),
      issues: (result.issues || []).slice(0, 5),
      missing_elements: (result.missing_elements || []).slice(0, 5),
      suggestions: (result.suggestions || []).slice(0, 5),
      strengths: (result.strengths || []).slice(0, 5),
      should_warn: Boolean(result.should_warn),
    };

    return new Response(JSON.stringify(sanitized), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-quote-quality error:", err);
    return new Response(JSON.stringify(SAFE_FALLBACK), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
