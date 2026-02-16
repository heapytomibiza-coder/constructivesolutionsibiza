/**
 * Attribution helpers — parse, read, write localStorage.
 * Pure functions, no side-effects except localStorage.
 */

const SID_KEY = 'csibiza_sid';
const ATTR_KEY = 'csibiza_attr';

export interface AttributionData {
  session_id: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  ref?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
  landing_url?: string | null;
  raw_params?: Record<string, string>;
}

/** UTM / ref param keys we care about */
const TRACKED_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ref', 'gclid', 'fbclid',
] as const;

/** Generate a simple UUID v4 */
function uuidv4(): string {
  return crypto.randomUUID();
}

/** Get or create a stable session ID */
export function getSessionId(): string {
  try {
    let sid = localStorage.getItem(SID_KEY);
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    // SSR / private browsing fallback
    return uuidv4();
  }
}

/** Check if this is the first visit (no existing session) */
export function isFirstVisit(): boolean {
  try {
    return !localStorage.getItem(SID_KEY);
  } catch {
    return true;
  }
}

/** Parse attribution params from current URL */
export function parseAttributionParams(): Omit<AttributionData, 'session_id'> | null {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    // Check if any tracked params exist
    const hasTrackedParam = TRACKED_PARAMS.some(k => params.has(k));
    if (!hasTrackedParam) return null;

    const raw: Record<string, string> = {};
    params.forEach((v, k) => { raw[k] = v; });

    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),
      ref: params.get('ref'),
      gclid: params.get('gclid'),
      fbclid: params.get('fbclid'),
      referrer: document.referrer || null,
      landing_url: window.location.href,
      raw_params: raw,
    };
  } catch {
    return null;
  }
}

/** Build a full AttributionData object for first visit (no params) */
export function buildFirstVisitAttribution(sessionId: string): AttributionData {
  return {
    session_id: sessionId,
    referrer: document.referrer || null,
    landing_url: window.location.href,
  };
}

/** Save attribution data to localStorage */
export function saveAttribution(data: AttributionData): void {
  try {
    localStorage.setItem(ATTR_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/** Read saved attribution from localStorage */
export function readAttribution(): AttributionData | null {
  try {
    const raw = localStorage.getItem(ATTR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AttributionData;
  } catch {
    return null;
  }
}

/** Get a lean attribution object for embedding in jobs / events */
export function getLeanAttribution(): Record<string, string | null> {
  const attr = readAttribution();
  if (!attr) {
    return { session_id: getSessionId() };
  }
  return {
    session_id: attr.session_id,
    ref: attr.ref ?? null,
    utm_source: attr.utm_source ?? null,
    utm_medium: attr.utm_medium ?? null,
    utm_campaign: attr.utm_campaign ?? null,
  };
}
