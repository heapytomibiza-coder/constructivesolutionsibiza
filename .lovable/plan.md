

# Add Quick Actions to Client Dashboard + Community Forum Links

## Summary

The Pro Dashboard already has a direct link to `/professional/profile` in both mobile and desktop quick actions. The Client Dashboard currently has no quick action section at all -- just stats and a job list.

This plan adds:
1. A **quick actions section** to the Client Dashboard (matching the Pro Dashboard pattern) with links to Post Job, Messages, Community Forum, and Settings
2. A **Community Forum tile** to the Pro Dashboard's quick actions (both mobile and desktop)

## Changes

### 1. `src/pages/dashboard/client/ClientDashboard.tsx`

Add a quick actions grid between the stats row and the jobs list card, using the same `QuickActionTile` pattern from ProDashboard:

**Mobile (2-column grid, visible below `sm`):**
- Post a Job (`/post`) -- Plus icon
- Messages (`/messages`) -- MessageSquare icon
- Community Forum (`/forum`) -- MessageCircle icon (from lucide)
- Settings (`/settings`) -- Settings icon

**Desktop (card with stacked buttons, hidden below `sm`):**
Same four actions rendered as full-width buttons inside a "Quick Actions" card, matching the Pro Dashboard's desktop layout.

Import the `QuickActionTile` component -- since it's currently defined locally inside `ProDashboard.tsx`, it will be extracted to a shared location first.

### 2. Extract `QuickActionTile` to shared component

Move `QuickActionTile` from `src/pages/dashboard/professional/ProDashboard.tsx` into `src/pages/dashboard/shared/components/QuickActionTile.tsx` so both dashboards can reuse it.

Update ProDashboard to import from the new shared location.

### 3. `src/pages/dashboard/professional/ProDashboard.tsx`

Add a "Community Forum" tile to both the mobile quick actions grid and the desktop quick actions card:
- Community Forum (`/forum`) -- MessageCircle icon
- Hint: "Ask questions, get recommendations"

### 4. Translation keys (EN + ES)

Add to `public/locales/en/dashboard.json`:
- `client.quickActions`: "Quick Actions"
- `client.communityForum`: "Community Forum"
- `client.communityForumHint`: "Ask questions, get recommendations"
- `client.settingsHint`: "Account and preferences"
- `client.postJobHint`: "Describe what you need done"
- `client.messagesHint`: "Chat with Taskers"
- `pro.communityForum`: "Community Forum"
- `pro.communityForumHint`: "Ask questions, get recommendations"

Add equivalent keys to `public/locales/es/dashboard.json`.

## Technical notes

- The `QuickActionTile` component already accepts `to`, `icon`, `label`, and `hint` props -- no API changes needed, just relocating it
- The forum is already a public route (`/forum`) so no rollout gating is needed
- Both dashboards maintain their existing nav bar, stats, and content -- only the quick actions section is modified

