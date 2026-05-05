import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { UserRole } from "@/hooks/useSessionSnapshot";

const useConversationsMock = vi.fn();

vi.mock("@/pages/messages/hooks", () => ({
  useConversations: (...args: unknown[]) => useConversationsMock(...args),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

import { ConversationList } from "@/pages/messages/ConversationList";

describe("ConversationList lane wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConversationsMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("passes activeRole into useConversations", () => {
    const activeRole: UserRole = "client";
    render(
      <ConversationList
        userId="user-1"
        activeRole={activeRole}
        onSelect={() => undefined}
      />
    );
    expect(useConversationsMock).toHaveBeenCalledWith("user-1", "client");
  });
});

// --- Hook-level filter test ---
const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: (...args: unknown[]) => fromMock(...args),
    channel: () => ({
      on: function () { return this; },
      subscribe: function () { return this; },
    }),
    removeChannel: vi.fn(),
  },
}));

import { useConversations } from "@/pages/messages/hooks/useConversations";

function emptyTable() {
  const builder: any = {
    select: () => builder,
    in: () => Promise.resolve({ data: [], error: null }),
  };
  return builder;
}

function renderHook<T>(cb: () => T) {
  const result: { current: T | null } = { current: null };
  function Probe() {
    result.current = cb();
    return null;
  }
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <Probe />
    </QueryClientProvider>
  );
  return result;
}

describe("useConversations activeRole filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => emptyTable());
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "c1", job_id: "j1", client_id: "user-1", pro_id: "other-pro",
          last_message_at: null, last_message_preview: null,
          created_at: "2026-01-01", last_read_at_client: null,
          last_read_at_pro: null, unread_count: 0,
        },
        {
          id: "c2", job_id: "j2", client_id: "other-client", pro_id: "user-1",
          last_message_at: null, last_message_preview: null,
          created_at: "2026-01-01", last_read_at_client: null,
          last_read_at_pro: null, unread_count: 0,
        },
      ],
      error: null,
    });
  });

  it("returns only client-side conversations when activeRole=client", async () => {
    const result = renderHook(() => useConversations("user-1", "client"));
    await waitFor(() => expect(result.current?.data?.length).toBe(1));
    expect(result.current?.data?.[0].id).toBe("c1");
  });

  it("returns only pro-side conversations when activeRole=professional", async () => {
    const result = renderHook(() => useConversations("user-1", "professional"));
    await waitFor(() => expect(result.current?.data?.length).toBe(1));
    expect(result.current?.data?.[0].id).toBe("c2");
  });

  it("returns all conversations when activeRole is null/undefined", async () => {
    const result = renderHook(() => useConversations("user-1", null));
    await waitFor(() => expect(result.current?.data?.length).toBe(2));
  });
});
