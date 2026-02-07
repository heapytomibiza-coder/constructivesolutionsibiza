
# Remove Messages and Contact from Main Header Navigation

## Current State

The main header shows these links:
- Services → Jobs → Professionals → How it works → **Contact** → **Messages** → Community

"Messages" and "Contact" are redundant:
- Messages is already in the user dropdown menu
- Contact is accessible via footer

## Solution

Remove the `nav` property from these two routes in the registry. This removes them from the header while keeping the routes functional.

## Changes

### File: `src/app/routes/registry.ts`

**Remove nav from Contact route (lines 66-71):**

Before:
```typescript
{ 
  path: '/contact', 
  access: 'public', 
  lane: 'public', 
  nav: { section: 'public', labelKey: 'nav.contact', order: 6 },
  titleKey: 'nav.contact',
},
```

After:
```typescript
{ 
  path: '/contact', 
  access: 'public', 
  lane: 'public', 
  titleKey: 'nav.contact',
},
```

**Remove nav from Messages route (lines 115-121):**

Before:
```typescript
{ 
  path: '/messages', 
  access: 'auth', 
  redirectTo: '/auth', 
  lane: 'shared', 
  nav: { section: 'shared', labelKey: 'nav.messages', order: 1, hideWhenPublic: true },
  titleKey: 'nav.messages',
},
```

After:
```typescript
{ 
  path: '/messages', 
  access: 'auth', 
  redirectTo: '/auth', 
  lane: 'shared', 
  titleKey: 'nav.messages',
},
```

## Result

Header will show: **Services → Jobs → Professionals → How it works → Community**

Users can still access:
- Messages via user dropdown (already there)
- Contact via footer or direct URL
