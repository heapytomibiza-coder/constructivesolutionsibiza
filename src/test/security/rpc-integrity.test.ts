/**
 * SECURITY TEST — RPC integrity
 * Covers: SEC-003 (quote assignment uses server-side values)
 *
 * Validates that the acceptQuote action does NOT send professionalId to the RPC.
 * The RPC derives the professional from the quote to prevent mismatch attacks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    rpc: mockRpc,
  },
}));

vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));

describe('RPC integrity — SEC-003', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ error: null });
  });

  it('acceptQuote does NOT pass professionalId to RPC (server derives it)', async () => {
    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');

    await acceptQuote('quote-1', 'job-1', 'attacker-controlled-pro-id');

    // The RPC should only receive quote ID and job ID
    expect(mockRpc).toHaveBeenCalledWith('accept_quote_and_assign', {
      p_quote_id: 'quote-1',
      p_job_id: 'job-1',
    });

    // Critically: no professional ID in the RPC params
    const rpcArgs = mockRpc.mock.calls[0][1];
    expect(rpcArgs).not.toHaveProperty('p_professional_id');
    expect(rpcArgs).not.toHaveProperty('professional_id');
  });

  it('acceptQuote RPC params cannot be tampered with extra fields', async () => {
    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');

    await acceptQuote('quote-1', 'job-1', 'pro-1');

    // Only 2 keys should be sent
    const rpcArgs = mockRpc.mock.calls[0][1];
    expect(Object.keys(rpcArgs)).toHaveLength(2);
    expect(Object.keys(rpcArgs).sort()).toEqual(['p_job_id', 'p_quote_id']);
  });

  it('mismatched jobId/quoteId still sends exact client values — server validates the relationship', async () => {
    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');

    await acceptQuote('quote-from-job-A', 'completely-different-job-B', 'pro-1');

    // RPC receives the exact IDs the client sent — it is the RPC's job to reject the mismatch
    expect(mockRpc).toHaveBeenCalledWith('accept_quote_and_assign', {
      p_quote_id: 'quote-from-job-A',
      p_job_id: 'completely-different-job-B',
    });
    // Still only 2 keys, no professional ID injected
    const rpcArgs = mockRpc.mock.calls[0][1];
    expect(Object.keys(rpcArgs)).toHaveLength(2);
  });
});
