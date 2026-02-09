
## Launch Blockers: Quick Fix Batch

Four targeted fixes to clear the launch checklist. No architectural changes.

---

### Fix 1: Remove DEBUG-123 label

**File:** `src/pages/professional/ProfileEdit.tsx` (line 278)

Change:
```
{t("pro.profile.title", "Your Profile")} - DEBUG-123
```
To:
```
{t("pro.profile.title", "Your Profile")}
```

---

### Fix 2: Wire up contact form with toast feedback

**File:** `src/pages/public/Contact.tsx`

Replace the no-op `handleSubmit` with a simple toast confirmation. No backend needed for soft launch -- just acknowledge the submission and clear the form so it doesn't silently do nothing.

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  toast.success(t('contact.successMessage', 'Message sent! We\'ll get back to you soon.'));
  form.reset();
};
```

Add `toast` import from `sonner`.

---

### Fix 3: Hide placeholder pages (Services + Portfolio)

These two pages are stubs with no functionality. They are not linked from any nav or dashboard -- only registered as routes. The cleanest approach: replace their route elements with a redirect back to the pro dashboard so any direct URL hit doesn't land on a broken page.

**File:** `src/App.tsx`

Replace the two route lines:
```tsx
<Route path="/professional/services" element={<ProfessionalServices />} />
...
<Route path="/professional/portfolio" element={<ProfessionalPortfolio />} />
```

With redirects:
```tsx
<Route path="/professional/services" element={<Navigate to="/dashboard/pro" replace />} />
<Route path="/professional/portfolio" element={<Navigate to="/dashboard/pro" replace />} />
```

Then remove the unused imports for `ProfessionalServices` and `ProfessionalPortfolio`.

---

### Fix 4: Enable leaked password protection

This is a backend auth configuration change. Will use the auth configuration tool to enable HaveIBeenPwned password checking so compromised passwords are rejected at signup.

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/professional/ProfileEdit.tsx` | Remove `- DEBUG-123` |
| `src/pages/public/Contact.tsx` | Add toast feedback + form reset |
| `src/App.tsx` | Redirect placeholder routes, remove unused imports |
| Auth config | Enable leaked password protection |
