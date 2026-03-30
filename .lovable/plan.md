

# Build-First Wireframe & Implementation Plan
## Constructive Solutions Ibiza

---

## PART 1 — DESIGN-FIRST PRIORITY ORDER

### Top 10 Pages to Design First

| Rank | Page | Why It Matters | Business Goal | Risk If Poor |
|------|------|----------------|---------------|-------------|
| 1 | **Homepage** | First impression, conversion entry | Convert visitors → job posters or pro signups | Bounce rate kills pipeline |
| 2 | **Post a Job Wizard** | Core client action, defines job quality | Structured jobs → better matching → better quotes | Vague jobs → bad quotes → no hires |
| 3 | **Pro Onboarding** | Supply acquisition | Get pros verified and receiving jobs | Drop-off = no supply |
| 4 | **Job Ticket Detail** | Where hiring decisions happen | Quote review → hire → completion → review | Lost hires = lost revenue |
| 5 | **Quote Comparison View** | **Does not exist yet** — highest-value missing page | Side-by-side comparison → confident hiring | Clients leave platform to compare via WhatsApp |
| 6 | **Messages / Conversation Thread** | Where deals are negotiated | Keep conversations on-platform | Off-platform = lost control |
| 7 | **Professional Dashboard** | Pro home base | Guide pros through setup → jobs → quoting | Confused pros = no quotes |
| 8 | **Client Dashboard** | Client home base | Quick access to jobs, messages, actions | Confused clients = no repeat use |
| 9 | **Service Listing Detail** | Pro's marketplace presence | Showcase quality → attract inquiries | Weak listings = no trust |
| 10 | **Professional Profile** | Public trust page | Reviews + portfolio → conversion | No social proof = no hires |

---

## PART 2 — WIREFRAME SPEC FOR TOP 10 PAGES

### 1. Homepage (`/`)

**Status**: Built (604 lines). 8-section conversion journey exists.

- **Objective**: Convert visitors within 30 seconds
- **Primary user**: Guest / Visitor
- **Key actions**: Post a Job, Browse Services, Join as Pro
- **Sections** (top→bottom): Nav → Hero + Search → How We Work (4 steps) → Our Services (6 cards) → Featured Projects → Why Choose Us (old vs new) → Social Proof → Trust Signals → Final CTA → Footer
- **Trust elements**: Guided process badge, verified pros, stats bar
- **Mobile**: Single-column, stacked CTAs, search bar prominent
- **Empty states**: N/A (static content)
- **Conversion notes**: Hero CTA must be above fold. "Post a Job" must be reachable without scrolling.

### 2. Post a Job Wizard (`/post`)

**Status**: Built. 7-step wizard with sessionStorage persistence.

- **Objective**: Produce a structured, matchable job brief
- **Primary user**: Client (or guest, auth at publish)
- **Sections**: Progress bar → Step content (tiles/forms) → Step 7 Job Brief review → Publish
- **Trust elements**: "Your data stays private until you publish" note
- **Mobile**: Touch-friendly tiles (48px min), auto-advance 250ms
- **Empty states**: "Can't find what you need?" escape route
- **Error states**: Validation on Step 5 (location, timing, budget, contact)
- **Conversion notes**: Auth gate deferred to publish. No friction before commitment.

### 3. Pro Onboarding (`/onboarding/professional`)

**Status**: Built. Multi-step with shared component library.

- **Objective**: Get pro verified and receiving matched jobs
- **Primary user**: New professional
- **Sections**: Business info → Service selection (taxonomy browser) → Portfolio upload → Verification
- **Trust elements**: Progress indicator, "Save" feedback (QuietSaveIndicator)
- **Mobile**: ZoneTile (56px), GradientIconHeader, IslandWideTile
- **Empty states**: Pre-populated hints for each field
- **Conversion notes**: Each step must feel achievable. Show "what happens after" motivation.

### 4. Job Ticket Detail (`/dashboard/client/jobs/:jobId`)

**Status**: Built (366 lines). Shows summary + distribution actions + invites. **Missing**: quotes received, conversations list, quote accept/decline, mark complete, leave review.

