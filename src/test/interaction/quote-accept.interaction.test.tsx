/**
 * INTERACTION TEST — Quote acceptance
 * Covers: QUOTE-002 (accept), QUOTE-003 (duplicate), QUOTE-004 (ownership)
 * Health alert link: quote funnel → acceptQuote must enforce server-side integrity
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRpc = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  },
}));

vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));

describe('Quote accept interaction tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('QUOTE-002: acceptQuote calls RPC with correct params (no professionalId)', async () => {
    mockRpc.mockResolvedValueOnce({ error: null });

    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');
    const result = await acceptQuote('quote-1', 'job-1', 'pro-1');

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('accept_quote_and_assign', {
      p_quote_id: 'quote-1',
      p_job_id: 'job-1',
    });
    // SEC-003: professionalId must NOT be in RPC params
    const rpcArgs = mockRpc.mock.calls[0][1];
    expect(Object.keys(rpcArgs)).toHaveLength(2);
  });

  it('QUOTE-003: handles job_already_assigned error', async () => {
    mockRpc.mockResolvedValueOnce({ error: { message: 'job_already_assigned' } });

    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');
    const result = await acceptQuote('quote-1', 'job-1', 'pro-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('already has an assigned professional');
  });

  it('QUOTE-004: blocks unauthenticated users', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');
    const result = await acceptQuote('quote-1', 'job-1', 'pro-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not authenticated');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('QUOTE-004: handles not_authorized error from RPC', async () => {
    mockRpc.mockResolvedValueOnce({ error: { message: 'not_authorized' } });

    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');
    const result = await acceptQuote('quote-1', 'job-1', 'pro-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not authorized');
  });

  it('QUOTE-003: handles quote_not_acceptable (already accepted)', async () => {
    mockRpc.mockResolvedValueOnce({ error: { message: 'quote_not_acceptable' } });

    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');
    const result = await acceptQuote('quote-1', 'job-1', 'pro-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not in an acceptable status');
  });
});
