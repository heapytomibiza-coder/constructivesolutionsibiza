import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

const MIN_SAMPLE = 5;

const SAFE_FALLBACK = {
  suggested_min: null,
  suggested_max: null,
  confidence: 0,
  basis: null,
  sample_size: 0,
};

/** Round to nearest €50 */
function roundTo50(n: number): number {
  return Math.round(n / 50) * 50;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { micro_slugs } = await req.json();

    if (!Array.isArray(micro_slugs) || micro_slugs.length === 0) {
      return new Response(JSON.stringify(SAFE_FALLBACK), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.rpc("get_budget_range_for_micros", {
      p_micro_slugs: micro_slugs,
    });

    if (error || !data || data.length === 0) {
      console.error("RPC error:", error);
      return new Response(JSON.stringify(SAFE_FALLBACK), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const row = data[0];

    if (!row.sample_size || row.sample_size < MIN_SAMPLE) {
      return new Response(JSON.stringify(SAFE_FALLBACK), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const suggested_min = roundTo50(Number(row.p20));
    const suggested_max = roundTo50(Number(row.p80));
    const confidence = Math.min(1, row.sample_size / 20);

    return new Response(
      JSON.stringify({
        suggested_min,
        suggested_max,
        confidence,
        basis: row.sample_size,
        sample_size: row.sample_size,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Budget suggestion error:", err);
    return new Response(JSON.stringify(SAFE_FALLBACK), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