- **Objective**: Full job lifecycle control centre
- **Primary user**: Client
- **Sections** (top→bottom):
  1. Sticky nav (back + title)
  2. Status badge + action buttons (contextual by status)
  3. Job summary card (category, micro-services, location, timing, budget)
  4. **Quotes section** (list of received quotes with "Compare" CTA) ← MISSING
  5. **Conversations section** (linked message threads) ← MISSING
  6. Distribution actions (Post to Board, Invite Specific)
  7. Invites sent list
  8. **Completion section** (mark complete when `in_progress`) ← MISSING
  9. **Review section** (leave review when `completed`) ← MISSING
- **Trust elements**: Status timeline, pro verification badges on quotes
- **Mobile**: Single column, action buttons as bottom sheet or inline
- **Empty states**: "No quotes yet — your job is live" / "Waiting for responses"
- **Error states**: Job not found, unauthorized access
- **Conversion notes**: This is where money is made. Quote → hire must be frictionless.

### 5. Quote Comparison View (**NEW — Does Not Exist**)

- **Objective**: Side-by-side structured comparison so clients hire confidently
- **Primary user**: Client with 2+ quotes
- **Key actions**: Compare, Accept, Decline, Message pro
- **Sections** (top→bottom):
  1. Job title + "Comparing X quotes"
  2. Comparison table: columns per pro, rows = Labour, Materials, Extras, Total, Response time, Rating, Verified badge
  3. Pro summary cards (avatar, name, rating, jobs completed)
  4. Per-quote CTA: "Accept", "Message", "Decline"
  5. "Need more quotes?" link back to distribution
- **Trust elements**: Verified badge, review count, response time
- **Mobile**: Swipeable cards (one pro per card) rather than table
- **Empty states**: "Only 1 quote received — waiting for more" with countdown/nudge
- **Conversion notes**: This is the highest-ROI page to build. Every marketplace that nails comparison wins.

### 6. Messages / Conversation Thread (`/messages/:id`)

**Status**: Built. Split layout with realtime, quote attachment.

- **Objective**: Keep negotiations on-platform
- **Primary user**: Both client and pro
- **Sections**: Conversation list (left/mobile: full) | Thread (right/mobile: full) with job context panel
- **Trust elements**: Job context always visible, structured quote rendering
- **Mobile**: Full-screen thread, swipe back to list
- **Empty states**: "No conversations yet"
- **Conversion notes**: Quote attachment CTA must be prominent for pros.

### 7. Professional Dashboard (`/dashboard/pro`)

**Status**: Built (320 lines). Stage-aware guidance + menu groups.

- **Objective**: Navigation hub, not analytics dump
- **Primary user**: Professional
- **Sections**: Welcome + role pill → Guidance card (stage-based) → Menu groups (Jobs, Listings, Services, Portfolio, Messages, Forum, Insights, Settings) → Logout
- **Mobile**: Full-width menu items, touch-friendly
- **Conversion notes**: Hub, not dashboard. 3-click rule to any action.

### 8. Client Dashboard (`/dashboard/client`)

**Status**: Built (202 lines). Clean nav hub with badges.

- **Objective**: Navigation hub
- **Primary user**: Client
- **Sections**: Welcome → Post a Job (primary) → My Jobs (badge) → Messages (badge) → Community → Saved Pros → Settings → Logout
- **Mobile**: Full-width menu items
- **Conversion notes**: "Post a Job" must always be the most prominent item.

### 9. Service Listing Detail (`/services/listing/:id`)

**Status**: Built. Shows description, pricing, gallery, pro info.

- **Objective**: Showcase a pro's service offering → drive inquiries
- **Primary user**: Guest/Client browsing
- **Sections**: Gallery → Title + Pro info card → Description → Pricing table → Reviews → CTA (Contact / Request Quote)
- **Trust elements**: Verified badge, review count, rating
- **Mobile**: Gallery as horizontal scroll, sticky CTA bar at bottom
- **Empty states**: "No reviews yet — be the first client"

### 10. Professional Profile (`/professionals/:id`)

