# Constructive Solutions Ibiza

A construction-focused platform built to connect clients, workers, and projects across Ibiza — bringing structure, trust, and efficiency to a fragmented industry.

## 🚀 What It Does

- Connects clients with verified construction professionals
- Streamlines job posting and matching
- Improves communication and project visibility
- Builds trust through structured reviews and workflows

## 👷 Who It's For

- **Clients** → find reliable workers faster
- **Workers** → access better, verified jobs
- **Project managers** → organize and track work efficiently

## 🔄 How It Works

1. Client posts a job with structured scope and budget
2. Workers are matched based on skills, location, and availability
3. Communication happens inside the platform
4. Work is completed, reviewed, and protected

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
| Testing | Vitest (73 tests — smoke + interaction suites) |
| CI | GitHub Actions (smoke → interaction → full suite) |

---

## ⚙️ CI/CD Pipeline

Automated pipelines ensure code quality on every change:

- **Smoke tests** — route stability, render safety, state resilience
- **Interaction tests** — user journey validation
- **Type checking** — compile-time safety
- **Full suite** — runs on main after merge

See [`docs/ci/RELEASE_DISCIPLINE.md`](docs/ci/RELEASE_DISCIPLINE.md) for the full policy.

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
