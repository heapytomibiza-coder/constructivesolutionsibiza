import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import nodemailer from "npm:nodemailer@6.9.12";

// ============================================
// CONFIG
// ============================================

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") ?? "465", 10);
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? "info@constructivesolutionsibiza.com";
const BRAND_NAME = "Constructive Solutions Ibiza";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "info@constructivesolutionsibiza.com";
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP_NUMBER") ?? "";
const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_CALLMEBOT_APIKEY") ?? "";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ============================================
// SMTP EMAIL SENDER
// ============================================

async function sendEmail(to: string, subject: string, html: string): Promise<{ error?: string }> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.error("SMTP config check - HOST:", !!SMTP_HOST, "USER:", !!SMTP_USER, "PASS:", !!SMTP_PASSWORD, "FROM:", SMTP_FROM);
    return { error: "SMTP not configured (missing host, user, or password)" };
  }
  
  console.log(`SMTP sending to="${to}" host="${SMTP_HOST}:${SMTP_PORT}" user="${SMTP_USER}"`);
  
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${BRAND_NAME}" <${SMTP_FROM}>`,
      to,
      subject,
      text: htmlToPlainText(html),
      html,
    });

    console.log(`Email sent successfully to ${to}: ${subject}`);
    return {};
  } catch (err) {
    console.error("SMTP send error:", err);
    return { error: String(err) };
  }
}

// ============================================
// HELPERS
// ============================================

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

async function getUserEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

// ============================================
// WHATSAPP & TELEGRAM SENDERS
// ============================================

async function sendWhatsApp(message: string): Promise<void> {
  if (!ADMIN_WHATSAPP || !WHATSAPP_API_KEY) return;
  try {
    const encoded = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_WHATSAPP}&text=${encoded}&apikey=${WHATSAPP_API_KEY}`;
    const res = await fetch(url);
    await res.text();
    console.log("WhatsApp sent");
  } catch (err) {
    console.error("WhatsApp error:", err);
  }
}

async function sendTelegram(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    await res.text();
  } catch (err) {
    console.error("Telegram error:", err);
  }
}

// ============================================
// EMAIL TEMPLATE SHELL
// ============================================

function emailShell(headerBg: string, headerTitle: string, body: string, footer?: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: ${headerBg}; padding: 24px 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">${headerTitle}</h1>
    </div>
    <div style="padding: 28px 32px;">${body}</div>
    <div style="background: #f9fafb; padding: 12px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">${footer || `© ${new Date().getFullYear()} ${BRAND_NAME}`}</p>
    </div>
  </div>
</body></html>`;
}

// ============================================
// EMAIL TEMPLATES — ADMIN ALERTS
// ============================================

function buildAdminNewJobEmail(payload: any, siteUrl: string) {
  return {
    subject: `New job posted: ${payload.title}`,
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      "New Job Posted",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload.title}</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Category</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.category || "N/A"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Area</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.area || "Ibiza"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Budget</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.budget || "TBD"}</td></tr>
      </table>
      <a href="${siteUrl}/admin" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View in Admin →</a>`
    ),
    whatsapp: `📋 New job: ${payload.title}\n${payload.category || ""} · ${payload.area || "Ibiza"}`,
    telegram: `📋 <b>NEW JOB POSTED</b>\n<b>${escapeHtml(payload.title)}</b>\n${escapeHtml(payload.category || "")} · ${escapeHtml(payload.area || "Ibiza")}`,
  };
}

function buildAdminNewUserEmail(payload: any, siteUrl: string) {
  return {
    subject: `New user registered: ${payload.display_name || payload.email || "Unknown"}`,
    html: emailShell(
      "linear-gradient(135deg, #3b82f6, #6366f1)",
      "New User Registration",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload.display_name || "New User"}</h2>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">${payload.email || ""}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">Intent: <strong>${payload.intent || "client"}</strong></p>
      <a href="${siteUrl}/admin" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View Users →</a>`
    ),
    whatsapp: `👤 New user: ${payload.display_name || payload.email || "Unknown"} (${payload.intent || "client"})`,
    telegram: `👤 <b>NEW USER</b>\n${escapeHtml(payload.display_name || payload.email || "Unknown")}\nIntent: ${escapeHtml(payload.intent || "client")}`,
  };
}

