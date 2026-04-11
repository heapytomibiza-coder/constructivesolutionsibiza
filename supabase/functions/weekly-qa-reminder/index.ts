import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  try {
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

    const alertSummary = openAlerts && openAlerts.length > 0
      ? openAlerts.map((a) => `  • ${a.severity === "critical" ? "🔴" : "🟡"} ${a.title}`).join("\n")
      : "  ✅ No open alerts";

    const message = [
      `📋 Weekly QA Checklist — ${today}`,
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "Section A: Mobile Reality Check (375px)",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "□ Open job → modal not blocked",
      "□ Accept quote → button visible & tappable",
      "□ Keyboard → does not hide CTA",
      "□ Toolbar → does not cover content",
      "□ Navigation smooth between pages",
      "□ Onboarding steps visible without scrolling past submit",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "Section B: Core Trust Flows",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "□ Sign up (client + pro)",
      "□ Login redirect (returnUrl works)",
      "□ Post job (full wizard)",
      "□ Professional sees matched job",
      "□ Send quote",
      "□ Accept quote → job in_progress",
      "□ Messaging works both ways",
      "□ Job status updates correctly",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "Section C: Role & Permissions",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "□ Client ↛ pro dashboard",
      "□ Client ↛ someone else's quote",
      "□ Pro ↛ other pro's listings",
      "□ Non-admin ↛ admin routes",
      "□ Admin sees correct data",
      "□ Role switcher works (header + mobile)",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "Section D: Feels Broken?",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "□ Anything confusing?",
      "□ Buttons misleading?",
      "□ Error messages helpful?",
      "□ Anything look unfinished?",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "Open Risks",
      "━━━━━━━━━━━━━━━━━━━━━━",
      alertSummary,
      "",
      "Mark each: ✅ Working | ⚠️ Feels off | ❌ Broken",
      "Log results and tag issues immediately.",
    ].join("\n");

    // Send to Telegram
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
