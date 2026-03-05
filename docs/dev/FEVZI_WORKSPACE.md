# Fevzi — Developer Workspace

**Purpose:** Isolated workspace for code review, snippet testing, and change approvals.  
**Owner:** Fevzi  
**Last updated:** 2026-03-05

---

## How This Works

### 1. Snippet Testing

Fevzi can isolate code snippets here for review before they touch the main codebase.

Drop test snippets into `docs/dev/snippets/` with the naming convention:

```
snippets/
  YYYY-MM-DD_<feature-name>.tsx    # Component snippets
  YYYY-MM-DD_<feature-name>.sql    # Migration snippets
  YYYY-MM-DD_<feature-name>.md     # Notes / questions
```

Example:
```
snippets/2026-03-05_quote-revision-ui.tsx
snippets/2026-03-05_matching-query-fix.sql
```

### 2. Change Approval Log

When Fevzi reviews a change, log the decision here:

| Date | Change | Files Affected | Status | Notes |
|------|--------|---------------|--------|-------|
| _2026-03-05_ | _Example: Quote UI refactor_ | _QuoteCard.tsx, quotes.query.ts_ | ✅ Approved | _Looks good_ |
| | | | | |

**Status values:** `✅ Approved` · `⚠️ Needs Changes` · `❌ Rejected` · `🔍 Under Review`

### 3. Active Review Queue

List items currently under review:

- [ ] _Nothing queued yet_

### 4. Questions / Blockers

Fevzi can log questions or blockers here for async resolution:

| Date | Question | Answer | Resolved? |
|------|----------|--------|-----------|
| | | | |

---

## Git Workflow for Fevzi

### Branch Convention
```
fevzi/<feature-or-fix-name>
```

Examples:
```
fevzi/quote-line-items-fix
fevzi/messaging-mobile-jitter
fevzi/onboarding-validation
```

### PR Process
1. Create branch from `main`
2. Make changes
3. Add snippet to `docs/dev/snippets/` if isolating for review
4. Open PR with description referencing the Architecture Pack section
5. Log approval in the table above
6. Merge to `main`

---

## Reference Documents

- [Architecture Pack](../ARCHITECTURE_PACK.md) — Master blueprint
- [Platform Overview](../PLATFORM_OVERVIEW.md) — Non-technical summary
- [Architecture Guide](../ARCHITECTURE.md) — Domain structure
- [Contributing](../../CONTRIBUTING.md) — Code standards
