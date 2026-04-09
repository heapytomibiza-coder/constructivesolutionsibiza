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

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "Europe/Madrid",
    });

    // Run all queries in parallel
    const [
      errorsRes,
      crashesRes,
      networkRes,
      authFailsRes,
      jobsCreatedRes,
      jobsPostedRes,
      emailPendingRes,
      emailFailedRes,
      topRouteRes,
      topNetworkRes,
    ] = await Promise.all([
      // Total errors (24h)
      supabase
        .from("error_events")
        .select("id", { count: "exact", head: true })
        .gt("created_at", since),

      // React crashes (24h)
      supabase
        .from("error_events")
        .select("id", { count: "exact", head: true })
        .gt("created_at", since)
        .eq("error_type", "react_crash"),

      // Network failures (24h)
      supabase
        .from("network_failures")
        .select("id", { count: "exact", head: true })
        .gt("created_at", since),

      // Auth failures (24h) — network failures to auth endpoints
      supabase
        .from("network_failures")
        .select("id", { count: "exact", head: true })
        .gt("created_at", since)
        .like("request_url", "%/auth/%"),

      // Jobs created (24h)
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .gt("created_at", since),

      // Jobs posted (24h)
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .gt("created_at", since)
        .eq("status", "open")
        .eq("is_publicly_listed", true),

      // Email queue: pending
      supabase
        .from("email_notifications_queue")
        .select("id", { count: "exact", head: true })
        .is("sent_at", null)
        .is("failed_at", null),

      // Email queue: failed
      supabase
        .from("email_notifications_queue")
        .select("id", { count: "exact", head: true })
        .not("failed_at", "is", null),

      // Top failing route
      supabase
        .from("error_events")
        .select("route")
        .gt("created_at", since)
        .not("route", "is", null)
        .limit(200),

      // Top network issue
      supabase
        .from("network_failures")
        .select("request_url")
        .gt("created_at", since)
        .not("request_url", "is", null)
        .limit(200),
    ]);

    const errors = errorsRes.count ?? 0;
    const crashes = crashesRes.count ?? 0;
    const networkFails = networkRes.count ?? 0;
    const authFails = authFailsRes.count ?? 0;
    const jobsCreated = jobsCreatedRes.count ?? 0;
    const jobsPosted = jobsPostedRes.count ?? 0;
    const emailPending = emailPendingRes.count ?? 0;
    const emailFailed = emailFailedRes.count ?? 0;

    // Compute top failing route
    const routeCounts: Record<string, number> = {};
    for (const r of topRouteRes.data ?? []) {
      if (r.route) routeCounts[r.route] = (routeCounts[r.route] || 0) + 1;
    }
    const topRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0];

    // Compute top network issue (extract function name from URL)
    const netCounts: Record<string, number> = {};
    for (const r of topNetworkRes.data ?? []) {
      if (r.request_url) {
        const match = r.request_url.match(/\/functions\/v1\/([^?/]+)/);
        const label = match ? match[1] : new URL(r.request_url).pathname.split("/").pop() || r.request_url;
        netCounts[label] = (netCounts[label] || 0) + 1;
      }
    }
    const topNet = Object.entries(netCounts).sort((a, b) => b[1] - a[1])[0];

    // Determine status
    let status: string;
    let emoji: string;
    if (crashes > 0 || errors > 50 || authFails > 20) {
      status = "RED";
      emoji = "🔴";
    } else if (errors > 20 || networkFails > 100) {
      status = "AMBER";
      emoji = "🟡";
    } else {
      status = "GREEN";
      emoji = "🟢";
    }

    const check = (val: number, threshold: number) => val > threshold ? "⚠️" : "✅";

    const message = [
      `🏥 Daily Health Report — ${today}`,
      "",
      `Status: ${emoji} ${status}`,
      "",
      `Errors (24h): ${errors} ${check(errors, 20)}`,
      `Network fails (24h): ${networkFails} ${check(networkFails, 50)}`,
      `React crashes: ${crashes} ${check(crashes, 0)}`,
      `Auth failures: ${authFails} ${check(authFails, 10)}`,
      "",
      `Jobs created: ${jobsCreated}`,
      `Jobs posted: ${jobsPosted}`,
      "",
      `Emails pending: ${emailPending}`,
      `Emails failed: ${emailFailed} ${check(emailFailed, 0)}`,
      "",
      topRoute ? `Top failing route: ${topRoute[0]} (${topRoute[1]} errors)` : "Top failing route: none",
      topNet ? `Top network issue: ${topNet[0]} (${topNet[1]} fails)` : "Top network issue: none",
    ].join("\n");

    // Send to Telegram
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      });
    }

    return new Response(JSON.stringify({ status, message }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Daily health check failed:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