function buildBugReportEmail(payload: any, siteUrl: string) {
  return {
    subject: `🐛 Bug Report: ${payload.route || payload.url || "Unknown page"}`,
    html: emailShell(
      "linear-gradient(135deg, #dc2626, #ef4444)",
      "🐛 Bug Report",
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; border-left: 3px solid #ef4444; padding-left: 12px;">${payload.description}</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Page</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.route || "N/A"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Viewport</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.viewport || "N/A"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Browser</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.browser || "N/A"}</td></tr>
      </table>
      <a href="${siteUrl}/dashboard/admin?tab=support" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View in Admin →</a>`
    ),
    whatsapp: `🐛 Bug Report\n${payload.description?.substring(0, 120)}\nPage: ${payload.route || "N/A"}`,
    telegram: `🐛 <b>BUG REPORT</b>\n${escapeHtml(payload.description?.substring(0, 200) || "No description")}\n📍 ${escapeHtml(payload.route || "Unknown page")}`,
  };
}

function buildPlatformErrorEmail(payload: any, siteUrl: string) {
  return {
    subject: `⚠️ Platform Error: ${payload.error_type || "Unknown"}`,
    html: emailShell(
      "linear-gradient(135deg, #dc2626, #b91c1c)",
      "⚠️ Platform Error",
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; border-left: 3px solid #dc2626; padding-left: 12px;">${payload.message || "An error occurred"}</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Type</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.error_type || "N/A"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Route</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.route || "N/A"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Count</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.count || 1}</td></tr>
      </table>
      <a href="${siteUrl}/dashboard/admin?tab=health" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View Health →</a>`
    ),
    whatsapp: `⚠️ Platform Error: ${payload.error_type || "Unknown"}\n${(payload.message || "").substring(0, 100)}`,
    telegram: `⚠️ <b>PLATFORM ERROR</b>\n${escapeHtml(payload.error_type || "Unknown")}\n${escapeHtml((payload.message || "").substring(0, 150))}`,
  };
}

function buildSupportTicketEmail(payload: any, siteUrl: string) {
  const priorityEmoji = payload.priority === "high" ? "🔴" : payload.priority === "medium" ? "🟡" : "🟢";
  return {
    subject: `${priorityEmoji} Support ticket ${payload.ticket_number}: ${payload.issue_type}`,
    html: emailShell(
      "linear-gradient(135deg, #374151, #4b5563)",
      "New Support Ticket",
      `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Ticket</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.ticket_number}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Issue</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.issue_type}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Priority</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${priorityEmoji} ${payload.priority}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">From</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.created_by_role}</td></tr>
      </table>
      ${payload.summary ? `<p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">${payload.summary}</p>` : ""}
      <a href="${siteUrl}/admin" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">Open Support Inbox →</a>`
    ),
    whatsapp: `${priorityEmoji} Support ticket ${payload.ticket_number}\nIssue: ${payload.issue_type}\nPriority: ${payload.priority}`,
    telegram: `${priorityEmoji} <b>SUPPORT TICKET</b>\n${escapeHtml(payload.ticket_number)}: ${escapeHtml(payload.issue_type)}`,
  };
}

function buildProSignupEmail(payload: any, siteUrl: string) {
  return {
    subject: `New professional signup: ${payload.display_name}`,
    html: emailShell(
      "linear-gradient(135deg, #374151, #4b5563)",
      "New Professional Signup",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload.display_name}</h2>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">A new professional has registered. Review their profile in the admin panel.</p>
      <a href="${siteUrl}/admin" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">Review in Admin →</a>`
    ),
    whatsapp: `New pro signup: ${payload.display_name}`,
    telegram: `🔧 <b>NEW PRO SIGNUP</b>\n${escapeHtml(payload.display_name)}`,
  };
}

