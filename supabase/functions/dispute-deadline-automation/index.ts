import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * dispute-deadline-automation
 *
 * Scheduled edge function (pg_cron every 15 min) that:
 * 1. Sends 24h-before-deadline nudge to counterparty
 * 2. Sends deadline-passed warning to both parties + admin
 * 3. Auto-advances disputes past grace period (24h after deadline)
 *
 * Idempotency: uses dispute_ai_events to track sent nudges and avoid duplicates.
 */

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

// Grace period after deadline before auto-advancing (hours)
const GRACE_PERIOD_HOURS = 24;
// Nudge window before deadline (hours)
const NUDGE_BEFORE_HOURS = 24;

async function hasEvent(disputeId: string, eventType: string): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from("dispute_ai_events")
    .select("id", { count: "exact", head: true })
    .eq("dispute_id", disputeId)
    .eq("event_type", eventType);
  return (count ?? 0) > 0;
}

async function recordEvent(disputeId: string, eventType: string, metadata: Record<string, unknown> = {}) {
  await supabaseAdmin.from("dispute_ai_events").insert({
    dispute_id: disputeId,
    event_type: eventType,
    metadata,
  });
}

async function enqueueEmail(eventType: string, recipientUserId: string | null, payload: Record<string, unknown>) {
  await supabaseAdmin.from("email_notifications_queue").insert({
    event_type: eventType,
    recipient_user_id: recipientUserId,
    payload,
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = new Date();
    const nowIso = now.toISOString();

    // ─── 1. Fetch active disputes with deadlines ───
    const { data: disputes, error } = await supabaseAdmin
      .from("disputes")
      .select("id, job_id, status, counterparty_id, raised_by, raised_by_role, response_deadline, evidence_deadline, counterparty_responded_at, issue_types")
      .in("status", ["open", "awaiting_counterparty", "evidence_collection"])
      .not("response_deadline", "is", null);

    if (error) throw error;
    if (!disputes || disputes.length === 0) {
      return new Response(JSON.stringify({ processed: 0, nudges: 0, warnings: 0, advanced: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let nudges = 0;
    let warnings = 0;
    let advanced = 0;

    for (const d of disputes) {
      const responseDeadline = d.response_deadline ? new Date(d.response_deadline) : null;
      const evidenceDeadline = d.evidence_deadline ? new Date(d.evidence_deadline) : null;
      const hasResponded = !!d.counterparty_responded_at;

      if (!responseDeadline) continue;

      const hoursUntilDeadline = (responseDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      const hoursPastDeadline = -hoursUntilDeadline;

      // ─── NUDGE: 24h before response deadline, no response yet ───
      if (!hasResponded && hoursUntilDeadline > 0 && hoursUntilDeadline <= NUDGE_BEFORE_HOURS) {
        const eventKey = "deadline_nudge_24h";
        if (!(await hasEvent(d.id, eventKey))) {
          // Email counterparty
          if (d.counterparty_id) {
            await enqueueEmail("dispute_deadline_approaching", d.counterparty_id, {
              dispute_id: d.id,
              job_id: d.job_id,
              hours_remaining: Math.round(hoursUntilDeadline),
              deadline: d.response_deadline,
              deadline_type: "response",
            });
          }
          await recordEvent(d.id, eventKey, { hours_remaining: Math.round(hoursUntilDeadline) });
          nudges++;
        }
      }

      // ─── WARNING: deadline passed, no response ───
      if (!hasResponded && hoursPastDeadline > 0 && hoursPastDeadline <= GRACE_PERIOD_HOURS) {
        const eventKey = "deadline_passed_warning";
        if (!(await hasEvent(d.id, eventKey))) {
          // Notify counterparty
          if (d.counterparty_id) {
            await enqueueEmail("dispute_deadline_passed", d.counterparty_id, {
              dispute_id: d.id,
              job_id: d.job_id,
              deadline_type: "response",
              grace_hours: GRACE_PERIOD_HOURS,
            });
          }
          // Notify raiser
          await enqueueEmail("dispute_deadline_passed_raiser", d.raised_by, {
            dispute_id: d.id,
            job_id: d.job_id,
            deadline_type: "response",
          });
          // Notify admin
          await enqueueEmail("admin_dispute_deadline_passed", null, {
            dispute_id: d.id,
            job_id: d.job_id,
            status: d.status,
            issue_types: d.issue_types,
          });
          await recordEvent(d.id, eventKey, { hours_past: Math.round(hoursPastDeadline) });
          warnings++;
        }
      }

      // ─── AUTO-ADVANCE: grace period expired, no response ───
      if (!hasResponded && hoursPastDeadline > GRACE_PERIOD_HOURS) {
        const eventKey = "auto_advanced_past_deadline";
        if (!(await hasEvent(d.id, eventKey))) {
          // Determine next status based on current
          let nextStatus: string | null = null;
          if (d.status === "awaiting_counterparty") {
            nextStatus = "evidence_collection"; // Skip to evidence collection without counterparty input
          } else if (d.status === "evidence_collection") {
            nextStatus = "assessment"; // Move to assessment with available evidence
          }

          if (nextStatus) {
            const { error: advErr } = await supabaseAdmin
              .from("disputes")
              .update({
                status: nextStatus,
                updated_at: nowIso,
              })
              .eq("id", d.id);

            if (!advErr) {
              // Log status history
              await supabaseAdmin.from("dispute_status_history").insert({
                dispute_id: d.id,
                from_status: d.status,
                to_status: nextStatus,
                change_source: "automation",
                metadata: { reason: "response_deadline_expired", grace_hours: GRACE_PERIOD_HOURS },
              });

              // Notify both parties
              if (d.counterparty_id) {
                await enqueueEmail("dispute_auto_advanced", d.counterparty_id, {
                  dispute_id: d.id,
                  job_id: d.job_id,
                  new_status: nextStatus,
                  reason: "deadline_expired",
                });
              }
              await enqueueEmail("dispute_auto_advanced", d.raised_by, {
                dispute_id: d.id,
                job_id: d.job_id,
                new_status: nextStatus,
                reason: "deadline_expired",
              });

              await recordEvent(d.id, eventKey, {
                from_status: d.status,
                to_status: nextStatus,
                hours_past_deadline: Math.round(hoursPastDeadline),
              });
              advanced++;
            } else {
              console.error(`Failed to advance dispute ${d.id}:`, advErr);
            }
          }
        }
      }

      // ─── EVIDENCE DEADLINE NUDGE ───
      if (evidenceDeadline) {
        const evidenceHoursLeft = (evidenceDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (evidenceHoursLeft > 0 && evidenceHoursLeft <= NUDGE_BEFORE_HOURS) {
          const eventKey = "evidence_deadline_nudge_24h";
          if (!(await hasEvent(d.id, eventKey))) {
            // Nudge both parties
            for (const userId of [d.raised_by, d.counterparty_id].filter(Boolean)) {
              await enqueueEmail("dispute_deadline_approaching", userId!, {
                dispute_id: d.id,
                job_id: d.job_id,
                hours_remaining: Math.round(evidenceHoursLeft),
                deadline: d.evidence_deadline,
                deadline_type: "evidence",
              });
            }
            await recordEvent(d.id, eventKey, { hours_remaining: Math.round(evidenceHoursLeft) });
            nudges++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ processed: disputes.length, nudges, warnings, advanced }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("dispute-deadline-automation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
