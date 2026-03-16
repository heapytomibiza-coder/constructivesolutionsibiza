Activate `founding-members` Rollout Phase

## What's Happening

You're at Week 3 since launch. The `pipe-control` phase (Wizard, Jobs, Forum, Messaging) has been live. Now it's time to flip the switch to `founding-members`, which unlocks:

1. **Professional Directory** (`/professionals`) -- fully built, includes search, category filtering, ranked results, and individual profile pages with "Start a Job" CTA
2. **Professional Detail Pages** (`/professionals/:id`) -- fully built, shows bio, avatar, verification badge, and direct job creation link
  &nbsp;

## What Needs to Change

**One-line code change:**

- `src/domain/rollout.ts` line 34: change `'pipe-control'` to `'founding-members'`

That's it. The `RolloutGate` component and `canSeeRoute` nav logic will automatically:

- Show "Professionals" in the navigation menu
- Allow public access to `/professionals` and `/professionals/:id`
- Keep later-phase features (Services marketplace, Pricing, Reputation, quoting system) still hidden

## What's Already Ready

- Professional directory page with hero, search bar, category/subcategory filtering, ranked results
- Professional detail page with avatar, bio, verification badge, "Start a Job" CTA, and "Send Message" placeholder
- All i18n translations (EN + ES) for professional and quotes features
- RLS policies and DB queries already in place

## Draft WhatsApp Announcement

Here's a message you can adapt:

---

**Constructive Solutions Ibiza -- New Features Live**

Hi everyone! Two weeks in and we're rolling out the next set of features:

**Professional Directory**  
You can now browse verified professionals on the platform. Visit the "Professionals" tab to see who's available, filter by trade, and view their profiles. Each profile has a "Start a Job" button to send work directly to that person.

These features are live now. Go check them out and let us know what you think!

constructivesolutionsibiza.lovable.app

---

## Implementation Steps

1. Update `CURRENT_ROLLOUT` from `'pipe-control'` to `'founding-members'` in `src/domain/rollout.ts`
2. Verify the nav shows the "Professionals" link
3. No database changes needed -- everything is already wired up.
4. Hold back the quoting feature for another 2 weeks