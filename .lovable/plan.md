

# Rebuild Public Professional Profile as Conversion-Focused Sales Page

## What changes

Rewrite `src/pages/public/ProfessionalDetails.tsx` to:

1. **Reorder sections** to lead with commercial content: Hero > Live Services > About > Specialisations > Service Area > Reviews/Trust
2. **Add a Services section** querying `service_listings_browse` (the approved public-safe view) filtered by `provider_id`, displayed as cards with image, title, description, pricing, and a "View Service" link to `/services/listing/:id`
3. **Make the sidebar sticky** on desktop (`lg:sticky lg:top-24`) with Quick Facts + CTAs
4. **Add mobile sticky bottom CTA bar** (fixed bottom, visible below `lg` breakpoint) with "Start a Job" button
5. **Improve reviews placeholder** copy from "Reviews coming soon" to "Client reviews will appear here as the trust system rolls out"
6. **Remove "Member since"** (not in the current query, not worth adding a field for now)
7. **No new data model** -- every field displayed maps directly to what exists in Edit Profile or `service_listings_browse`

## Edit Profile to Public Profile alignment

| Edit Profile Section | Public Profile Section |
|---|---|
| Basic Info (name, tagline) | Hero |
| Business (business_name) | Hero subtitle |
| About (bio) | About card |
| Contact (email, phone) | Not shown -- replaced by CTAs |
| Visibility toggle | Not shown -- internal |
| Quick-nav: Edit Services | **Services section** (live listings) |
| Quick-nav: Job Priorities | Specialisations (micro-preference badges) |
| -- | Service Area (from `service_zones`) |
| -- | Quick Facts sidebar (availability, pricing, lead time) |

## Services section details

- Query `service_listings_browse` where `provider_id = professional.user_id`, limited to 6
- Each card: hero image (4:3 fallback), title (2-line clamp), pricing summary, location
- CTA per card: "View Service" linking to `/services/listing/:id`
- Section only renders when results exist and `isRolloutActive('service-layer')`
- Distinct from Specialisations: services = cards, specialisations = compact badges

## Sticky sidebar

- Desktop: `lg:sticky lg:top-24` on right column div
- Contains: "Start a Job" CTA, Quick Facts (lead time, emergency, pricing, services count, min call-out), "Send Message" CTA
- Mobile: hide sidebar message card, add fixed bottom bar with primary CTA button

## Files modified

- `src/pages/public/ProfessionalDetails.tsx` -- full rework (single file change)

## No database changes needed

All data comes from existing tables/views with existing RLS policies.

