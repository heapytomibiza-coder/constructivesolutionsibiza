/**
 * Attribution capture hook.
 * Mounts once in SessionProvider.
 * On first visit or when UTM/ref params are present, sends data to collect-attribution edge function.
 * If user is authenticated, includes JWT to bind session → user on the server.
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getSessionId,
  isFirstVisit,
  parseAttributionParams,
  buildFirstVisitAttribution,
  saveAttribution,
  type AttributionData,
} from '@/lib/attribution';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/collect-attribution`;

async function sendAttribution(data: AttributionData): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Include JWT if available (enables server-side user binding)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    await fetch(FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    // fire-and-forget — attribution must never block user experience
  }
}

export function useAttribution(): void {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;

    const firstVisit = isFirstVisit();
    const sessionId = getSessionId(); // creates if needed, writes localStorage + cookie
    const params = parseAttributionParams();

    // Only fire if first visit OR attribution params present
    if (!firstVisit && !params) return;

    sent.current = true;

    const data: AttributionData = params
      ? { session_id: sessionId, ...params }
      : buildFirstVisitAttribution(sessionId);

    saveAttribution(data);
    sendAttribution(data);
  }, []);
}

/**
 * Fire-and-forget: bind attribution session to user on SIGNED_IN.
 * Called from useSessionSnapshot — sends JWT so the edge function
 * can set attribution_sessions.user_id and update profile attribution.
 */
export async function bindAttributionOnSignIn(): Promise<void> {
  try {
    const sessionId = getSessionId();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.access_token) return;

    await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });
  } catch {
    // fire-and-forget
  }
}
