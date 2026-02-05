

# Add Community Navigation Link

## Problem
The Community link to `/forum` is missing from both desktop and mobile navigation, despite the route being properly configured in App.tsx.

## Changes Required

### 1. Update Desktop Navigation
**File: `src/components/layout/PublicNav.tsx`**

Add Community link between "How it works" and "Contact" in the desktop nav links section (around line 77):

```tsx
<Link 
  to="/forum" 
  className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
>
  Community
</Link>
```

### 2. Update Mobile Navigation
**File: `src/components/layout/MobileNav.tsx`**

**Step A**: Import the `Users` icon from lucide-react:
```tsx
import { ..., Users } from 'lucide-react';
```

**Step B**: Add to `publicNavLinks` array (between "How it works" and "Contact"):
```tsx
{ to: '/forum', label: 'Community', icon: Users },
```

---

## Result
After these changes:
- ✅ Desktop header shows "Community" link
- ✅ Mobile drawer shows "Community" with Users icon
- ✅ Both link to `/forum` which renders `ForumIndex`

