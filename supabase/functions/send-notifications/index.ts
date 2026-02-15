import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// ============================================
// CONFIG
// ============================================

const GMAIL_USER = "heapytomibiza@gmail.com";
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD") ?? "";
const ADMIN_EMAIL = "heapytomibiza@gmail.com";
const BRAND_NAME = "Constructive Solutions Ibiza";
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP_NUMBER") ?? "";
const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_CALLMEBOT_APIKEY") ?? "";

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
// GMAIL SMTP SENDER
// ============================================

async function sendEmail(to: string, subject: string, html: string): Promise<{ error?: string }> {
  try {
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_USER,
          password: GMAIL_APP_PASSWORD,
        },
      },
    });

    await client.send({
      from: `${BRAND_NAME} <${GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    await client.close();
    return {};
  } catch (err) {
    console.error("SMTP error:", err);
    return { error: String(err) };
  }
}

// ============================================
// WHATSAPP SENDER (Callmebot)
// ============================================

async function sendWhatsApp(message: string): Promise<void> {
  if (!ADMIN_WHATSAPP || !WHATSAPP_API_KEY) {
    console.log("WhatsApp not configured, skipping");
    return;
  }
  try {
    const encoded = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_WHATSAPP}&text=${encoded}&apikey=${WHATSAPP_API_KEY}`;
    const res = await fetch(url);
    const body = await res.text();
    console.log("WhatsApp sent:", res.status, body.substring(0, 100));
  } catch (err) {
    console.error("WhatsApp error:", err);
  }
}

// ============================================
// HELPERS
// ============================================

async function getUserEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

// ============================================
// EMAIL TEMPLATES
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

function buildMessageEmail(payload: any, siteUrl: string) {
  const preview = payload.message_preview || "New message";
  const convUrl = `${siteUrl}/messages/${payload.conversation_id}`;
  return {
    subject: `You have a new message — ${BRAND_NAME}`,
    html: emailShell(
      "linear-gradient(135deg, #374151, #4b5563)",
      "New Message",
      `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 6px; font-style: italic; border-left: 3px solid #e5e7eb; padding-left: 12px;">"${preview}"</p>
      <p style="color: #9ca3af; font-size: 13px; margin: 0 0 20px;">Reply to keep the conversation going.</p>
      <a href="${convUrl}" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View Conversation →</a>`
    ),
    whatsapp: `New message on ${BRAND_NAME}:\n"${preview.substring(0, 80)}"\n${convUrl}`,
  };
}

function buildProSignupEmail(payload: any, siteUrl: string) {
  return {
    subject: `New professional signup: ${payload.display_name}`,
    html: emailShell(
      "linear-gradient(135deg, #374151, #4b5563)",
      "New Professional Signup",
      `<h2 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${payload.display_name}</h2>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">A new professional has registered. Review their profile and services in the admin panel.</p>
      <a href="${siteUrl}/admin" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">Review in Admin →</a>`
    ),
    whatsapp: `New pro signup: ${payload.display_name}\n${siteUrl}/admin`,
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
    whatsapp: `${priorityEmoji} Support ticket ${payload.ticket_number}\nIssue: ${payload.issue_type}\nPriority: ${payload.priority}\n${siteUrl}/admin`,
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
    whatsapp: `New forum post: ${payload.title}\nBy: ${payload.author_display_name}\n${postUrl}`,
  };
}

function buildJobMatchEmail(payload: any, siteUrl: string) {
  const jobUrl = `${siteUrl}/jobs/${payload.job_id}`;
  return {
    subject: `New job match: ${payload.title} — ${payload.area || "Ibiza"}`,
    html: emailShell(
      "linear-gradient(135deg, #059669, #10b981)",
      "New Job Match",
      `<p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: -12px 0 16px; text-align: center;">A job matching your services was just posted</p>
      <h2 style="margin: 0 0 4px; color: #111827; font-size: 18px;">${payload.title}</h2>
      <p style="color: #9ca3af; font-size: 13px; margin: 0 0 16px;">${payload.category || ""}</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">📍 Location</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.area || "Ibiza"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">💶 Budget</td><td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${payload.budget || "To be discussed"}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">⏱️ Timing</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${payload.timing || "Flexible"}</td></tr>
      </table>
      <a href="${jobUrl}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">View Job & Respond →</a>`,
      `© ${new Date().getFullYear()} ${BRAND_NAME} — You're receiving this because this job matches your services`
    ),
    whatsapp: `New job: ${payload.title}\n${payload.area || "Ibiza"}\n${payload.budget || "TBD"}\n${jobUrl}`,
  };
}

