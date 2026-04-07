import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const PRIMARY_FROM = "CS Ibiza <noreply@csibiza.com>";
const FALLBACK_FROM = "CS Ibiza <onboarding@resend.dev>";
const NOTIFY_EMAIL = Deno.env.get("ADMIN_EMAIL");
if (!NOTIFY_EMAIL) {
  console.error("ADMIN_EMAIL secret is not configured");
}

import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function sendWithFallback(to: string, subject: string, html: string) {
  const primary = await resend.emails.send({
    from: PRIMARY_FROM, to: [to], subject, html,
  });
  if (!primary.error) return primary;

  const msg = String(primary.error.message ?? "");
  if (msg.toLowerCase().includes("domain is not verified")) {
    return resend.emails.send({ from: FALLBACK_FROM, to: [to], subject, html });
  }
  return primary;
}

function formatBudget(job: any): string {
  if (job.budget_type === "fixed" && job.budget_value) {
    return `€${Number(job.budget_value).toLocaleString()}`;
  }
  if (job.budget_min && job.budget_max) {
    return `€${Number(job.budget_min).toLocaleString()} – €${Number(job.budget_max).toLocaleString()}`;
  }
  return "To be discussed";
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// Spanish translations for timing values
const timingEs: Record<string, string> = {
  "Flexible": "Flexible",
  "ASAP": "Lo antes posible",
  "Within 1 week": "En 1 semana",
  "Within 2 weeks": "En 2 semanas",
  "Within 1 month": "En 1 mes",
  "Within 3 months": "En 3 meses",
  "Not urgent": "Sin prisa",
};

async function sendTelegramAlert(job: any, siteUrl: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) return;

  const budget = formatBudget(job);
  const jobUrl = `${siteUrl}/jobs/${job.id}`;
  const boardUrl = `${siteUrl}/jobs`;

  // Build trade line: Category › Subcategory › Micro
  const tradeParts = [job.category, job.subcategory, job.micro_slug?.replace(/-/g, " ")].filter(Boolean);
  const tradeLine = tradeParts.length > 0 ? tradeParts.join(" › ") : "General";

  const timing = job.start_timing || "Flexible";
  const timingSpanish = timingEs[timing] || timing;

  // Get Spanish title from i18n if available
  const titleEn = job.title || "Untitled";
  const titleEs = job.title_i18n?.es || titleEn;
  const titleLine = titleEs !== titleEn
    ? `${escapeHtml(titleEn)} / ${escapeHtml(titleEs)}`
    : escapeHtml(titleEn);

  const text = [
    `🚨 <b>NEW JOB / NUEVO TRABAJO</b>`,
    ``,
    `📌 <b>${titleLine}</b>`,
    ``,
    `🔧 <b>Trade / Oficio:</b> ${escapeHtml(tradeLine)}`,
    `📍 <b>Area / Zona:</b> ${escapeHtml(job.area || "Ibiza")}`,
    `💶 <b>Budget / Presupuesto:</b> ${escapeHtml(budget)}`,
    `⏱️ <b>When / Cuándo:</b> ${escapeHtml(timing)} / ${escapeHtml(timingSpanish)}`,
    ``,
    `👉 <a href="${jobUrl}">View Job / Ver Trabajo</a>`,
    `📋 <a href="${boardUrl}">All Jobs / Todos los Trabajos</a>`,
  ].join("\n");

  // Extract first photo from job answers if available
  let photoBase64: string | null = null;
  try {
    const answers = typeof job.answers === "string" ? JSON.parse(job.answers) : job.answers;
    const photos: string[] = answers?.extras?.photos ?? [];
    if (photos.length > 0 && photos[0].startsWith("data:")) {
      photoBase64 = photos[0];
    }
  } catch {
    // answers parse failed, proceed without photo
  }

  try {
    // If we have a photo, send it with sendPhoto (caption = text)
    if (photoBase64) {
      // Convert base64 data URL to binary
      const base64Data = photoBase64.split(",")[1];
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // 8MB guard — fall back to text-only if too large
      if (bytes.length <= 8 * 1024 * 1024) {
        const mimeMatch = photoBase64.match(/^data:(image\/\w+);/);
        const ext = mimeMatch?.[1]?.split("/")?.[1] ?? "jpg";

        const form = new FormData();
        form.append("chat_id", chatId);
        form.append("caption", text);
        form.append("parse_mode", "HTML");
        form.append("photo", new Blob([bytes], { type: mimeMatch?.[1] ?? "image/jpeg" }), `job-photo.${ext}`);

        const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const body = await res.text();
          console.error("Telegram sendPhoto failed, falling back to text:", res.status, body);
          // Fall through to sendMessage below
        } else {
          return; // Photo sent successfully
        }
      }
    }

    // Text-only fallback (or no photo available)
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: false }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram sendMessage failed:", res.status, body);
    }
  } catch (err) {
    console.error("Telegram alert failed:", err);
  }
}

