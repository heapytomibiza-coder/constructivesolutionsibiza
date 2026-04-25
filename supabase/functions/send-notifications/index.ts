import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import nodemailer from "npm:nodemailer@6.9.12";
import { Resend } from "npm:resend@4.1.2";

// ============================================
// CONFIG
// ============================================

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") ?? "465", 10);
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? Deno.env.get("GMAIL_APP_PASSWORD") ?? "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? "info@constructivesolutionsibiza.com";

// SMTP_SECURE: respect explicit env, else true only on 465 (implicit TLS).
// Port 587 → secure=false → nodemailer upgrades via STARTTLS automatically.
function resolveSmtpSecure(): boolean {
  const raw = Deno.env.get("SMTP_SECURE");
  if (raw !== undefined && raw !== "") {
    return raw.toLowerCase() === "true" || raw === "1";
  }
  return SMTP_PORT === 465;
}
const SMTP_SECURE = resolveSmtpSecure();

// Resend domain verification gate. The domain in RESEND_FROM must be verified
// at Resend; otherwise every send returns "domain is not verified". Set
// RESEND_DOMAIN_VERIFIED=true once the domain shows verified at resend.com.
const RESEND_DOMAIN_VERIFIED = (Deno.env.get("RESEND_DOMAIN_VERIFIED") ?? "").toLowerCase() === "true";
const BRAND_NAME = "Constructive Solutions Ibiza";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "info@constructivesolutionsibiza.com";
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP_NUMBER") ?? "";
const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_CALLMEBOT_APIKEY") ?? "";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";

// Resend transport (primary, with SMTP fallback)
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") || SMTP_FROM;
const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ============================================
// SMTP EMAIL SENDER
// ============================================

type FailureType =
  | "SMTP_AUTH_FAILED"
  | "RESEND_DOMAIN_UNVERIFIED"
  | "PROVIDER_CONFIG_MISSING"
  | "PROVIDER_SEND_FAILED";

interface SendResult {
  ok: boolean;
  provider: "resend" | "smtp" | "none";
  messageId?: string;
  error?: string;
  failureType?: FailureType;
  correlationId: string;
}

function classifySmtpError(err: unknown): FailureType {
  const msg = String(err).toLowerCase();
  if (msg.includes("535") || msg.includes("invalid login") || msg.includes("authentication")) {
    return "SMTP_AUTH_FAILED";
  }
  return "PROVIDER_SEND_FAILED";
}

