import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";
    if (!TELEGRAM_CHAT_ID) throw new Error("TELEGRAM_CHAT_ID is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Madrid",
    });

    // Fetch recent open risks from platform_alerts
    const { data: openAlerts } = await supabase
      .from("platform_alerts")
      .select("title, severity, category")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5);

    const alertLines = openAlerts && openAlerts.length > 0
      ? openAlerts.map((a) => `• ${a.severity === "critical" ? "🔴" : "🟡"} ${a.title}`).join("\n")
      : "  ✅ No open alerts";

    const message = [
      `📋 Weekly QA Checklist — ${today}`,
      "",
      "Tester: __________",
      "Environment: (Staging / Production)",
      "Device: (iPhone / Android / Desktop)",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "Section A: Mobile Reality Check (375px)",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "□ Open job → modal fully visible",
      "→ Try scrolling + tapping bottom buttons",
      "→ RESULT:",
      "",
      "□ Accept quote → button visible & tappable",
      "→ Try with keyboard open",
      "→ RESULT:",
      "",
      "□ Keyboard → does NOT hide CTA",
      "→ Focus input, try submit",
      "→ RESULT:",
      "",
      "□ Toolbar / sticky UI → does NOT cover content",
      "→ Scroll to bottom + interact",
      "→ RESULT:",
      "",
      "□ Navigation → no lag / no stuck states",
      "→ Rapid navigation between 3 pages",
      "→ RESULT:",
      "",
      "□ Onboarding → submit button always reachable",
      "→ Try incomplete + complete flows",
      "→ RESULT:",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "Section B: Core Trust Flows (CRITICAL)",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "□ Sign up (client + pro)",
      "→ Use NEW emails (not cached)",
      "→ RESULT:",
      "",
      "□ Login redirect",
      "→ Try accessing protected page BEFORE login",
      "→ RESULT:",
      "",
      "□ Post job (full wizard)",
      "→ Try skipping steps / invalid inputs",
      "→ RESULT:",
      "",
      "□ Professional sees matched job",
      "→ Confirm visibility is correct",
      "→ RESULT:",
      "",
      "□ Send quote",
      "→ Try empty / invalid values",
      "→ RESULT:",
      "",
      "□ Accept quote",
      "→ Click twice quickly (double-click test)",
      "→ RESULT:",
      "",
      "□ Messaging",
      "→ Send message → refresh → confirm persistence",
      "→ RESULT:",
      "",
      "□ Job status updates",
      "→ Check ALL views (client + pro dashboard)",
      "→ RESULT:",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "Section C: Role & Permissions (TRY TO BREAK IT)",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "□ Client ↛ pro dashboard",
      "→ Paste URL manually",
      "→ RESULT:",
      "",
      "□ Client ↛ someone else's quote",
      "→ Attempt via direct URL or UI",
      "→ RESULT:",
      "",
      "□ Pro ↛ other pro's listings",
      "→ Try editing via URL",
      "→ RESULT:",
      "",
      "□ Non-admin ↛ admin routes",
      "→ Paste admin URL",
      "→ RESULT:",
      "",
      "□ Admin sees correct data",
      "→ Spot check users/jobs",
      "→ RESULT:",
      "",
      "□ Role switcher",
      "→ Switch roles repeatedly (5x)",
      "→ RESULT:",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      'Section D: "Feels Broken?" (IMPORTANT)',
      "━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "□ Anything confusing? → Where exactly?",
      "□ Buttons misleading? → Which ones?",
      "□ Error messages helpful? → Copy + clarity",
      "□ Anything look unfinished? → Screenshots required",
      "□ Anything slow? → Where + how long",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "Open Risks (from TRACEABILITY.md)",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "",
      alertLines,
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "FINAL STATUS",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Critical issues found: ___",
      "Non-critical issues: ___",
      "",
      "Release safe? (Yes / No)",
      "",
      "Notes:",
    ].join("\n");

    // Send to Telegram via connector gateway
    if (TELEGRAM_CHAT_ID) {
      const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
        }),
      });
      const body = await res.text();
      if (!res.ok) {
        console.error("Telegram send failed:", res.status, body);
      }
    }

    return new Response(JSON.stringify({ success: true, message }), {
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
