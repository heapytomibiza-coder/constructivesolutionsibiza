// Temporary route-echo handler to debug GET/POST routing issues.
// This intentionally responds 200 for any method and returns the observed URL + headers.

import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      method: req.method,
      pathname: url.pathname,
      search: url.search,
      headers: Object.fromEntries(req.headers.entries()),
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
});
