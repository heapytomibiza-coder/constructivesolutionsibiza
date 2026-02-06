

# Fix Language Switching Lag

## The Problem

The current `LanguageSwitcher` uses a naive approach that triggers a synchronous language change without preloading namespaces. With `i18next-http-backend` + lazy loading, the first switch to Spanish causes a visible pause while JSON files are fetched over the network.

**Current behavior:**
```tsx
const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng); // ← blocks UI while fetching
};
```

---

## Solution Overview

Implement a 4-part fix to make language switching feel instant:

| Fix | Description |
|-----|-------------|
| **1. Preload on idle** | After app mounts, quietly load Spanish namespaces in background |
| **2. Safe language switch** | Load namespaces first, then switch language |
| **3. Utility function** | Create reusable `preloadLanguage` helper |
| **4. Better Suspense fallback** | Replace `null` with subtle loading indicator |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/i18n/preload.ts` | **Create** - Utility functions for preloading |
| `src/components/layout/LanguageSwitcher.tsx` | **Update** - Use safe async switch |
| `src/App.tsx` | **Update** - Add idle preload hook |
| `src/main.tsx` | **Update** - Better Suspense fallback |

---

## Implementation Details

### 1. Create `src/i18n/preload.ts`

```typescript
import i18n from './index';
import { NS } from './namespaces';

// All namespaces we want to preload
const CORE_NAMESPACES = Object.values(NS);

/**
 * Preload a language's namespaces before switching
 * Prevents visible lag on first switch
 */
export async function changeLanguageSafe(lng: string): Promise<void> {
  // Load the language bundle first
  await i18n.loadLanguages(lng);
  // Ensure all namespaces are loaded
  await i18n.loadNamespaces(CORE_NAMESPACES);
  // Now switch - instant because everything is cached
  await i18n.changeLanguage(lng);
}

/**
 * Preload the alternate language in background
 * Call this on app mount after a small delay
 */
export function preloadAlternateLanguage(): void {
  const current = i18n.language?.startsWith('es') ? 'es' : 'en';
  const alternate = current === 'en' ? 'es' : 'en';
  
  // Load in background, don't await
  i18n.loadLanguages(alternate);
  i18n.loadNamespaces(CORE_NAMESPACES);
}
```

### 2. Update `LanguageSwitcher.tsx`

```tsx
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Loader2 } from 'lucide-react';
import { changeLanguageSafe } from '@/i18n/preload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = async (lng: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await changeLanguageSafe(lng);
    } finally {
      setIsLoading(false);
    }
  };

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'en';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="gap-1">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="text-xs font-medium uppercase">{currentLang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={currentLang === 'en' ? 'bg-accent' : ''}
          disabled={isLoading}
        >
          🇬🇧 English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('es')}
          className={currentLang === 'es' ? 'bg-accent' : ''}
          disabled={isLoading}
        >
          🇪🇸 Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 3. Update `App.tsx` - Add idle preload

```tsx
import { useEffect } from 'react';
import { preloadAlternateLanguage } from '@/i18n/preload';

const App = () => {
  // Preload alternate language on idle (800ms after mount)
  useEffect(() => {
    const id = window.setTimeout(() => {
      preloadAlternateLanguage();
    }, 800);
    return () => window.clearTimeout(id);
  }, []);

  return (
    // ... rest of component
  );
};
```

### 4. Update `main.tsx` - Better fallback

```tsx
import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Subtle loading indicator instead of blank screen
const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
      <div className="h-full w-1/2 animate-pulse bg-accent" />
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<LoadingFallback />}>
    <App />
  </Suspense>
);
```

---

## How It Works

```text
┌─────────────────────────────────────────────────────────────┐
│                      App Mounts (EN)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (800ms delay)
┌─────────────────────────────────────────────────────────────┐
│           Background: Preload ES namespaces                 │
│           (common, auth, jobs, forum, dashboard, wizard)    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (User clicks 🇪🇸 Español)
┌─────────────────────────────────────────────────────────────┐
│           changeLanguageSafe('es')                          │
│           └─ Already cached → instant switch!               │
└─────────────────────────────────────────────────────────────┘
```

---

## Result

| Before | After |
|--------|-------|
| 500-800ms pause on first Spanish switch | Instant (< 50ms) |
| Blank screen during initial load | Subtle animated bar |
| No loading indicator during switch | Spinner on globe icon |

---

## Testing Checklist

1. Clear localStorage (to reset language detection)
2. Load app in English
3. Wait 1 second (preload completes)
4. Click 🇪🇸 Español → should be instant
5. Refresh page → Spanish should persist
6. Switch back to English → instant
7. Hard refresh with cleared cache → subtle loading bar appears