function newCorrelationId(): string {
  return `email-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  correlationIdIn?: string,
): Promise<SendResult> {
  const correlationId = correlationIdIn ?? newCorrelationId();
  let resendError: string | undefined;
  let lastFailure: FailureType | undefined;

  // --- Resend (primary, only when domain is verified) ---
  if (resendClient && RESEND_DOMAIN_VERIFIED) {
    try {
      console.log(JSON.stringify({
        scope: "email", correlationId, provider: "resend", phase: "attempt",
        to, from: RESEND_FROM,
      }));
      const { data, error: apiError } = await resendClient.emails.send({
        from: `${BRAND_NAME} <${RESEND_FROM}>`,
        to: [to],
        subject,
        html,
      });
      if (apiError) {
        resendError = `Resend API: ${apiError.message}`;
        lastFailure = /not verified|domain/i.test(apiError.message)
          ? "RESEND_DOMAIN_UNVERIFIED"
          : "PROVIDER_SEND_FAILED";
        console.error(JSON.stringify({
          scope: "email", correlationId, provider: "resend", phase: "fail",
          failureType: lastFailure, to, reason: apiError.message,
        }));
      } else {
        const messageId = data?.id ?? "unknown";
        console.log(JSON.stringify({
          scope: "email", correlationId, provider: "resend", phase: "sent",
          to, messageId, subject,
        }));
        return { ok: true, provider: "resend", messageId, correlationId };
      }
    } catch (err) {
      resendError = `Resend transport: ${String(err)}`;
      lastFailure = "PROVIDER_SEND_FAILED";
      console.error(JSON.stringify({
        scope: "email", correlationId, provider: "resend", phase: "fail",
        failureType: lastFailure, to, reason: String(err),
      }));
    }
  } else if (resendClient && !RESEND_DOMAIN_VERIFIED) {
    resendError = "Resend skipped: RESEND_DOMAIN_VERIFIED is not 'true'";
    lastFailure = "RESEND_DOMAIN_UNVERIFIED";
    console.warn(JSON.stringify({
      scope: "email", correlationId, provider: "resend", phase: "skipped",
      failureType: lastFailure, reason: "RESEND_DOMAIN_VERIFIED!=true",
    }));
  }

  // --- SMTP (fallback) ---
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    const reason = "SMTP not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASSWORD)";
    console.error(JSON.stringify({
      scope: "email", correlationId, provider: "smtp", phase: "skipped",
      failureType: "PROVIDER_CONFIG_MISSING", reason,
    }));
    return {
      ok: false, provider: "none",
      error: resendError ? `${resendError}; ${reason}` : reason,
      failureType: "PROVIDER_CONFIG_MISSING",
      correlationId,
    };
  }

  const starttls = !SMTP_SECURE && SMTP_PORT === 587;
  console.log(JSON.stringify({
    scope: "email", correlationId, provider: "smtp", phase: "attempt",
    to, host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, starttls,
    from: SMTP_FROM, user_masked: maskUser(SMTP_USER),
  }));

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE, // 465 = implicit TLS; 587 = false → STARTTLS upgrade
      requireTLS: starttls,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });

    const info = await transporter.sendMail({
      from: `"${BRAND_NAME}" <${SMTP_FROM}>`,
      to,
      subject,
      text: htmlToPlainText(html),
      html,
    });

    const messageId = info?.messageId ?? "unknown";
    console.log(JSON.stringify({
      scope: "email", correlationId, provider: "smtp", phase: "sent",
      to, messageId, subject, host: SMTP_HOST, port: SMTP_PORT,
      secure: SMTP_SECURE, starttls,
    }));
    return { ok: true, provider: "smtp", messageId, correlationId };
  } catch (err) {
    const failureType = classifySmtpError(err);
    const smtpError = `SMTP: ${String(err)}`;
    console.error(JSON.stringify({
      scope: "email", correlationId, provider: "smtp", phase: "fail",
      failureType, to, host: SMTP_HOST, port: SMTP_PORT,
      secure: SMTP_SECURE, starttls, reason: String(err),
    }));
    return {
      ok: false, provider: "none",
      error: resendError ? `${resendError}; ${smtpError}` : smtpError,
      failureType,
      correlationId,
    };
  }
}

function maskUser(user: string): string {
  if (!user) return "";
  const [name, domain] = user.split("@");
  if (!domain) return `${user.slice(0, 2)}***`;
  return `${name.slice(0, 2)}***@${domain}`;
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
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: "HTML", disable_web_page_preview: false }),
    });
    await res.text();
  } catch (err) {
    console.error("Telegram error:", err);
  }
}

async function sendTelegramPhoto(photoUrl: string, caption: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    // If it's a base64 data URI, upload as multipart form data
    if (photoUrl.startsWith("data:")) {
      const match = photoUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) {
        console.warn("Telegram photo: invalid data URI, falling back to text");
        await sendTelegram(caption);
        return;
      }
      const ext = match[1];
      const base64Data = match[2];
      // Skip if base64 is too large (>8MB decoded ≈ >10.6MB base64 string)
      if (base64Data.length > 10_600_000) {
        console.warn("Telegram photo: base64 too large, falling back to text");
        await sendTelegram(caption);
        return;
      }
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      const formData = new FormData();
      formData.append("chat_id", TELEGRAM_CHAT_ID);
      formData.append("caption", caption);
      formData.append("parse_mode", "HTML");
      formData.append("photo", new Blob([binaryData], { type: `image/${ext}` }), `photo.${ext}`);

      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("Telegram sendPhoto (base64) failed:", res.status, body);
        await sendTelegram(caption);
      }
    } else {
      // Regular URL
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          photo: photoUrl,
          caption,
          parse_mode: "HTML",
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("Telegram sendPhoto failed:", res.status, body);
        // Fall back to text-only
        await sendTelegram(caption);
      }
    }
  } catch (err) {
    console.error("Telegram photo error:", err);
    // Fall back to text-only
    await sendTelegram(caption);
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
    // Telegram handled by send-job-notification (richer format with trade breadcrumb, budget, timing, photo)
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
    telegram: `👤 <b>NEW USER</b>\n${escapeHtml(payload.display_name || payload.email || "Unknown")}\nIntent: ${escapeHtml(payload.intent || "client")}\n\n👉 ${siteUrl}/dashboard/admin?tab=users`,
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
    telegram: `🐛 <b>BUG REPORT</b>\n${escapeHtml(payload.description?.substring(0, 200) || "No description")}\n📍 ${escapeHtml(payload.route || "Unknown page")}\n\n👉 ${siteUrl}/dashboard/admin?tab=support`,
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
    telegram: `⚠️ <b>PLATFORM ERROR</b>\n${escapeHtml(payload.error_type || "Unknown")}\n${escapeHtml((payload.message || "").substring(0, 150))}\n\n👉 ${siteUrl}/dashboard/admin?tab=health`,
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
    telegram: `${priorityEmoji} <b>SUPPORT TICKET</b>\n${escapeHtml(payload.ticket_number)}: ${escapeHtml(payload.issue_type)}\n\n👉 ${siteUrl}/dashboard/admin?tab=support`,
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
    telegram: `🔧 <b>NEW PRO SIGNUP</b>\n${escapeHtml(payload.display_name)}\n\n👉 ${siteUrl}/dashboard/admin?tab=users`,
  };
}

function buildNewServiceEmail(payload: any, siteUrl: string) {
  return {
    subject: `🔧 New service added: ${payload.micro_name} by ${payload.display_name}`,
    html: emailShell(
      "linear-gradient(135deg, #7c3aed, #8b5cf6)",
      "New Service Added",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload.micro_name}</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Professional</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.display_name}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Category</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.category_name}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service Slug</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.micro_slug}</td></tr>
      </table>
      <a href="${siteUrl}/dashboard/admin?tab=users" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">Review in Admin →</a>`
    ),
    whatsapp: `🔧 New service: ${payload.micro_name}\nBy: ${payload.display_name}\nCategory: ${payload.category_name}`,
    telegram: `🔧 <b>NEW SERVICE ADDED</b>\n<b>${escapeHtml(payload.micro_name)}</b>\nBy: ${escapeHtml(payload.display_name)}\nCategory: ${escapeHtml(payload.category_name)}\n\n👉 ${siteUrl}/dashboard/admin?tab=users`,
  };
}