// ============================================
// HANDLER
// ============================================

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data: queue, error: queueError } = await supabaseAdmin
      .from("email_notifications_queue")
      .select("*")
      .is("sent_at", null)
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(20);

    if (queueError) throw queueError;
    if (!queue || queue.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://constructivesolutionsibiza.com";
    let sent = 0;

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (i > 0) await new Promise(r => setTimeout(r, 600));
      
      try {
        // Resolve recipient
        let recipientEmail: string | null = null;
        const adminOnlyEvents = ["pro_signup", "support_ticket", "forum_post"];
        
        if (!item.recipient_user_id || adminOnlyEvents.includes(item.event_type)) {
          recipientEmail = ADMIN_EMAIL;
        } else {
          recipientEmail = await getUserEmail(item.recipient_user_id);
          // Route all to admin until domain verified
          if (recipientEmail && recipientEmail !== ADMIN_EMAIL) {
            recipientEmail = ADMIN_EMAIL;
          }
        }

        if (!recipientEmail) {
          await supabaseAdmin
            .from("email_notifications_queue")
            .update({ attempts: item.attempts + 1, last_error: "Could not resolve recipient email" })
            .eq("id", item.id);
          continue;
        }

        // Check notification preferences
        if (item.recipient_user_id && (item.event_type === "new_message" || item.event_type === "job_match")) {
          const { data: prefs } = await supabaseAdmin
            .from("notification_preferences")
            .select("email_messages, email_job_matches")
            .eq("user_id", item.recipient_user_id)
            .maybeSingle();

          const allow =
            item.event_type === "new_message" ? (prefs?.email_messages ?? true) :
            item.event_type === "job_match" ? (prefs?.email_job_matches ?? true) :
            true;

          if (!allow) {
            await supabaseAdmin
              .from("email_notifications_queue")
              .update({ sent_at: new Date().toISOString(), last_error: "skipped_by_preferences" })
              .eq("id", item.id);
            continue;
          }
        }

        // Build email
        const payload = item.payload || {};
        let email: { subject: string; html: string; whatsapp?: string };

        switch (item.event_type) {
          case "new_message":
            email = buildMessageEmail(payload, siteUrl);
            break;
          case "pro_signup":
            email = buildProSignupEmail(payload, siteUrl);
            break;
          case "support_ticket":
            email = buildSupportTicketEmail(payload, siteUrl);
            break;
          case "job_match":
            email = buildJobMatchEmail(payload, siteUrl);
            break;
          case "forum_post":
            email = buildForumPostEmail(payload, siteUrl);
            break;
          default:
            await supabaseAdmin
              .from("email_notifications_queue")
              .update({ attempts: item.attempts + 1, last_error: `Unknown event_type: ${item.event_type}` })
              .eq("id", item.id);
            continue;
        }

        // Send email via Gmail SMTP
        const result = await sendEmail(recipientEmail, email.subject, email.html);

        if (result.error) {
          await supabaseAdmin
            .from("email_notifications_queue")
            .update({ attempts: item.attempts + 1, last_error: result.error })
            .eq("id", item.id);
        } else {
          await supabaseAdmin
            .from("email_notifications_queue")
            .update({ sent_at: new Date().toISOString() })
            .eq("id", item.id);
          sent++;

          // Also send WhatsApp for admin-targeted events
          if (email.whatsapp && adminOnlyEvents.includes(item.event_type)) {
            await sendWhatsApp(email.whatsapp);
          }
        }
      } catch (itemErr) {
        console.error("Item error:", itemErr);
        await supabaseAdmin
          .from("email_notifications_queue")
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
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
