import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Primary sender (your branded domain). This will only work once the domain is verified.
const PRIMARY_FROM = "CS Ibiza <noreply@csibiza.com>";

// Fallback sender (works without verifying your own domain).
const FALLBACK_FROM = "CS Ibiza <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AuthEmailRequest {
  type: "signup" | "recovery" | "resend";
  email: string;
  intent?: string;
  phone?: string;
  password?: string;
  redirectUrl?: string;
}

type SendEmailArgs = { to: string; subject: string; html: string };

const sendEmailWithSenderFallback = async ({ to, subject, html }: SendEmailArgs) => {
  const primary = await resend.emails.send({
    from: PRIMARY_FROM,
    to: [to],
    subject,
    html,
  });

  if (!primary.error) {
    return { usedFrom: PRIMARY_FROM, response: primary, primaryResponse: primary };
  }

  const msg = String(primary.error.message ?? "");
  const isDomainNotVerified = msg.toLowerCase().includes("domain is not verified");

  if (isDomainNotVerified) {
    const fallback = await resend.emails.send({
      from: FALLBACK_FROM,
      to: [to],
      subject,
      html,
    });

    return { usedFrom: FALLBACK_FROM, response: fallback, primaryResponse: primary };
  }

  return { usedFrom: PRIMARY_FROM, response: primary, primaryResponse: primary };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, intent, phone, password, redirectUrl }: AuthEmailRequest = await req.json();

    if (!email || !type) {
      throw new Error("Missing required fields: email and type");
    }

    // Create admin client for generating links
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Use SITE_URL env var, falling back to request origin or preview URL
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split("/").slice(0, 3).join("/");
    const siteUrl = Deno.env.get("SITE_URL") || origin || "https://id-preview--c31efcb5-ae5c-4284-990c-e746238ecde8.lovable.app";

    let actionLink: string;
    let subject: string;
    let htmlContent: string;

    if (type === "signup") {
      if (!password || password.length < 6) {
        throw new Error("Missing required fields: password");
      }

      const meta: Record<string, string> = {};
      if (intent) meta.intent = intent;
      if (phone) meta.phone = phone;

      // Generate signup confirmation link (creates user + sets password)
      let linkData: any | null = null;

      const signupLink = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
          data: Object.keys(meta).length ? meta : undefined,
        },
      });

      if (signupLink.error) {
        console.error("Generate signup link error:", signupLink.error);

        // If user already exists (or signup link can't be generated), fall back to a magic link.
        const magicLink = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: {
            redirectTo: `${siteUrl}/auth/callback`,
          },
        });

        if (magicLink.error) {
          console.error("Generate magiclink fallback error:", magicLink.error);
          // Don't reveal if user exists - return success anyway
          return new Response(
            JSON.stringify({ success: true, message: "If an account exists, an email will be sent." }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        linkData = magicLink.data;
      } else {
        linkData = signupLink.data;
      }

      actionLink = linkData?.properties?.action_link || "";
      subject = "Confirm your CS Ibiza account";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #374151 0%, #4b5563 100%); padding: 32px; text-align: center;">
              <div style="display: inline-block; background: white; border-radius: 4px; padding: 8px 12px;">
                <span style="font-weight: bold; font-size: 18px; color: #374151;">CS</span>
              </div>
              <h1 style="color: white; margin: 16px 0 0; font-size: 24px; font-weight: 600;">CS Ibiza</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">Welcome to CS Ibiza!</h2>
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px;">
                Click the button below to confirm your email address and activate your account.
              </p>
              <a href="${actionLink}" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
                Confirm Email
              </a>
              <p style="color: #9ca3af; font-size: 14px; margin: 24px 0 0; line-height: 1.5;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
            <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} CS Ibiza. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === "resend") {
      // For EXISTING users - use magiclink to confirm their email and sign them in
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) {
        console.error("Generate magiclink error:", error);
        return new Response(
          JSON.stringify({ success: true, message: "If an account exists, an email will be sent." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      actionLink = data.properties?.action_link || "";
      subject = "Sign in to CS Ibiza";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #374151 0%, #4b5563 100%); padding: 32px; text-align: center;">
              <div style="display: inline-block; background: white; border-radius: 4px; padding: 8px 12px;">
                <span style="font-weight: bold; font-size: 18px; color: #374151;">CS</span>
              </div>
              <h1 style="color: white; margin: 16px 0 0; font-size: 24px; font-weight: 600;">CS Ibiza</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">Sign In Link</h2>
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px;">
                Click the button below to sign in and confirm your account.
              </p>
              <a href="${actionLink}" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
                Sign In
              </a>
              <p style="color: #9ca3af; font-size: 14px; margin: 24px 0 0; line-height: 1.5;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} CS Ibiza. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === "recovery") {
      // Generate password reset link
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${siteUrl}/auth/reset-password`,
        },
      });

      if (error) {
        console.error("Generate recovery link error:", error);
        // Don't reveal if user exists
        return new Response(
          JSON.stringify({ success: true, message: "If an account exists, an email will be sent." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      actionLink = data.properties?.action_link || "";
      subject = "Reset your CS Ibiza password";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #374151 0%, #4b5563 100%); padding: 32px; text-align: center;">
              <div style="display: inline-block; background: white; border-radius: 4px; padding: 8px 12px;">
                <span style="font-weight: bold; font-size: 18px; color: #374151;">CS</span>
              </div>
              <h1 style="color: white; margin: 16px 0 0; font-size: 24px; font-weight: 600;">CS Ibiza</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 20px;">Reset Your Password</h2>
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px;">
                You requested to reset your password. Click the button below to set a new password.
              </p>
              <a href="${actionLink}" style="display: inline-block; background: #374151; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
                Reset Password
              </a>
              <p style="color: #9ca3af; font-size: 14px; margin: 24px 0 0; line-height: 1.5;">
                If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
              </p>
            </div>
            <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} CS Ibiza. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      throw new Error("Invalid email type");
    }

    // Send email via provider (fallback to a default sender if your domain isn't verified yet)
    const { usedFrom, response: emailResponse, primaryResponse } =
      await sendEmailWithSenderFallback({
        to: email,
        subject,
        html: htmlContent,
      });

    if (primaryResponse?.error) {
      console.warn(
        "Primary sender failed; attempting fallback sender:",
        primaryResponse.error
      );
    }

    if (emailResponse?.error) {
      console.error("Email send failed:", emailResponse.error);
      throw new Error("Email could not be sent");
    }

    console.log("Email accepted by provider:", {
      usedFrom,
      id: emailResponse.data?.id,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-auth-email function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
