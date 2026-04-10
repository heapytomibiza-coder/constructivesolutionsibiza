# Payments Architecture

**Last updated:** 2026-04-10
**Owner:** Engineering Lead

## Purpose

Design document for the payment system. Currently PLANNED — not built. This doc captures the architecture so future development follows a coherent design.

## Scope

Stripe integration, quote-to-payment linking, milestone-based structured payments, dispute resolution, and pro payouts.

## Current State

**Not implemented.** Listed in rollout phase `protection-beta` (Phase 5 of 6).

Existing infrastructure that payments will build on:
- `quotes` table with `status`, `price_type`, `price_fixed/min/max`, `subtotal`, `total`, `vat_percent`
- `quote_line_items` table with itemized breakdown
- `job_status_history` table for audit trail
- `jobs.assigned_professional_id` for linking jobs to pros

## Core Components (Planned)

### 1. Payment Flow

```
Quote accepted
     │
     ▼
Create Stripe Payment Intent
     │
     ├── Fixed price → Single payment intent for quote.total
     │
     ├── Range price → Payment intent for agreed amount
     │
     └── Hourly → Time-based billing (future)
           │
           ▼
Client pays via Stripe Elements
     │
     ▼
Payment held via Stripe Connect (structured milestone release)
     │
     ▼
Job completed → Client approves
     │
     ├── Approved → Release to pro (Stripe Transfer)
     │
     └── Disputed → Dispute resolution flow
```

### 2. Proposed Tables

```sql
-- Payment records
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) NOT NULL,
  quote_id UUID REFERENCES quotes(id) NOT NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT DEFAULT 'pending',
  -- pending → captured → released → refunded / disputed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pro payout tracking
CREATE TABLE pro_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL,
  payment_id UUID REFERENCES payments(id) NOT NULL,
  stripe_transfer_id TEXT,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  -- pending → transferred → failed
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Stripe Integration Plan

- **Stripe Elements:** Client-side payment form (PCI compliant, no card data stored)
- **Stripe Connect:** For pro payouts (Standard or Express accounts)
- **Webhooks:** Edge function to process Stripe events (payment_intent.succeeded, etc.)
- **Platform fee:** Percentage deducted before pro payout

### 4. Payment Protection Model

```
Status Flow:
  pending → funded → in_progress → awaiting_approval → approved → released
                                  └── disputed → resolved → released / refunded
```

- Client funds are processed through Stripe Connect with structured milestone release
- Automatic release after N days if client doesn't respond
- Dispute creates a `support_requests` entry for admin review

### 5. Milestone-Based Payments

For larger jobs, split payment into milestones:
- Each milestone has its own payment intent
- Pro marks milestone complete → client approves → partial release
- Reduces risk for both parties on high-value jobs

## Design Decisions

- **Stripe Connect Standard:** Pros manage their own Stripe dashboard. Lower support burden.
- **Quote-linked payments:** Every payment traces back to an accepted quote. No orphaned payments.
- **Platform fee on release, not capture:** Fee calculated at payout time for flexibility.
- **No card storage:** Stripe Elements handles all PCI compliance. We store only Stripe IDs.

## Failure Modes / Risks

- **Stripe webhook failures:** Must be idempotent. Use `stripe_payment_intent_id` as dedup key.
- **Pro without Stripe account:** Block payout, not job acceptance. Pro can onboard to Stripe later.
- **Currency mismatch:** Platform is EUR-only for now. Must validate before payment creation.
- **Partial refunds:** Need clear policy — who bears the platform fee on refund?

## Security Considerations

- RLS on `payments` and `pro_payouts` — client sees own payments, pro sees own payouts, admin sees all
- Stripe webhook verification via signature validation in edge function
- No raw card data ever touches our database
- Amount validation: payment amount must match accepted quote total

## Future Considerations

- Multi-currency support (GBP for UK expansion)
- Subscription-based pricing for recurring services
- Tipping / bonus payments post-completion
- Invoice generation (PDF) from quote + payment data
- Tax reporting exports for pros

## Related Files

- `docs/architecture/data-flows.md` — Quote flow diagram
- `src/domain/rollout.ts` — `protection-beta` phase
- `docs/ARCHITECTURE_PACK.md` — "PLANNED Systems" section
