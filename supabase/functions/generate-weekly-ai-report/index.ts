import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: internal secret OR admin JWT
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let isAuthorized = false;

    if (internalSecret && expectedSecret && internalSecret === expectedSecret) {
      isAuthorized = true;
    } else if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("roles")
          .eq("user_id", user.id)
          .maybeSingle();
        if (roleRow && Array.isArray(roleRow.roles) && roleRow.roles.includes("admin")) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Assemble structured weekly summary
    const reportWeek = new Date();
    reportWeek.setDate(reportWeek.getDate() - reportWeek.getDay()); // Start of week
    const reportWeekStr = reportWeek.toISOString().split("T")[0];

    // Get this week's metrics (last 7 days)
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];

    const { data: thisWeekMetrics } = await supabase
      .from("daily_platform_metrics")
      .select("*")
      .gte("metric_date", sevenDaysAgo)
      .lt("metric_date", today)
      .order("metric_date");

    const { data: prevWeekMetrics } = await supabase
      .from("daily_platform_metrics")
      .select("*")
      .gte("metric_date", fourteenDaysAgo)
      .lt("metric_date", sevenDaysAgo)
      .order("metric_date");

    // Category breakdown
    const { data: categoryMetrics } = await supabase
      .from("daily_category_metrics")
      .select("*")
      .gte("metric_date", sevenDaysAgo)
      .lt("metric_date", today);

    // Active alerts (open/acknowledged, last 14 days)
    const { data: activeAlerts } = await supabase
      .from("platform_alerts")
      .select("*")
      .in("status", ["open", "acknowledged"])
      .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
      .order("created_at", { ascending: false });

    // Aggregate summary
    const aggregate = (metrics: any[] | null) => {
      if (!metrics?.length) return null;
      return {
        days: metrics.length,
        jobs_created: metrics.reduce((s, m) => s + (m.jobs_created || 0), 0),
        jobs_posted: metrics.reduce((s, m) => s + (m.jobs_posted || 0), 0),
        jobs_awarded: metrics.reduce((s, m) => s + (m.jobs_awarded || 0), 0),
        jobs_completed: metrics.reduce((s, m) => s + (m.jobs_completed || 0), 0),
        jobs_disputed: metrics.reduce((s, m) => s + (m.jobs_disputed || 0), 0),
        total_conversations: metrics.reduce((s, m) => s + (m.total_conversations || 0), 0),
        total_messages: metrics.reduce((s, m) => s + (m.total_messages || 0), 0),
        new_users: metrics.reduce((s, m) => s + (m.new_users || 0), 0),
        new_professionals: metrics.reduce((s, m) => s + (m.new_professionals || 0), 0),
        jobs_with_zero_responses: metrics.reduce((s, m) => s + (m.jobs_with_zero_responses || 0), 0),
        avg_response_rate: avg(metrics.map((m) => m.response_rate).filter(Boolean)),
        avg_success_rate: avg(metrics.map((m) => m.success_rate).filter(Boolean)),
        avg_dispute_rate: avg(metrics.map((m) => m.dispute_rate).filter(Boolean)),
        avg_wizard_completion: avg(metrics.map((m) => m.wizard_completion_rate).filter(Boolean)),
        avg_job_score: avg(metrics.map((m) => m.avg_job_score).filter(Boolean)),
      };
    };

    const avg = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

    const summaryJson = aggregate(thisWeekMetrics);
    const prevSummary = aggregate(prevWeekMetrics);

    // Category rollup
    const catRollup: Record<string, any> = {};
    for (const cm of categoryMetrics || []) {
      if (!catRollup[cm.category]) {
        catRollup[cm.category] = { jobs_created: 0, jobs_posted: 0, jobs_completed: 0, jobs_disputed: 0 };
      }
      catRollup[cm.category].jobs_created += cm.jobs_created || 0;
      catRollup[cm.category].jobs_posted += cm.jobs_posted || 0;
      catRollup[cm.category].jobs_completed += cm.jobs_completed || 0;
      catRollup[cm.category].jobs_disputed += cm.jobs_disputed || 0;
    }

    const comparisonJson = {
      this_week: summaryJson,
      prev_week: prevSummary,
      category_breakdown: catRollup,
      active_alerts_count: activeAlerts?.length || 0,
      active_alerts: (activeAlerts || []).slice(0, 10).map((a) => ({
        severity: a.severity,
        title: a.title,
        body: a.body,
        category: a.category,
        metric_date: a.metric_date,
      })),
    };

    // 2. Call AI for analysis
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    let aiAnalysis = "";
    let issues: any[] = [];
    let recommendations: any[] = [];

    if (lovableApiKey && summaryJson) {
      const prompt = `You are an operations analyst for a home-services marketplace in Ibiza.
Analyze this weekly platform data and provide actionable insights.

THIS WEEK SUMMARY:
${JSON.stringify(summaryJson, null, 2)}

PREVIOUS WEEK COMPARISON:
${JSON.stringify(prevSummary, null, 2)}

CATEGORY BREAKDOWN:
${JSON.stringify(catRollup, null, 2)}

ACTIVE ALERTS (${activeAlerts?.length || 0}):
${JSON.stringify((activeAlerts || []).slice(0, 10).map(a => ({ severity: a.severity, title: a.title, body: a.body })), null, 2)}

Respond in valid JSON with this exact structure:
{
  "analysis": "2-3 paragraph narrative of what happened this week, what changed vs last week, and why",
  "issues": [{"title": "...", "severity": "high|medium|low", "description": "..."}],
  "recommendations": [{"title": "...", "priority": "high|medium|low", "action": "specific action to take", "expected_impact": "..."}]
}

Focus on:
- What changed week-over-week and likely causes
- Operational risks (zero-response jobs, dispute spikes, worker inactivity)
- Top 3-5 specific actions the operator should take
- Be direct and practical, not generic`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a marketplace operations analyst. Return only valid JSON." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          try {
            const parsed = JSON.parse(content);
            aiAnalysis = parsed.analysis || "";
            issues = parsed.issues || [];
            recommendations = parsed.recommendations || [];
          } catch {
            aiAnalysis = content;
          }
        } else {
          const errText = await aiResponse.text();
          console.error("AI gateway error:", aiResponse.status, errText);
          aiAnalysis = "AI analysis unavailable this week.";
        }
      } catch (err) {
        console.error("AI call failed:", err);
        aiAnalysis = "AI analysis unavailable this week.";
      }
    } else {
      aiAnalysis = "No metrics data available for analysis.";
    }

    // 3. Upsert report
    const { error: upsertError } = await supabase
      .from("weekly_ai_reports")
      .upsert(
        {
          report_week: reportWeekStr,
          summary_json: summaryJson || {},
          comparison_json: comparisonJson,
          ai_analysis: aiAnalysis,
          issues,
          recommendations,
          open_alerts_snapshot: (activeAlerts || []).slice(0, 20),
        },
        { onConflict: "report_week" }
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_week: reportWeekStr,
        has_ai_analysis: !!aiAnalysis && aiAnalysis !== "AI analysis unavailable this week.",
        issues_count: issues.length,
        recommendations_count: recommendations.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
