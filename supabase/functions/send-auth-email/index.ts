import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AuthEmailRequest {
  type: "signup" | "recovery" | "resend";
  email: string;
  intent?: string;
  redirectUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, intent, redirectUrl }: AuthEmailRequest = await req.json();

    if (!email || !type) {
      throw new Error("Missing required fields: email and type");
    }

    // Create admin client for generating links
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const baseUrl = redirectUrl || Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '') || "";
    const siteUrl = "https://id-preview--c31efcb5-ae5c-4284-990c-e746238ecde8.lovable.app";

    let actionLink: string;
    let subject: string;
    let htmlContent: string;

    if (type === "signup" || type === "resend") {
      // Generate signup confirmation link
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email,
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
          data: intent ? { intent } : undefined,
        },
      });

      if (error) {
        console.error("Generate link error:", error);
        // Don't reveal if user exists - return success anyway
        return new Response(
          JSON.stringify({ success: true, message: "If an account exists, an email will be sent." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      actionLink = data.properties?.action_link || "";
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

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "CS Ibiza <noreply@csibiza.com>",
      to: [email],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

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