function buildListingReadyEmail(payload: any, siteUrl: string) {
  return {
    subject: `✅ Listing ready for review: "${payload.display_title}" by ${payload.display_name}`,
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      "Listing Ready for Review",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload.display_title}</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Professional</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.display_name}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Service</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.micro_name}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Category</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.category_name}</td></tr>
      </table>
      <p style="color: #059669; font-weight: 600; margin: 0 0 16px;">✅ This listing has title, description, and pricing — ready for your approval.</p>
      <a href="${siteUrl}/admin?tab=listings" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">Review & Approve →</a>`
    ),
    whatsapp: `✅ Listing ready: "${payload.display_title}"\nBy: ${payload.display_name}\nService: ${payload.micro_name}\n\nReview → ${siteUrl}/admin?tab=listings`,
    telegram: `✅ <b>LISTING READY FOR REVIEW</b>\n<b>${escapeHtml(payload.display_title)}</b>\nBy: ${escapeHtml(payload.display_name)}\nService: ${escapeHtml(payload.micro_name)}\n\n👉 ${siteUrl}/admin?tab=listings`,
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
    telegram: `💬 <b>NEW FORUM POST</b>\n<b>${escapeHtml(payload.title || "Untitled")}</b>\nBy: ${escapeHtml(payload.author_display_name || "Community Member")}\n\n👉 ${siteUrl}/forum/post/${payload.post_id}`,
    ...(payload._first_photo ? { telegram_photo: payload._first_photo } : {}),
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
      <a href="${siteUrl}${isTasker ? "/dashboard/pro" : "/post-job"}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">${isTasker ? "Complete Your Profile →" : "Post Your First Job →"}</a>
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
      <a href="${siteUrl}/dashboard/pro" style="display: inline-block; background: ${accepted ? "#059669" : "#6b7280"}; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">${accepted ? "View Job →" : "Browse Jobs →"}</a>`
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
      <a href="${siteUrl}/${payload.is_tasker ? "dashboard/pro" : "dashboard"}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View Dashboard →</a>`
    ),
  };
}

// ============================================
// EMAIL TEMPLATES — DISPUTE NOTIFICATIONS
// ============================================

async function enrichDisputePayload(payload: any): Promise<any> {
  if (payload.job_id) {
    try {
      const { data: job } = await supabaseAdmin
        .from("jobs")
        .select("title, category, area")
        .eq("id", payload.job_id)
        .single();
      if (job) {
        payload._job_title = job.title;
        payload._job_area = job.area || "Ibiza";
      }
    } catch (_) { /* ignore */ }
  }
  return payload;
}

