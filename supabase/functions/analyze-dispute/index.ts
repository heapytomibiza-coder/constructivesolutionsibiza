import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

const ALLOWED_PATHWAYS = ["corrective_work", "financial_adjustment", "shared_responsibility", "expert_review"];
const ALLOWED_ISSUE_TYPES = [
  "quality", "completion", "delay", "payment", "scope_change",
  "materials", "access_site_conditions", "communication_conduct",
  "damage", "abandonment", "pricing_variation",
];
const HIGH_RISK_ISSUES = ["damage", "abandonment", "communication_conduct"];
const MANUAL_REVIEW_THRESHOLD_EUR = 20_000;

const SYSTEM_PROMPT = `You are a neutral construction case structuring assistant for a marketplace platform in Ibiza, Spain.

Your role is to:
1. Extract facts from dispute descriptions
2. Identify disputed issues  
3. Highlight missing evidence
4. Recommend the most appropriate workflow pathway
5. Provide a confidence score

CRITICAL RULES:
- Do NOT assign legal blame
- Do NOT make emotional judgments  
- Do NOT guarantee outcomes
- Use neutral, construction-aware language
- Always say "suggested" or "recommended", never "decided" or "ruled"

ISSUE TYPES (use these exact values):
quality, completion, delay, payment, scope_change, materials, access_site_conditions, communication_conduct, damage, abandonment, pricing_variation

RESOLUTION PATHWAYS (use these exact values):
corrective_work, financial_adjustment, shared_responsibility, expert_review

Use "corrective_work" when work is incomplete or fixable.
Use "financial_adjustment" when partial value delivered but correction inefficient.
Use "shared_responsibility" when both sides contributed to the issue.
Use "expert_review" when technical quality unclear, high value, or conflicting evidence.`;

/** Validate and sanitize parsed AI output */
function validateAnalysis(raw: any): { valid: boolean; analysis: any; errors: string[] } {
  const errors: string[] = [];

  if (!raw || typeof raw !== "object") return { valid: false, analysis: null, errors: ["Not an object"] };

  // confidence_score
  const conf = typeof raw.confidence_score === "number" ? raw.confidence_score : NaN;
  if (isNaN(conf) || conf < 0 || conf > 1) errors.push("confidence_score out of range");
  raw.confidence_score = Math.max(0, Math.min(1, conf || 0.5));

  // suggested_pathway
  if (!ALLOWED_PATHWAYS.includes(raw.suggested_pathway)) {
    errors.push(`Invalid pathway: ${raw.suggested_pathway}`);
    raw.suggested_pathway = "expert_review";
  }

  // issue_types
  if (!Array.isArray(raw.issue_types)) raw.issue_types = [];
  raw.issue_types = raw.issue_types.filter((t: string) => ALLOWED_ISSUE_TYPES.includes(t)).slice(0, 20);

  // arrays capped
  for (const key of ["agreed_facts", "disputed_points", "missing_evidence"]) {
    if (!Array.isArray(raw[key])) raw[key] = [];
    raw[key] = raw[key].slice(0, 20);
  }

  // summary_neutral
  if (typeof raw.summary_neutral !== "string" || !raw.summary_neutral.trim()) {
    errors.push("Empty summary_neutral");
    raw.summary_neutral = "Analysis could not generate a summary.";
  }
  raw.summary_neutral = raw.summary_neutral.slice(0, 2000);

  // requires_human_review
  if (typeof raw.requires_human_review !== "boolean") raw.requires_human_review = true;

  return { valid: errors.length === 0, analysis: raw, errors };
}

