
# Complete the Job Ticket as the Lifecycle Hub

## Current state audit

### ✅ Already working for BOTH roles:
- **Job summary card** (title, category, location, timing, budget)
- **Status badge** (ready/open/in_progress/completed/cancelled)
- **StatusTimeline** (visual dots: ready → open → in_progress → completed)
- **Review section** (role-aware — client reviews pro, pro reviews client)
- **Conversations link** (role-aware unread detection)
- **Raise Issue button** (links to dispute system)

### ✅ Working for CLIENT only (correctly gated):
- Activity panel (invites/conversations/quotes counts)
- Completion CTA ("Mark as Complete")
- Quotes section (compare/review incoming quotes)
- Distribution actions (post to board, invite pros)
- Edit/Close/Hire Again buttons

### ❌ Missing — needs adding:

1. **JobTimeline on the ticket page** — We built a rich vertical timeline (merges status history + quote events + reviews) but it's only in the messages header. It should be the centrepiece of the Job Ticket page, replacing or supplementing the simple dot-based `StatusTimeline`.

2. **Pro's quote summary** — When a pro views their job ticket, they should see their own submitted quote (amount, status, line items) so they know what was agreed. Currently quotes section is client-only.

3. **Client name for pro view** — The pro should see who the client is (display name from profiles table). Currently no client identity shown.

## Changes

### 1. Add `JobTimeline` to the Job Ticket page
- Import the existing `JobTimeline` from `src/pages/messages/components/JobTimeline.tsx`
- Show it expanded (not collapsed like in chat header) below the status badge
- Keep the simple `StatusTimeline` dots as a compact summary, add the rich timeline below it
- Both roles see this

### 2. Add pro's own quote card
- New section: when `!isClient`, fetch the pro's quote for this job
- Show a read-only summary: total amount, status (submitted/accepted/revised), line items
- Reuse existing `QuoteCard` component or show a simple summary card

### 3. Show client identity to the pro
- Fetch client `display_name` from `profiles` table using `job.user_id`
- Show in the job summary card header area as "Client: [name]"

### 4. Tidy the StatusTimeline
- The simple dot timeline still serves as a quick-glance indicator
- The rich `JobTimeline` underneath shows the detailed audit trail

## Result
The Job Ticket becomes the single source of truth for both roles:
- **Pro sees**: status → timeline → job summary → their quote → conversations → review → raise issue
- **Client sees**: status → timeline → activity → job summary → completion → review → quotes → conversations → distribution → invites