function buildForumPostEmail(payload: any, siteUrl: string) {
  const postUrl = `${siteUrl}/forum/post/${payload.post_id}`;
  return {
    subject: `New forum post: ${payload.title}`,
    html: emailShell(
      "linear-gradient(135deg, #374151, #4b5563)",
      "New Forum Post",
      `<h2 style="margin: 0 0 4px; color: #111827; font-size: 18px;">${payload.title}</h2>
      <p style="color: #9ca3af; font-size: 13px; margin: 0 0 12px;">by ${payload.author_display_name}</p>
      ${payload.content_preview ? `<p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">${payload.content_preview}</p>` : ""}
      <a href="${postUrl}" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View Post →</a>`
    ),
    whatsapp: `New forum post: ${payload.title}\nBy: ${payload.author_display_name}`,
    telegram: `💬 <b>NEW FORUM POST</b>\n<b>${escapeHtml(payload.title || "Untitled")}</b>\nBy: ${escapeHtml(payload.author_display_name || "Community Member")}`,
  };
}

// ============================================
// EMAIL TEMPLATES — USER EMAILS
// ============================================

function buildMessageEmail(payload: any, siteUrl: string) {
  const preview = payload.message_preview || "New message";
  const convUrl = `${siteUrl}/messages/${payload.conversation_id}`;
  return {
    subject: `You have a new reply — respond now`,
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      "You Have a Reply!",
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 6px; font-style: italic; border-left: 3px solid #10b981; padding-left: 12px;">"${preview}"</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">Responding quickly helps you get the best service.</p>
      <a href="${convUrl}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">Reply Now →</a>`
    ),
  };
}

function buildWelcomeEmail(payload: any, siteUrl: string) {
  const isTasker = payload.intent === "professional" || payload.intent === "both";
  return {
    subject: `Welcome to ${BRAND_NAME}!`,
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      `Welcome to ${BRAND_NAME}!`,
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">Hi ${payload.display_name || "there"} 👋</h2>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">Thanks for joining ${BRAND_NAME}. ${isTasker ? "You're now registered as a professional. Complete your profile to start receiving job matches." : "You can now post jobs and connect with trusted professionals in Ibiza."}</p>
      <a href="${siteUrl}${isTasker ? "/dashboard/professional" : "/post-job"}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">${isTasker ? "Complete Your Profile →" : "Post Your First Job →"}</a>
      <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0; text-align: center;">Need help? Reply to this email anytime.</p>`
    ),
  };
}

function buildJobPostedConfirmEmail(payload: any, siteUrl: string) {
  const jobUrl = `${siteUrl}/jobs/${payload.job_id}`;
  return {
    subject: `Your job "${payload.title}" has been posted`,
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      "Job Posted Successfully!",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload.title}</h2>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">Your job is now live and visible to professionals in the ${payload.area || "Ibiza"} area. You'll receive notifications when professionals respond.</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Category</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.category || "N/A"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Area</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.area || "Ibiza"}</td></tr>
      </table>
      <a href="${jobUrl}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View Your Job →</a>`
    ),
  };
}

function buildQuoteReceivedEmail(payload: any, siteUrl: string) {
  const convUrl = `${siteUrl}/messages/${payload.conversation_id || ""}`;
  return {
    subject: `You've received a quote for "${payload.job_title}"`,
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      "New Quote Received!",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload.job_title}</h2>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px;">A professional has sent you a quote. Review it and respond to move forward.</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">From</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.pro_name || "Professional"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Type</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.price_type || "Fixed"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.total ? `€${payload.total}` : "See details"}</td></tr>
      </table>
      <a href="${convUrl}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">Review Quote →</a>`
    ),
  };
}

function buildQuoteStatusEmail(payload: any, siteUrl: string) {
  const accepted = payload.status === "accepted";
  return {
    subject: `Your quote for "${payload.job_title}" was ${accepted ? "accepted! 🎉" : "declined"}`,
    html: emailShell(
      accepted ? "linear-gradient(135deg, #059669, #10b981)" : "linear-gradient(135deg, #6b7280, #9ca3af)",
      accepted ? "Quote Accepted! 🎉" : "Quote Declined",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload.job_title}</h2>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${accepted
        ? "Great news! The client has accepted your quote. You can now coordinate directly to get started."
        : "The client has decided to go with another option for this job. Keep an eye out for new matches!"
      }</p>
      <a href="${siteUrl}/dashboard/professional" style="display: inline-block; background: ${accepted ? "#059669" : "#6b7280"}; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">${accepted ? "View Job →" : "Browse Jobs →"}</a>`
    ),
  };
}