/** Check if human review should be forced beyond confidence threshold */
function shouldForceHumanReview(analysis: any, job: any): boolean {
  // Always true during beta
  // Also check: high-risk issues, high-value project, low confidence
  if (analysis.confidence_score < 0.65) return true;

  const hasHighRisk = (analysis.issue_types || []).some((t: string) => HIGH_RISK_ISSUES.includes(t));
  if (hasHighRisk) return true;

  const budget = job?.budget_value || job?.budget_max || 0;
  if (budget > MANUAL_REVIEW_THRESHOLD_EUR) return true;

  return true; // beta: always human review
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { dispute_id } = await req.json();
    if (!dispute_id) {
      return new Response(JSON.stringify({ error: "dispute_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch dispute
    const { data: dispute, error: dErr } = await supabase
      .from("disputes")
      .select("*")
      .eq("id", dispute_id)
      .single();

    if (dErr || !dispute) {
      return new Response(JSON.stringify({ error: "Dispute not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify authorization
    if (dispute.raised_by !== user.id && dispute.counterparty_id !== user.id) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Not authorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Log analysis_requested
    await supabase.from("dispute_ai_events").insert({
      dispute_id,
      event_type: "analysis_requested",
      metadata: { triggered_by: user.id },
    });

    // Fetch related data
    const [inputsRes, evidenceRes, jobRes] = await Promise.all([
      supabase.from("dispute_inputs").select("*").eq("dispute_id", dispute_id),
      supabase.from("dispute_evidence").select("*").eq("dispute_id", dispute_id),
      supabase.from("jobs").select("title, category, subcategory, area, description, answers, budget_type, budget_value, budget_min, budget_max").eq("id", dispute.job_id).single(),
    ]);

    const inputs = inputsRes.data || [];
    const evidence = evidenceRes.data || [];
    const job = jobRes.data;

    // Build context
    const userStatements = inputs.map((i: any) => {
      const who = i.user_id === dispute.raised_by ? "Complainant" : "Respondent";
      if (i.input_type === "voice" && i.transcript) return `${who} (voice): ${i.transcript}`;
      if (i.input_type === "multiple_choice" && i.questionnaire_answers) return `${who} (questionnaire): ${JSON.stringify(i.questionnaire_answers)}`;
      return `${who}: ${i.raw_text || "No text provided"}`;
    });

    const evidenceSummary = evidence.map((e: any) => {
      const who = e.user_id === dispute.raised_by ? "Complainant" : "Respondent";
      return `${who} uploaded ${e.file_type}: ${e.description || e.file_name || "no description"}`;
    });

    const prompt = `Analyze this construction dispute case.

JOB CONTEXT:
- Title: ${job?.title || "Unknown"}
- Category: ${job?.category || "Unknown"} / ${job?.subcategory || "Unknown"}
- Location: ${job?.area || "Ibiza"}
- Budget: ${job?.budget_type || "not specified"} ${job?.budget_value ? `€${job.budget_value}` : job?.budget_min ? `€${job.budget_min}-€${job.budget_max}` : ""}
- Description: ${job?.description || "None"}

DISPUTE INFO:
- Raised by: ${dispute.raised_by_role}
- Issue types declared: ${(dispute.issue_types || []).join(", ") || "not yet classified"}
- Requested outcome: ${dispute.requested_outcome || "not specified"}

STATEMENTS:
${userStatements.length > 0 ? userStatements.join("\n\n") : "No statements submitted yet."}

EVIDENCE SUBMITTED:
${evidenceSummary.length > 0 ? evidenceSummary.join("\n") : "No evidence uploaded yet."}`;

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "dispute_analysis",
              description: "Provide structured analysis of a construction dispute case",
              parameters: {
                type: "object",
                properties: {
                  issue_types: {
                    type: "array",
                    items: { type: "string", enum: ALLOWED_ISSUE_TYPES },
                    description: "Identified issue types",
                  },
                  summary_neutral: {
                    type: "string",
                    description: "One neutral paragraph summarizing the case without blame",
                  },
                  agreed_facts: {
                    type: "array",
                    items: { type: "string" },
                    description: "Facts both parties would likely agree on",
                  },
                  disputed_points: {
                    type: "array",
                    items: { type: "string" },
                    description: "Points where accounts conflict",
                  },
                  missing_evidence: {
                    type: "array",
                    items: { type: "string" },
                    description: "Evidence that would help resolve this case",
                  },
                  suggested_pathway: {
                    type: "string",
                    enum: ALLOWED_PATHWAYS,
                    description: "Recommended resolution pathway",
                  },
                  confidence_score: {
                    type: "number",
                    description: "Confidence in analysis from 0.0 to 1.0",
                  },
                  requires_human_review: {
                    type: "boolean",
                    description: "Whether this case should be escalated to human review",
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why this pathway is suggested",
                  },
                },
                required: [
                  "issue_types", "summary_neutral", "agreed_facts",
                  "disputed_points", "missing_evidence", "suggested_pathway",
                  "confidence_score", "requires_human_review", "reasoning",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "dispute_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      await supabase.from("dispute_ai_events").insert({
        dispute_id,
        event_type: "analysis_failed",
        metadata: { error: `HTTP ${status}`, triggered_by: user.id },
      });

      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI service rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", status, await aiResponse.text());
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      await supabase.from("dispute_ai_events").insert({
        dispute_id,
        event_type: "analysis_failed",
        metadata: { error: "No tool call in response", triggered_by: user.id },
      });
      return new Response(JSON.stringify({ error: "AI returned invalid response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawAnalysis = JSON.parse(toolCall.function.arguments);
    const { analysis, errors } = validateAnalysis(rawAnalysis);

    // Force human review based on broader rules
    analysis.requires_human_review = shouldForceHumanReview(analysis, job);

    // Store analysis (is_current trigger auto-deactivates previous)
    const { data: savedAnalysis, error: saveErr } = await supabase
      .from("dispute_analysis")
      .insert({
        dispute_id,
        issue_types: analysis.issue_types,
        agreed_facts: analysis.agreed_facts,
        disputed_points: analysis.disputed_points,
        missing_evidence: analysis.missing_evidence,
        summary_neutral: analysis.summary_neutral,
        suggested_pathway: analysis.suggested_pathway,
        confidence_score: analysis.confidence_score,
        requires_human_review: analysis.requires_human_review,
        raw_ai_response: aiData,
        is_current: true,
      })
      .select()
      .single();

    if (saveErr) {
      console.error("Save error:", saveErr);
    }

    // Update dispute with AI results
    await supabase
      .from("disputes")
      .update({
        summary_neutral: analysis.summary_neutral,
        ai_confidence_score: analysis.confidence_score,
        recommended_pathway: analysis.suggested_pathway,
        human_review_required: analysis.requires_human_review,
        issue_types: analysis.issue_types,
      })
      .eq("id", dispute_id);

    // Log success
    await supabase.from("dispute_ai_events").insert({
      dispute_id,
      event_type: "analysis_completed",
      metadata: {
        analysis_id: savedAnalysis?.id,
        confidence: analysis.confidence_score,
        pathway: analysis.suggested_pathway,
        human_review: analysis.requires_human_review,
        validation_errors: errors,
        triggered_by: user.id,
      },
    });

    return new Response(
      JSON.stringify({ analysis: { ...analysis, id: savedAnalysis?.id } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-dispute error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
