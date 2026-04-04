import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  // Auth: require authenticated user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const _authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { error: claimsErr } = await _authClient.auth.getClaims(
    authHeader.replace("Bearer ", "")
  );
  if (claimsErr) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { services, businessName, strengths, pride, projects, workStyle, extra } =
      await req.json();

    const hasServices = Array.isArray(services) && services.length > 0;
    const hasAnswers = [strengths, pride, projects, workStyle, extra].some(
      (v) => typeof v === "string" && v.trim().length > 0
    );

    if (!hasServices && !hasAnswers) {
      return new Response(
        JSON.stringify({ error: "At least one service or answer is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context sections
    const contextParts: string[] = [];

    if (hasServices) {
      contextParts.push(`Selected services:\n${services.join(", ")}`);
    }
    if (businessName) {
      contextParts.push(`Business name: ${businessName}`);
    }
    if (strengths?.trim()) {
      contextParts.push(`What they are known for on site: ${strengths}`);
    }
    if (pride?.trim()) {
      contextParts.push(`What they take pride in: ${pride}`);
    }
    if (projects?.trim()) {
      contextParts.push(`What kind of projects they usually work on: ${projects}`);
    }
    if (workStyle?.trim()) {
      contextParts.push(`How they work day-to-day: ${workStyle}`);
    }
    if (extra?.trim()) {
      contextParts.push(`Anything else clients should know: ${extra}`);
    }

    const systemPrompt = `You are writing a professional bio for a skilled tradesperson or construction professional.

Write in first person.

The tone must be:
- grounded
- natural
- skilled
- trustworthy
- free from corporate or marketing language

Do not use words like:
- passionate
- results-driven
- dynamic
- dedicated professional
- expert craftsman
unless the user clearly gave information that genuinely supports it.

Use the selected services as the core foundation of the bio.

Instructions:
- Write 2 to 4 short sentences
- Max 500 characters preferred
- Sound like a real tradesperson, not a marketing agency
- Only use information provided
- Do not invent years of experience, qualifications, or safety records
- If the input is minimal, keep it short but credible
- Focus on clear work type, quality, reliability, and standards where available

Return only the final bio text. Nothing else.`;

    const userPrompt = contextParts.join("\n\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let bio = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Enforce 500 char limit
    if (bio.length > 500) {
      bio = bio.substring(0, 497) + "...";
    }

    return new Response(JSON.stringify({ bio }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-bio error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
