# Constructive Solutions Ibiza

**Infrastructure for a broken industry.**

A construction-focused platform built to connect clients, workers, and projects across Ibiza — bringing structure, trust, and efficiency to a fragmented industry.

🔗 **Explore the platform →** [constructivesolutionsibiza.lovable.app](https://constructivesolutionsibiza.lovable.app)

[![CI](https://img.shields.io/badge/CI-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-73%20passing-blue)]()
[![Security](https://img.shields.io/badge/security-0%20blocking%20issues-green)]()
[![Stage](https://img.shields.io/badge/stage-v0.9%20pre--launch-orange)]()

---

## 📊 Project Status

| | |
|---|---|
| **Stage** | Active Development — Pre-launch |
| **Version** | v0.9 |
| **Environment** | Staging / Preview |
| **Last Update** | April 2026 |
| **Current Focus** | Security hardening, UX polish, real-user testing |

### 🗺️ Roadmap

- [x] User authentication (email + Google)
- [x] Job posting wizard with structured scope
- [x] Worker matching system (skills, location, availability)
- [x] In-platform messaging
- [x] Quote system with line items
- [x] Review and rating system
- [x] Dispute resolution flow (28-day structured system)
- [x] Admin dashboard with platform metrics
- [x] i18n (English / Spanish)
- [x] CI/CD pipeline (smoke → interaction → full suite)
- [x] Security hardening (RLS, storage policies, audit)
- [ ] Payment protection (secure holding system)
- [ ] WhatsApp notification bridge
- [ ] Public professional directory
- [ ] Mobile-optimised experience polish

---

## 🚀 What It Does

- Connects clients with verified construction professionals
- Streamlines job posting and intelligent matching
- Improves communication with structured in-platform messaging
- Builds trust through reviews, dispute resolution, and payment protection
- Provides transparency with progress tracking and photo updates

## 👷 Who It's For

| Role | Value |
|------|-------|
| **Clients** | Find reliable workers faster, with clear scope and protection |
| **Workers** | Access serious, verified jobs with structured briefs |
| **Project managers** | Organise and track work efficiently across teams |

---

## 🌍 Real-World Context

This platform is built from direct experience in Ibiza's construction industry, where:

- **Jobs are managed through WhatsApp** — no structure, no records, no accountability
- **Trust is inconsistent** — clients gamble on recommendations; workers chase unreliable leads
- **Coordination is fragmented** — scope changes, payment disputes, and miscommunication are the norm
- **No system exists** to protect either side when things go wrong

Constructive Solutions exists to replace this chaos with **structured workflows, verified professionals, and built-in protection**.

> This is not a generic freelance marketplace. This is purpose-built infrastructure for construction.

---

## ⚡ What Makes This Different

This is not a generic freelance marketplace.

Constructive Solutions Ibiza is **purpose-built infrastructure**:

- **Structured job data** — not free-text chaos
- **Role-based workflows** — client, worker, admin — each with clear permissions
- **Built-in dispute resolution** — 28-day structured system, not "figure it out"
- **Security-first architecture** — RLS, scoped storage, SECURITY DEFINER functions
- **Designed for repeat, long-term use** — not one-off gigs

---

## 🌍 Adoption (Early Stage)

Currently being developed and tested with real workflows in Ibiza's construction network.

- Initial job flows being validated with real clients and workers
- Worker matching logic under live testing
- Feedback loops integrated directly into development

> This platform is being shaped from real-world usage, not isolated development.

---

## 🎥 Demo Preview

🔗 **Live preview:** [constructivesolutionsibiza.lovable.app](https://constructivesolutionsibiza.lovable.app)

Screenshots and screen recordings — *coming soon*.

---

## 🔄 How It Works

1. **Client posts a job** with structured scope, budget, and requirements
2. **Workers are matched** based on skills, location, and availability
3. **Communication happens inside the platform** — structured, recorded, clear
4. **Work is completed, reviewed, and protected** through the resolution system

---

## 📁 Project Structure

```
src/
├── pages/           → Route-level page components (domain-organised)
├── domain/          → Domain logic, resolvers, formatters
├── features/        → Feature modules (job wizard, messaging, disputes)
├── components/      → Shared UI components
├── shared/          → Generic helpers and utilities
├── hooks/           → Custom React hooks
├── contexts/        → React context providers (auth, role, language)
├── core/            → Core app configuration and setup
├── guard/           → Route guards and auth protection
├── i18n/            → Internationalisation (EN/ES)
├── integrations/    → Backend client and type definitions
├── lib/             → Utility libraries
├── app/             → App shell and layout
└── assets/          → Static assets

supabase/
├── migrations/      → 93+ versioned SQL migrations
└── functions/       → Edge functions (notifications, translations)

docs/
├── START_HERE.md    → 10-minute technical tour
├── ARCHITECTURE_PACK.md → Full system blueprint
├── BACKEND_AUDIT.md → Security audit and RLS review
└── dev/             → Developer workspace and review notes
```

---

## ⚙️ Setup

### Prerequisites

- Node.js 18+
- npm or bun

### Install and Run

```sh
git clone <REPO_URL>
cd constructive-solutions-ibiza
npm install
npm run dev
```

Opens at `http://localhost:5173`

### Environment

The backend is managed via Lovable Cloud — no external database setup required.

For local development, the `.env` file is auto-configured with the necessary connection details.

---

## 🧪 Testing

| Suite | Coverage |
|-------|----------|
| Smoke tests | Route stability, render safety, state resilience |
| Interaction tests | User journey validation |
| Type checking | Compile-time safety |
| Full suite | Runs on main after merge |

```sh
npm test
```

73 tests across smoke and interaction suites.

See [`docs/ci/RELEASE_DISCIPLINE.md`](docs/ci/RELEASE_DISCIPLINE.md) for the full CI/CD policy.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 · TypeScript · Vite · Tailwind · shadcn/ui |
| Backend | Supabase (Postgres · Realtime · Auth · Edge Functions) |
| i18n | i18next (EN / ES) |
| Testing | Vitest (73 tests) |
| CI | GitHub Actions (smoke → interaction → full suite) |

---

## 🔐 Security

Security is enforced at every layer. See **[SECURITY.md](SECURITY.md)** for the full policy.

Key measures:

- **Row-Level Security (RLS)** on all tables — access scoped to authenticated users
- **SECURITY DEFINER functions** — `has_role()`, `is_admin_email()`, `switch_active_role()`
- **Private storage buckets** — dispute evidence and progress photos are party-scoped
- **93+ versioned migrations** — full audit trail of every schema change
- **0 blocking security issues** — confirmed by latest security scan

Full audit: **[docs/BACKEND_AUDIT.md](docs/BACKEND_AUDIT.md)**

---

## 🌐 Platform Scope

Construction and property services only. Categories include:

- Construction & renovation
- Electrical · Plumbing · HVAC
- Carpentry · Kitchens & bathrooms
- Floors · Doors · Windows
- Painting & decorating
- Gardening & landscaping
- Pools & spas
- Smart home · Testing & certification

> Lifestyle, concierge, and general freelance services are intentionally excluded.

---

## 📦 Version

**v0.9** — Pre-launch

Recent changes:
- Security hardening: dispute evidence storage locked down, progress photos privatised
- Duplicate RLS policies cleaned
- Realtime defensive guards added
- CI pipeline stabilised (73 tests passing)

---

## 📈 Metrics (Early Stage)

| Metric | Value |
|--------|-------|
| Active development | v0.9 |
| Database migrations | 93+ |
| Passing tests | 73 |
| Blocking security issues | 0 |

---

## 🧠 Future Infrastructure

Planned system extensions include:

- Secure payment holding system (payment protection)
- AI-assisted job scoping and matching
- Worker reputation scoring with trust metrics
- Multi-project management dashboards
- WhatsApp notification bridge
- Cross-platform integration with related service systems

---

## 📌 Development Board

Track progress → *[GitHub Projects board — coming soon]*

---

## 🤝 Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for code standards, branch naming, and PR rules.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [START_HERE.md](docs/START_HERE.md) | 10-minute technical tour |
| [ARCHITECTURE_PACK.md](docs/ARCHITECTURE_PACK.md) | Full system blueprint |
| [BACKEND_AUDIT.md](docs/BACKEND_AUDIT.md) | Security audit and RLS review |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Domain structure guide |

See **[docs/README.md](docs/README.md)** for the full documentation index.

---

**Built for Ibiza. Built on trust. Designed to scale.**