**Status**: Route exists, gated behind `founding-members` rollout.

- **Objective**: Public trust page for a pro
- **Primary user**: Client evaluating a pro
- **Sections**: Header (avatar, name, verified, rating) → Bio → Services offered → Portfolio gallery (before/after) → Reviews → CTA (Contact / Request Quote)
- **Trust elements**: Verified badge, review breakdown, job completion rate
- **Mobile**: Compact header, scrollable portfolio gallery

---

## PART 3 — CRITICAL COMPONENT LIBRARY

| Component | Purpose | Used On | Variants/States |
|-----------|---------|---------|----------------|
| `PublicLayout` + `HeroBanner` | Page shell + hero | All public pages | Exists ✅ |
| `MenuItem` (dashboard) | Nav hub menu item | Both dashboards | `primary` / default / with badge. Exists ✅ |
| `Badge` (status) | Job/invite/listing status | Job cards, tickets, listings | `ready`, `open`, `in_progress`, `completed`, `cancelled`. Exists ✅ |
| `ClientJobCard` | Job summary card | Client jobs list | With status badge, quote count. Exists ✅ |
| `JobListingCard` | Public job card | Job board | Category, location, budget. Exists ✅ |
| `ServiceListingCard` | Pro service card | Services directory | Pricing, gallery, rating. Exists ✅ |
| **`QuoteComparisonCard`** | One pro's quote summary | **Quote Comparison View** | **MISSING — must build** |
| **`QuoteComparisonTable`** | Side-by-side quote grid | **Quote Comparison View** | **MISSING — must build** |
| `ConversationCard` | Message thread preview | Messages inbox | Unread badge, last message. Exists ✅ |
| `MessageBubble` | Single message | Conversation thread | Sent/received, quote attachment. Exists ✅ |
| `EmptyState` | Zero-content placeholder | Throughout | Icon, title, description, CTA. Exists ✅ |
| `CardSkeleton` | Loading placeholder | Throughout | Exists ✅ |
| `GradientIconHeader` | Section header with icon | Pro onboarding/edit | Exists ✅ |
| `ZoneTile` / `IslandWideTile` | Touch-friendly selection | Onboarding, wizard | Exists ✅ |
| `QuietSaveIndicator` | Subtle save feedback | Pro forms | Exists ✅ |
| `RoleSwitcher` / `MobileRolePill` | Role switching | Dashboards | Exists ✅ |
| `MobileFAB` | Floating action button | Job board, homepage | Exists ✅ |
| `SavedProHeart` | Save/unsave pro | Pro cards, profiles | Exists ✅ |
| `StatTile` | Metric display | Pro insights | Exists ✅ |
| **`ProSummaryCard`** | Compact pro info | Quote comparison, invites | **MISSING — must build** |
| **`StatusTimeline`** | Visual job lifecycle | Job Ticket Detail | **MISSING — should build** |
| `NotificationPreferenceToggles` | Email preference switches | Settings | Exists ✅ (recently expanded) |
| `UniversalSearchBar` | Search across platform | Homepage, nav | Exists ✅ |
| `ReportProblemButton` | Report issues | Shared | Exists ✅ |

---

## PART 4 — USER JOURNEY UX BREAKDOWN

### Journey 1: Visitor → Posted Job

```text
Homepage → "Post a Job" → Wizard (7 steps) → Auth gate → Published
```
- **Friction points**: Step 3 taxonomy gaps (micro-service not found), auth gate at publish
- **Drop-off risks**: Step 4 question pack too long, "Can't find" exit not obvious enough
- **UX improvements**: Show "X pros available" count during wizard to build anticipation

### Journey 2: Pro Signup → First Quote Sent

```text
Auth → Role select → Onboarding → Services → Dashboard → Job match → Conversation → Quote
```
- **Friction points**: Onboarding has 4+ steps before anything happens, service taxonomy can feel overwhelming
- **Drop-off risks**: No jobs matched after completing onboarding = immediate churn
- **UX improvements**: Show sample matched jobs during onboarding ("Jobs like these are waiting"). Send first match nudge within 1h of completion.

