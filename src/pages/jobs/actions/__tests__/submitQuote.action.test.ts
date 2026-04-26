/**
 * Unit tests for submitQuote.action.ts — Track 5 quote → response bridge.
 *
 * Verifies:
 *   1. Happy path (both RPCs succeed)
 *   2. link_quote_to_response returns RPC error → linkWarning=true, success=true
 *   3. link_quote_to_response throws → linkWarning=true, success=true
 *   4. submit_quote_with_items failure → success=false, link RPC NOT called
 *   5. Daily-limit + duplicate-key error branches preserved
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const mockRpc = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

// trackEvent is fire-and-forget; stub it so tests don't touch analytics
vi.mock("@/lib/trackEvent", () => ({
  trackEvent: vi.fn(),
}));

import { submitQuote } from "../submitQuote.action";

const PAYLOAD = {
  jobId: "job-1",
  priceType: "fixed" as const,
  priceFixed: 1000,
  scopeText: "Scope",
};

beforeEach(() => {
  mockRpc.mockReset();
  mockGetUser.mockReset();
  mockGetUser.mockResolvedValue({ data: { user: { id: "pro-1" } } });
});

describe("submitQuote", () => {
  it("returns success + linked when both RPCs succeed", async () => {
    mockRpc
      .mockResolvedValueOnce({ data: "quote-123", error: null }) // submit_quote_with_items
      .mockResolvedValueOnce({ data: null, error: null }); // link_quote_to_response

    const result = await submitQuote(PAYLOAD);

    expect(result).toEqual({
      success: true,
      quoteId: "quote-123",
      linkWarning: false,
    });
    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc.mock.calls[0][0]).toBe("submit_quote_with_items");
    expect(mockRpc.mock.calls[1][0]).toBe("link_quote_to_response");
    expect(mockRpc.mock.calls[1][1]).toEqual({
      p_job_id: "job-1",
      p_quote_id: "quote-123",
    });
  });

  it("returns linkWarning=true when link_quote_to_response responds with an error", async () => {
    mockRpc
      .mockResolvedValueOnce({ data: "quote-456", error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { code: "P0001", message: "boom", details: null, hint: null },
      });

    const result = await submitQuote(PAYLOAD);

    expect(result.success).toBe(true);
    expect(result.quoteId).toBe("quote-456");
    expect(result.linkWarning).toBe(true);
  });

  it("returns linkWarning=true when link_quote_to_response throws", async () => {
    mockRpc
      .mockResolvedValueOnce({ data: "quote-789", error: null })
      .mockRejectedValueOnce(new Error("network down"));

    const result = await submitQuote(PAYLOAD);

    expect(result.success).toBe(true);
    expect(result.quoteId).toBe("quote-789");
    expect(result.linkWarning).toBe(true);
  });

  it("returns success=false and never calls link_quote_to_response when submit fails", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { code: "P0001", message: "Generic submit failure" },
    });

    const result = await submitQuote(PAYLOAD);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to submit quote");
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc.mock.calls[0][0]).toBe("submit_quote_with_items");
  });

  it("preserves the daily-limit error branch", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Daily quote limit reached" },
    });

    const result = await submitQuote(PAYLOAD);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Daily quote limit/i);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it("preserves the duplicate-key error branch", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "duplicate key value violates unique constraint" },
    });

    const result = await submitQuote(PAYLOAD);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already have a quote/i);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it("returns Not authenticated when there is no user", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const result = await submitQuote(PAYLOAD);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
