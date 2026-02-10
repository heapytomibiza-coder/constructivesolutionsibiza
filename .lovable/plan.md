

## Feature: Scoped Direct Mode Wizard + Richer Tasker Selection

### What This Solves

Two gaps in the Direct Mode flow:

1. **Unscoped wizard**: When an Asker clicks "Start a Job" on a Tasker's profile, the wizard shows ALL 295 micro-services. The Asker can accidentally request work the Tasker doesn't do, creating a bad experience for both sides.

2. **Blind selection**: When choosing a Tasker from the Review step, the list shows only name and avatar -- no services, no bio, no verification detail. The Asker is picking blind.

---

### Solution Overview

**Part A -- Scope the wizard to the Tasker's services**

When the wizard opens in direct mode (`?pro=<uuid>`), fetch that Tasker's `professional_services` and use them to filter what the Asker sees at each taxonomy level:

- **Step 1 (Category)**: Only show categories that contain at least one of the Tasker's services
- **Step 2 (Subcategory)**: Only show subcategories with matching services
- **Step 3 (Micro)**: Only show the specific tasks the Tasker has unlocked

This means the Asker literally cannot select a service the Tasker doesn't offer.

**Part B -- Richer Tasker selection cards**

When the Professionals page is in select mode (`?select=true`), upgrade each card to show:
- Bio snippet (first ~80 characters)
- Verification badge (already shown) + status label
- Top 3 service names
- Services count

---

### Technical Approach

#### New Hook: `useProfessionalServices`

A small query hook that fetches a Tasker's unlocked micro IDs + their parent category/subcategory IDs:

```
Query: professional_services + service_micro_categories (joined)
Returns: { microIds, subcategoryIds, categoryIds }
Cached with staleTime: 5 min
```

#### Changes to DB-Powered Selectors

Each selector receives an optional `allowedIds` filter prop:

| File | Change |
|------|--------|
| `CategorySelector.tsx` | Accept optional `allowedCategoryIds: string[]`. If provided, filter the displayed categories to only those in the set. |
| `SubcategorySelector.tsx` | Accept optional `allowedSubcategoryIds: string[]`. Same filtering logic. |
| `MicroStep.tsx` | Accept optional `allowedMicroIds: string[]`. Only show micros in the set. |

#### Changes to CanonicalJobWizard

- When `wizardState.targetProfessionalId` is set, call the new hook to get their service scope
- Pass the scope down to each selector component
- Add a small info banner: "Showing services offered by [Tasker Name]"

#### Changes to Professionals Page (Select Mode)

- Fetch professional services (top 3 micro names) alongside profile data
- Expand the card layout in select mode to include bio snippet and service tags
- Keep the compact card for normal browse mode (no visual regression)

### Files to Create/Edit

| File | Action | What |
|------|--------|------|
| `src/features/wizard/canonical/hooks/useProServiceScope.ts` | **Create** | Hook to fetch a Tasker's service scope (micro/sub/category IDs) |
| `src/features/wizard/db-powered/CategorySelector.tsx` | Edit | Add optional `allowedCategoryIds` filter |
| `src/features/wizard/db-powered/SubcategorySelector.tsx` | Edit | Add optional `allowedSubcategoryIds` filter |
| `src/features/wizard/db-powered/MicroStep.tsx` | Edit | Add optional `allowedMicroIds` filter |
| `src/features/wizard/canonical/CanonicalJobWizard.tsx` | Edit | Wire up scope hook + pass filters when in direct mode |
| `src/pages/public/Professionals.tsx` | Edit | Richer cards in select mode (bio, services, verification label) |

### Edge Cases Handled

- **Tasker has no services**: Show empty state with message "This professional hasn't set up their services yet"
- **Scope hook still loading**: Show skeleton/loading state on selectors (don't flash unfiltered list)
- **Tasker adds services later**: Cache is 5 min, so new services appear on next wizard open
- **Non-direct mode**: No filtering applied -- wizard works exactly as today

### What This Does NOT Change

- Broadcast mode (unaffected)
- The wizard steps themselves (same 7 steps)
- How jobs are submitted or stored
- The matching algorithm
- Any database schema (pure frontend filtering)