### Journey 3: Client Receives Quotes → Hires

```text
Job Ticket → See quotes → Compare → Accept → in_progress
```
- **Friction points**: **No comparison view exists**. Quotes viewed in separate conversations. No structured side-by-side.
- **Drop-off risks**: Client cannot easily compare → leaves platform → hires via WhatsApp
- **UX improvements**: Build Quote Comparison View. Add "Compare Quotes" CTA to Job Ticket when 2+ quotes exist.

### Journey 4: Job In Progress → Completion

```text
in_progress → Mark complete → Review prompt → Review submitted
```
- **Friction points**: "Mark Complete" not visible in current Job Ticket Detail (missing section)
- **Drop-off risks**: Client forgets to mark complete, no review left
- **UX improvements**: Add completion section to Job Ticket. Nudge emails already wired (review_reminder).

### Journey 5: Save Pro → Repeat Hire

```text
Complete job → Save pro (heart) → New job → See saved pro as match → Hire again
```
- **Friction points**: SavedProHeart exists but "Saved Pros" list in dashboard doesn't show quote/hire history
- **UX improvements**: Show last job + rating on saved pro card. "Hire Again" button (useRebook exists ✅).

### Journey 6: Dispute / Correction

```text
Issue arises → Raise Dispute → 28-day resolution → Outcome
```
- **Friction points**: Gated behind `escrow-beta`. Currently only route exists.
- **UX improvements**: Deferred. Current priority is pre-dispute clarity (structured jobs + quotes reduce disputes).

---

## PART 5 — MVP SCREEN-BY-SCREEN BUILD PLAN

### Sprint 1: Core Conversion Path (Quote Comparison + Job Ticket Completion)

**Pages/Components**:
- `QuoteComparisonCard` component
- `QuoteComparisonTable` component (desktop) / swipeable cards (mobile)
- Quote Comparison View (new page or section within Job Ticket Detail)
- Job Ticket Detail: add Quotes Received section, Conversations section, Mark Complete, Leave Review
- `ProSummaryCard` component
- `StatusTimeline` component

**Dependencies**: Existing `quotes` table, `job_reviews` table, `conversations` table
**Test before moving on**: Post a job → receive 2+ quotes → compare → accept → mark complete → leave review. Full lifecycle.

### Sprint 2: Public Trust Pages (Pro Profile + Directory)

**Pages/Components**:
- Professional Profile page (`/professionals/:id`)
- Professional Directory page (`/professionals`)
- Portfolio gallery component (before/after)
- Review breakdown component (rating distribution)

**Dependencies**: `professional_profiles`, `portfolio_items`, `job_reviews` tables. `founding-members` rollout flag.
**Test before moving on**: Browse directory → view profile → see reviews + portfolio → contact pro.

### Sprint 3: Onboarding Polish + Empty States

**Pages/Components**:
- Onboarding guidance improvements (show sample matched jobs)
- Empty state variants for: no quotes, no conversations, no reviews, no matches
- Job Ticket status timeline visualization
- Settings page completion (account deletion, email change)

**Dependencies**: Sprint 1 complete
**Test before moving on**: New pro signup → complete onboarding → see guidance → receive first match. New client → post job → see "waiting for quotes" state.

### Sprint 4: Service Layer + Marketplace Browse

**Pages/Components**:
- Service Listing Detail polish (sticky CTA, gallery improvements)
- Services Directory improvements (search, filters)
- Homepage featured projects (real data vs static)
- For Professionals landing page

**Dependencies**: `service-layer` rollout flag, Sprint 2 complete
**Test before moving on**: Browse services → view listing → contact pro → receive response.

---

## PART 6 — HIGHEST PRIORITY UX FIXES (Before Scaling)

### 1. Build Quote Comparison View
**Why**: This is the single biggest revenue gap. Clients receive quotes but have no structured way to compare them. Without this, hiring decisions happen off-platform.
**What**: Side-by-side table (desktop) / swipeable cards (mobile) showing labour, materials, total, pro rating, response time. Accept/Decline/Message per quote.

