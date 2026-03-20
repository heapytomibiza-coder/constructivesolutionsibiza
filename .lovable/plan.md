

# Performance Optimization — Phase 2

Your Phase 1 gains (WebP images, bundle splitting, hero `<img>` tag) are solid. Here is what to tackle next, ordered by impact.

## Summary

The remaining bottlenecks are: (1) i18n blocks rendering while loading ALL 13 translation files, (2) no responsive images — mobile downloads desktop-sized heroes, (3) listing pages load all images at once, (4) fonts still lack `display=swap` in the CSS import.

---

## Plan

### 1. Fix render-blocking i18n preload (Critical)

**Problem**: `preloadCoreNamespaces()` loads all 13 namespace JSON files before React renders anything. The homepage only needs `common` + `lexicon`. Users see a spinner while `dashboard.json`, `wizard.json`, `questions.json`, `professional.json`, etc. all download — files they will never use on the landing page.

**Fix**:
- Change `preloadCoreNamespaces()` to only load `common` and `lexicon` (the two namespaces the landing page uses)
- Let other namespaces load on-demand when their pages mount (i18next already handles this with `useTranslation('dashboard')`)
- This cuts ~10 network requests off the critical path

**Files**: `src/i18n/preload.ts`

### 2. Add `display=swap` to Google Fonts import (Critical — easy)

**Problem**: The font CSS import in `index.css` has no `display=swap`, which means text is invisible until the font downloads.

**Fix**: Already has `&display=swap` in the URL — confirmed. No change needed here.

Actually, re-reading line 1: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');` — this is correct. Good.

### 3. Add responsive images with `srcset` (High impact)

**Problem**: No `srcset` anywhere in the codebase. Mobile (411px viewport) downloads the same hero and card images as desktop (1920px). On a 411px phone, a 1600px hero is ~4x larger than needed.

**Fix**:
- Create a reusable `ResponsiveImage` component that accepts multiple size variants
- For the `HeroBanner`, add `srcset` and `sizes` attributes to serve smaller images on mobile
- For `ServiceListingCard`, add `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"` so the browser picks the right size
- Generate smaller image variants (400w, 800w, 1200w) from existing assets

**Files**: `src/shared/components/layout/HeroBanner.tsx`, `src/pages/services/ServiceListingCard.tsx`, new utility component

### 4. Lazy-load below-the-fold homepage sections (High impact)

**Problem**: The homepage is 591 lines with many sections. All render immediately even though only the hero is visible on first load.

**Fix**:
- Create a `LazySection` wrapper using `IntersectionObserver` that only renders children when they scroll into view
- Wrap sections below the hero (How We Work, Problem/Solution, Payment Protection, etc.) with `LazySection`
- This reduces initial DOM size and speeds up first paint

**Files**: New `src/shared/components/LazySection.tsx`, `src/pages/Index.tsx`

### 5. Limit simultaneous image loads on listing grids (Medium)

**Problem**: The service marketplace and job board load all card images at once. With 27+ listings, that is 27 image requests firing simultaneously.

**Fix**:
- Already using `loading="lazy"` on card images — this is correct
- Add `content-visibility: auto` CSS to card containers so the browser skips rendering off-screen cards entirely
- Consider pagination or "Load more" button after 12 items

**Files**: `src/pages/services/ServiceMarketplace.tsx`, `src/index.css`

### 6. Defer non-essential scripts and components (Medium)

**Problem**: `ReportIssueWidget` and `initMonitor` load on every page immediately.

**Fix**:
- Wrap `ReportIssueWidget` in a `requestIdleCallback` or delay its mount by a few seconds
- Ensure `initMonitor` does not block first paint (verify it is async)

**Files**: `src/App.tsx`, `src/main.tsx`

---

## Technical details

### i18n preload change (Step 1)
```typescript
// Before: loads ALL 13 namespaces
const CORE_NAMESPACES = Object.values(NS);

// After: only critical-path namespaces
const BOOT_NAMESPACES = ['common', 'lexicon'];
```

### LazySection component (Step 4)
```typescript
// Uses IntersectionObserver to defer rendering
function LazySection({ children, rootMargin = '200px' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref}>{visible ? children : <div style={{ minHeight: 200 }} />}</div>;
}
```

### Content-visibility CSS (Step 5)
```css
.card-grounded {
  content-visibility: auto;
  contain-intrinsic-size: auto 400px;
}
```

---

## Expected impact

| Change | LCP improvement | Effort |
|--------|----------------|--------|
| i18n preload trim | ~500-800ms faster first render | Small |
| Responsive images | ~30-50% less data on mobile | Medium |
| Lazy sections | Faster TTI, less DOM work | Small |
| Content-visibility on grids | Less rendering work | Small |
| Defer widgets | Minor first-paint gain | Small |

The i18n fix is the single biggest remaining win — it is currently blocking the entire app from rendering while downloading ~13 JSON files that are not needed.

