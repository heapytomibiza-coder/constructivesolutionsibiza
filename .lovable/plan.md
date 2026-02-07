
# Complete Professional Registration System - Gap Analysis & Implementation Plan

## Current State Summary

### What EXISTS and WORKS ✅

| Component | Status | Details |
|-----------|--------|---------|
| **Auth Foundation** | ✅ Complete | Users can sign up/in, intent-based role assignment works |
| **Role System** | ✅ Complete | `user_roles` table with client/professional separation |
| **Intent-to-Role Trigger** | ✅ Complete | `handle_new_user()` creates proper stubs based on intent |
| **Auth Callback Routing** | ✅ Just fixed | Now routes pros → `/onboarding/professional`, clients → `/dashboard/client` |
| **Service Selection** | ✅ Solid | Category → Subcategory → Micro selection with `professional_services` |
| **Preference System** | ✅ Working | Love/like/neutral/avoid stored in `professional_micro_preferences` |
| **Matching Foundation** | ✅ Working | `matched_jobs_for_professional` view links pros to relevant jobs |
| **Question Packs** | ~98% | Most micro services have question packs |
| **Stats Tables** | ✅ Exist | `professional_micro_stats` ready for verification ladder |

### What is MISSING or INCOMPLETE ❌

| Component | Status | Priority | Impact |
|-----------|--------|----------|--------|
| **Guided Onboarding Flow** | ❌ Fragmented | HIGH | Pros don't know what to do next |
| **Basic Info Step** | ❌ Missing | HIGH | No name/bio/phone collection |
| **Verification Step** | ❌ Missing | HIGH | No way to upload ID/certs |
| **Availability Setup** | ❌ Missing | MEDIUM | No working hours / on-call toggle |
| **Location/Radius** | ❌ Missing | HIGH | Can't filter jobs by service area |
| **Pricing Model** | ❌ Missing | MEDIUM | No hourly rate / day rate setup |
| **Professional Dashboard** | ⚠️ Basic | MEDIUM | Exists but missing profile completeness |
| **Status Lifecycle** | ❌ Missing | HIGH | No draft → pending → live workflow |
| **Admin Moderation** | ❌ Missing | LOW (V2) | No approval queue |

---

## The Professional Signup Journey (What Needs Building)

```text
CURRENT FLOW (broken):
┌─────────────┐     ┌─────────────────────────┐     ┌──────────────┐
│ Signup Form │ ──▶ │ /onboarding/professional │ ──▶ │ Service Setup│
│ (intent)    │     │ (progress tracker only) │     │ (works!)     │
└─────────────┘     └─────────────────────────┘     └──────────────┘
                              │
                              ▼
              No actual basic info, verification, or location steps!


PROPOSED FLOW (complete):
┌─────────────┐     ┌──────────────────────────────────────────────────────────┐
│ Signup Form │ ──▶ │              ONBOARDING WIZARD                            │
│ (intent)    │     ├──────────────────────────────────────────────────────────┤
└─────────────┘     │ Step 1: Basic Info        │ Name, phone, bio, photo      │
                    │ Step 2: Service Area      │ Location + radius/zones      │
                    │ Step 3: Job Types         │ Existing service setup       │
                    │ Step 4: Availability      │ Hours, on-call, lead time    │
                    │ Step 5: Pricing           │ Day rate, hourly, min fee    │
                    │ Step 6: Verification      │ ID upload, certs (optional)  │
                    │ Step 7: Review & Go Live  │ Preview + submit for review  │
                    └──────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │ Status: draft → pending_review → verified → live        │
                    │                                                         │
                    │ • draft: Still filling in details                       │
                    │ • pending_review: Submitted, awaiting moderation        │
                    │ • verified: Approved by admin/auto                      │
                    │ • live: Visible in marketplace, receives matches        │
                    └─────────────────────────────────────────────────────────┘
```

---

## Database Schema Additions Required

### 1. Extend `professional_profiles` table

```sql
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS
  -- Basic info (some may duplicate profiles table, unify later)
  business_name TEXT,
  tagline TEXT,  -- "Reliable electrician with 15 years experience"
  
  -- Location & Service Area
  service_area_type TEXT DEFAULT 'zones', -- 'zones' or 'radius'
  service_zones TEXT[], -- ['ibiza-town', 'san-antonio', 'santa-eulalia']
  service_radius_km INTEGER, -- If using radius instead of zones
  base_location JSONB, -- {lat, lng, address} for radius calculation
  
  -- Availability
  availability_status TEXT DEFAULT 'available', -- available, busy, on_vacation
  typical_lead_time TEXT DEFAULT 'same_week', -- same_day, same_week, one_week_plus
  accepts_emergency BOOLEAN DEFAULT false,
  working_hours JSONB, -- {mon: {start: '08:00', end: '18:00'}, ...}
  
  -- Pricing
  pricing_model TEXT DEFAULT 'quote_required', -- hourly, daily, fixed, quote_required
  hourly_rate_min DECIMAL(10,2),
  hourly_rate_max DECIMAL(10,2),
  day_rate DECIMAL(10,2),
  minimum_call_out DECIMAL(10,2),
  emergency_multiplier DECIMAL(3,2) DEFAULT 1.5,
  
  -- Status lifecycle
  profile_status TEXT DEFAULT 'draft', -- draft, pending_review, verified, live, suspended
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id);
```

