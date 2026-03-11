import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;

Deno.test("send-job-notification rejects without x-internal-secret", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-job-notification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Unauthorized");
});

Deno.test("send-job-notification rejects wrong x-internal-secret", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-job-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": "wrong-value",
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Unauthorized");
});
