/**
 * i18n namespace constants for type-safe translations
 */
export const NS = {
  common: "common",
  auth: "auth",
  jobs: "jobs",
  forum: "forum",
  dashboard: "dashboard",
  wizard: "wizard",
  onboarding: "onboarding",
  lexicon: "lexicon",
} as const;

export type Namespace = (typeof NS)[keyof typeof NS];