// ============================================
// EMAIL TEMPLATES — TASKER EMAILS
// ============================================

function buildJobMatchEmail(payload: any, siteUrl: string) {
  const jobUrl = `${siteUrl}/jobs/${payload.job_id}`;
  return {
    subject: `New job match: ${payload.title} — ${payload.area || "Ibiza"}`,
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      "New Job Match",
      `<h2 style="margin: 0 0 4px; color: #111827; font-size: 18px;">${payload.title}</h2>
      <p style="color: #9ca3af; font-size: 13px; margin: 0 0 16px;">${payload.category || ""}</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Location</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.area || "Ibiza"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Budget</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.budget || "To be discussed"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Timing</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.timing || "Flexible"}</td></tr>
      </table>
      <a href="${jobUrl}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View Job & Respond →</a>`,
      `© ${new Date().getFullYear()} ${BRAND_NAME} — You're receiving this because this job matches your services`
    ),
  };
}

function buildJobCompletedEmail(payload: any, siteUrl: string) {
  return {
    subject: `Job completed: ${payload.title}`,
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      "Job Completed! 🎉",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload.title}</h2>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">This job has been marked as completed. ${payload.is_tasker ? "Great work! Your profile reputation has been updated." : "We hope you had a great experience."}</p>
      <a href="${siteUrl}/${payload.is_tasker ? "dashboard/professional" : "dashboard"}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View Dashboard →</a>`
    ),
  };
}

// ============================================
// EVENT → TEMPLATE ROUTER
// ============================================

type EmailResult = { subject: string; html: string; whatsapp?: string; telegram?: string };

const ADMIN_ONLY_EVENTS = [
  "admin_new_job", "admin_new_user", "pro_signup", "support_ticket",
  "forum_post", "bug_report", "platform_error", "contact_form",
];

function buildEmail(eventType: string, payload: any, siteUrl: string): EmailResult | null {
  switch (eventType) {
    // Admin alerts
    case "admin_new_job":     return buildAdminNewJobEmail(payload, siteUrl);
    case "admin_new_user":    return buildAdminNewUserEmail(payload, siteUrl);
    case "pro_signup":        return buildProSignupEmail(payload, siteUrl);
    case "support_ticket":    return buildSupportTicketEmail(payload, siteUrl);
    case "forum_post":        return buildForumPostEmail(payload, siteUrl);
    case "bug_report":        return buildBugReportEmail(payload, siteUrl);
    case "platform_error":    return buildPlatformErrorEmail(payload, siteUrl);
    // User emails
    case "new_message":       return buildMessageEmail(payload, siteUrl);
    case "welcome":           return buildWelcomeEmail(payload, siteUrl);
    case "job_posted_confirm": return buildJobPostedConfirmEmail(payload, siteUrl);
    case "quote_received":    return buildQuoteReceivedEmail(payload, siteUrl);
    case "quote_accepted":
    case "quote_declined":    return buildQuoteStatusEmail({ ...payload, status: eventType === "quote_accepted" ? "accepted" : "declined" }, siteUrl);
    // Tasker emails
    case "job_match":         return buildJobMatchEmail(payload, siteUrl);
    case "job_completed":     return buildJobCompletedEmail(payload, siteUrl);
    default:                  return null;
  }
}

// ============================================
// TEST ENDPOINT
// ============================================