### 2. Create `professional_documents` table (for verification)

```sql
CREATE TABLE professional_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL, -- 'id_front', 'id_back', 'certificate', 'insurance', 'license'
  file_path TEXT NOT NULL, -- Supabase storage path
  file_name TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## UI Components to Build

### Step 1: Basic Info Form
- Display name input
- Business name (optional)
- Tagline / elevator pitch
- Phone number (already captured at signup, but allow edit)
- Avatar upload (Supabase storage)
- Short bio textarea

### Step 2: Service Area Setup
- Toggle: "Zone-based" vs "Radius-based"
- Zone selector: Checkbox grid of Ibiza areas
- Radius: Map pin + slider (5km, 10km, 25km, 50km, Island-wide)
- Base location address input

### Step 3: Job Types (EXISTS - ProfessionalServiceSetup.tsx)
- Already built and working
- Just needs integration into the stepped flow

### Step 4: Availability Configuration
- Status dropdown: Available / Busy / On Vacation
- Lead time: Same day, Same week, 1 week+
- Emergency toggle: "I accept emergency call-outs"
- Working hours: Day pickers with time ranges

### Step 5: Pricing Setup
- Model selector: Hourly / Daily / Fixed price / Quote required
- Rate inputs based on selection
- Minimum call-out fee
- Emergency rate multiplier

### Step 6: Verification Documents
- ID Upload (front/back)
- Trade certificates (optional, multi-upload)
- Insurance document (optional)
- Progress indicator showing what's uploaded

### Step 7: Review & Submit
- Profile preview card (how clients will see you)
- Checklist of required fields
- "Submit for Review" button
- Terms acceptance checkbox

---

## Implementation Phases

### Phase 1: Database Foundation (1 session)
1. Extend `professional_profiles` with new columns
2. Create `professional_documents` table
3. Update RLS policies for both
4. Set up Supabase storage bucket for documents

### Phase 2: Stepped Onboarding UI (2-3 sessions)
1. Convert `/onboarding/professional` to multi-step wizard
2. Build Step 1: Basic Info form with validation
3. Build Step 2: Service Area selector with zone grid
4. Integrate existing service setup as Step 3
5. Build Step 4: Availability form
6. Build Step 5: Pricing form
7. Build Step 6: Document upload with preview
8. Build Step 7: Review page with submit action

### Phase 3: Status Lifecycle (1 session)
1. Add `profile_status` field progression logic
2. Update "go live" button to check requirements
3. Show profile status in dashboard
4. Block marketplace actions for non-live profiles

### Phase 4: Dashboard Enhancements (1 session)
1. Profile completeness percentage widget
2. Missing steps nudges
3. Document status indicators
4. Quick-edit actions for each section

---

## Immediate Action Items (What We Can Build Now)

### Minimum Viable Onboarding (MVP)

To get a working professional signup without building everything:

1. **Keep existing stepped progress tracker** in `/onboarding/professional`
2. **Wire the steps to actual pages**:
   - Step 1 "Basic Info" → New basic info form
   - Step 2 "Verification" → Placeholder with "Coming soon"
   - Step 3 "Services" → Existing `/professional/service-setup`
3. **Add location selector** to service setup (quick win)
4. **Update onboarding phases** to match new steps
5. **Enable "go live"** when: name + 1 service + 1 zone selected

This gets professionals through a real flow in 1-2 sessions.

---

## Decision Point

**Which approach do you want to take?**

| Option | Scope | Timeline | Outcome |
|--------|-------|----------|---------|
| **A. MVP Flow** | Wire existing pages, add basic info + location | 1-2 sessions | Working signup, can onboard real pros |
| **B. Full Wizard** | Complete 7-step wizard with all features | 4-5 sessions | Production-ready, trust-building flow |
| **C. Incremental** | Add one feature at a time over multiple days | Ongoing | Lower risk, slower progress |

My recommendation: **Start with Option A** to unblock professional signups, then iterate toward B.
