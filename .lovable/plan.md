
# Job Board Mobile UX Enhancement Plan

## Overview
This plan addresses four key gaps in the mobile experience:
1. Job cards need better visual appeal and direct CTAs (Apply/Message)
2. Missing mobile navigation (burger menu)
3. Role switching capability (Client ↔ Professional)
4. Signup intent question (missing "Are you hiring or offering services?")

---

## Current State Analysis

### Job Cards (JobListingCard.tsx)
- Has pills for category, status, budget, location, timing
- Only has a "View" button - no direct Apply/Message CTAs
- Entire card is clickable to open modal
- Missing urgency visual hierarchy and action buttons

### Mobile Navigation (PublicNav.tsx)
- Desktop nav links are hidden on mobile (`hidden md:flex`)
- No burger menu - mobile users only see logo + Sign in + Post a job
- No way to navigate to Services, Professionals, How it works, etc.

### Role Switching (RoleSwitcher.tsx)
- Component exists and works well
- Uses Select dropdown with icons
- Only shows if user has multiple roles
- Not integrated into PublicNav (only in dashboards)

### Signup Flow (Auth.tsx)
- Simple email/password tabs
- No intent question ("hiring vs offering services")
- All users default to client role

---

## Implementation Plan

### Phase 1: Mobile Navigation (Burger Menu)

**New Component: `MobileNav.tsx`**

Create a Sheet-based mobile navigation drawer with:

```text
┌────────────────────────────┐
│ [X Close]                  │
│                            │
│ 🏠 Home                    │
│ 🔧 Services                │
│ 📋 Jobs                    │
│ 👷 Professionals           │
│ ❓ How it works            │
│ 📧 Contact                 │
│                            │
│ ───────────────────────    │
│ [Sign in]  [Post a job]    │
│                            │
│ [If logged in:]            │
│ 👤 Dashboard               │
│ 💬 Messages                │
│ ⚙️ Settings                │
│                            │
│ [If multi-role:]           │
│ 🔄 Switch to Professional  │
└────────────────────────────┘
```

**Changes to PublicNav.tsx:**
- Add burger icon (Menu) on mobile (left side)
- Trigger opens MobileNav Sheet
- Keep Post a job button visible on mobile
- Show RoleSwitcher in drawer for logged-in multi-role users

---

### Phase 2: Enhanced Job Cards

**JobListingCard.tsx Updates:**

Add a CTA row at the bottom of each card:

```text
┌─────────────────────────────────────────┐
│ │ [Plumbing] [Leak Repair] [Open]       │
│ │                                       │
│ │ Fix bathroom leak - urgent            │
│ │ Water dripping from ceiling...        │
│ │                                       │
│ │ 📍 San Antonio  💶 €200-€500  🕐 ASAP │
│ │ Posted 2h ago                         │
│ │                                       │
│ │ ────────────────────────────────────  │
│ │ [Message]  [Apply] ← only for pros    │
└─────────────────────────────────────────┘
```

**Logic for CTA buttons:**
- **Not logged in**: Show "Sign in to apply" link
- **Logged in as Client (job owner)**: Show "Edit" + "View applicants" (future)
- **Logged in as Client (not owner)**: Hide CTAs (clients don't apply)
- **Logged in as Professional**: Show "Message" + "Apply" buttons
  - Apply opens the modal for now (until apply flow exists)
  - Message triggers startConversation directly from card

**Mobile-specific:**
- On mobile, buttons should be full-width stacked
- Consider sticky bottom bar in modal (already exists in JobDetailsModal)

---

### Phase 3: Role Switching in Navigation

**Integration points:**

1. **MobileNav drawer**: Add RoleSwitcher at bottom for multi-role users
2. **PublicNav desktop**: Add RoleSwitcher in header for logged-in users
3. **Redirect on switch**:
   - Switching to Client → stay on current page or go to /dashboard/client
   - Switching to Professional → stay or go to /dashboard/pro

**Copy updates:**
- "Client" → "Hiring" or keep "Client"
- "Professional" → "Working" or keep "Professional"
- Your suggestion: "Asker" / "Tasker" terminology

**Decision point:** Keep current "Client/Professional" terms or switch to "Hiring/Working" or "Asker/Tasker"

---

### Phase 4: Signup Intent Question

**New Component: `IntentSelector.tsx`**

Add before email/password form:

```text
┌─────────────────────────────────────────┐
│         What brings you here?           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🏠 I need help with a project   │   │
│  │    Post jobs, get quotes        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔧 I offer my services          │   │
│  │    Find work, apply for jobs    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ↔️ Both                         │   │
│  │    I hire and work              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Backend behavior:**
- "I need help" → roles = ['client'], active_role = 'client'
- "I offer services" → roles = ['client', 'professional'], active_role = 'professional'
- "Both" → roles = ['client', 'professional'], active_role = 'client'

**Post-signup redirect:**
- Client → /post (encourage first job) or /dashboard/client
- Professional → /onboarding/professional (complete profile)
- Both → choice screen or default to client flow

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/layout/MobileNav.tsx` | Create | New mobile drawer navigation |
| `src/components/layout/PublicNav.tsx` | Modify | Add burger trigger, RoleSwitcher for auth users |
| `src/pages/jobs/JobListingCard.tsx` | Modify | Add CTA row with Message/Apply buttons |
| `src/pages/auth/Auth.tsx` | Modify | Add intent selection before signup |
| `src/components/auth/IntentSelector.tsx` | Create | Intent selection component |
| `src/components/layout/index.ts` | Modify | Export MobileNav |

---

## Technical Details

### MobileNav Implementation
```typescript
// Uses Sheet from @/components/ui/sheet
// Triggered by Menu icon in PublicNav
// Contains:
// - Nav links (Link from react-router-dom)
// - Auth buttons (Sign in / Post a job)
// - RoleSwitcher (if authenticated + multi-role)
// - Sign out button (if authenticated)
```

### JobListingCard CTA Logic
```typescript
// Pseudo-code for CTA visibility
const { user, activeRole, hasRole, isProReady } = useSession();
const isOwner = user?.id === job.owner_id;
const isPro = hasRole('professional');
const isClient = activeRole === 'client';

// CTA scenarios:
if (!user) → "Sign in to respond"
if (isOwner) → hide CTAs (or show Edit later)
if (isPro && isProReady) → "Message" + "Apply"
if (isPro && !isProReady) → "Complete profile to apply"
if (isClient && !isOwner) → hide CTAs (clients browse, don't apply)
```

### Intent Selector State
```typescript
type UserIntent = 'client' | 'professional' | 'both';

// Passed to signup, stored temporarily, then:
// - On successful signup, trigger RPC to set roles
// - Or handle in auth callback with metadata
```

---

## UX Considerations

1. **Burger menu placement**: Left side (standard) with logo center, Post a job right
2. **Role switch feedback**: Toast notification "Switched to Professional mode"
3. **Card CTAs**: Don't clutter - max 2 buttons, contextual to user role
4. **Intent question**: Can be skipped, defaults to client
5. **Mobile CTAs**: Stack vertically, primary action on bottom (thumb zone)

---

## Future Enhancements (Not in this plan)

- Formal "Apply" flow with cover message
- View applicants screen for job owners
- Push notifications for new messages
- Saved jobs / favorites
- Professional onboarding improvements

---

## Order of Implementation

1. **MobileNav + Burger menu** - Highest impact for mobile navigation
2. **JobListingCard CTAs** - Enables direct engagement
3. **Role switching in nav** - Completes the dual-mode experience
4. **Signup intent** - Improves onboarding clarity

Each phase is independently shippable.
