

# Fix Intent Selector Labels + Job Details Timing/Capitalization

## What's changing

### 1. Intent Selector -- Update labels to match Asker/Tasker branding

Currently when signing up (with `allowProfessional=false`), users see:
- "I'm a Client" (Asker badge)
- "Both"

**New copy:**
- Option 1: **"I'm an Asker"** with subtitle badge "Asker" -- description: "I need help with a project -- post jobs, get quotes, hire professionals"
- Option 2: **"I'm a Tasker"** with subtitle badge "Tasker" -- description: "We'll add you as both so you can hire and offer services"

This repurposes the "Both" card into the clear Tasker entry point, explaining that both roles are included automatically.

### 2. Job Details -- Fix timing display and capitalization

The `formatTiming` function in `buildJobPack.ts` and the `prettyStatus` function in `JobDetailsModal.tsx` have inconsistent capitalization:
- `prettyStatus("in_progress")` produces "In progress" instead of "In Progress"
- Timing labels like "This week", "This month" need consistent title case

**Fix:** Update `prettyStatus` to capitalize each word (Title Case), and ensure timing display values use proper capitalization.

### 3. Password hint alignment

The signup password hint still says "At least 6 characters" but the minimum was changed to 8. Update both EN and ES translation files.

---

## Files to change

### `public/locales/en/auth.json`
- `intent.options.client.title`: "I'm a Client" -> "I'm an Asker"
- `intent.options.both.title`: "Both" -> "I'm a Tasker"
- `intent.options.both.subtitle`: (add) "Tasker"
- `intent.options.both.description`: "I hire professionals AND offer my own services" -> "We'll add you as both so you can hire and offer services"
- `signUp.passwordHint`: "At least 6 characters" -> "At least 8 characters"
- `resetPasswordPage.passwordTooShort`: "Password must be at least 6 characters" -> "Password must be at least 8 characters"

### `public/locales/es/auth.json`
- `intent.options.client.title`: "Soy cliente" -> "Soy Asker"
- `intent.options.both.title`: "Ambos" -> "Soy Tasker"
- `intent.options.both.subtitle`: (add) "Tasker"
- `intent.options.both.description`: "Contrato profesionales Y tambien ofrezco mis propios servicios" -> "Te agregaremos como ambos para que puedas contratar y ofrecer servicios"
- `signUp.passwordHint`: "Minimo 6 caracteres" -> "Minimo 8 caracteres"
- `resetPasswordPage.passwordTooShort`: update to 8 characters

### `src/pages/jobs/JobDetailsModal.tsx`
- Fix `prettyStatus` to use Title Case (capitalize every word, not just the first)

### `src/pages/jobs/lib/buildJobPack.ts`
- Verify timing labels use consistent capitalization (already correct: "This week", "This month", etc.)

---

## Technical details

### prettyStatus fix (JobDetailsModal.tsx, line 41-44)

Current:
```typescript
function prettyStatus(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
```

Fixed (Title Case all words):
```typescript
function prettyStatus(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
```

This changes "in progress" to "In Progress", "open" to "Open", etc.

### Intent selector -- no component changes needed

The `IntentSelector.tsx` component already supports optional `subtitle` on any option. Since the "both" option currently has no subtitle, adding `"subtitle": "Tasker"` to the JSON will make the badge appear automatically.

