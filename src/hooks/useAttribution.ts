/**
 * Attribution capture hook.
 * Mounts once in SessionProvider.
 * On first visit or when UTM/ref params are present, sends data to collect-attribution edge function.
 */

import { useEffect, useRef } from 'react';
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
    await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.warn('[attribution] collect failed:', err);
  }
}

export function useAttribution(): void {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;

    const firstVisit = isFirstVisit();
    const sessionId = getSessionId(); // creates if needed
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
