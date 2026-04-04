

# Dashboard Hierarchy Rebalance — Calm Home Base

## Problem
The dashboard stacks up to 3 large guidance cards (stage card + profile prompt + draft listings nudge) above the menu, making it feel like a to-do list attack instead of a calm hub.

## Principle
**One blocker card at most. Everything else moves down or gets compact.**

---

## Changes

### 1. Card priority — only the highest-priority card renders prominently

Current rendering order (all can appear simultaneously):
1. Welcome banner
2. Stage card (needs_profile / needs_services / needs_review / needs_visibility)
3. Profile prompt (prompt1 / prompt2 / prompt3)
4. Draft listings nudge

**New rule**: Render at most **one** card above the menu, using this priority:
- Welcome banner (if present) — wins, nothing else shown
- Stage card (if not `active`) — wins, nothing else shown
- If `active`: show nothing above the menu

### 2. Profile prompts → move below the menu

The "Want to look more professional?" / "Add a bio" / "Update job preferences" prompts become **compact reminder rows** rendered *after* the menu section, not before it. They use a smaller, inline style — no large card, no prominent CTA button. Just a text link row with an arrow.

### 3. Draft listings nudge → move below the menu

The "You have N unpublished listings" nudge also moves below the menu, rendered as a compact reminder row alongside the profile prompts. This information is already surfaced inside My Listings itself.

### 4. Compact reminder row component

Replace the large `Card` wrapper for secondary nudges with a simple row:
```
[icon]  Want to look more professional? Complete profile basics  →
[icon]  You have 28 unpublished listings. Complete them  →
```
Muted styling, small text, no prominent button. Feels like a helpful suggestion, not homework.

### 5. Menu moves up

With secondary cards removed from above, the menu (`Your Work` / `Grow` / `Account`) sits directly below the header + at most one stage card. The dashboard immediately feels like a navigation hub.

---

## Resulting layout

```text
┌─────────────────────────────┐
│  Professional Dashboard     │
│  Welcome back, user@email   │
├─────────────────────────────┤
│  [One stage card OR nothing]│  ← only if blocker exists
├─────────────────────────────┤
│  YOUR WORK                  │
│  Edit Profile               │
│  Browse Matching Jobs       │
│  My Jobs                    │
│  Messages                   │
│  My Listings                │
│  GROW                       │
│  Market Insights            │
│  Community Forum            │
│  ACCOUNT                    │
│  Settings                   │
├─────────────────────────────┤
│  ── Suggestions ──          │  ← compact rows, muted
│  💡 Complete profile basics │
│  💡 28 unpublished listings │
├─────────────────────────────┤
│  [Empty matched jobs card]  │  ← if applicable
└─────────────────────────────┘
```

---

## Files changed

| File | Change |
|------|--------|
| `ProDashboard.tsx` | Move profile prompt + draft nudge below menu; add compact `ReminderRow` component; enforce one-card-max rule above menu |

## What does NOT change
- No routes
- No new features
- No translation key changes (reuses existing keys)
- Stage cards keep their existing design (they are real blockers)
- Welcome banner keeps its existing design
- Menu structure unchanged

