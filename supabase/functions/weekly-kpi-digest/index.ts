import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Constructive Solutions Ibiza <notifications@constructivesolutionsibiza.com>";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "";
if (!ADMIN_EMAIL) {
  console.error("ADMIN_EMAIL secret is not configured — digest will not send");
}
const BRAND_NAME = "Constructive Solutions Ibiza";
const SITE_URL = Deno.env.get("SITE_URL") || "https://constructivesolutionsibiza.lovable.app";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface KPIData {
  period: string;
  newUsers: number;
  newPros: number;
  jobsPosted: number;
  jobsCompleted: number;
  conversations: number;
  messagesSent: number;
  openTickets: number;
  failedEmails: number;
  topCategories: { category: string; count: number }[];
  topAreas: { area: string; count: number }[];
}

async function gatherKPIs(): Promise<KPIData> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const from = weekAgo.toISOString();
  const to = now.toISOString();

  const [
    { count: newUsers },
    { count: newPros },
    { count: jobsPosted },
    { count: jobsCompleted },
    { count: conversations },
    { count: messagesSent },
    { count: openTickets },
    { count: failedEmails },
    { data: topCats },
    { data: topAreas },
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", from).lte("created_at", to),
    supabaseAdmin.from("professional_profiles").select("*", { count: "exact", head: true }).gte("created_at", from).lte("created_at", to),
    supabaseAdmin.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open").eq("is_publicly_listed", true).gte("created_at", from).lte("created_at", to),
    supabaseAdmin.from("jobs").select("*", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", from).lte("completed_at", to),
    supabaseAdmin.from("conversations").select("*", { count: "exact", head: true }).gte("created_at", from).lte("created_at", to),
    supabaseAdmin.from("messages").select("*", { count: "exact", head: true }).eq("message_type", "user").gte("created_at", from).lte("created_at", to),
    supabaseAdmin.from("support_requests").select("*", { count: "exact", head: true }).in("status", ["open", "triage"]),
    supabaseAdmin.from("email_notifications_queue").select("*", { count: "exact", head: true }).is("sent_at", null).gte("attempts", 3),
    supabaseAdmin.from("jobs").select("category").eq("is_publicly_listed", true).gte("created_at", from).lte("created_at", to).not("category", "is", null),
    supabaseAdmin.from("jobs").select("area").eq("is_publicly_listed", true).gte("created_at", from).lte("created_at", to).not("area", "is", null),
  ]);

  const catCounts: Record<string, number> = {};
  (topCats || []).forEach((r: any) => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
  const topCategories = Object.entries(catCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const areaCounts: Record<string, number> = {};
  (topAreas || []).forEach((r: any) => { areaCounts[r.area] = (areaCounts[r.area] || 0) + 1; });
  const topAreasResult = Object.entries(areaCounts)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    period: `${weekAgo.toLocaleDateString("en-GB")} – ${now.toLocaleDateString("en-GB")}`,
    newUsers: newUsers ?? 0,
    newPros: newPros ?? 0,
    jobsPosted: jobsPosted ?? 0,
    jobsCompleted: jobsCompleted ?? 0,
    conversations: conversations ?? 0,
    messagesSent: messagesSent ?? 0,
    openTickets: openTickets ?? 0,
    failedEmails: failedEmails ?? 0,
    topCategories,
    topAreas: topAreasResult,
  };
}

function metricRow(label: string, value: number | string, color?: string): string {
  return `<tr>
    <td style="padding: 10px 16px; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">${label}</td>
    <td style="padding: 10px 16px; color: ${color || "#111827"}; font-size: 18px; font-weight: 700; text-align: right; border-bottom: 1px solid #f3f4f6;">${value}</td>
  </tr>`;
}

