/**
 * @deprecated — Use acceptQuote.action.ts instead.
 * This legacy path performed client-side multi-step validation.
 * The atomic accept_quote_and_assign RPC is now the single source of truth.
 * Kept temporarily for reference — no active importers remain.
 */

import { supabase } from '@/integrations/supabase/client';

export async function assignProfessional(
  _jobId: string,
  _professionalId: string
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'This path is deprecated. Use acceptQuote instead.' };
}
