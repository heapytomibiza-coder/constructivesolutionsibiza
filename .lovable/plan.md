# Responses Lifecycle UX Design Spec

Backend (RLS, RPCs, lifecycle states) is **frozen**. This is a pure UX/UI design plan covering both sides of the `match → interested → quoted → shortlisted → accepted` flow, ready to drive the upcoming Responses UI scaffold (Step 3 of the current track).

Current state in repo: Quotes UI exists (`QuotesTab`, `QuoteCard`, `ProposalBuilder`). **No Responses UI exists yet.** This spec defines what to build on top of the already-hardened RPCs (`express_interest`, `link_quote_to_response`, `shortlist_response`, `accept_response`, `decline_response`, `withdraw_response`).

---

## 1. Professional Journey (step-by-step)

**Entry points**
- Job Board card (matched badge if `job_matches` row exists)
- "Matched for you" feed on the pro dashboard
- Email/push notification → deep-link to job detail

**Flow**

1. **Discover** — Pro sees a job card. If matched, a subtle "Matched" chip appears (no pressure language).
2. **Open job detail** — Sticky bottom action bar (mobile) / right rail (desktop) shows a single primary CTA based on state:
   - No response yet → **"I'm interested"** (one tap, optimistic)
   - Interested → **"Send a quote"** + secondary "Withdraw"
   - Quote sent → status pill "Quote sent · awaiting client" + "Edit quote" / "Withdraw"
   - Shortlisted → green pill "You're shortlisted" + "Send revised quote"
   - Accepted → "You won this job" → CTA jumps to Job Workspace
   - Declined → muted state + "View similar jobs"
3. **Express interest** — One-tap, no modal. Toast: *"Client notified. Add a quote to stand out."* Inline nudge card appears under the CTA prompting the quote.
4. **Submit quote** — Existing `ProposalBuilder` opens. On submit, `link_quote_to_response` is called transparently; pro never sees the term "link".
5. **Wait state** — Clear "What happens next" mini-timeline directly below the CTA (3 dots: Sent → Reviewed → Decision).
6. **Outcome** — Push + in-app notification. Accepted → confetti + immediate handoff to workspace. Declined → respectful copy + 2 similar jobs.

**Key principle:** every screen always answers *"What's my status?"* and *"What's my next move?"* in one glance.

---

## 2. Client Journey (step-by-step)

**Entry points**
- Post-Job success page → "View interested professionals"
- Job Ticket / dashboard → Responses tab badge with unread count
- Notification: "3 pros are interested in your job"

**Flow**

1. **Post job** — Success screen sets expectation: *"We're inviting matched pros now. You'll see responses here within 24h."*
2. **Responses inbox** — Single tab `Responses` on the job page, organized in three vertical sections:
   - **Shortlisted** (top, sticky)
   - **With quote** (sorted by price + rating composite)
   - **Interested** (no quote yet — gentle "Ask for quote" CTA)
3. **Pro card** — Avatar, name, rating, distance, repeat-hire badge, response time. Right side: price (or "Quote pending"), and two actions: **Shortlist** (heart/bookmark) and **View profile**.
4. **Compare** — When ≥2 quotes exist, a "Compare" button surfaces the existing comparison view.
5. **Shortlist** — Low-commitment action. Copy: *"Shortlist to keep your top picks. Pros are notified you're considering them."* Reversible.
6. **Accept** — High-commitment action behind a confirmation modal that restates: scope, price, what happens next, and that other pros will be auto-declined. Single irreversible CTA: **"Hire [Name]"**.
7. **Post-accept** — Auto-routes to Job Workspace; remaining responses move to a collapsed "Not selected" group with a polite auto-message.

**Key principle:** shortlist is a **soft signal** (encourages quotes); accept is a **hard commitment** (locks the project).

---

## 3. UI State Table

| Stage | Pro sees | Pro actions | Client sees | Client actions | System feedback |
|---|---|---|---|---|---|
| **matched** (no response) | "Matched" chip on card; primary CTA *"I'm interested"* | Express interest, Skip | Pro appears in "Suggested" list (greyed, no card) | — | None until pro acts |
| **interested** | Status pill *"You're interested"*; nudge *"Add a quote to stand out"* | Send quote, Withdraw | Pro card in **Interested** section, "Quote pending" tag | Shortlist, Ask for quote, View profile | Toast both sides on transition |
| **quoted** | Pill *"Quote sent · awaiting client"*; mini-timeline | Edit quote, Withdraw, Message | Pro card in **With quote** section, price visible, Compare enabled | Shortlist, Accept, Message, Compare | Email to client; in-app badge |
| **shortlisted** | Green pill *"You're shortlisted"*; subtle celebration | Send revised quote, Message | Pro card pinned to **Shortlisted** section | Accept, Remove from shortlist, Message | Push to pro: *"You're being considered"* |
| **accepted** | Banner *"You won this job"*; CTA → Workspace | Open workspace, Message | Workspace replaces inbox; non-winners collapsed | Open workspace | Confetti + notifications both sides |
| **declined / withdrawn** | Muted card *"This job went to another pro"* + similar jobs | Browse similar | Hidden by default, "Show declined" toggle | Restore (if not yet accepted elsewhere) | Quiet notification, no shaming |

