

# Onboarding Health Monitor — Admin Tile + RPC

## What

Add an "Onboarding Health" section to the Operator Cockpit that shows real-time counts for the key recovery metrics you outlined, so you can monitor without running manual queries.

## Layout

A new section between "Needs Attention" and "Latest Jobs" with 5 stat tiles in a grid:

```text
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Stuck by     │ No Zones     │ No Phone     │ 0 Offered    │ Completed    │
│ Phase        │              │              │ Services     │ Last 24h     │
│              │              │              │              │              │
│   20         │   12         │   8          │   15         │   3          │
│ not_started: │ service_setup│ can't go     │ can't go     │ ✓ recent     │
│ 14, basic: 2 │ + null zones │ live         │ live         │ completions  │
│ svc_setup: 4 │              │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

## Changes

### 1. New RPC: `admin_onboarding_health`

A `SECURITY DEFINER` function (admin-only via `has_role` check) that returns a single row:

```sql
- stuck_not_started: count where onboarding_phase = 'not_started'
- stuck_basic_info: count where onboarding_phase = 'basic_info'  
- stuck_service_setup: count where onboarding_phase = 'service_setup'
- no_zones: count where onboarding_phase = 'service_setup' AND service_zones IS NULL
- no_phone: count of pros not at 'complete' who have no phone in profiles
- zero_offered_services: count of pros not at 'complete' with 0 offered services
- completed_24h: count where onboarding_phase = 'complete' AND updated_at > now() - interval '24 hours'
```

Single query joining