function buildDisputeOpenedEmail(payload: any, siteUrl: string) {
  const issueList = (payload.issue_types || []).map((t: string) => t.replace(/_/g, " ")).join(", ");
  const deadlineStr = payload.response_deadline
    ? new Date(payload.response_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "48 hours";
  const disputeUrl = `${siteUrl}/disputes/${payload.dispute_id}/respond`;
  return {
    subject: `Action required: Issue raised on your project`,
    html: emailShell(
      "linear-gradient(135deg, #dc2626, #ef4444)",
      "Issue Raised on Your Project",
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">A concern has been raised regarding: <strong>${payload._job_title || "your project"}</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Issues</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${issueList || "Not specified"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Raised by</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.raised_by_role === "client" ? "Client" : "Professional"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Response deadline</td><td style="padding: 8px 0; color: #dc2626; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">${deadlineStr}</td></tr>
        ${payload.requested_outcome ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Requested outcome</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.requested_outcome.replace(/_/g, " ")}</td></tr>` : ""}
      </table>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 20px;">All responses are recorded and used to reach a fair outcome.</p>
      <a href="${disputeUrl}" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">View & Respond →</a>`
    ),
  };
}

function buildAdminDisputeOpenedEmail(payload: any, siteUrl: string) {
  const issueList = (payload.issue_types || []).map((t: string) => t.replace(/_/g, " ")).join(", ");
  return {
    subject: `⚠️ New dispute opened: ${payload._job_title || "Unknown project"}`,
    html: emailShell(
      "linear-gradient(135deg, #dc2626, #ef4444)",
      "⚠️ New Dispute",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload._job_title || "Unknown project"}</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Issues</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${issueList || "N/A"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Raised by</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.raised_by_role || "N/A"}</td></tr>
      </table>
      <a href="${siteUrl}/dashboard/admin" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View in Admin →</a>`
    ),
    whatsapp: `⚠️ New dispute: ${payload._job_title || "Unknown"}\nIssues: ${issueList}`,
    telegram: `⚠️ <b>NEW DISPUTE</b>\n<b>${escapeHtml(payload._job_title || "Unknown")}</b>\nIssues: ${escapeHtml(issueList)}\nBy: ${escapeHtml(payload.raised_by_role || "N/A")}\n\n👉 ${siteUrl}/dashboard/admin`,
  };
}

function buildDisputeResponseEmail(payload: any, siteUrl: string) {
  const disputeUrl = `${siteUrl}/disputes/${payload.dispute_id}`;
  return {
    subject: `Response received on your dispute — ${payload._job_title || "your project"}`,
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      "Response Received",
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">The other party has submitted their response regarding: <strong>${payload._job_title || "your project"}</strong></p>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">Both statements will now be reviewed to identify agreed facts and disputed points.</p>
      <a href="${disputeUrl}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">View Case →</a>`
    ),
  };
}

function buildDisputeEvidenceEmail(payload: any, siteUrl: string) {
  const disputeUrl = `${siteUrl}/disputes/${payload.dispute_id}`;
  return {
    subject: `New evidence uploaded — ${payload._job_title || "your dispute"}`,
    html: emailShell(
      "linear-gradient(135deg, #3b82f6, #6366f1)",
      "New Evidence Submitted",
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">New evidence has been uploaded to the dispute regarding: <strong>${payload._job_title || "your project"}</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Type</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${(payload.evidence_category || payload.file_type || "Document").replace(/_/g, " ")}</td></tr>
      </table>
      <a href="${disputeUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">View Evidence →</a>`
    ),
  };
}

function buildDeadlineApproachingEmail(payload: any, siteUrl: string) {
  const isEvidence = payload.deadline_type === "evidence";
  const deadlineStr = payload.deadline
    ? new Date(payload.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : `${payload.hours_remaining} hours`;
  const disputeUrl = isEvidence
    ? `${siteUrl}/disputes/${payload.dispute_id}`
    : `${siteUrl}/disputes/${payload.dispute_id}/respond`;
  return {
    subject: `⏰ ${payload.hours_remaining}h remaining: ${isEvidence ? "Evidence" : "Response"} deadline approaching`,
    html: emailShell(
      "linear-gradient(135deg, #d97706, #f59e0b)",
      `⏰ Deadline Approaching`,
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">You have <strong>${payload.hours_remaining} hours</strong> remaining to submit your ${isEvidence ? "evidence" : "response"} regarding: <strong>${payload._job_title || "your project"}</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Deadline</td><td style="padding: 8px 0; color: #dc2626; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">${deadlineStr}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Type</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${isEvidence ? "Evidence submission" : "Response to dispute"}</td></tr>
      </table>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 20px;">If the deadline passes without a ${isEvidence ? "submission" : "response"}, the case will progress automatically.</p>
      <a href="${disputeUrl}" style="display: inline-block; background: #d97706; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">${isEvidence ? "Upload Evidence →" : "Respond Now →"}</a>`
    ),
  };
}

