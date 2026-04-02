

# Pixel-Perfect Job Ticket UI Redesign

Upgrade the Job Ticket from functional cards into a premium guided workflow with proper visual hierarchy, spacing, and interaction states.

---

## 1. StageHero.tsx — Full rewrite

**Current:** Small card with icon + text + inline button.
**New:** Dominant hero panel answering "Where am I? What do I do?"

- Add `quotesCount` and `hasAcceptedQuote` props for the full 6-state map
- Single `resolveStage()` function determines: `open_no_quotes`, `open_with_quotes`, `assigned`, `in_progress`, `completed_no_review`, `completed_reviewed`
- `STAGE_MAP` config object with `title`, `meaning`, `nextStep`, `primaryAction` per stage, role-aware
- Layout: `rounded-3xl`, `p-7` desktop / `p-5` mobile, gradient background
- Status pill (colored badge) top-left
- Title: 32px/700 desktop, 26px/700 mobile
- "Next step" in a tinted inset panel (`rounded-2xl`)
- Primary action: `h-12 rounded-xl` desktop, full-width mobile
- One primary action only per state

## 2. JobProgressRail.tsx — Premium polish

**Desktop:**
- Wrap in `rounded-[20px]` card surface with `p-5`, border
- "JOB PROGRESS" header (12px, uppercase, tracked)
- Job title preview below (16px, 600, max 2 lines) — new `jobTitle` prop
- Step nodes: done `28px` filled, current `32px` with ring, upcoming `28px` outline
- Connector: `2px`, primary-colored for done
- Rail footer: last update time, professional name, status — new `proName`, `lastUpdateAt` props

**Mobile:**
- Wrap in card `rounded-[18px]`, `p-3.5`
- Status summary row: "Work in progress · Updated today"
- Steps: `min-w-[88px]` each

## 3. ProgressUpdates.tsx — Latest Update Card + Timeline

- Split the first (latest) update into a prominent "Latest Update Card": `rounded-[22px]`, `p-5`, full-width image `max-h-96 rounded-2xl`
- Older updates: compact list with small thumbnails, `rounded-2xl`, `p-3.5`
- Default: show latest large + next 2 smaller, "View all" if more
- Add mobile FAB for professionals: `56px` pill, bottom-right, "Update" label, only during `in_progress`

## 4. JobTicketDetail.tsx — Layout + content order

**Desktop widths:** Left rail `w-[280px]`, gap `24px`, right `max-w-[820px]`
**Mobile:** `px-4`, `py-3`, section gap `16px`

**Content priority order:**
1. StageHero (with new props: `quotesCount`, `hasAcceptedQuote`)
2. ProgressUpdates (in_progress / completed)
3. JobTicketReview (completed)
4. Quotes section (role-dependent)
5. ConversationPreviewCard (new — compact)
6. Job Summary accordion (collapsed past open)
7. Distribution actions (client + ready/open)

Remove `JobActivityPanel` from inline position — its info is covered by the rail footer and stage hero.

## 5. New: ConversationPreviewCard.tsx

Compact card (`rounded-[20px]`, `p-4.5`):
- "Conversation" title
- Last message preview (truncated), sender, timestamp
- Unread badge
- "Open chat" → links to `/messages/:conversationId`
- Fetches from existing conversations query, filtered by role

## 6. Card hierarchy system

Three tiers enforced consistently:
- **Hero:** `rounded-3xl`, `p-7`, gradient, subtle shadow
- **Primary:** `rounded-[22px]`, `p-5`
- **Secondary:** `rounded-[18px]`, `p-4`

## 7. Typography + spacing

Desktop: 32/700 hero → 20/600 section → 18/600 card → 15-16/400 body → 13/500 meta
Mobile: 26/700 hero → 18/600 section → 15/400 body → 12-13 meta
Spacing scale: 4, 8, 12, 16, 20, 24, 28, 32 only.

---

## Files affected

| File | Action |
|------|--------|
| `StageHero.tsx` | Major rewrite — 6-state resolver, premium layout |
| `JobProgressRail.tsx` | Polish — card wrap, footer summary, node sizing |
| `ProgressUpdates.tsx` | Split latest/timeline, mobile FAB |
| `JobTicketDetail.tsx` | Layout widths, content order, new props |
| `ConversationPreviewCard.tsx` | New component |

No database changes needed.

