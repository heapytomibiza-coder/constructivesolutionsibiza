# Constructive Solutions Ibiza

Construction job platform connecting clients with trusted tradespeople in Ibiza.

Clients post construction jobs, professionals send structured quotes, and work is completed with real-time messaging, project tracking, and reviews.

---

## Quick Start

```sh
git clone <REPO_URL>
cd constructive-solutions-ibiza
npm install
npm run dev
```

Opens at `http://localhost:5173`

---

## First-Time Code Review

Start here: **[docs/START_HERE.md](docs/START_HERE.md)**

A 10-minute guided walkthrough covering routing, matching, messaging, quotes, and database security.

---

## Architecture

Full system blueprint: **[docs/ARCHITECTURE_PACK.md](docs/ARCHITECTURE_PACK.md)**

Includes user journeys, route map, job lifecycle state machine, feature-page matrix, and data spine.

---

## Backend Security

All schema migrations and Row-Level Security policies are versioned in `supabase/migrations/` (93+ migration files).

Security functions include `has_role()` (SECURITY DEFINER), `is_admin_email()`, and `switch_active_role()`.

Full audit: **[docs/BACKEND_AUDIT.md](docs/BACKEND_AUDIT.md)**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 · TypeScript · Vite · Tailwind · shadcn-ui |
| Backend | Supabase (Postgres · Realtime · Auth · Edge Functions) |
| i18n | i18next (EN / ES) |
| Testing | Vitest · ESLint |

---

## Platform Scope

Construction and property services only. Categories include:

- Construction & renovation
- Electrical · Plumbing · HVAC
- Carpentry · Kitchens & bathrooms
- Floors · Doors · Windows
- Painting & decorating
- Gardening & landscaping
- Pools & spas
- Smart home · Testing & certification

Lifestyle, concierge, and general freelance services are intentionally excluded.

---

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for code standards and conventions.

---

## Documentation

See **[docs/README.md](docs/README.md)** for a full index of all project documentation.