function buildDeadlinePassedEmail(payload: any, siteUrl: string) {
  const disputeUrl = `${siteUrl}/disputes/${payload.dispute_id}/respond`;
  return {
    subject: `⚠️ Response deadline has passed — ${payload._job_title || "your dispute"}`,
    html: emailShell(
      "linear-gradient(135deg, #dc2626, #ef4444)",
      "⚠️ Deadline Passed",
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">The response deadline for the dispute regarding <strong>${payload._job_title || "your project"}</strong> has passed.</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">You have a <strong>${payload.grace_hours || 24} hour grace period</strong> to submit your response. After that, the case will automatically progress without your input.</p>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 20px;">All responses are recorded and used to reach a fair outcome.</p>
      <a href="${disputeUrl}" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">Respond Now →</a>`
    ),
  };
}

function buildDeadlinePassedRaiserEmail(payload: any, siteUrl: string) {
  const disputeUrl = `${siteUrl}/disputes/${payload.dispute_id}`;
  return {
    subject: `Update: Response deadline passed — ${payload._job_title || "your dispute"}`,
    html: emailShell(
      "linear-gradient(135deg, #6b7280, #9ca3af)",
      "Deadline Update",
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">The counterparty's response deadline for your dispute regarding <strong>${payload._job_title || "your project"}</strong> has passed without a response.</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">A grace period is in effect. If no response is received, the case will automatically progress based on the information available.</p>
      <a href="${disputeUrl}" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">View Case →</a>`
    ),
  };
}

function buildAdminDeadlinePassedEmail(payload: any, siteUrl: string) {
  const issueList = (payload.issue_types || []).map((t: string) => t.replace(/_/g, " ")).join(", ");
  return {
    subject: `⚠️ Dispute deadline passed: ${payload._job_title || "Unknown"}`,
    html: emailShell(
      "linear-gradient(135deg, #dc2626, #ef4444)",
      "⚠️ Deadline Passed",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload._job_title || "Unknown project"}</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Status</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${(payload.status || "").replace(/_/g, " ")}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Issues</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${issueList || "N/A"}</td></tr>
      </table>
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px;">Counterparty has not responded. Auto-advance will trigger after grace period.</p>
      <a href="${siteUrl}/dashboard/admin" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View in Admin →</a>`
    ),
    telegram: `⚠️ <b>DEADLINE PASSED</b>\n<b>${escapeHtml(payload._job_title || "Unknown")}</b>\nStatus: ${escapeHtml((payload.status || "").replace(/_/g, " "))}\nNo counterparty response\n\n👉 ${siteUrl}/dashboard/admin`,
  };
}

function buildAutoAdvancedEmail(payload: any, siteUrl: string) {
  const disputeUrl = `${siteUrl}/disputes/${payload.dispute_id}`;
  const newStatusLabel = (payload.new_status || "").replace(/_/g, " ");
  return {
    subject: `Case progressed automatically — ${payload._job_title || "your dispute"}`,
    html: emailShell(
      "linear-gradient(135deg, #6b7280, #9ca3af)",
      "Case Progressed",
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">The dispute regarding <strong>${payload._job_title || "your project"}</strong> has automatically progressed to: <strong>${newStatusLabel}</strong></p>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">This occurred because the response deadline passed. The case will continue based on the information currently available.</p>
      <a href="${disputeUrl}" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">View Case →</a>`
    ),
  };
}

// ============================================
// NUDGE EMAIL TEMPLATES
// ============================================

const NUDGE_EVENTS = [
  "nudge_draft_stale", "nudge_quotes_pending", "nudge_conversation_stale",
  "nudge_pro_no_quote", "nudge_review_reminder", "nudge_onboarding_incomplete",
];

