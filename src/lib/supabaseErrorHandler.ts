/**
 * CENTRALIZED SUPABASE ERROR HANDLER
 *
 * Opt-in utility: call handleSupabaseError(error, "Loading job") after any
 * Supabase query to get a visible toast + captured debug context.
 */

import { toast } from 'sonner';
import { setLastSupabaseError } from '@/lib/debugContext';

const friendlyMessages: Record<string, string> = {
  PGRST301: 'Permission denied. Please check your login.',
  PGRST116: 'Record not found.',
  '23505': 'Duplicate entry — this already exists.',
  '23503': 'Referenced record not found.',
  '42501': 'Insufficient privileges.',
};

export function handleSupabaseError(err: unknown, context?: string) {
  if (!err || typeof err !== 'object') return;

  setLastSupabaseError(err);

  const e = err as Record<string, unknown>;
  const code = (e.code as string) ?? '';
  const raw = (e.message as string) ?? 'Something went wrong.';
  const friendly = friendlyMessages[code] ?? raw;

  toast.error(context ? `${context}: ${friendly}` : friendly);

  console.error(`[SupabaseError]${context ? ` ${context}` : ''}`, err);
}
