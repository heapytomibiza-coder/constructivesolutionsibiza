
# Fix Mobile Header: Remove Debug Text & Optimize Spacing

## The Problem

The mobile header currently shows:
```
[≡] [CS] Constructive [Hola (ES)] [🌐 ES] [Publicar...]
```

Issues identified:
1. **"Hola (ES)"** - A temporary i18n debug component that was never removed
2. **Cramped spacing** - Too many elements competing for limited mobile width
3. **Truncated button** - "Publicar" button is cut off

## The Solution

### 1. Remove the I18nSmokeTest Component

The file explicitly states it's temporary:
```tsx
/**
 * Temporary smoke test component to verify i18n switching works.
 * Remove after verification is complete.
 */
```

Remove it from `PublicNav.tsx` line 89.

### 2. Optimize Mobile Header Layout

Current layout priorities:
- Burger menu (essential)
- Logo mark + short name (essential)
- Language switcher (keep, but compact)
- Post Job button (important CTA)

Changes:
- Remove debug component entirely
- Hide full brand name on very small screens, show only "CS" mark
- Tighten gap between elements
- Ensure "Post Job" button fits

## Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/PublicNav.tsx` | Remove `I18nSmokeTest` import and usage, optimize mobile spacing |
| `src/components/layout/I18nSmokeTest.tsx` | Delete file (or keep for dev-only) |
| `public/locales/en/common.json` | Remove `debug.hello` key |
| `public/locales/es/common.json` | Remove `debug.hello` key |

## Detailed Changes

### PublicNav.tsx Changes

**Remove I18nSmokeTest:**
```tsx
// REMOVE this import
import { I18nSmokeTest } from '@/components/layout/I18nSmokeTest';

// REMOVE this line (~line 89)
<I18nSmokeTest />
```

**Optimize mobile logo area:**
```tsx
{/* Before */}
<span className="font-display text-xl font-semibold text-foreground">
  {PLATFORM.shortName}
</span>

{/* After - hide on extra small screens */}
<span className="font-display text-xl font-semibold text-foreground hidden xs:inline sm:inline">
  {PLATFORM.shortName}
</span>
```

**Tighten gaps:**
```tsx
{/* Before */}
<div className="flex items-center gap-2">

{/* After */}
<div className="flex items-center gap-1.5 sm:gap-2">
```

### Result

Clean mobile header:
```
[≡] [CS] Constructive  [🌐 ES] [Publicar un Trabajo]
```

Or on very narrow screens:
```
[≡] [CS]  [🌐 ES] [Publicar]
```

## Summary

- Delete the temporary `I18nSmokeTest` component (it has served its purpose)
- Remove the debug translation keys
- Add responsive hiding for brand name on tiny viewports
- Tighten spacing gaps for mobile comfort
