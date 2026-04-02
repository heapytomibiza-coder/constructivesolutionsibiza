# Pixel-Perfect Job Ticket UI Redesign

## What changes

Upgrade the existing Job Ticket components from functional-but-flat to a premium guided workflow with proper visual hierarchy, spacing, and interaction states.

---

## 1. StageHero.tsx — Complete redesign

Current: small card with icon + text + button inline.
New: dominant hero panel with status pill, large title (32px desktop / 26px mobile), meaning paragraph, distinct "Next step" inset panel, and separated action row.

**Key changes:**
- Add `quotesCount` and `hasAcceptedQuote` props to support the full 6-state map (open_no_quotes, open_with_quotes, assigned, in_progress, completed_no_review, completed_reviewed)
- Replace the switch-on-status with a `resolveStage()` function + `STAGE_MAP` config object
- Role-aware descriptions (client vs professional get different meaning + next step text)
- Larger card: `rounded-3xl`, padding `28px`, gradient background
- Status pill top-left (colored badge with stage label)
- "Next step" rendered in a soft inset panel (`rounded-2xl`, tinted background)
- Primary action button: `h-12 px-5 rounded-xl` on desktop, full-width on mobile
- Optional support strip below actions (e.g. "3 updates posted")

## 2. JobProgressRail.tsx — Premium polish

Current: functional but visually thin.
New: wrapped in a card surface with proper padding and footer summary.

**Desktop changes:**
- Wrap in a `rounded-[20px]` card with border and `p-5`
- "JOB PROGRESS" header with `tracking-wider uppercase 12px 600`
- Job title preview below header (16px, 600, max 2 lines)
- Step nodes: done=`28px` filled, current=`32px` with ring, upcoming=`28px` outline
- Connector line: `2px` thick, colored for done steps
- Step row min-height: `52px`, gap `12px`
- Rail footer: compact summary strip showing last update time, professional name, status

**Mobile changes:**
- Wrap in a card with `rounded-[18px]`, `p-3.5`
- Each step: min-width `88px`, icon above/label below
- Status summary row above or inside the card ("Work in progress · Updated today")

## 3. ProgressUpdates.tsx — Latest Update Card + Timeline

Current: flat list of updates.
New: split into "Latest Update Card" (large, prominent) + condensed timeline for older updates.

**Latest Update Card:**
- `rounded-[22px]`, `p-5`
- Full-width image with `max-h-96 object-cover rounded-2xl`
- Note text `16px`, timestamp + author meta `13px`

**Older updates:**
- Compact list items: `p-3.5 rounded-2xl`, small thumbnail if image exists
- "View all updates" link if >3 updates
- Show only latest large + next 2 smaller by default

**Pro mobile FAB:**
- Floating "Update" pill button (`56px`, bottom-right) for professionals during in_progress
- Only visible on mobile, only for assigned pro

## 4. JobTicketDetail.tsx — Layout restructure

**Desktop (lg+):**
- Left rail: `w-[280px]` (up from `w-56`)
- Gap: `24px`
- Right column: `max-w-[820px]`
- Container: `max-w-7xl`, `px-6`, `py-6`

**Mobile:**
- `px-4`, `py-3`
- Section gap: `16px` (down from `20px`)

**Content order refined:**
1. StageHero (always)
2. ProgressUpdates — latest update card (in_progress / completed)
3. JobTicketCompletion (client + in_progress) — absorbed into StageHero action
4. JobTicketReview (completed)
5. Quotes section (role-dependent)
6. ConversationPreviewCard (compact: last message + "Open chat" button, not full thread)
7. Job Summary accordion (collapsed past open stage)
8. Distribution actions (client + ready/open)

**Conversation treatment:**
- Replace inline `JobTicketConversations` with a compact preview card showing last message + unread badge + "Open chat" button
- Full conversation stays in messaging thread

## 5. New: ConversationPreviewCard component

Compact card (`rounded-[20px]`, `p-4.5`):
- Title: "Conversation"
- Last message preview (truncated)
- Sender + timestamp
- Unread badge
- "Open chat" button linking to `/messages/:conversationId`

## 6. Job Summary — Accordion treatment

- When past open stage: render as a clean accordion (`rounded-[18px]`)
- Trigger row: `h-14`, "Job summary" label + chevron
- Category/area preview text in muted on trigger row
- Quote details also become an accordion below

## 7. Card hierarchy system

Apply consistent card styling:
- **Level 1 (Hero):** `rounded-3xl`, `p-7`, gradient bg, subtle shadow
- **Level 2 (Primary content):** `rounded-[22px]`, `p-5`
- **Level 3 (Secondary):** `rounded-[18px]`, `p-4`, lower contrast

## 8. Spacing system

Enforce strict scale: 4, 8, 12, 16, 20, 24, 28, 32
- Section gap mobile: `16px`
- Section gap desktop: `20px`
- Hero padding: `28px`
- Primary card padding: `20px`
- Secondary card padding: `16px`

## 9. Typography hierarchy

Desktop: Hero title 32/700, section title 20/600, card title 18/600, body 15-16/400, meta 13/500, tiny 12/600
Mobile: Hero title 26/700, section title 18/600, body 15/400, meta 12-13

---

## Files affected

| File | Action |
|------|--------|
| `StageHero.tsx` | Major rewrite — 6-state config, premium layout |
| `JobProgressRail.tsx` | Polish — card wrap, footer, node sizing, mobile card |
| `ProgressUpdates.tsx` | Split into latest card + timeline, add mobile FAB |
| `JobTicketDetail.tsx` | Layout widths, spacing, content order, conversation preview |
| `ConversationPreviewCard.tsx` | New — compact chat preview |
| `JobTicketConversations.tsx` | Keep for full view, no longer inline on ticket |

No database changes needed.
