import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * generate-job-content
 *
 * Fire-and-forget edge function that generates polished title, teaser,
 * and worker brief for a job using AI, then writes results to the jobs table.
 *
 * Triggered after job INSERT from CanonicalJobWizard.
 * Must complete BEFORE translate-content runs so translations use the polished text.
 *
 * Guards:
 * - Skips if edit_version > 0 (user has manually edited)
 * - Skips if is_custom_request = true (custom jobs keep user-provided titles)
 * - Falls back silently on any error (mechanical title from buildJobPayload remains)
 */

interface RequestBody {
  job_id: string;
  /** Original payload fields for translation fallback */
  fallback_fields?: {
    title?: string;
    teaser?: string;
    description?: string;
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { job_id, fallback_fields } = body;

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
      .select("id, title, teaser, answers, category, subcategory, micro_slug, area, edit_version, is_custom_request, budget_min, budget_max, budget_type, flags, computed_safety, has_photos, description")
      .eq("id", job_id)
      .single();

    if (fetchErr || !job) {
      console.error("generate-job-content: job fetch failed", fetchErr);
      return new Response(JSON.stringify({ status: "skipped", reason: "job not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Guard: skip if user has edited or custom request
    if (job.edit_version > 0) {
      return new Response(JSON.stringify({ status: "skipped", reason: "user_edited" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (job.is_custom_request) {
      // Still generate worker_brief for custom requests
      const brief = await generateWorkerBrief(job);
      if (brief) {
        await supabase.from("jobs").update({ worker_brief: brief }).eq("id", job_id);
      }
      // Trigger translation for custom request (uses original title/teaser)
      await triggerTranslation(supabaseUrl, job_id, authHeader, {
        title: job.title as string,
        teaser: (job.teaser as string) ?? "",
        description: (job.description as string) ?? "",
      });
      return new Response(JSON.stringify({ status: "partial", reason: "custom_request_brief_only" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const answers = job.answers as Record<string, unknown> | null;
    if (!answers) {
      return new Response(JSON.stringify({ status: "skipped", reason: "no_answers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate title, teaser, and worker brief via AI
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("generate-job-content: LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ status: "skipped", reason: "no_api_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selected = (answers as Record<string, unknown>).selected as Record<string, unknown> | undefined;
    const microNames = (selected?.microNames as string[]) ?? [];
    const logistics = (answers as Record<string, unknown>).logistics as Record<string, unknown> | undefined;
    const extras = (answers as Record<string, unknown>).extras as Record<string, unknown> | undefined;

    const contextParts = [
      `Category: ${job.category ?? "unknown"}`,
      `Subcategory: ${job.subcategory ?? "unknown"}`,
      `Services: ${microNames.join(", ") || job.micro_slug || "unspecified"}`,
      `Area: ${job.area ?? "Ibiza"}`,
      job.budget_type === "tbd" ? "Budget: To be determined" :
        job.budget_min && job.budget_max ? `Budget: €${job.budget_min}–€${job.budget_max}` :
        "Budget: Not specified",
      logistics?.startDatePreset ? `Timing: ${logistics.startDatePreset}` : "",
      extras?.notes ? `Client notes: ${extras.notes}` : "",
      job.has_photos ? "Photos: Yes" : "",
      job.flags && (job.flags as string[]).length > 0 ? `Flags: ${(job.flags as string[]).join(", ")}` : "",
    ].filter(Boolean).join("\n");

    // Summarize micro answers for richer context
    const microAnswers = (answers as Record<string, unknown>).microAnswers as Record<string, Record<string, unknown>> | undefined;
    let microContext = "";
    if (microAnswers) {
      const parts: string[] = [];
      for (const [slug, qa] of Object.entries(microAnswers)) {
        const entries = Object.entries(qa)
          .filter(([, v]) => v != null && v !== "" && v !== false)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
          .join("; ");
        if (entries) parts.push(`[${slug}] ${entries}`);
      }
      if (parts.length > 0) microContext = `\nScope details:\n${parts.join("\n")}`;
    }

    const prompt = `You are a content writer for a construction and home services marketplace in Ibiza, Spain.

Given the following structured job data, generate THREE things:

1. **title** — A clear, professional job title (max 80 chars). Should describe WHAT needs doing and WHERE. No quotes, no hype. Examples: "Kitchen Renovation in Santa Eulalia", "Pool Tiling Repair – San José", "Full Bathroom Refit, Ibiza Town".

2. **teaser** — A one-sentence summary (max 160 chars) that gives professionals the key info at a glance. Include scope, location, and any notable requirements.

3. **worker_brief** — A 2-3 sentence summary (max 300 chars) written FOR professionals. Focus on: what skills are needed, any access/logistics issues, budget context, and timeline. Use direct language.

Job data:
${contextParts}
${microContext}

Current mechanical title: "${job.title}"
Current mechanical teaser: "${job.teaser ?? ""}"

Respond ONLY with valid JSON:
{
  "title": "...",
  "teaser": "...",
  "worker_brief": "..."
}

Rules:
- Keep location names, measurements, and currency as-is
- Use professional, marketplace-appropriate language
- Do not invent details not present in the data
- If data is sparse, keep outputs simple and factual
- Write in English (translation happens separately)`;

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
          temperature: 0.2,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("generate-job-content: AI error", aiResponse.status, errText);
      return new Response(JSON.stringify({ status: "skipped", reason: "ai_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("generate-job-content: failed to parse AI response");
      return new Response(JSON.stringify({ status: "skipped", reason: "parse_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const newTitle = typeof parsed.title === "string" ? parsed.title.slice(0, 200) : null;
    const newTeaser = typeof parsed.teaser === "string" ? parsed.teaser.slice(0, 300) : null;
    const workerBrief = typeof parsed.worker_brief === "string" ? parsed.worker_brief.slice(0, 500) : null;

    if (!newTitle && !newTeaser && !workerBrief) {
      return new Response(JSON.stringify({ status: "skipped", reason: "empty_output" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      ai_generated_title: true,
    };
    if (newTitle) updatePayload.title = newTitle;
    if (newTeaser) updatePayload.teaser = newTeaser;
    if (workerBrief) updatePayload.worker_brief = workerBrief;

    const { error: updateErr } = await supabase
      .from("jobs")
      .update(updatePayload)
      .eq("id", job_id)
      .eq("edit_version", 0); // Extra safety: only update if still unedited

    if (updateErr) {
      console.error("generate-job-content: update failed", updateErr);
      return new Response(JSON.stringify({ status: "error", reason: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trigger translation with the updated (AI-polished) content
    const translationFields = {
      title: newTitle ?? (job.title as string),
      teaser: newTeaser ?? (job.teaser as string) ?? "",
      description: (job.description as string) ?? "",
    };
    await triggerTranslation(supabaseUrl, job_id, authHeader, translationFields);

    return new Response(
      JSON.stringify({
        status: "complete",
        title_generated: !!newTitle,
        teaser_generated: !!newTeaser,
        brief_generated: !!workerBrief,
        translation_triggered: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-job-content error:", err);
    // Best-effort: still try translation with fallback fields on AI failure
    try {
      const body: RequestBody = { job_id: "" };
      if (fallback_fields) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        await triggerTranslation(supabaseUrl, body.job_id, authHeader ?? "", fallback_fields);
      }
    } catch { /* ignore */ }
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Generate only worker_brief for custom requests (no title/teaser override).
 */
async function generateWorkerBrief(job: Record<string, unknown>): Promise<string | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;

  const answers = job.answers as Record<string, unknown> | null;
  const custom = answers?.custom as Record<string, unknown> | undefined;

  const prompt = `You are writing a brief summary for construction professionals about a custom job request in Ibiza, Spain.

Job title: ${job.title ?? "Custom request"}
Description: ${custom?.description ?? job.description ?? "Not provided"}
Category: ${job.category ?? "Unspecified"}
Area: ${job.area ?? "Ibiza"}
Budget: ${job.budget_type === "tbd" ? "To be determined" : job.budget_min && job.budget_max ? `€${job.budget_min}–€${job.budget_max}` : "Not specified"}

Write a 2-3 sentence summary (max 300 chars) FOR professionals. Focus on skills needed, scope, and timeline. Be direct and factual.

Respond with ONLY the brief text, no JSON, no quotes.`;

  try {
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
          temperature: 0.2,
        }),
      }
    );

    if (!aiResponse.ok) return null;
    const data = await aiResponse.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    return text ? text.slice(0, 500) : null;
  } catch {
    return null;
  }
}
