/**
 * Attribution helpers — parse, read, write localStorage + cookie.
 * Pure functions, no side-effects except localStorage/cookie.
 */

const SID_KEY = 'csibiza_sid';
const ATTR_KEY = 'csibiza_attr';
const COOKIE_NAME = 'csibiza_sid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

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

/** Read a cookie value by name */
function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/** Set a cookie */
function setCookie(name: string, value: string, maxAge: number): void {
  try {
    const secure = window.location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax${secure}`;
  } catch {
    // ignore
  }
}

/** Get or create a stable session ID (localStorage + cookie) */
export function getSessionId(): string {
  try {
    // Try localStorage first, then cookie fallback
    let sid = localStorage.getItem(SID_KEY) || getCookie(COOKIE_NAME);
    if (!sid) {
      sid = uuidv4();
    }
    // Always persist to both stores
    localStorage.setItem(SID_KEY, sid);
    setCookie(COOKIE_NAME, sid, COOKIE_MAX_AGE);
    return sid;
  } catch {
    // SSR / private browsing fallback
    const cookieSid = getCookie(COOKIE_NAME);
    if (cookieSid) return cookieSid;
    const newSid = uuidv4();
    setCookie(COOKIE_NAME, newSid, COOKIE_MAX_AGE);
    return newSid;
  }
}

/** Check if this is the first visit (no existing session in either store) */
export function isFirstVisit(): boolean {
  try {
    return !localStorage.getItem(SID_KEY) && !getCookie(COOKIE_NAME);
  } catch {
    return !getCookie(COOKIE_NAME);
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
