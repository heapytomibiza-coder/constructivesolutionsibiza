// Shared CORS headers for all edge functions
// Origin allowlist — only approved domains receive ACAO headers

const ALLOWED_ORIGINS = [
  "https://constructivesolutionsibiza.lovable.app",
  "https://constructivesolutionsibiza.com",
  "https://www.constructivesolutionsibiza.com",
  "https://id-preview--c31efcb5-ae5c-4284-990c-e746238ecde8.lovable.app",
  "https://c31efcb5-ae5c-4284-990c-e746238ecde8.lovableproject.com",
];

const CORS_HEADERS_BASE = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Returns CORS headers with origin validation.
 * Only returns Access-Control-Allow-Origin if the request origin is in the allowlist.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    return { ...CORS_HEADERS_BASE, "Access-Control-Allow-Origin": origin };
  }
  // No ACAO header for unknown origins — browser will reject the response
  return { ...CORS_HEADERS_BASE };
}

/**
 * Legacy static export for non-browser contexts (webhooks, server-to-server).
 * These functions don't need origin checking but we keep the header set consistent.
 */
export const corsHeaders = {
  ...CORS_HEADERS_BASE,
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
};
