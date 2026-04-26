/**
 * Unit tests for deriveSyncState — pure helper backing the
 * Track 5 sync badge in the pro quote card.
 */

import { describe, it, expect } from "vitest";
import { deriveSyncState } from "../ResponseSyncBadge";

describe("deriveSyncState", () => {
  it("returns 'linked' when response.quote_id matches quote.id", () => {
    expect(
      deriveSyncState({
        quoteId: "q-1",
        quoteStatus: "submitted",
        responseQuoteId: "q-1",
        hasResponse: true,
      }),
    ).toBe("linked");
  });

  it("returns 'unlinked' when response is missing", () => {
    expect(
      deriveSyncState({
        quoteId: "q-1",
        quoteStatus: "submitted",
        responseQuoteId: null,
        hasResponse: false,
      }),
    ).toBe("unlinked");
  });

  it("returns 'unlinked' when response.quote_id is null", () => {
    expect(
      deriveSyncState({
        quoteId: "q-1",
        quoteStatus: "submitted",
        responseQuoteId: null,
        hasResponse: true,
      }),
    ).toBe("unlinked");
  });

  it("returns 'unlinked' when response.quote_id points to a different quote", () => {
    expect(
      deriveSyncState({
        quoteId: "q-1",
        quoteStatus: "submitted",
        responseQuoteId: "q-old",
        hasResponse: true,
      }),
    ).toBe("unlinked");
  });

  it("returns null when there is no quote yet", () => {
    expect(
      deriveSyncState({
        quoteId: null,
        quoteStatus: null,
        responseQuoteId: null,
        hasResponse: false,
      }),
    ).toBeNull();
  });

  it("returns null for terminal quote states (withdrawn)", () => {
    expect(
      deriveSyncState({
        quoteId: "q-1",
        quoteStatus: "withdrawn",
        responseQuoteId: null,
        hasResponse: true,
      }),
    ).toBeNull();
  });

  it("returns null for terminal quote states (rejected)", () => {
    expect(
      deriveSyncState({
        quoteId: "q-1",
        quoteStatus: "rejected",
        responseQuoteId: "q-1",
        hasResponse: true,
      }),
    ).toBeNull();
  });

  it("treats accepted quotes as live for sync purposes (linked)", () => {
    expect(
      deriveSyncState({
        quoteId: "q-1",
        quoteStatus: "accepted",
        responseQuoteId: "q-1",
        hasResponse: true,
      }),
    ).toBe("linked");
  });
});
