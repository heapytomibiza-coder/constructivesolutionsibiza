
# Fix: Slug Mismatch Between Frontend and Database

## The Problem

The Services page and Index page generate category slugs using JavaScript regex:
```javascript
category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
```

This produces incorrect slugs with multiple consecutive dashes (e.g., `painting---decorating`) because `&` and spaces are replaced individually. The database has properly normalized slugs (e.g., `painting-decorating`).

**Result**: When users click categories like "Painting & Decorating" from the Services page, they're routed to `/services/painting---decorating`, but `ServiceCategory.tsx` queries for that slug and gets no match → "Category Not Found".

---

## The Fix

Update the slug generation logic to collapse consecutive dashes:

```javascript
// Before (broken)
const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// After (fixed)
const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
```

Or even better, add trim for edge cases:
```javascript
const slug = category
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');
```

---

## Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/pages/public/Services.tsx` | 60 | Fix slug generation |
| `src/pages/Index.tsx` | 91 | Fix slug generation (same issue) |

---

## Verification Checklist

After fix, these should all work:

| Test | Expected URL | DB Query Slug |
|------|--------------|---------------|
| Click "Painting & Decorating" | `/services/painting-decorating` | `painting-decorating` ✓ |
| Click "Gardening & Landscaping" | `/services/gardening-landscaping` | `gardening-landscaping` ✓ |
| Click "Pool & Spa" | `/services/pool-spa` | `pool-spa` ✓ |
| Click "Floors, Doors & Windows" | `/services/floors-doors-windows` | `floors-doors-windows` ✓ |

---

## Implementation

### Step 1: Fix Services.tsx

Replace line 60:
```typescript
const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
```

### Step 2: Fix Index.tsx

Replace line 91 with the same fix.

### Step 3: Test End-to-End

1. Go to `/services`
2. Click "Painting & Decorating"
3. Verify URL is `/services/painting-decorating` (not `painting---decorating`)
4. Verify category loads from DB with subcategories
5. Select a subcategory, click "Post Job"
6. Verify wizard opens at Step 3 (Micro) with category+subcategory pre-filled
7. Click "Browse Professionals"
8. Verify filter badges appear on `/professionals` page

---

## Summary

This is a **one-line fix in two files** that resolves the slug mismatch causing categories to appear "Not Found". The rest of the deep-linking implementation (ServiceCategory, Wizard, Professionals filtering) is already correctly implemented.
