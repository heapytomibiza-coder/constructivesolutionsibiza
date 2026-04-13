

## Export All 335 Question Packs as a Browsable Reference

### What you'll get

Two files written to `/mnt/documents/`:

1. **`question-packs-reference.md`** — Human-readable Markdown organized by category (17 categories, 335 packs, ~1,880 questions). Each pack shows every question's ID, type, label, options, required status, `show_if` conditional logic, and any interpretation rules.

2. **`question-packs-complete.json`** — Raw JSON export of all 335 packs for programmatic use.

### Structure of the Markdown

```text
# Question Pack Library — Full Reference
## Summary: 335 packs across 17 categories

## Table of Contents
- Construction (50 packs)
- HVAC (36 packs)
- Electrical (32 packs)
- ...

## Construction

### adding-new-rooms — "Adding New Rooms" (6 questions)
| # | ID | Type | Label | Required | Options | show_if |
|---|-----|------|-------|----------|---------|---------|
| 1 | description | textarea | Describe... | ✓ | — | — |
| 2 | area_size | radio | How big? | ✓ | small, medium, large | — |
...

Rules: (if any)
- IF known_issues = "yes" → flags: PRE_EXISTING_ISSUES

### brick-repair — "Brick Repair" (5 questions)
...

(all 335 packs)
```

### Implementation steps

1. Query all 335 packs from `question_packs` in batches (full `questions` JSON + `metadata`)
2. Group by `category_contract`
3. For each pack, render a question table with all fields including conditional `show_if` logic
4. Append interpretation rules (from `metadata->'rules'`) as IF/THEN blocks
5. Write both files to `/mnt/documents/`

