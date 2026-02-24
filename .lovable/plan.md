

## Root cause

**`FormattedAnswers.tsx` translates the wrong field.** It runs `translateValue(answer.displayValue)` where `displayValue` is already the English label (e.g. `"Villa / House"`). The i18n key for that is `options.villa_house`, but `norm("Villa / House")` produces `"Villa / House"` — no match, so English falls through.

The `rawValue` field (e.g. `"villa_house"`) is the stable snake_case key that matches the locale JSON, but it's never used for translation.

**`ReviewStep.tsx` also renders `mainCategory`, `subcategory`, and `microNames` as raw strings** with no taxonomy translation calls.

## Fix (2 files)

### 1. `src/pages/jobs/components/FormattedAnswers.tsx`

Change `translateValue` to look up `answer.rawValue` (snake_case DB key) first, falling back to `displayValue`:

```ts
const translateValue = (rawValue: string | string[], displayValue: string): string => {
  // Handle arrays (checkbox answers)
  if (Array.isArray(rawValue)) {
    return rawValue.map(v => {
      const translated = t(`options.${v}`, { defaultValue: '' });
      return translated || v;
    }).join(', ');
  }
  // Single value — look up by raw snake_case key
  const byRaw = t(`options.${rawValue}`, { defaultValue: '' });
  if (byRaw) return byRaw;
  // Fallback to normalized displayValue
  const key = norm(displayValue);
  const byDisplay = t(`options.${key}`, { defaultValue: '' });
  return byDisplay || displayValue;
};
```

Update the render call from:
```tsx
{translateValue(answer.displayValue)}
```
to:
```tsx
{translateValue(answer.rawValue, answer.displayValue)}
```

### 2. `src/features/wizard/canonical/steps/ReviewStep.tsx`

Import taxonomy helpers and wrap the raw category/micro strings:

- `mainCategory` → `txCategory(mainCategory, t)`
- `subcategory` → `txSubcategory(subcategory, t)`
- Each `microName` → `txMicro(microSlugs[i], t, name)` (requires passing `microSlugs` alongside `microNames`)

This ensures the Review step (step 7) also shows translated taxonomy labels.

## No new locale keys needed

The `rawValue` keys (`villa_house`, `apartment`, `asap`, etc.) already exist in `es/questions.json` from the previous round of work.

