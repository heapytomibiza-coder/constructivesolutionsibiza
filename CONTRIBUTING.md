# Contributing to Constructive Solutions Ibiza

Thanks for your interest in contributing. Whether you're fixing a bug, improving UX, or adding a feature — this guide will help you stay aligned with the project's architecture and standards.

## Getting Started

1. Fork the repo and clone locally
2. Run `npm install` and `npm run dev`
3. Create a feature branch from `main` (see naming conventions below)
4. Make your changes following the rules in this document
5. Open a PR with test steps documented

## Branch Naming

Use descriptive, prefixed branch names:

- `feature/job-wizard-validation` — new functionality
- `fix/messaging-scroll-bug` — bug fixes
- `refactor/extract-pricing-hook` — code improvement
- `docs/update-architecture` — documentation only

## Architecture Rules

### Domain Boundaries

1. **UI components render display-ready data only** - No raw JSON blobs or database shapes in components
2. **Business logic lives in `lib/` or `services/`** - Not in UI components
3. **No cross-domain internal imports** - Use `index.ts` exports for public APIs
4. **Domain folders own everything about that domain** - `shared/` is only for truly generic UI/helpers

### Read/Write Separation (TanStack Query)

4. **All reads go in `queries/`** - Return data, never mutate
   - Example: `jobBoard.query.ts`, `jobDetails.query.ts`
5. **All writes go in `actions/`** - Mutations, RPC calls, inserts
   - Example: `messageJob.action.ts`, `createJob.action.ts`
6. **UI uses `useQuery()` for reads, `useMutation()` for writes**
   - Import query/action functions from domain folders

### Query Key Management

7. **Centralize keys in `queries/keys.ts`** within each domain
8. **Use hierarchical keys** - `["jobs", "details", id]` not `["job_details", id]`
9. **Colocate keys with queries** - Keys and query functions live together

### Validation & Types

10. **API payloads validated in `validators.ts`** with Zod
11. **No `_pack_*` metadata keys in UI** - Filter at extraction/resolution stage
12. **Separate write models (wizard) from read models (display)**

### Supabase Usage

13. **Phase 1:** No Supabase imports in `components/` - allowed in page containers
14. **Phase 2:** No Supabase imports in pages - only in queries/actions
15. **RLS is the security gate** - UI checks are for UX only

### Error Handling

16. **Use `UserError` for user-facing errors in actions**
17. **Actions map Supabase errors to user-friendly messages**
18. **UI checks `isUserError()` to show appropriate feedback**

## Quality Bar

### Every Feature Must Have

- [ ] Loading state
- [ ] Empty state  
- [ ] Error state
- [ ] Mobile works
- [ ] Validation exists where needed

### Definition of Done

- [ ] Feature works on mobile
- [ ] Error states handled gracefully
- [ ] Test steps documented in PR description
- [ ] No TypeScript errors
- [ ] No console errors in runtime

## Folder Structure

```
src/pages/<domain>/
  components/    # Domain-specific UI components
  lib/           # Pure logic: resolvers, formatters, mappers
  queries/       # TanStack Query read functions + keys
  actions/       # Writes: mutations, RPC, inserts
  hooks/         # Composed hooks that orchestrate queries
  types.ts       # Domain types
  validators.ts  # Zod schemas (when needed)
  index.ts       # Public exports

src/shared/
  components/    # Truly generic UI (Button, Modal, Input)
  lib/           # Generic helpers (date, money, debounce)
```

## PR Checklist

Before submitting a PR, verify:

- [ ] Code follows domain-first organization
- [ ] Supabase calls are in queries/ or actions/, not UI
- [ ] No raw JSON shapes leak into components
- [ ] Loading/empty/error states implemented
- [ ] Works on mobile viewport
- [ ] No TypeScript or console errors
- [ ] Test steps documented
