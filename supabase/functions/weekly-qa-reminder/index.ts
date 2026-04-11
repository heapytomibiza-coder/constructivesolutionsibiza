import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Weekly QA Reminder — Hardened
 *
 * Auth: Accepts INTERNAL_FUNCTION_SECRET via x-internal-secret header
 *       (for direct calls) or any valid bearer token (for pg_cron via anon key).
 *       Matches the pattern used by daily-health-check and process-nudges.
 *
 * Idempotency: Skips if already sent for this ISO week (qa_reminder_runs).
 *              This is the primary spam guard — max 1 send per week.
 * Logging: Writes every invocation result to qa_reminder_runs.
 * Dedup: Open risks are deduplicated by title, capped at 3.
 */

function getIsoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  // --- Auth gate: x-internal-secret header or Authorization bearer ---
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";
  const secretHeader = req.headers.get("x-internal-secret") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  const hasInternalSecret = internalSecret && secretHeader === internalSecret;
  const hasBearer = authHeader.startsWith("Bearer ");

  // Reject calls with no credentials at all
  if (!hasInternalSecret && !hasBearer) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Env validation ---
  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({ error: "TELEGRAM_BOT_TOKEN not configured" }), { status: 500 });
  }

  const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!TELEGRAM_CHAT_ID) {
    return new Response(JSON.stringify({ error: "TELEGRAM_CHAT_ID not configured" }), { status: 500 });
  }

  const FUNCTION_NAME = "weekly-qa-reminder";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // --- Idempotency: skip if already sent this week ---
    const now = new Date();
    const weekKey = getIsoWeekKey(now);

    const { data: existing } = await supabase
      .from("qa_reminder_runs")
      .select("id")
      .eq("function_name", FUNCTION_NAME)
      .eq("week_key", weekKey)
      .eq("status", "sent")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Already sent for ${weekKey}` }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      );
    }

    const today = now.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Madrid",
    });

    // --- Fetch + deduplicate open risks (max 3 unique) ---
    const { data: openAlerts } = await supabase
      .from("platform_alerts")
      .select("title, severity, category")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(20);

    const seen = new Set<string>();
    const uniqueAlerts: typeof openAlerts = [];
    if (openAlerts) {
      for (const a of openAlerts) {
        if (!seen.has(a.title)) {
          seen.add(a.title);
          uniqueAlerts.push(a);
        }
        if (uniqueAlerts.length >= 3) break;
      }
    }

    const alertLines = uniqueAlerts.length > 0
      ? uniqueAlerts.map((a) => `• ${a.severity === "critical" ? "🔴" : "🟡"} ${a.title}`).join("\n")
      : "✅ No open alerts";

    // --- Build message (Markdown) ---
    const message = [
      `📋 *Weekly QA Checklist — ${today}*`,
      "",
      "Tester: \\_\\_\\_\\_\\_\\_\\_\\_\\_\\_",
      "Environment: _(Staging / Production)_",
      "Device: _(iPhone / Android / Desktop)_",
      "",
      "*━━ Section A: Mobile (375px) ━━*",
      "",
      "□ Open job → modal fully visible",
      "  → Scroll + tap bottom buttons",
      "",
      "□ Accept quote → button visible",
      "  → Try with keyboard open",
      "",
      "□ Keyboard → does NOT hide CTA",
      "  → Focus input, try submit",
      "",
      "□ Toolbar → does NOT cover content",
      "  → Scroll to bottom + interact",
      "",
      "□ Navigation → no lag / stuck",
      "  → Rapid nav between 3 pages",
      "",
      "□ Onboarding → submit reachable",
      "  → Try incomplete + complete",
      "",
      "*━━ Section B: Core Flows (CRITICAL) ━━*",
      "",
      "□ Sign up (client + pro) → new emails",
      "□ Login redirect → protected page first",
      "□ Post job → skip steps / bad input",
      "□ Pro sees matched job → visibility",
      "□ Send quote → empty / invalid values",
      "□ Accept quote → double-click test",
      "□ Messaging → send → refresh → persists",
      "□ Job status → all views (client+pro)",
      "",
      "*━━ Section C: Permissions (BREAK IT) ━━*",
      "",
      "□ Client ↛ pro dashboard (paste URL)",
      "□ Client ↛ someone else's quote",
      "□ Pro ↛ other pro's listings",
      "□ Non-admin ↛ admin routes",
      "□ Admin sees correct data",
      "□ Role switcher → 5x rapid switch",
      "",
      "*━━ Section D: Feels Broken? ━━*",
      "",
      "□ Confusing? → Where",
      "□ Misleading buttons? → Which",
      "□ Bad error messages? → Copy them",
      "□ Unfinished? → Screenshot",
      "□ Slow? → Where + how long",
      "",
      "*━━ Open Risks ━━*",
      "",
      alertLines,
      "",
      "*━━ FINAL STATUS ━━*",
      "",
      "Critical: \\_\\_\\_ | Non-critical: \\_\\_\\_",
      "Release safe? *(Yes / No)*",
    ].join("\n");

    // --- Send to Telegram ---
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
    const body = await res.text();

    if (!res.ok) {
      console.error("Telegram send failed:", res.status, body);
      await supabase.from("qa_reminder_runs").insert({
        function_name: FUNCTION_NAME,
        week_key: weekKey,
        destination: "telegram",
        status: "failed",
        error_message: `${res.status}: ${body.slice(0, 500)}`,
      });
      return new Response(JSON.stringify({ error: "Telegram send failed", status: res.status }), {
        headers: { "Content-Type": "application/json" },
        status: 502,
      });
    }

    // Log success
    await supabase.from("qa_reminder_runs").insert({
      function_name: FUNCTION_NAME,
      week_key: weekKey,
      destination: "telegram",
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, week_key: weekKey }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Weekly QA reminder failed:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
