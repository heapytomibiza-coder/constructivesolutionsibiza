
# Phase 6 — Trust & Growth Layer

## Status: ✅ Hardened & Deployed

## Fixes Applied (Hardening Pass)

### 1. Demand Intelligence — DB-Level Tier Gating ✅
- Removed permissive `SELECT` policy on `demand_snapshots`
- Created `get_demand_snapshots()` RPC with tier check: only `gold`/`elite` users get data
- Bronze/Silver users receive `demand_data_not_entitled` exception
- Frontend uses RPC, not direct table access

### 2. Ranking Score — Not Exposed to Client ✅
- Removed public `SELECT` policy on `professional_rankings`
- Created `get_professional_labels(p_user_ids)` — returns labels only, no numeric score
- Created `get_professional_ranking_scores(p_user_ids)` — used server-side for sort ordering
- `rankedProfessionals.query.ts` fetches scores for sorting, strips them before returning
- Client receives `ranking_labels: string[]` only

### 3. Client Reputation RLS ✅ (Confirmed Correct)
- `user_id = auth.uid()` — self-read
- Admin read via `has_role` + `is_admin_email`
- Pro read via jobs/conversations relationship check
- No INSERT/UPDATE/DELETE policies = deny by default

### 4. Repeat Hire — Live Aggregate RPC (Intentional)
- `get_repeat_hire_pair(p_client_id, p_pro_id)` — SECURITY DEFINER, live COUNT from `jobs`
- Decision: live aggregate, not materialized table
- Rationale: at current scale (<10K completed jobs), a COUNT with indexed WHERE is <1ms
- Scale trigger: if >50K completed jobs, migrate to materialized `repeat_hires` table

### 5. Trigger Coverage — Complete ✅
- `trg_job_completed_trust_scores` — on job completion → recalculates client rep + pro ranking
- `trg_review_trust_scores` — on review insert → recalculates both
- `trg_dispute_trust_scores` — on dispute insert/update → recalculates both
- `trg_message_response_trust` — on first message in conversation → recalculates response speed

### 6. Cron + Backfill — Complete ✅
- `refresh-demand-snapshots` edge function deployed
- Cron scheduled: every 6 hours (`0 */6 * * *`)
- Initial backfill run: 48 demand snapshots, 34 client reputations seeded
- Professional rankings: 0 (no completed jobs with assigned pros in current data — correct)

## Architecture Summary

| System | Storage | Access | Recalculation |
|--------|---------|--------|---------------|
| Client Reputation | `client_reputation` table | RLS: self + admin + relationship-based pro | Triggers: job completion, review, dispute, first message |
| Pro Rankings | `professional_rankings` table | Labels via RPC only; scores internal | Triggers: job completion, review, dispute, first message |
| Repeat Hire | Live aggregate RPC | SECURITY DEFINER | On-demand (no trigger needed) |
| Demand Intelligence | `demand_snapshots` table | Tier-gated RPC (Gold/Elite) | Cron every 6h |
