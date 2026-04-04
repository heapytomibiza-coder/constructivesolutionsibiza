

## Plan: Tighten Welcome CTA + Icon Pattern + Prompt 3 Guard

Three small, safe fixes based on the user's feedback.

### 1. Welcome CTA destination

**File:** `src/pages/dashboard/professional/ProDashboard.tsx` (line 301)

Change `<Link to="/jobs">` → `<Link to="/dashboard/professional/jobs">`

This points "View Matching Jobs" to the professional's own matched-jobs list (`/dashboard/professional/jobs`) rather than the generic public jobs page. Matches the existing menu item "My Jobs" destination.

### 2. Icon rendering pattern

**File:** `src/pages/dashboard/professional/ProDashboard.tsx` (line 321)

Currently: `<profilePrompt.icon className="h-5 w-5 text-primary" />`

Change to:
```tsx
{(() => { const Icon = profilePrompt.icon; return <Icon className="h-5 w-5 text-primary" />; })()}
```

Or cleaner — destructure before the JSX block (around line 316):
```tsx
const PromptIcon = profilePrompt.icon;
```
Then use `<PromptIcon className="h-5 w-5 text-primary" />` on line 321.

### 3. Prompt 3 condition guard

**File:** `src/pages/dashboard/professional/ProDashboard.tsx` (line 224)

Currently: `if (matchCount >= 5)` — always shows, even for fully complete profiles.

Add a guard so Prompt 3 only shows if there's something actionable. Since Prompt 3 is about fine-tuning job preferences, and the CTA goes to the services step, a reasonable guard is: show only if the user hasn't updated services recently, or simply — show only if Prompts 1 and 2 conditions are already satisfied (business name + tagline + bio all present). This prevents it from appearing for users who haven't even hit Prompt 1/2 thresholds yet.

Change to:
```tsx
if (matchCount >= 5 && businessName && tagline && bio) {
  return { key: 'prompt3', ... };
}
```

This means Prompt 3 only appears for users who have already completed their profile basics — making it a genuine "next level" suggestion rather than appearing for everyone at 5+ matches.

### Files to change

| File | Change |
|---|---|
| `ProDashboard.tsx` | Welcome CTA link, icon pattern, Prompt 3 guard |

### Build order

All three changes are in the same file, independent of each other. Single edit.

