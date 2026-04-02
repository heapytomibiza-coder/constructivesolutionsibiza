

# Narrative Flow Transformation — Job Ticket Page

## Problem

The page has good structure and spacing but lacks **visual weight hierarchy** and **narrative flow**. Every section reads at the same weight, making the page feel flat and lifeless. There's no "main moment" — no proof of activity, no human signals.

## Design Principle

Every screen answers five questions in order:
1. Where am I? (Rail + Header)
2. What's happening? (Hero)
3. What should I do? (Primary action)
4. What proves this is real? (Proof — **currently missing weight**)
5. What else might I need? (Context — currently competing with proof)

## Changes

### 1. Make Latest Update the dominant centrepiece (ProgressUpdates.tsx)

The `LatestUpdateCard` currently looks like every other card. Transform it into the **visual anchor** of the page:

- Increase padding and border radius to hero-tier (`rounded-3xl p-6`)
- Photo-first layout: if there's a photo, render it edge-to-edge at the top of the card (no padding), with note overlaid or below
- Add author name and "2 hours ago" in a warmer, more human format
- Add a subtle gradient accent on the left border to signal "this is the main thing"
- Increase note text size to `text-base` for the latest update
- When no updates exist during `in_progress`, show an encouraging empty state ("No updates yet — post the first one") rather than generic text

### 2. Introduce visual weight hierarchy in JobTicketDetail.tsx

Restructure spacing and visual weight across sections:

- **Hero**: stays as-is (already well-designed)
- **Progress Updates** (proof section): add `mt-1` tighter coupling to hero — it should feel like "the next beat" not "another section"
- **Quotes / Conversation / Job Details**: demote visually — use `border-border/40 bg-muted/20` (secondary tier styling) and reduce padding
- **Job Details**: keep collapsed by default when past open (already done), but also reduce its visual prominence further with lighter border
- **Conversation preview**: already compact, keep as-is

### 3. Add human signals throughout

- **LatestUpdateCard**: Show author name (fetch from profiles or pass through), show relative time prominently
- **Section headers**: Replace generic "Progress Updates" with contextual labels like "Latest from the site" or keep "Progress Updates" but add the last-updated timestamp inline
- **Empty states**: Make them warmer and action-oriented, not just "No data"

### 4. Collapse empty containers

In `JobTicketDetail.tsx`, sections that have no meaningful content should not render at all (many already do this via conditional rendering — verify `ProjectGallery`, `PortfolioPrompt`, and `ConversationPreviewCard` all return null when empty).

### 5. Section ordering refinement for `in_progress` state

Reorder the content flow for narrative progression:

```text
Hero (meaning + action)
  ↓
Cancellation banner (if applicable — urgent)
  ↓
Latest Update (DOMINANT — the proof)
  ↓
Post form (pro) / Completion CTA (client)
  ↓
Project Gallery
  ↓
Conversation preview (compact)
  ↓
Quote summary (collapsed/compact)
  ↓
Job Details (collapsed)
  ↓
Footer actions (muted)
```

This is largely the current order, but the visual weight shift makes it feel intentional.

## Files Modified

| File | Change |
|------|--------|
| `ProgressUpdates.tsx` | Redesign `LatestUpdateCard` as hero-tier centrepiece with photo-first layout, larger text, human timestamps, author name. Improve empty state copy. |
| `JobTicketDetail.tsx` | Demote secondary sections (quotes, job details, conversation) to lighter visual tier. Tighten spacing between hero and proof section. |
| `ConversationPreviewCard.tsx` | Minor — ensure it already returns null when no conversation exists (confirmed). |
| `ProQuoteSummary.tsx` / `JobTicketQuotes.tsx` | Reduce visual weight — lighter borders, muted backgrounds to signal "reference" not "action". |

## What this achieves

- The page goes from "cards stacked equally" to "a story unfolding"
- The latest update becomes the visual anchor — proof that something is happening
- Secondary info recedes into supporting context
- The 3-second test passes: you instantly know where you are, what's happening, and what to do

