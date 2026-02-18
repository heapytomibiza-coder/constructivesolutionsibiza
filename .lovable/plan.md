# Fix: "Go Live" Blocked + Home Tiles Mismatch

## Problem 1: "Go Live" button is disabled (not a spinner bug)

**Root cause**: All stuck professionals have `service_zones = NULL` in the database. The ReviewStep requires `service_zones` to be non-empty before enabling the "Go Live" button -- so it stays greyed out with "Complete all checklist items to go live".

The service zones are correctly saved by ServiceAreaStep, but the session snapshot only loads `service_zones` from `professional_profiles`. Since these users show `service_zones = NULL` in the DB, either:

- They navigated directly to a later step via URL params (skipping ServiceAreaStep)
- An earlier version of the code didn't save zones

**Fix A -- Session snapshot not loading service_zones (already works)**
The `useSessionSnapshot` already fetches `service_zones` at line 116. No change needed here.

**Fix B -- Make ReviewStep resilient: fetch directly from DB**
Instead of relying solely on the session snapshot (which might be stale), the ReviewStep should fetch `service_zones` directly from the database to get the freshest data. This ensures the checklist reflects actual DB state.

**Fix C -- Data repair for stuck users**
Run a one-time SQL to check which users at `service_setup` phase genuinely have no zones. For those, the admin dashboard already surfaces them -- they need to go back and complete the ServiceAreaStep.

## Problem 2: Home tiles category name mismatch

**Root cause**: `MAIN_CATEGORIES` in `src/domain/scope.ts` has `'Architects & Design'` but the database has `'Architects, Design & Management'`. When the homepage generates a slug from the name, it creates `architects-design` but the DB slug is `architects-design-management`.

**Fix**: Update `MAIN_CATEGORIES` and `categoryIcons` in the Index page to match the actual DB category name.

---

## Technical Changes

### 1. Update `src/domain/scope.ts`

- Change `'Architects & Design'` to `'Architects, Design & Management'` in `MAIN_CATEGORIES`

### 2. Update `src/pages/Index.tsx`

- Change the `categoryIcons` key from `'Architects & Design'` to `'Architects, Design & Management'`

### 3. Update `src/pages/onboarding/steps/ReviewStep.tsx`

- Add a direct DB query for `service_zones` and `phone` to ensure the checklist is based on fresh data, not just the session cache
- This prevents false "incomplete" states when the session hasn't refreshed yet

### 4. Update `src/i18n/categoryTranslations.ts` (if needed)

- Ensure the translation key for the renamed category matches

### 5. Data verification query

- Check stuck users and confirm whether they truly have no zones or if it's a display issue