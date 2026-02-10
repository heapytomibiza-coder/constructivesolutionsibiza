

## Sitemap + Legal Page Scaffolds

### Production Domain
`https://constructivesolutionsibiza.com`

---

### 1. Create `public/sitemap.xml`

A static sitemap covering all public-facing routes:

```text
Homepage                    /
Services                    /services
Jobs Board                  /jobs
Professionals               /professionals
How It Works                /how-it-works
Contact                     /contact
Forum                       /forum
Post a Job                  /post
Privacy Policy              /privacy
Terms of Service            /terms
```

All URLs will use `https://constructivesolutionsibiza.com` as the base. `lastmod` set to today's date. Priority weighted: homepage 1.0, core pages 0.8, secondary 0.6.

---

### 2. Update `robots.txt`

Change the existing `Sitemap:` directive from `csibiza.com` to:
```
Sitemap: https://constructivesolutionsibiza.com/sitemap.xml
```

---

### 3. Scaffold Privacy Policy page (`src/pages/public/Privacy.tsx`)

A minimal but professional page using `PublicLayout`:
- Page title: "Privacy Policy"
- Last updated date
- Sections covering: information collected, how it's used, data sharing, cookies, user rights, contact
- Content is placeholder-quality but structured correctly (not lorem ipsum -- real section headings with sensible defaults for a service marketplace)
- Footer note: "For questions, contact us at [contact page link]"

---

### 4. Scaffold Terms of Service page (`src/pages/public/Terms.tsx`)

Same pattern as Privacy:
- Page title: "Terms of Service"
- Sections: acceptance, platform description, user accounts, posting jobs, professional obligations, prohibited conduct, limitation of liability, contact
- Real structure, soft-launch-acceptable copy

---

### 5. Register routes in `App.tsx`

Add two new public routes before the catch-all:
```
/privacy  -> Privacy
/terms    -> Terms
```

These are already linked from the footer (`PublicFooter.tsx`) and the auth page (`Auth.tsx`), so no navigation changes needed.

---

### 6. Update `index.html` OG URLs

Update `og:image` to use the production domain path (the actual image file still needs to be provided by you).

---

### Summary

| Change | File |
|--------|------|
| New file | `public/sitemap.xml` |
| Edit | `public/robots.txt` (sitemap URL) |
| New file | `src/pages/public/Privacy.tsx` |
| New file | `src/pages/public/Terms.tsx` |
| Edit | `src/App.tsx` (add 2 routes) |
| Edit | `index.html` (OG URL base) |

### Still needed from you
- **OG image**: Drop a 1200x630 branded image into chat
- **Favicon**: Drop a branded .ico or .png into chat
- **SITE_URL secret**: Set to `https://constructivesolutionsibiza.com` in your environment
- **Legal review**: The privacy/terms pages are scaffolds -- review and update the copy before hard launch
