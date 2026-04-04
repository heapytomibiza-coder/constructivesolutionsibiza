

# Clarity and Guidance Pass — Professional Pages

## What this covers
A copy-only pass across professional pages to improve titles, descriptions, hints, empty states, and action labels. No route changes, no new features, no redesign.

## Changes by page

### 1. Dashboard Home (`/dashboard/pro`)
- **Menu labels**: Add hint text beneath key menu items to distinguish them
  - "Browse Matching Jobs" → add hint: "Open jobs that match your services"
  - "My Jobs" → add hint: "Jobs you've been hired for" (new key `pro.myJobsHint`)
  - "My Listings" → add hint: "Your public service pages on the marketplace" (new key `pro.myListingsHint`)
  - "My Insights" → add hint: "Market demand and trends" (new key `pro.myInsightsHint`)
- **"Edit Profile"** hint: Change from "Update your Tasker profile" → "Update your professional profile" (both EN and ES)
- **Dashboard title**: "Tasker Dashboard" → "Professional Dashboard" (both EN and ES)

### 2. My Jobs (`/dashboard/pro/jobs` — `ProJobsList.tsx`)
- Add subtitle below header: "Jobs where a client has accepted your quote or hired you directly."
- Empty state copy improvement: current is fine but add: "Browse the job board to find and respond to open requests."

### 3. Browse Matching Jobs (`/jobs` — `JobBoardPage.tsx`)
- No changes needed — this is a public page with its own hero. The copy is already clear.

### 4. My Listings (`/dashboard/pro/listings` — `MyServiceListings.tsx`)
- Page title: "Manage Listings" → "My Listings" (aligns with dashboard menu label)
- Subtitle: Change from "Edit and publish your services to appear on the platform." → "These are the service pages clients see when browsing the marketplace. Edit, publish, or pause them here."
- Empty drafts: "No draft listings. Add categories to create drafts." → "No drafts yet. Add service categories to generate listing drafts automatically."
- Empty live: "No live listings yet. Edit and publish your drafts to go live." → "No live listings yet. Complete and publish a draft to appear in the marketplace."

### 5. Edit Listing (`ServiceListingEditor.tsx`)
- Header: "Edit Listing" → "Edit Service Page" — reinforces that this is a public-facing page, not internal config
- Update EN and ES translation keys

### 6. Manage Services (`ManageServices.tsx`)
- Header: "Manage Services" → "Choose Your Services"
- Subtitle: "Add or remove the jobs you want to be matched with." → "Select the types of work you do. We use these to match you with relevant client requests."
- This clearly distinguishes from Listings (which are public pages) — services are internal matching config.

### 7. Insights (`ProInsights.tsx`)
- Title: "My Insights" → "Market Insights"
- Locked description is already good. No changes needed.

### 8. Profile Edit (`ProfileEdit.tsx`)
- No structural changes. Fix "Tasker" reference in hint text.

### 9. Job Priorities (`JobPriorities.tsx`)
- Already clear. No changes needed.

## Files changed

| File | Change |
|------|--------|
| `public/locales/en/dashboard.json` | Updated ~12 translation keys (titles, hints, empty states) |
| `public/locales/es/dashboard.json` | Spanish equivalents of above |
| `public/locales/en/professional.json` | `editListing` → "Edit Service Page" |
| `public/locales/es/professional.json` | Spanish equivalent |
| `src/pages/dashboard/professional/ProJobsList.tsx` | Add subtitle text below header |
| `src/pages/dashboard/professional/ProDashboard.tsx` | Add hint props to MenuItem components (if MenuItem supports hints — otherwise add inline hint text) |

## What does NOT change
- No routes
- No components
- No features
- No layout or design changes
- Job board page (`/jobs`) is untouched — it's a public page with its own clear copy

