const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi;
const PHONE_RE = /(^|[^\w])(\+?\d[\d\s().-]{6,}\d)(?=$|[^\w])/g;

export function maskContactDetails(value: string, replacement = "[contact hidden]"): string {
  if (!value) return value;

  return value
    .replace(EMAIL_RE, replacement)
    .replace(URL_RE, replacement)
    .replace(PHONE_RE, (match, prefix: string, candidate: string) => {
      const digitCount = candidate.replace(/\D/g, "").length;
      return digitCount >= 7 ? `${prefix}${replacement}` : match;
    });
}