function buildNudgeEmail(eventType: string, payload: any, siteUrl: string): EmailResult | null {
  // process-nudges sets subject + body in payload; wrap in email shell
  const subject = payload.subject;
  const body = payload.body;
  if (!subject || !body) return null;

  const ctaUrl = payload.job_id ? `${siteUrl}/dashboard/my-jobs` : `${siteUrl}/dashboard`;
  const ctaLabel = eventType === "nudge_pro_no_quote" ? "View Job →"
    : eventType === "nudge_review_reminder" ? "Leave a Review →"
    : "View Your Jobs →";

  const html = emailShell(
    "linear-gradient(135deg, #f59e0b, #d97706)",
    "Reminder",
    `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">${escapeHtml(body)}</p>
    <a href="${ctaUrl}" style="display: inline-block; background: #d97706; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">${ctaLabel}</a>`,
    `You're receiving this because you have an active project. <a href="${siteUrl}/dashboard/settings" style="color: #9ca3af;">Manage preferences</a>`
  );

  return { subject, html };
}

// ============================================
// EVENT → TEMPLATE ROUTER
// ============================================

type EmailResult = { subject: string; html: string; whatsapp?: string; telegram?: string; telegram_photo?: string };

const ADMIN_ONLY_EVENTS = [
  "admin_new_job", "admin_new_user", "pro_signup", "support_ticket",
  "forum_post", "bug_report", "platform_error", "contact_form", "new_service",
  "listing_ready_for_review", "admin_dispute_opened", "admin_dispute_deadline_passed",
];

const DISPUTE_EVENTS = [
  "dispute_opened", "admin_dispute_opened", "dispute_response_submitted", "dispute_evidence_uploaded",
  "dispute_deadline_approaching", "dispute_deadline_passed", "dispute_deadline_passed_raiser",
  "admin_dispute_deadline_passed", "dispute_auto_advanced",
];

function buildOnboardingNudgeEmail(payload: any, siteUrl: string): EmailResult {
  const name = payload.display_name || payload.business_name || "there";
  const phase = payload.onboarding_phase || "not_started";
  const isAlmostDone = phase === "service_setup";

  const phaseMessage = isAlmostDone
    ? "You're almost there — just finish setting up your service areas and you'll be live."
    : "Complete your profile to start receiving job matches from clients in Ibiza.";

  return {
    subject: "Complete your profile — new opportunities are waiting",
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      "New Opportunities Are Waiting",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">Hi ${escapeHtml(name)} 👋</h2>
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Clients are posting jobs in your area right now, and we'd love to connect you with them.</p>
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">${phaseMessage}</p>
      ${isAlmostDone ? `<p style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 16px; color: #166534; font-size: 14px; margin: 0 0 20px;">🎯 <strong>You're 90% done</strong> — just a few more minutes to complete your setup.</p>` : ""}
      <a href="${siteUrl}/onboarding/professional" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 15px;">Complete Your Profile →</a>
      <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0; text-align: center;">Need help? Reply to this email anytime.</p>`,
      `© ${new Date().getFullYear()} ${BRAND_NAME} — <a href="${siteUrl}/dashboard/settings" style="color: #9ca3af;">Manage preferences</a>`
    ),
  };
}

