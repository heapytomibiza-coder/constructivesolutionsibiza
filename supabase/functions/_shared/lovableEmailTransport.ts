// Track 1 — Email Recovery
// Single transport for all platform/app emails. Replaces the broken
// Resend + Gmail SMTP path. Writes pre-rendered HTML into Lovable's
// `transactional_emails` pgmq queue, which is drained by the
// `process-email-queue` dispatcher (retries, rate limit, DLQ).
//
// Logging is mirrored to `email_send_log` (status='pending') so the
// admin observability tools see one row per send attempt.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Verified sender subdomain — set during email_domain setup, MUST NOT be
// the root domain (the Lovable email API rejects mismatched senders).
const SENDER_DOMAIN = "notify.www.constructivesolutionsibiza.com";
const FROM_DOMAIN = "notify.www.constructivesolutionsibiza.com";
const SITE_NAME = "Constructive Solutions Ibiza";

export interface EnqueueResult {
  ok: boolean;
  messageId: string;
  error?: string;
}

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

/**
 * Enqueue a pre-rendered email into the Lovable transactional queue.
 *
 * Returns ok=true once the row is on the queue. Actual delivery is async,
 * handled by the process-email-queue dispatcher. Failure means we could
 * not enqueue (DB error) — caller should record an error and retry later.
 */
export async function enqueuePlatformEmail(
  supabase: SupabaseClient,
  params: {
    to: string;
    subject: string;
    html: string;
    label: string;            // e.g. event_type — used for analytics & DLQ tagging
    idempotencyKey: string;   // unique per logical send (e.g. queue row id)
  },
): Promise<EnqueueResult> {
  const messageId = crypto.randomUUID();
  const text = htmlToPlainText(params.html);
  const normalizedTo = params.to.trim().toLowerCase();

  // 1. Suppression check — fail-closed: if we cannot verify, do not send.
  const { data: suppressed, error: supErr } = await supabase
    .from("suppressed_emails")
    .select("id")
    .eq("email", normalizedTo)
    .maybeSingle();

  if (supErr) {
    console.error("[lovableEmailTransport] suppression check failed", {
      label: params.label,
      to: normalizedTo,
      error: supErr.message,
    });
    return { ok: false, messageId, error: `suppression_check_failed: ${supErr.message}` };
  }

  if (suppressed) {
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: params.label,
      recipient_email: params.to,
      status: "suppressed",
    });
    console.log("[lovableEmailTransport] suppressed", { label: params.label, to: normalizedTo });
    return { ok: true, messageId };
  }

  // 2. Log pending BEFORE enqueue so we have a record even if enqueue crashes
  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: params.label,
    recipient_email: params.to,
    status: "pending",
  });

  // 3. Enqueue into Lovable's transactional queue. The dispatcher
  // (process-email-queue) handles delivery, retries, and rate-limiting.
  const { error: enqueueError } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: params.to,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: params.subject,
      html: params.html,
      text,
      purpose: "transactional",
      label: params.label,
      idempotency_key: params.idempotencyKey,
      queued_at: new Date().toISOString(),
    },
  });

  if (enqueueError) {
    console.error("[lovableEmailTransport] enqueue failed", {
      label: params.label,
      to: normalizedTo,
      error: enqueueError.message,
    });
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: params.label,
      recipient_email: params.to,
      status: "failed",
      error_message: `enqueue_failed: ${enqueueError.message}`,
    });
    return { ok: false, messageId, error: enqueueError.message };
  }

  console.log("[lovableEmailTransport] enqueued", {
    label: params.label,
    to: normalizedTo,
    messageId,
  });
  return { ok: true, messageId };
}
