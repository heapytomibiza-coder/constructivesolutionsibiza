## Investor Analytical Breakdown — PDF Report

A one-off PDF generated from live production data, written to `/mnt/documents/`.

### Scope
- All-time, since launch
- Core KPIs only (no funnel, geo, or trust deep-dives)

### Sections

1. **Cover** — Constructive Solutions Ibiza, generated date, period covered (first record → today)

2. **Headline numbers** (single page, large stat tiles)
   - Total users
   - Total professionals (and active / live)
   - Total jobs posted
   - Jobs completed
   - Conversations started
   - Reviews submitted
   - Service listings live
   - Average review rating

3. **Timeline of progression** (monthly, since launch)
   - New users / month
   - New professionals / month
   - Jobs posted / month
   - Jobs completed / month
   - Each shown as a small line chart + cumulative total

4. **Marketplace activity**
   - Job status distribution (open / in_progress / completed / cancelled)
   - Quotes submitted, quotes accepted
   - Average time from job posted → first quote (if available)

5. **Trust signals (lightweight)**
   - Total reviews + average rating
   - Disputes opened vs. resolved (counts only)

6. **Methodology footer** — data source, date pulled, any caveats (e.g. test accounts excluded if flag exists)

### Technical approach
- Use `psql` (already wired) to pull aggregates from `auth.users`, `professional_profiles`, `jobs`, `service_listings`, `conversations`, `job_reviews`, `quotes`, `disputes`
- Generate charts with `matplotlib`, assemble PDF with `reportlab`
- Visual QA: convert each page to image, inspect, fix, re-render
- Deliver as `/mnt/documents/investor_breakdown.pdf` via `<lov-artifact>`

### Out of scope (per your answers)
- Funnel / conversion analysis
- Geographic / category breakdown
- Detailed trust & quality deep-dive
- Excel workbook
- In-app investor dashboard

Approve and I'll pull the data and generate the PDF.