function buildEmail(eventType: string, payload: any, siteUrl: string): EmailResult | null {
  // Onboarding nudge — dedicated template (not generic nudge)
  if (eventType === "nudge_onboarding_incomplete") {
    return buildOnboardingNudgeEmail(payload, siteUrl);
  }

  // Nudge events — payload-driven template
  if (NUDGE_EVENTS.includes(eventType)) {
    return buildNudgeEmail(eventType, payload, siteUrl);
  }

  switch (eventType) {
    // Admin alerts
    case "admin_new_job":     return buildAdminNewJobEmail(payload, siteUrl);
    case "admin_new_user":    return buildAdminNewUserEmail(payload, siteUrl);
    case "pro_signup":        return buildProSignupEmail(payload, siteUrl);
    case "support_ticket":    return buildSupportTicketEmail(payload, siteUrl);
    case "forum_post":        return buildForumPostEmail(payload, siteUrl);
    case "bug_report":        return buildBugReportEmail(payload, siteUrl);
    case "platform_error":    return buildPlatformErrorEmail(payload, siteUrl);
    case "new_service":       return buildNewServiceEmail(payload, siteUrl);
    case "listing_ready_for_review": return buildListingReadyEmail(payload, siteUrl);
    // Dispute notifications
    case "dispute_opened":              return buildDisputeOpenedEmail(payload, siteUrl);
    case "admin_dispute_opened":        return buildAdminDisputeOpenedEmail(payload, siteUrl);
    case "dispute_response_submitted":  return buildDisputeResponseEmail(payload, siteUrl);
    case "dispute_evidence_uploaded":   return buildDisputeEvidenceEmail(payload, siteUrl);
    case "dispute_deadline_approaching": return buildDeadlineApproachingEmail(payload, siteUrl);
    case "dispute_deadline_passed":      return buildDeadlinePassedEmail(payload, siteUrl);
    case "dispute_deadline_passed_raiser": return buildDeadlinePassedRaiserEmail(payload, siteUrl);
    case "admin_dispute_deadline_passed": return buildAdminDeadlinePassedEmail(payload, siteUrl);
    case "dispute_auto_advanced":        return buildAutoAdvancedEmail(payload, siteUrl);
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

/**
 * Health probe — INTERNAL_FUNCTION_SECRET only.
 *
 * GET/POST  ?probe=1            → returns provider config (no send)
 * GET/POST  ?probe=1&to=foo@bar → also sends a single test email
 *
 * Never exposes passwords. Auth is enforced upstream in `handler` via the
 * x-internal-secret header check.
 */
async function handleHealthProbe(req: Request): Promise<Response> {
  const headers = { "Content-Type": "application/json", ...getCorsHeaders(req) };
  const url = new URL(req.url);
  const testTo = url.searchParams.get("to");

  const config = {
    resend: {
      configured: Boolean(RESEND_API_KEY),
      domain_verified_flag: RESEND_DOMAIN_VERIFIED,
      from: RESEND_FROM,
      will_attempt: Boolean(RESEND_API_KEY) && RESEND_DOMAIN_VERIFIED,
    },
    smtp: {
      configured: Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD),
      host: SMTP_HOST || null,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      mode: SMTP_SECURE ? "implicit-tls" : (SMTP_PORT === 587 ? "starttls" : "plain"),
      from: SMTP_FROM,
      user_masked: maskUser(SMTP_USER),
      password_present: Boolean(SMTP_PASSWORD),
    },
    timestamp: new Date().toISOString(),
  };

  if (!testTo) {
    return new Response(JSON.stringify({ probe: true, config }), { status: 200, headers });
  }

  const testHtml = emailShell(
    "linear-gradient(135deg, #059669, #10b981)",
    "Email Health Probe",
    `<p style="color: #374151; font-size: 15px; line-height: 1.6;">Health-probe test from <strong>${BRAND_NAME}</strong>.</p>
     <p style="color: #6b7280; font-size: 13px;">Provider order: Resend (verified=${RESEND_DOMAIN_VERIFIED}) → SMTP ${SMTP_HOST}:${SMTP_PORT} secure=${SMTP_SECURE}</p>
     <p style="color: #6b7280; font-size: 13px;">Sent at: ${new Date().toISOString()}</p>`
  );
  const result = await sendEmail(testTo, `Health probe — ${BRAND_NAME}`, testHtml);

  return new Response(
    JSON.stringify({
      probe: true,
      config,
      send: {
        attempted: true,
        ok: result.ok,
        provider: result.provider,
        messageId: result.messageId || null,
        error: result.error || null,
      },
    }),
    { status: result.ok ? 200 : 502, headers }
  );
}

// ============================================
// MAIN QUEUE PROCESSOR
// ============================================

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: internal secret OR Bearer token (pg_cron compatibility)
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  const providedSecret = req.headers.get("x-internal-secret");
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const isInternalAuth = internalSecret && providedSecret === internalSecret;
  // Accept any Bearer token (pg_cron sends anon key which isn't available as env var)
  const isBearerAuth = bearerToken.length > 20 || (bearerToken && bearerToken === serviceKey);
  if (!isInternalAuth && !isBearerAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const url = new URL(req.url);

    // Health probe — INTERNAL_FUNCTION_SECRET required
    if (url.searchParams.get("probe") === "1") {
      if (!isInternalAuth) {
        return new Response(
          JSON.stringify({ error: "Forbidden: probe requires x-internal-secret" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      return handleHealthProbe(req);
    }

    // Legacy admin test endpoint (kept for back-compat) — now routes to probe
    if (url.searchParams.get("test_email") === "1" && isInternalAuth) {
      return handleHealthProbe(req);
    }

    // Fetch pending queue items
    const { data: queue, error: queueError } = await supabaseAdmin
      .from("email_notifications_queue")
      .select("*")
      .is("sent_at", null)
      .is("failed_at", null)
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

        // Check notification preferences for preference-controlled events
        const PREFERENCE_CONTROLLED_EVENTS = [
          "new_message", "job_match", "quote_received", "welcome", "job_posted_confirm",
          ...NUDGE_EVENTS,
        ];
        if (item.recipient_user_id && PREFERENCE_CONTROLLED_EVENTS.includes(item.event_type)) {
          const { data: prefs } = await supabaseAdmin
            .from("notification_preferences")
            .select("email_messages, email_job_matches, email_quotes, email_project_updates")
            .eq("user_id", item.recipient_user_id)
            .maybeSingle();

          const prefMap: Record<string, boolean> = {
            new_message: prefs?.email_messages ?? true,
            job_match: prefs?.email_job_matches ?? true,
            quote_received: prefs?.email_quotes ?? true,
            welcome: prefs?.email_project_updates ?? true,
            job_posted_confirm: prefs?.email_project_updates ?? true,
          };
          // All nudge_* events use email_project_updates
          for (const ne of NUDGE_EVENTS) {
            prefMap[ne] = prefs?.email_project_updates ?? true;
          }
          const allow = prefMap[item.event_type] ?? true;

          if (!allow) {
            await supabaseAdmin.from("email_notifications_queue")
              .update({ sent_at: new Date().toISOString(), last_error: "skipped_by_preferences" })
              .eq("id", item.id);
            continue;
          }
        }

        // Enrich payload with photos for supported event types
        const payload = { ...(item.payload || {}) } as any;
        
        if (item.event_type === "admin_new_job" && payload.job_id) {
          try {
            const { data: jobRow } = await supabaseAdmin
              .from("jobs")
              .select("answers")
              .eq("id", payload.job_id)
              .single();
            const photos = (jobRow?.answers as any)?.extras?.photos;
            if (Array.isArray(photos) && photos.length > 0) {
              payload._first_photo = photos[0];
            }
          } catch (_) { /* ignore */ }
        }

        if (item.event_type === "forum_post" && payload.post_id) {
          try {
            const { data: postRow } = await supabaseAdmin
              .from("forum_posts")
              .select("photos")
              .eq("id", payload.post_id)
              .single();
            if (Array.isArray(postRow?.photos) && postRow.photos.length > 0) {
              payload._first_photo = postRow.photos[0];
            }
          } catch (_) { /* ignore */ }
        }

        // Enrich dispute payloads with job title
        if (DISPUTE_EVENTS.includes(item.event_type) && payload.job_id) {
          await enrichDisputePayload(payload);
        }

        // Build and send
        const email = buildEmail(item.event_type, payload, siteUrl);

        if (!email) {
          const newAttempts = item.attempts + 1;
          await supabaseAdmin.from("email_notifications_queue")
            .update({ attempts: newAttempts, last_error: `Unknown event_type: ${item.event_type}`, ...(newAttempts >= 3 ? { failed_at: new Date().toISOString() } : {}) })
            .eq("id", item.id);
          continue;
        }

        const result = await sendEmail(recipientEmail, email.subject, email.html);

        if (!result.ok) {
          const newAttempts = item.attempts + 1;
          await supabaseAdmin.from("email_notifications_queue")
            .update({ attempts: newAttempts, last_error: `[${result.provider}] ${result.error}`, ...(newAttempts >= 3 ? { failed_at: new Date().toISOString() } : {}) })
            .eq("id", item.id);
        } else {
          await supabaseAdmin.from("email_notifications_queue")
            .update({ sent_at: new Date().toISOString(), last_error: `provider:${result.provider}` })
            .eq("id", item.id);
          sent++;

          // Also send WhatsApp/Telegram for admin events
          if (ADMIN_ONLY_EVENTS.includes(item.event_type)) {
            if (email.whatsapp) await sendWhatsApp(email.whatsapp);
            if (email.telegram_photo) {
              await sendTelegramPhoto(email.telegram_photo, email.telegram || "");
            } else if (email.telegram) {
              await sendTelegram(email.telegram);
            }
          }
        }
      } catch (itemErr) {
        console.error("Item error:", itemErr);
        const newAttempts = item.attempts + 1;
        await supabaseAdmin.from("email_notifications_queue")
          .update({ attempts: newAttempts, last_error: String(itemErr), ...(newAttempts >= 3 ? { failed_at: new Date().toISOString() } : {}) })
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