function buildEmailHtml(job: any, siteUrl: string): string {
  const budget = formatBudget(job);
  const area = job.area || "Ibiza";
  const timing = job.start_timing || "Flexible";
  const category = job.category || "";
  const title = job.title || "New Job";
  const description = job.description ? job.description.substring(0, 200) : "";
  const jobUrl = `${siteUrl}/jobs/${job.id}`;

  // WhatsApp-ready copy block
  const whatsappBlock = `🛠️ NEW JOB: ${title}\n📍 ${area}\n💶 ${budget}\n⏱️ ${timing}\n📝 ${description}\n\nView: ${jobUrl}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #374151 0%, #4b5563 100%); padding: 24px 32px; text-align: center;">
      <div style="display: inline-block; background: white; border-radius: 4px; padding: 6px 10px;">
        <span style="font-weight: bold; font-size: 16px; color: #374151;">CS</span>
      </div>
      <h1 style="color: white; margin: 12px 0 0; font-size: 20px; font-weight: 600;">New Job Posted</h1>
    </div>
    <div style="padding: 28px 32px;">
      <h2 style="margin: 0 0 4px; color: #111827; font-size: 18px;">${title}</h2>
      <p style="color: #9ca3af; font-size: 13px; margin: 0 0 16px;">${category}</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">📍 Location</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${area}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">💶 Budget</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${budget}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">⏱️ Timing</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${timing}</td>
        </tr>
      </table>

      ${description ? `<p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">${description}</p>` : ""}

      <a href="${jobUrl}" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px;">
        View Job Details →
      </a>

      <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; font-weight: 600;">📋 WhatsApp-ready copy:</p>
        <pre style="color: #374151; font-size: 13px; margin: 0; white-space: pre-wrap; font-family: inherit; line-height: 1.5;">${whatsappBlock}</pre>
      </div>
    </div>
    <div style="background: #f9fafb; padding: 12px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} CS Ibiza — Job notification</p>
    </div>
  </div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: accept internal secret header OR any Authorization header (for pg_cron)
  // This function is internal-only (processes a queue), not user-facing.
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  const providedSecret = req.headers.get("x-internal-secret");
  const authHeader = req.headers.get("authorization") ?? "";
  const isInternalAuth = internalSecret && providedSecret === internalSecret;
  const hasBearerToken = authHeader.startsWith("Bearer ") && authHeader.length > 20;
  if (!isInternalAuth && !hasBearerToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!NOTIFY_EMAIL) {
    return new Response(JSON.stringify({ error: "ADMIN_EMAIL not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Generate a unique batch ID to claim items and prevent concurrent processing
    const batchId = crypto.randomUUID();

    // Claim unsent notifications atomically (max 20)
    const { error: claimError } = await supabaseAdmin
      .from("job_notifications_queue")
      .update({ last_error: `claiming:${batchId}` })
      .is("sent_at", null)
      .lt("attempts", 3)
      .or("last_error.is.null,last_error.not.like.claiming:%")
      .order("created_at", { ascending: true })
      .limit(20);

    if (claimError) throw claimError;

    // Fetch only the items we claimed
    const { data: queue, error: queueError } = await supabaseAdmin
      .from("job_notifications_queue")
      .select("*")
      .eq("last_error", `claiming:${batchId}`)
      .is("sent_at", null)
      .order("created_at", { ascending: true });

    if (queueError) throw queueError;
    if (!queue || queue.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const origin = req.headers.get("origin") || req.headers.get("referer")?.split("/").slice(0, 3).join("/");
    const siteUrl = Deno.env.get("PUBLIC_SITE_ORIGIN") || "https://www.constructivesolutionsibiza.com";

    let sent = 0;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      // Rate limit: wait 600ms between sends to stay under 2/sec
      if (i > 0) await new Promise(r => setTimeout(r, 600));
      try {
        // Load job details
        const { data: job, error: jobError } = await supabaseAdmin
          .from("jobs")
          .select("id, title, title_i18n, category, subcategory, micro_slug, area, budget_type, budget_value, budget_min, budget_max, start_timing, description, status, answers")
          .eq("id", item.job_id)
          .single();

        if (jobError || !job) {
          await supabaseAdmin
            .from("job_notifications_queue")
            .update({ attempts: item.attempts + 1, last_error: "Job not found" })
            .eq("id", item.id);
          continue;
        }

        const subject = `🛠️ New job: ${job.title} — ${job.area || "Ibiza"}`;
        const html = buildEmailHtml(job, siteUrl);
        const result = await sendWithFallback(NOTIFY_EMAIL, subject, html);

        // Send Telegram push notification (always attempt, even if email fails)
        let telegramOk = false;
        try {
          await sendTelegramAlert(job, siteUrl);
          telegramOk = true;
        } catch (tgErr) {
          console.error("Telegram alert failed:", tgErr);
        }

        if (result.error) {
          // If Telegram succeeded, mark as sent despite email failure
          if (telegramOk) {
            await supabaseAdmin
              .from("job_notifications_queue")
              .update({ sent_at: new Date().toISOString() })
              .eq("id", item.id);
            sent++;
          } else {
            await supabaseAdmin
              .from("job_notifications_queue")
              .update({ attempts: item.attempts + 1, last_error: String(result.error.message) })
              .eq("id", item.id);
          }
        } else {
          await supabaseAdmin
            .from("job_notifications_queue")
            .update({ sent_at: new Date().toISOString() })
            .eq("id", item.id);
          sent++;
        }
      } catch (itemErr) {
        await supabaseAdmin
          .from("job_notifications_queue")
          .update({ attempts: item.attempts + 1, last_error: String(itemErr) })
          .eq("id", item.id);
      }
    }

    // After sending admin notifications, enqueue job match emails for matching pros
    for (const item of queue) {
      if (item.sent_at) continue; // skip items that weren't processed
      try {
        // Load job to get micro_slug
        const { data: job } = await supabaseAdmin
          .from("jobs")
          .select("id, title, category, area, budget_type, budget_value, budget_min, budget_max, start_timing, micro_slug")
          .eq("id", item.job_id)
          .single();

        if (!job?.micro_slug) continue;

        // Find matching pros via micro_slug → micro_id → professional_services
        const { data: microCat } = await supabaseAdmin
          .from("service_micro_categories")
          .select("id")
          .eq("slug", job.micro_slug)
          .eq("is_active", true)
          .single();

        if (!microCat) continue;

        const { data: matchingPros } = await supabaseAdmin
          .from("professional_services")
          .select("user_id")
          .eq("micro_id", microCat.id)
          .eq("status", "offered");

        if (!matchingPros || matchingPros.length === 0) continue;

        const budget = formatBudget(job);
        for (const pro of matchingPros) {
          // Don't notify the job poster
          if (pro.user_id === job.user_id) continue;
          await supabaseAdmin
            .from("email_notifications_queue")
            .insert({
              event_type: "job_match",
              recipient_user_id: pro.user_id,
              payload: {
                job_id: job.id,
                title: job.title,
                category: job.category,
                area: job.area || "Ibiza",
                budget,
                timing: job.start_timing || "Flexible",
              },
            });
        }
      } catch (matchErr) {
        console.error("Job match enqueue error:", matchErr);
      }
    }

    return new Response(
      JSON.stringify({ processed: queue.length, sent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("send-job-notification error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
