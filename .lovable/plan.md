

# Fix: Add Missing /settings Route

## Problem
The dashboards (both Client and Pro) have Settings icon buttons linking to `/settings`, but this route doesn't exist. Users clicking the settings icon get a 404 error.

## Current State
- `ClientDashboard.tsx` line 72-76: Links to `/settings`
- `ProDashboard.tsx` line 62-65: Links to `/settings`
- No route defined in `src/app/routes/registry.ts`
- No Settings page component exists

## Solution Options

### Option A: Create a Settings Page (Recommended)
Create a minimal Settings page with common account management features:
- Account info (email, name)
- Notification preferences (placeholder)
- Role info display
- Sign out button

### Option B: Remove Settings Links Temporarily
If settings functionality isn't a priority, remove the Settings icon buttons from both dashboards until the feature is ready.

---

## Recommended Implementation (Option A)

### 1. Create Settings Page
**File:** `src/pages/settings/Settings.tsx`

A simple settings page with:
- Header with back navigation
- Account section showing user email
- Role information
- Sign out button
- Placeholder sections for future features (notifications, preferences)

### 2. Add Route to Registry
**File:** `src/app/routes/registry.ts`

Add to client routes (since both clients and pros need settings):
```typescript
{ path: '/settings', access: 'auth', redirectTo: '/auth' },
```

### 3. Add Route to App.tsx
**File:** `src/App.tsx`

Add inside the protected RouteGuard:
```typescript
<Route path="/settings" element={<Settings />} />
```

### 4. Export from index (optional)
Create `src/pages/settings/index.ts` for clean imports.

---

## Technical Details

### Settings Page Structure
```text
┌─────────────────────────────────────────┐
│ ← Back to Dashboard    CS Ibiza         │
├─────────────────────────────────────────┤
│                                         │
│  Settings                               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Account                          │   │
│  │ user@example.com                 │   │
│  │ Role: Client / Professional      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Notifications (Coming soon)      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [Sign Out]                       │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Route Access Rule
- Uses `auth` access rule (any authenticated user)
- Redirects to `/auth` if not logged in

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/settings/Settings.tsx` | Create | Settings page component |
| `src/pages/settings/index.ts` | Create | Clean exports |
| `src/app/routes/registry.ts` | Modify | Add `/settings` route |
| `src/App.tsx` | Modify | Add Settings route |

---

## Future Enhancements (Not in this fix)
- Edit profile (name, phone)
- Change password
- Email notification preferences
- Delete account
- Connected accounts (if OAuth added later)