function buildDigestEmail(kpi: KPIData): { subject: string; html: string } {
  const alertRows: string[] = [];
  if (kpi.failedEmails > 0) alertRows.push(`<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 14px; margin-bottom: 8px; border-radius: 4px; font-size: 13px; color: #991b1b;">🔴 ${kpi.failedEmails} email(s) failed after max retries</div>`);
  if (kpi.openTickets > 0) alertRows.push(`<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 14px; margin-bottom: 8px; border-radius: 4px; font-size: 13px; color: #92400e;">🟡 ${kpi.openTickets} support ticket(s) still open</div>`);

  const topCatsList = kpi.topCategories.map(c => `<li style="color: #374151; font-size: 13px; margin-bottom: 4px;"><strong>${c.category}</strong> — ${c.count} job(s)</li>`).join("");
  const topAreasList = kpi.topAreas.map(a => `<li style="color: #374151; font-size: 13px; margin-bottom: 4px;"><strong>${a.area}</strong> — ${a.count} job(s)</li>`).join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">📊 Weekly Platform Digest</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">${kpi.period}</p>
    </div>
    <div style="padding: 28px 32px;">
      ${alertRows.length ? `<div style="margin-bottom: 20px;">${alertRows.join("")}</div>` : ""}
      <h2 style="margin: 0 0 12px; font-size: 15px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Growth</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        ${metricRow("New Users", kpi.newUsers)}
        ${metricRow("New Professionals", kpi.newPros)}
      </table>
      <h2 style="margin: 0 0 12px; font-size: 15px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Activity</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        ${metricRow("Jobs Posted", kpi.jobsPosted)}
        ${metricRow("Jobs Completed", kpi.jobsCompleted)}
        ${metricRow("Conversations", kpi.conversations)}
        ${metricRow("Messages Sent", kpi.messagesSent)}
      </table>
      <h2 style="margin: 0 0 12px; font-size: 15px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Ops Health</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        ${metricRow("Open Support Tickets", kpi.openTickets, kpi.openTickets > 0 ? "#dc2626" : "#059669")}
        ${metricRow("Failed Emails", kpi.failedEmails, kpi.failedEmails > 0 ? "#dc2626" : "#059669")}
      </table>
      ${topCatsList ? `<h2 style="margin: 0 0 8px; font-size: 15px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Categories</h2><ul style="padding-left: 18px; margin: 0 0 20px;">${topCatsList}</ul>` : ""}
      ${topAreasList ? `<h2 style="margin: 0 0 8px; font-size: 15px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Top Areas</h2><ul style="padding-left: 18px; margin: 0 0 20px;">${topAreasList}</ul>` : ""}
      <div style="text-align: center; margin-top: 20px;">
        <a href="${SITE_URL}/dashboard/admin" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">Open Admin Dashboard →</a>
      </div>
    </div>
    <div style="background: #f9fafb; padding: 12px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} ${BRAND_NAME} — Automated weekly digest</p>
    </div>
  </div>
</body></html>`;

  return {
    subject: `📊 Weekly Digest: ${kpi.jobsPosted} jobs, ${kpi.newUsers} users — ${kpi.period}`,
    html,
  };
}

const handler = async (req: Request): Promise<Response> => {
  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // Auth: require dedicated internal secret (cron/admin only)
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  const providedSecret = req.headers.get("x-internal-secret");
  if (!internalSecret || providedSecret !== internalSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...headers } });
    }

    console.log("Gathering weekly KPIs...");
    const kpi = await gatherKPIs();
    console.log("KPIs gathered:", JSON.stringify(kpi));

    const { subject, html } = buildDigestEmail(kpi);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    });

    const body = await res.text();
    if (!res.ok) {
      console.error("Resend error:", res.status, body);
      return new Response(JSON.stringify({ error: `Resend ${res.status}`, detail: body.substring(0, 200) }), { status: 500, headers: { "Content-Type": "application/json", ...headers } });
    }

    console.log("Weekly digest sent successfully");
    return new Response(JSON.stringify({ success: true, kpi }), { status: 200, headers: { "Content-Type": "application/json", ...headers } });
  } catch (error: unknown) {
    console.error("weekly-kpi-digest error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json", ...headers } });
  }
};

serve(handler);
