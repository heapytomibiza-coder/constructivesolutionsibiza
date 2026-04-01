

# Onboarding QA Checklist — Repeatable Test Plan

## What

Create a structured, repeatable QA checklist document (`docs/qa/ONBOARDING_QA_CHECKLIST.md`) that the team can run before any onboarding-related deploy. Covers the 10 test scenarios outlined, prioritized by impact.

## Why

The onboarding flow has been stabilized through multiple rounds of fixes. A documented checklist prevents regression and gives any team member (dev or non-dev) a clear protocol to follow.

## Changes

### 1. Create `docs/qa/ONBOARDING_QA_CHECKLIST.md`

A single markdown file with:

- **Prerequisites** — how to set up a test (new account, existing account, admin access)
- **10 numbered test scenarios** grouped by priority (🔴 Critical / 🟠 Important / 🟡 Valuable / 🟢 Nice-to-have)
- Each scenario includes: **What to do**, **What to check**, **Pass criteria**
- **Quick-run version** — the "If you only do 3" subset for fast pre-deploy checks
- **Admin metrics validation** section tied to the new Onboarding Health dashboard

### Test scenarios included

| # | Test | Priority |
|---|------|----------|
| 1