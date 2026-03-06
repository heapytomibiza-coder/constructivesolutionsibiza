

## Plan: Improve Tasker Dashboard & Listing Editor

Three improvements based on user feedback:

---

### 1. Add Unsplash Stock Photo Picker in Listing Editor

**Problem:** Professionals must upload their own images. Many don't have good photos for generic services like "Wooden Worktops."

**Solution:** Add a "Choose Stock Photo" button alongside the upload area in `ServiceListingEditor.tsx`. This will use the Unsplash API (free tier, 50 req/hr) via a backend function to search for relevant construction/trade images.

**Implementation:**
- Create a new edge function `supabase/functions/search-stock-photos/index.ts` that proxies Unsplash API calls (requires `UNSPLASH_ACCESS_KEY` secret)
- Add a `StockPhotoPicker` component — a dialog with a search bar and grid of thumbnails. When selected, the image URL is set as `heroUrl` or added to gallery
- Integrate into `ServiceListingEditor.tsx` hero image and gallery sections with a secondary "Browse Stock Photos" button
- Use Unsplash's free hotlinking (required by their terms) — no need to re-upload to storage

**Alternative (no API key needed):** Use curated, pre-selected images bundled per service category. Less flexible but zero external dependency. 

**I recommend asking the user which approach they prefer before proceeding.**

---

### 2. Reorder Tasker Dashboard — Actions First, Clearer Wording

**Problem:** The dashboard leads with stats and matched jobs. The user wants the "Manage Your Work" actions to be more prominent. Wording is unclear.

**Changes to `ProDashboard.tsx`:**
- **Desktop layout:** Swap columns — put "Manage Your Work" card on the LEFT (primary), matched jobs on the RIGHT
- **Mobile layout:** Move the quick-action grid ABOVE the stats row so actions come first
- **Add an "Edit My Services" button** directly in the quick actions grid (currently only accessible via Manage Listings → Add/Remove Categories, which is buried)
- **Clearer labels:**
  - "Service Categories" → "My Services" with hint "Types of work you accept"
  - "Manage Listings" → "My Public Ads" with hint "What clients see when browsing"
  - Add a new tile: "Edit My Services" → links to `/onboarding/professional?edit=1&step=services` with hint "Add or remove the jobs you accept"

---

### 3. Surface "Edit Services" (Category/Sub/Micro) More Clearly

**Problem:** The path to edit onboarding selections (category → subcategory → micro) is hidden behind Manage Listings → small "Add / Remove Categories" button. User couldn't find it.

**Changes:**
- Add a dedicated **"Edit My Services"** quick-action tile on `ProDashboard.tsx` (both mobile grid and desktop sidebar), linking to `/onboarding/professional?edit=1&step=services`
- Use a distinct icon (e.g., `Settings2` or `ListChecks`) and clear hint text: "Add or remove the types of jobs you want to receive"
- In `MyServiceListings.tsx`, make the existing "Add / Remove Categories" button more prominent — upgrade from outline to primary variant and add descriptive hint text below it

---

### Files to modify:
1. `src/pages/dashboard/professional/ProDashboard.tsx` — reorder layout, add "Edit My Services" tile, update labels
2. `src/pages/professional/ServiceListingEditor.tsx` — add stock photo picker UI
3. `src/pages/professional/MyServiceListings.tsx` — make "Add / Remove Categories" more prominent
4. `supabase/functions/search-stock-photos/index.ts` — new edge function (if Unsplash route chosen)
5. `public/locales/en/dashboard.json` + `es/dashboard.json` — new/updated translation keys

