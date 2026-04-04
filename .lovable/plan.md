

# Motivational Microcopy Layer — Professional Pages

## What this is
A copy-only pass that adds soft motivational headlines and "why this matters" framing across professional pages. No design changes, no routes, no new features.

## Tone
Encouraging, simple, confident, helpful. Not cheesy. Written for normal users.

---

## Changes by page

### 1. Dashboard Home (`ProDashboard.tsx`)
**Menu group labels** get motivational reframes:
- "Your Work" → **"Want more opportunities?"**
- "Grow" → **"Want to grow smarter?"**
- "Account" → stays as "Account" (no motivation needed here)

**Menu item hints** get light motivation added:
- Browse Matching Jobs hint: "Open jobs that match your services" → **"Find and respond to open client requests"**
- My Listings hint: "Your public service pages on the marketplace" → **"Complete these so clients can discover and book you"**
- Market Insights hint: "Market demand and trends" → **"See what clients are searching for in your area"**
- Community Forum hint: (add) **"Ask questions, share tips, get help"**

**Empty matched jobs card** — add motivational framing:
- Current body: "We'll show new jobs here when they match your services and areas."
- Add: **"Want more? Add more services to widen your reach."**

### 2. My Jobs (`ProJobsList.tsx`)
No changes needed — subtitle and empty state already guide well. The empty state already links to the job board.

### 3. My Listings (`MyServiceListings.tsx`)
**Subtitle** gets motivational reframe:
- Current: "These are the service pages clients see when browsing the marketplace. Edit, publish, or pause them here."
- New: **"Want to be seen more? Complete and publish your service pages so clients can discover you in the marketplace."**

**Empty draft state**:
- Current: "No drafts yet. Add service categories to generate listing drafts automatically."
- New: **"No drafts yet. Add service categories and we'll create listing drafts for you automatically."**

### 4. Edit Listing (`ServiceListingEditor`)
No changes — page is already task-focused. Adding motivation here would slow the user down.

### 5. Choose Your Services (`ManageServices.tsx`)
**Subtitle** gets motivational reframe:
- Current: "Select the types of work you do. We use these to match you with relevant client requests."
- New: **"Want more opportunities? Select the types of work you do — we use these to match you with real client requests."**

### 6. Profile Edit (`ProfileEdit.tsx`)
**Intro text** gets motivational reframe:
- Current: "Keep it fresh — clients love seeing who they're working with."
- New: **"Want clients to trust you faster? A strong profile helps you stand out and win more work."**

### 7. Job Priorities (`JobPriorities.tsx`)
**Subtitle** gets motivational reframe:
- Current: "Tell us which jobs to send you first. Your choices update instantly."
- New: **"Want better-fit jobs? Tell us which work you prefer and we'll prioritise it for you."**

### 8. Insights (`ProInsights.tsx`)
**Locked description** — add motivational line:
- Current: "See which services are trending, where demand is hottest, and how the market is moving — available on Gold and Elite plans."
- New: **"Want to grow smarter? See which services are trending, where demand is hottest, and how the market is moving."**

---

## Files changed

| File | Change |
|------|--------|
| `public/locales/en/dashboard.json` | ~8 translation value updates (hints, subtitles, empty states, menu labels) |
| `public/locales/es/dashboard.json` | Spanish equivalents |
| `public/locales/en/professional.json` | Priorities subtitle update |
| `public/locales/es/professional.json` | Spanish equivalent |
| `src/pages/professional/ProfileEdit.tsx` | Update hardcoded intro text (line ~304) |

## What does NOT change
- No routes
- No components
- No features
- No layout or design changes
- ProJobsList and ServiceListingEditor untouched
- Dashboard stage cards untouched (already motivational)

