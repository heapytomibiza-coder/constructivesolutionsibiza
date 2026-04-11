/**
 * INTERACTION TEST — Quote acceptance
 * Covers: QUOTE-002 (accept quote), QUOTE-003 (prevent duplicate), QUOTE-004 (ownership validation)
 *
 * Tests the acceptQuote action function directly — no component rendering needed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRpc = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
  },
}));

vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));

describe('Quote accept interaction tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('QUOTE-002: acceptQuote calls RPC with correct params', async () => {
    mockRpc.mockResolvedValueOnce({ error: null });

    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');
    const result = await acceptQuote('quote-1', 'job-1', 'pro-1');

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('accept_quote_and_assign', {
      p_quote_id: 'quote-1',
      p_job_id: 'job-1',
    });
  });

  it('QUOTE-003: acceptQuote handles already-assigned error', async () => {
    mockRpc.mockResolvedValueOnce({
      error: { message: 'job_already_assigned' },
    });

    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');
    const result = await acceptQuote('quote-1', 'job-1', 'pro-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('already has an assigned professional');
  });

  it('QUOTE-004: acceptQuote blocks unauthenticated users', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');
    const result = await acceptQuote('quote-1', 'job-1', 'pro-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not authenticated');
  });

  it('QUOTE-004: acceptQuote handles not_authorized error', async () => {
    mockRpc.mockResolvedValueOnce({
      error: { message: 'not_authorized' },
    });

    const { acceptQuote } = await import('@/pages/jobs/actions/acceptQuote.action');
    const result = await acceptQuote('quote-1', 'job-1', 'pro-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not authorized');
  });
});
