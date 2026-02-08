

# Plan: Align Phase 1 & 2 with Your Exact Specifications

## Summary

You've provided drop-in replacements for the professional component library. This plan aligns the existing implementation with your exact specifications, including the flexible `ReactNode` icon prop and the separated `zones.ts` file.

---

## Current State vs Your Specifications

| Component | Current | Your Specification | Action |
|-----------|---------|-------------------|--------|
| **GradientIconHeader** | Takes `LucideIcon` type | Takes `ReactNode` (flexible) | Update signature |
| **zones.ts** | Doesn't exist | Separate file with types + `allZoneIds()` | Create new file |
| **ZoneTile** | Has `id` prop + embedded `IBIZA_ZONES` | No `id` prop, zones moved out | Simplify component |
| **IslandWideTile** | Missing description | Add "We'll match you with jobs anywhere" | Add text |
| **ProfileEdit** | Partial upgrade | Full debounced autosave + ref pattern | Complete upgrade |

---

## File Changes

### 1. Create `src/shared/components/professional/zones.ts` (NEW)

Centralized zone data with types and helper:

```typescript
export type IbizaZone = { id: string; label: string };
export type IbizaZoneGroup = { group: string; zones: IbizaZone[] };

export const IBIZA_ZONES: IbizaZoneGroup[] = [
  { group: "Central", zones: [...] },
  { group: "West", zones: [...] },
  // ... all 5 groups
];

export const allZoneIds = () => IBIZA_ZONES.flatMap(g => g.zones.map(z => z.id));
```

### 2. Update `GradientIconHeader.tsx`

Change from `LucideIcon` type to `ReactNode` for flexibility:

```typescript
// Before
icon: LucideIcon;

// After
icon: ReactNode;
```

This allows usage like `icon={<User className="h-5 w-5" />}` for custom sizing.

### 3. Update `ZoneTile.tsx`

- Remove `IBIZA_ZONES` constant (moved to `zones.ts`)
- Remove unused `id` prop from interface
- Keep the 56px min-height and accessibility features

### 4. Update `IslandWideTile.tsx`

Add the description text:
```tsx
<span className="block text-base font-medium">I cover the entire island</span>
<p className="text-sm text-muted-foreground">
  We'll match you with jobs anywhere in Ibiza.
</p>
```

### 5. Update `index.ts`

Export the new `zones.ts`:
```typescript
export * from './zones';
```

### 6. Update `ProfileEdit.tsx`

Complete the upgrade with:
- Debounced autosave using `useRef<ReturnType<typeof setTimeout>>`
- `mode: "onChange"` for form validation
- Skip autosave if `isDirty === false` or required field invalid
- `QuietSaveIndicator` also shown in mobile footer
- `rounded-xl` on action buttons

---

## Technical Notes

### ReactNode vs LucideIcon Trade-off

**LucideIcon (current)**:
- Better autocomplete
- Component controls icon size automatically
- Slightly more restrictive

**ReactNode (your spec)**:
- More flexible (custom SVGs, styled icons)
- Caller controls icon size
- Matches your drop-in code exactly

Your specification uses ReactNode, which is the right call for maximum flexibility.

### Autosave Pattern

Your provided code includes a robust debounce pattern:
```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  const subscription = form.watch((values) => {
    if (!form.formState.isDirty) return;
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => autoSave(values), 700);
  });
  
  return () => {
    subscription.unsubscribe();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };
}, [form, autoSave, user, isFetching]);
```

This is cleaner than the current implementation and prevents autosave during initial fetch.

---

## Files Modified

| Action | File | Description |
|--------|------|-------------|
| Create | `src/shared/components/professional/zones.ts` | Types + data + `allZoneIds()` |
| Update | `src/shared/components/professional/GradientIconHeader.tsx` | ReactNode icon prop |
| Update | `src/shared/components/professional/ZoneTile.tsx` | Remove id prop + IBIZA_ZONES |
| Update | `src/shared/components/professional/IslandWideTile.tsx` | Add description text |
| Update | `src/shared/components/professional/index.ts` | Export zones.ts |
| Update | `src/pages/professional/ProfileEdit.tsx` | Complete debounced autosave |
| Update | `src/pages/onboarding/steps/ServiceAreaStep.tsx` | Use allZoneIds() helper |

---

## Expected Result

After implementation:
- Clean separation of concerns with `zones.ts`
- Flexible icon rendering in `GradientIconHeader`
- ProfileEdit with proper debounced autosave that:
  - Waits 700ms after typing stops
  - Shows "Saved" indicator on success
  - Skips autosave during initial load
  - Validates required field before saving

