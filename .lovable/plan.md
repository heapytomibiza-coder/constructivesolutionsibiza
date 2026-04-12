

# Export Full System Architecture Document

## What this does
Generates a comprehensive Markdown document containing the complete platform architecture — taxonomy, wizard structure, job output schema, worker profiles, and matching logic — exported as a downloadable file.

## Content structure

The document will contain 7 sections matching your request:

1. **Taxonomy** — All 16 categories, ~89 subcategories, ~335 micro-services extracted directly from the `service_search_index` database table
2. **Wizard Structure** — All 7 steps with exact questions, types, options, required/optional flags, and conditional logic (pulled from the codebase)
3. **Job Output** — The exact `jobs` table columns (41 fields) and the `answers` JSONB structure showing what gets stored
4. **Worker Side** — Professional profile fields, service selection model, onboarding phases
5. **Matching** — The `matched_jobs_for_professional` view logic (micro_slug join)
6. **Database Structure** — Key tables and their relationships
7. **Edge Cases** — Custom request fallback, "Other" location, general-project pack fallback, admin editing

## Technical approach

- Query the database for the full taxonomy (already retrieved)
- Pull wizard step definitions from codebase (already read)
- Generate a single Markdown file at `/mnt/documents/constructive_platform_architecture.md`
- No codebase changes — pure data extraction and formatting

## Output
One downloadable `.md` file, cleanly formatted and shareable.