async function handleTestEmail(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const testTo = url.searchParams.get("to");
  if (!testTo) {
    return new Response(JSON.stringify({ error: "Missing ?to= parameter" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  // Gate behind admin auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
  const { data: roleData } = await supabaseAdmin.from("user_roles").select("roles").eq("user_id", userData.user.id).maybeSingle();
  const { data: allowData } = await supabaseAdmin.from("admin_allowlist").select("email").eq("email", userData.user.email?.toLowerCase() ?? "").maybeSingle();
  if (!roleData?.roles?.includes("admin") || !allowData) {
    return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }

  const testHtml = emailShell(
    "linear-gradient(135deg, #059669, #10b981)",
    "SMTP Email Test",
    `<p style="color: #374151; font-size: 15px; line-height: 1.6;">This is a <strong>test email</strong> sent via SMTP to verify delivery is working correctly.</p>
    <p style="color: #6b7280; font-size: 13px;">Host: ${SMTP_HOST}:${SMTP_PORT}</p>
    <p style="color: #6b7280; font-size: 13px;">From: ${SMTP_FROM}</p>
    <p style="color: #6b7280; font-size: 13px;">Sent at: ${new Date().toISOString()}</p>`
  );
  const result = await sendEmail(testTo, `SMTP Test - ${BRAND_NAME}`, testHtml);
  return new Response(
    JSON.stringify({ test: true, sent: !result.error, error: result.error || null }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

// ============================================
// MAIN QUEUE PROCESSOR
// ============================================

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test endpoint
    const url = new URL(req.url);
    if (url.searchParams.get("test_email") === "1") {
      return handleTestEmail(req);
    }

    // Fetch pending queue items
    const { data: queue, error: queueError } = await supabaseAdmin
      .from("email_notifications_queue")
      .select("*")
      .is("sent_at", null)
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(20);

    if (queueError) throw queueError;
    if (!queue || queue.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const siteUrl = Deno.env.get("PUBLIC_SITE_ORIGIN") || Deno.env.get("SITE_URL") || "https://constructivesolutionsibiza.lovable.app";
    let sent = 0;

    for (const item of queue) {
      try {
        // Resolve recipient
        let recipientEmail: string | null = null;

        if (!item.recipient_user_id || ADMIN_ONLY_EVENTS.includes(item.event_type)) {
          recipientEmail = ADMIN_EMAIL;
        } else {
          recipientEmail = await getUserEmail(item.recipient_user_id);
        }

        if (!recipientEmail) {
          const newAttempts = item.attempts + 1;
          await supabaseAdmin.from("email_notifications_queue")
            .update({ attempts: newAttempts, last_error: "Could not resolve recipient email", ...(newAttempts >= 3 ? { failed_at: new Date().toISOString() } : {}) })
            .eq("id", item.id);
          continue;
        }

        // Check notification preferences for user-targeted events
        if (item.recipient_user_id && ["new_message", "job_match"].includes(item.event_type)) {
          const { data: prefs } = await supabaseAdmin
            .from("notification_preferences")
            .select("email_messages, email_job_matches")
            .eq("user_id", item.recipient_user_id)
            .maybeSingle();

          const allow =
            item.event_type === "new_message" ? (prefs?.email_messages ?? true) :
            item.event_type === "job_match" ? (prefs?.email_job_matches ?? true) : true;

          if (!allow) {
            await supabaseAdmin.from("email_notifications_queue")
              .update({ sent_at: new Date().toISOString(), last_error: "skipped_by_preferences" })
              .eq("id", item.id);
            continue;
          }
        }

        // Build and send
        const email = buildEmail(item.event_type, item.payload || {}, siteUrl);

        if (!email) {
          const newAttempts = item.attempts + 1;
          await supabaseAdmin.from("email_notifications_queue")
            .update({ attempts: newAttempts, last_error: `Unknown event_type: ${item.event_type}`, ...(newAttempts >= 3 ? { failed_at: new Date().toISOString() } : {}) })
            .eq("id", item.id);
          continue;
        }

        const result = await sendEmail(recipientEmail, email.subject, email.html);

        if (result.error) {
          await supabaseAdmin.from("email_notifications_queue")
            .update({ attempts: item.attempts + 1, last_error: result.error })
            .eq("id", item.id);
        } else {
          await supabaseAdmin.from("email_notifications_queue")
            .update({ sent_at: new Date().toISOString() })
            .eq("id", item.id);
          sent++;

          // Also send WhatsApp/Telegram for admin events
          if (ADMIN_ONLY_EVENTS.includes(item.event_type)) {
            if (email.whatsapp) await sendWhatsApp(email.whatsapp);
            if (email.telegram) await sendTelegram(email.telegram);
          }
        }
      } catch (itemErr) {
        console.error("Item error:", itemErr);
        await supabaseAdmin.from("email_notifications_queue")
          .update({ attempts: item.attempts + 1, last_error: String(itemErr) })
          .eq("id", item.id);
      }
    }

    return new Response(
      JSON.stringify({ processed: queue.length, sent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("send-notifications error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
