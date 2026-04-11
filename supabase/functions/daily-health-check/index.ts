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
      emailFailed24hRes,
      smtpAuthErrorRes,
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

      // Email queue: pending (unsent, not yet failed)
      supabase
        .from("email_notifications_queue")
        .select("id", { count: "exact", head: true })
        .is("sent_at", null)
        .is("failed_at", null),

      // Email queue: permanently failed (failed_at set)
      supabase
        .from("email_notifications_queue")
        .select("id", { count: "exact", head: true })
        .not("failed_at", "is", null),

      // Email failures in last 24h (attempts > 0, not sent)
      supabase
        .from("email_notifications_queue")
        .select("id", { count: "exact", head: true })
        .is("sent_at", null)
        .gt("attempts", 0)
        .gt("created_at", since),

      // SMTP auth errors — check most recent failures for 535/EAUTH
      supabase
        .from("email_notifications_queue")
        .select("last_error")
        .is("sent_at", null)
        .gt("attempts", 0)
        .not("last_error", "is", null)
        .order("created_at", { ascending: false })
        .limit(10),

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
    const emailFailed24h = emailFailed24hRes.count ?? 0;

    // Detect SMTP auth failure pattern
    const recentErrors = smtpAuthErrorRes.data ?? [];
    const hasSmtpAuthFailure = recentErrors.some(
      (r) => r.last_error && (r.last_error.includes("535") || r.last_error.includes("EAUTH"))
    );

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

    // Determine status — SMTP auth failure or email spike forces RED
    let status: string;
    let emoji: string;
    if (hasSmtpAuthFailure || crashes > 0 || errors > 50 || authFails > 20 || emailFailed24h > 10) {
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

    const lines = [
      `🏥 Daily Health Report — ${today}`,
      "",
      `Status: ${emoji} ${status}`,
    ];

    // SMTP auth failure alert (prominent, at top)
    if (hasSmtpAuthFailure) {
      lines.push("");
      lines.push("🔴 SMTP AUTH FAILURE — Email delivery is down!");
      lines.push("Action: Check SMTP_PASSWORD secret and hosting provider credentials");
    }

    lines.push(
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
      `Emails failed (total): ${emailFailed} ${check(emailFailed, 0)}`,
      `Emails failed (24h): ${emailFailed24h} ${check(emailFailed24h, 10)}`,
      "",
      topRoute ? `Top failing route: ${topRoute[0]} (${topRoute[1]} errors)` : "Top failing route: none",
      topNet ? `Top network issue: ${topNet[0]} (${topNet[1]} fails)` : "Top network issue: none",
    );

    const message = lines.join("\n");

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
