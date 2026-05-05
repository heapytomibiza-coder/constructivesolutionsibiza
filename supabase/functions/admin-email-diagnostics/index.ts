// Track 1 — Admin email diagnostics & test sender.
// Single endpoint:
//   POST { action: "send_test", template: "job_posted"|"new_job_alert"|"new_message"|"quote_received", to?: string }
// Dual-gated: caller must have role 'admin' AND is_admin_email().
// Enqueues a single test email per call via the Lovable transport.
// Does NOT touch routing, auth, dashboards, matching, wizard, or UI logic.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { enqueuePlatformEmail } from "../_shared/lovableEmailTransport.ts";

const SITE_NAME = "Constructive Solutions Ibiza";

type TemplateKey = "job_posted" | "new_job_alert" | "new_message" | "quote_received";

function buildHtml(template: TemplateKey): { subject: string; html: string } {
  const stamp = new Date().toISOString();
  const baseStyle =
    'font-family:Arial,sans-serif;background:#ffffff;padding:24px;color:#1a1a1a;max-width:560px;margin:0 auto';
  const card =
    'border:1px solid #e5e7eb;border-radius:12px;padding:24px;background:#ffffff';
  const h = 'font-size:20px;font-weight:700;margin:0 0 12px';
  const p = 'font-size:14px;color:#444;line-height:1.5;margin:0 0 12px';
  const tag = 'font-size:11px;color:#888;margin-top:24px';

  switch (template) {
    case "job_posted":
      return {
        subject: `[TEST] Your job has been posted — ${SITE_NAME}`,
        html: `<div style="${baseStyle}"><div style="${card}"><h1 style="${h}">Your job is live</h1><p style="${p}">This is a Track 1 test of the <strong>job posted confirmation</strong> email path. If you're reading this in your inbox, the Lovable email queue is delivering successfully.</p><p style="${tag}">Test stamp: ${stamp}</p></div></div>`,
      };
    case "new_job_alert":
      return {
        subject: `[TEST] New job matches your services — ${SITE_NAME}`,
        html: `<div style="${baseStyle}"><div style="${card}"><h1 style="${h}">A new job matches you</h1><p style="${p}">This is a Track 1 test of the <strong>new job alert</strong> email sent to professionals. Real alerts will include the job title, budget range, and a link to respond.</p><p style="${tag}">Test stamp: ${stamp}</p></div></div>`,
      };
    case "new_message":
      return {
        subject: `[TEST] New message — ${SITE_NAME}`,
        html: `<div style="${baseStyle}"><div style="${card}"><h1 style="${h}">You have a new message</h1><p style="${p}">This is a Track 1 test of the <strong>new message notification</strong> email path.</p><p style="${tag}">Test stamp: ${stamp}</p></div></div>`,
      };
    case "quote_received":
      return {
        subject: `[TEST] You received a quote — ${SITE_NAME}`,
        html: `<div style="${baseStyle}"><div style="${card}"><h1 style="${h}">A professional sent you a quote</h1><p style="${p}">This is a Track 1 test of the <strong>quote received</strong> email path.</p><p style="${tag}">Test stamp: ${stamp}</p></div></div>`,
      };
  }
}

function forbidden(corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return forbidden(corsHeaders);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await authClient.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (userErr || !userData?.user) return forbidden(corsHeaders);
  const callerId = userData.user.id;
  const callerEmail = userData.user.email ?? "";

  const [roleRes, emailRes] = await Promise.all([
    authClient.rpc("has_role", { _user_id: callerId, _role: "admin" }),
    authClient.rpc("is_admin_email"),
  ]);
  if (!roleRes.data || !emailRes.data) return forbidden(corsHeaders);

  let body: { action?: string; template?: TemplateKey; to?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (body.action !== "send_test") {
    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const allowedTemplates: TemplateKey[] = [
    "job_posted",
    "new_job_alert",
    "new_message",
    "quote_received",
  ];
  if (!body.template || !allowedTemplates.includes(body.template)) {
    return new Response(JSON.stringify({ error: "Invalid template" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const recipient = (body.to ?? callerEmail).trim().toLowerCase();
  if (!recipient || !recipient.includes("@")) {
    return new Response(JSON.stringify({ error: "Invalid recipient" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { subject, html } = buildHtml(body.template);
  const idempotencyKey = `admin-test-${body.template}-${crypto.randomUUID()}`;
  const result = await enqueuePlatformEmail(service, {
    to: recipient,
    subject,
    html,
    label: `test_${body.template}`,
    idempotencyKey,
  });

  return new Response(
    JSON.stringify({
      ok: result.ok,
      messageId: result.messageId,
      error: result.error,
      template: body.template,
      recipient,
    }),
    {
      status: result.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
