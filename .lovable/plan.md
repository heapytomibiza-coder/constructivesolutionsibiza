

## Plan: Replace default README + add docs front door

The root `README.md` is still the Lovable template placeholder. Replacing it with a proper platform README is the single highest-impact change for investor/dev credibility. Adding a `docs/README.md` completes the navigation.

### 1. Replace `README.md` (root)

Replace the entire file with a concise platform README covering:

- **What it is**: One-paragraph description of Constructive Solutions Ibiza
- **Quick Start**: Clone, install, run (`npm run dev` on localhost:5173)
- **First-Time Code Review**: Points to `docs/START_HERE.md`
- **Architecture**: Points to `docs/ARCHITECTURE_PACK.md`
- **Backend Security**: Notes 93+ versioned migrations in `supabase/migrations/`, RLS on all tables, security-definer functions
- **Tech Stack**: React, TypeScript, Vite, Tailwind, shadcn-ui, Supabase
- **Platform Scope**: Construction and property services only (lists categories)
- **Contributing**: Points to `CONTRIBUTING.md`

No Lovable project IDs or internal URLs exposed. Clean, professional, domain-specific.

### 2. Create `docs/README.md` (docs front door)

A short ~15-line navigation file:

- **Start Here**: `docs/START_HERE.md` (10-minute technical tour)
- **Blueprint**: `docs/ARCHITECTURE_PACK.md` (full system architecture)
- **Security Audit**: `docs/BACKEND_AUDIT.md` (RLS policies, access model)
- **Developer Workspace**: `docs/dev/` (Fevzi's review space, snippets, platform overview)

### No other changes

The root is already clean (no PHASE files present in the working tree). The docs structure is already well-organised. These two files complete the "trust scan" path:

```text
README.md  →  docs/START_HERE.md  →  docs/ARCHITECTURE_PACK.md
                                  →  docs/BACKEND_AUDIT.md
                                  →  docs/dev/ (Fevzi workspace)
```