---

## 4. Friction Points (where users drop off / get confused / feel risk)

1. **"Interested" feels weightless** — pros don't know if it actually does anything. → Show "Client notified" + nudge to quote.
2. **Quote vs Interest confusion** — pros think "interested" = "I'll quote later" then forget. → Persistent inline nudge + 24h reminder push.
3. **Shortlist ≠ Accept ambiguity (client side)** — clients fear shortlisting will commit them. → Microcopy + reversible UI affordance (heart toggle).
4. **Accept feels terminal** — clients hesitate because consequences are unclear. → Confirmation modal explicitly lists what will happen (other pros declined, workspace opens, payment hold initiated).
5. **Silent waiting** — pro submits quote, hears nothing for days. → Mini-timeline + "Client viewed your quote" read-receipt + 72h auto-nudge to client.
6. **No status on job board card** — pro re-opens a job and forgets they already engaged. → State-aware CTA on every entry point.
7. **Declined pros vanish** — feels like ghosting. → Auto-polite decline message + "2 similar open jobs" panel.

---

## 5. Top 5 UX Improvements (highest impact, no backend change)

1. **State-aware primary CTA everywhere** — Job card, job detail, dashboard tile all read the same response state and render exactly one primary action. Eliminates "what do I do?" cognitively.
2. **Mini progress timeline on every response** — 4-dot horizontal indicator (Interested → Quoted → Shortlisted → Hired) shown to both sides. Removes uncertainty without any new data.
3. **Soft vs hard distinction in client actions** — Shortlist = bookmark icon, reversible, no modal. Accept = filled primary button + confirmation modal listing consequences. Visually and physically different weights.
4. **Microcopy rewrite of the lifecycle**
   - "Express interest" → **"I'm interested"** (first person, low effort)
   - "Submit quote" → **"Send a quote"**
   - "Shortlist" → keep + helper *"Keep your top picks — pros get notified"*
   - "Accept response" → **"Hire [Name]"** (names the human, not the action)
   - "Decline" → **"Not this time"** (respectful, repeatable)
5. **Read receipts + 72h auto-nudge** — Pure UI signals on top of existing data: show "Client viewed your quote · 2h ago" using `updated_at` on the response row, and a banner on the client side after 72h: *"3 pros are still waiting on your decision."* No new tables, just better surfacing.

---

## 6. Wireframe Descriptions

**Pro — Job detail (mobile)**
```text
┌──────────────────────────────┐
│ < Back              ··· share │
│ Bathroom retile · Ibiza Town  │
│ ★ Matched for your services   │
│ ─────────────────────────────│
│ [Scope, photos, budget...]    │
│                               │
│ ──── What happens next ────   │
│  ● ─── ○ ─── ○ ─── ○         │
│ Interested Quote Decision Won │
└──────────────────────────────┘
┌──────────────────────────────┐ ← sticky bottom bar
│  [ I'm interested ]  ♡ save  │
└──────────────────────────────┘
```

**Client — Responses inbox**
```text
Responses (5)              [Compare ▸]
─────────────────────────────────────
★ SHORTLISTED (1)
  [Avatar] Marco T. · ★4.9 · 3km
          €1,840 fixed · 5 days
          [ Hire Marco ]  ♥  Message
─────────────────────────────────────
WITH QUOTE (2)
  [Avatar] Lucia R. · ★4.7 · 8km
          €1,650 estimate · 4–6 days
          [ Shortlist ♡ ]  Message
  ...
─────────────────────────────────────
INTERESTED · NO QUOTE YET (2)
  [Avatar] Diego P. · ★4.8
          "Wants to quote — ask now?"
          [ Ask for quote ]  Message
```

**Confirmation — Hire modal**
```text
Hire Marco for €1,840?
This will:
 • Open your shared Job Workspace
 • Initiate the secure payment hold
 • Politely decline the other 4 pros
You can't undo this. Disputes follow
the 28-day resolution process.

[ Cancel ]      [ Yes, hire Marco ]
```

---

## 7. Implementation Notes (for the next build step)

- New route: `/dashboard/jobs/:jobId/responses` (client) and response state surfaced inline on existing pro job-detail page.
- New components: `ResponseCard`, `ResponsesInbox`, `ResponseStateTimeline`, `HireConfirmModal`, `ProResponseActionBar`.
- New hooks: `useJobResponses(jobId)` (client view), `useMyResponse(jobId)` (pro view), both wrapping existing tables/RPCs.
- All writes go through existing RPCs only — no direct table writes.
- RouteGuard wiring: client routes require job ownership; pro action bar requires `professional` active role + onboarding complete.
- i18n: add `responses` namespace (en/es) for all new microcopy.
- No schema changes, no new RPCs, no RLS edits.

This spec is the design contract for **Step 3: Scaffold Responses UI**. Once approved, implementation proceeds with routes + RouteGuard + session hook (scope-locked as previously agreed).