### 2. Complete Job Ticket Detail Lifecycle
**Why**: Job Ticket currently stops at "distribution" — it shows invites but not quotes received, has no mark-complete, no review section. The entire hire→complete→review flow is broken in the UI.
**What**: Add 4 missing sections: Quotes Received, Conversations, Completion, Review.

### 3. Add "Waiting for Quotes" Empty State with Nudge Context
**Why**: A client who posts a job and sees a blank ticket will think the platform is broken.
**What**: Show "Your job is live — X professionals have been notified" with a progress indicator. If no quotes after 24h, show "We're finding more pros — you'll receive an email when quotes arrive."

### 4. Pro Onboarding Motivation Screen
**Why**: Pros complete onboarding but don't know what happens next. The gap between "profile complete" and "first job match" is the highest churn window.
**What**: After onboarding completion, show a confirmation screen: "You're set up. Here's what happens next: 1) We match you to relevant jobs 2) You'll get an email notification 3) Open the conversation and send your quote."

### 5. Mobile Quote Sending UX
**Why**: Pros are on phones on job sites. The quote attachment flow in messages must be fast and clear on mobile.
**What**: Audit the quote composer in conversation thread for mobile usability. Ensure line items are easy to add/edit on a phone keyboard. The structured quote (labour + materials + extras) must not feel like a desktop form.

---

## PART 7 — LOVABLE IMPLEMENTATION NOTES

| Page | Layout | Data Needs | Interaction | Priority | Build Approach |
|------|--------|-----------|-------------|----------|---------------|
| **Homepage** | 8-section scroll | Static + optional featured data | Search, nav CTAs | ✅ Built | Polish only |
| **Wizard** | Step-based, sessionStorage | Taxonomy tables, job insert | Tile selection, form inputs | ✅ Built | Stable |
| **Pro Onboarding** | Multi-step form | Profile insert, services | Form + taxonomy browser | ✅ Built | Add motivation screen |
| **Job Ticket Detail** | Single-column cards | Jobs, quotes, conversations, reviews, invites | Accept/decline, complete, review | 🔴 Incomplete | **Add 4 missing sections — Sprint 1** |
| **Quote Comparison** | Table (desktop) / cards (mobile) | Quotes + pro profiles for a job | Accept/decline/message | 🔴 Missing | **Build from scratch — Sprint 1** |
| **Messages** | Split pane | Conversations, messages, realtime | Send, attach quote | ✅ Built | Audit mobile UX |
| **Pro Dashboard** | Menu hub | Pro stats, stage | Navigation only | ✅ Built | Stable |
| **Client Dashboard** | Menu hub | Client stats, unread counts | Navigation only | ✅ Built | Stable |
| **Service Listing** | Detail page | Listing, pricing items, reviews | Contact, request quote | ✅ Built | Polish gallery/mobile |
| **Pro Profile** | Detail page | Profile, services, portfolio, reviews | Contact, save | 🟡 Route exists, page not built | **Sprint 2** |

---

## FINAL SUMMARY

### Top 10 Wireframes in Order
1. Homepage ✅
2. Post a Job Wizard ✅
3. Pro Onboarding ✅
4. Job Ticket Detail 🔴 (needs 4 sections)
5. Quote Comparison View 🔴 (missing entirely)
6. Messages ✅
7. Professional Dashboard ✅
8. Client Dashboard ✅
9. Service Listing Detail ✅
10. Professional Profile 🟡 (not built)

### Reusable Component List
- 17 components exist and are production-ready
- 3 components needed: `QuoteComparisonCard`, `QuoteComparisonTable`, `ProSummaryCard`
- 1 nice-to-have: `StatusTimeline`

### MVP Sprint Order
1. Quote Comparison + Job Ticket lifecycle completion
2. Pro Profile + Directory
3. Onboarding polish + empty states
4. Service layer + marketplace browse

### The Single Most Important Page to Get Right First
**Quote Comparison View** — it does not exist, and it sits at the exact point where revenue is won or lost. Every other page in the system feeds into this moment: client posts job → pro quotes → client compares → client hires. Without a comparison view, the entire funnel leaks at the decision point.

