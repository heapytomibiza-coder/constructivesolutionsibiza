import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * process-nudges
 *
 * Scheduled edge function (pg_cron every hour) that:
 * 1. Fetches pending nudge candidates via get_pending_nudges()
 * 2. Inserts into nudge_log (deduped by unique index)
 * 3. Enqueues email notifications via email_notifications_queue
 *
 * Safety: batch limit of 50 per run to prevent flood.
 * Auth: x-internal-secret OR Bearer token (for pg_cron via pg_net).
 */

const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";
const BATCH_LIMIT = 50;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TEMPLATES: Record<string, (n: NudgeCandidate) => { subject: string; body: string }> = {
  draft_stale: (n) => ({
    subject: "Finish posting your job — pros are waiting",
    body: `Your job "${n.job_title}" is saved as a draft. Post it now so professionals can respond.`,
  }),
  quotes_pending: (n) => ({
    subject: `You've received ${n.quote_count} quote${Number(n.quote_count) !== 1 ? "s" : ""} — review them now`,
    body: `Your job "${n.job_title}" has ${n.quote_count} quote${Number(n.quote_count) !== 1 ? "s" : ""} waiting for your review.`,
  }),
  conversation_stale: (n) => ({
    subject: `You spoke to ${n.pro_name || "a professional"} — ready to hire?`,
    body: `You started a conversation about "${n.job_title}" with ${n.pro_name || "a professional"}. Ready to move forward?`,
  }),
  pro_no_quote: (n) => ({
    subject: `New job match — "${n.job_title}" is waiting for your quote`,
    body: `A client posted "${n.job_title}" in your service area. Be the first to respond with a quote.`,
  }),
  review_reminder: (n) => ({
    subject: `How did "${n.job_title}" go? Leave a review`,
    body: `Your job "${n.job_title}" is complete. Leaving a review helps future clients and builds your reputation on the platform.`,
  }),
};

interface NudgeCandidate {
  nudge_type: string;
  user_id: string;
  job_id: string;
  job_title: string;
  pro_name: string | null;
  quote_count: number;
  user_email: string;
}

serve(async (req: Request) => {
  // Auth check: x-internal-secret or Bearer token (pg_cron compatibility)
  const secret = req.headers.get("x-internal-secret");
  const authHeader = req.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const isAuthed =
    (secret && secret === INTERNAL_SECRET) ||
    (bearerToken && bearerToken === anonKey);

  if (!isAuthed) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // 1. Fetch candidates
    const { data: candidates, error: fetchErr } = await supabaseAdmin.rpc("get_pending_nudges");
    if (fetchErr) throw fetchErr;

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ processed: 0, skipped: 0 }), { status: 200 });
    }

    // Safety cap
    const batch = (candidates as NudgeCandidate[]).slice(0, BATCH_LIMIT);
    const skipped = Math.max(0, candidates.length - BATCH_LIMIT);

    let processed = 0;

    for (const candidate of batch) {
      // 2. Insert into nudge_log (dedup via unique index)
      const { data: nudge, error: insertErr } = await supabaseAdmin
        .from("nudge_log")
        .insert({
          user_id: candidate.user_id,
          job_id: candidate.job_id,
          nudge_type: candidate.nudge_type,
        })
        .select("id")
        .single();

      if (insertErr) {
        // Unique constraint violation = already sent within cooldown, skip
        if (insertErr.code === "23505") continue;
        console.warn("nudge insert error:", insertErr);
        continue;
      }

      // 3. Build email template
      const template = TEMPLATES[candidate.nudge_type];
      if (!template) continue;
      const { subject, body } = template(candidate);

      // 4. Enqueue email via email_notifications_queue
      //    send-notifications will handle rendering in email shell + preference check
      await supabaseAdmin.from("email_notifications_queue").insert({
        recipient_user_id: candidate.user_id,
        event_type: `nudge_${candidate.nudge_type}`,
        payload: {
          to: candidate.user_email,
          subject,
          body,
          job_id: candidate.job_id,
          nudge_id: nudge.id,
        },
      });

      // 5. Mark as sent
      await supabaseAdmin.rpc("mark_nudge_sent", { p_nudge_id: nudge.id });

      processed++;
    }

    return new Response(
      JSON.stringify({ processed, skipped }),
      { status: 200 }
    );
  } catch (err) {
    console.error("process-nudges error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
