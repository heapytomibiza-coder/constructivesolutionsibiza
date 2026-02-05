

# Signup Flow Improvement: Asker vs Tasker Intent + Phone Number

## Overview

Redesign the signup flow to ask users upfront whether they're an **Asker** (need help) or **Tasker** (offer services), explain the roles clearly, and collect phone numbers for faster communication.

---

## Current State

The signup currently:
1. Shows email/password form first
2. Shows intent selector only *after* clicking "Continue"
3. Uses technical terms ("client", "professional")
4. Has no phone number field

---

## Proposed User Flow

```text
+---------------------------------------------+
|              Welcome to CS Ibiza            |
+---------------------------------------------+
|                                             |
|   Are you asking or tasking?                |
|   ----------------------------------------- |
|                                             |
|   [Asker Card]                              |
|   "I need help with a project"              |
|   Post jobs, get quotes, hire pros          |
|                                             |
|   [Tasker Card]                             |
|   "I offer my services"                     |
|   Find work, apply for jobs, grow business  |
|                                             |
|   [Both Card]                               |
|   "Both - I hire and offer services"        |
|                                             |
+---------------------------------------------+

      ↓ Select an option ↓

+---------------------------------------------+
|         Create your account                 |
|   (You selected: Asker / Tasker / Both)     |
+---------------------------------------------+
|                                             |
|   [Email field]                             |
|   [Phone field]    ← NEW                    |
|   [Password field]                          |
|                                             |
|   [Create Account]                          |
|                                             |
+---------------------------------------------+
```

---

## Implementation Details

### 1. Flip the Flow Order

**File: `src/pages/auth/Auth.tsx`**

Change from:
- Email/password first → intent selector on continue

Change to:
- Intent selector first → then email/password/phone form

Logic:
- Default state: `showIntentSelector = true` (start with intent)
- After intent selected → show credentials form
- Button shows "Back" to return to intent, "Create Account" to submit

---

### 2. Update IntentSelector with Asker/Tasker Terminology

**File: `src/components/auth/IntentSelector.tsx`**

Update the options array:

| Value | Title | Description |
|-------|-------|-------------|
| `client` | **I'm an Asker** | I need help with a project - post jobs, get quotes, hire professionals |
| `professional` | **I'm a Tasker** | I offer my services - find work, apply for jobs, grow my business |
| `both` | **Both** | I hire professionals AND offer my own services |

Update heading to: **"Are you asking or tasking?"**

Add clearer subtext explaining each role for first-time users.

---

### 3. Add Phone Number Field

**Database Change Required**

Option A (Recommended): Create a new `profiles` table for user contact info:

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone text,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: Users can only read/update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

Option B: Store phone in `professional_profiles.metadata` (already exists) - but this only works for professionals.

**Recommendation**: Use Option A since both Askers and Taskers need phone numbers.

**UI Change in `Auth.tsx`**:
- Add phone input field between email and password
- Store as user metadata initially, then write to profiles table via trigger
- Show format hint: "+34 XXX XXX XXX"

---

### 4. Update Database Trigger

**File: Database function `handle_new_user`**

Update the trigger to:
1. Continue creating `user_roles` based on intent
2. Create a `profiles` row with the phone number from signup metadata
3. Create `professional_profiles` stub for Taskers (existing behavior)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_intent TEXT;
  v_roles TEXT[];
  v_active_role TEXT;
  v_phone TEXT;
BEGIN
  v_intent := COALESCE(NEW.raw_user_meta_data->>'intent', 'client');
  v_phone := NEW.raw_user_meta_data->>'phone';
  
  -- Role logic (unchanged)
  IF v_intent = 'client' THEN
    v_roles := ARRAY['client']::TEXT[];
    v_active_role := 'client';
  ELSIF v_intent = 'professional' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'professional';
  ELSIF v_intent = 'both' THEN
    v_roles := ARRAY['client', 'professional']::TEXT[];
    v_active_role := 'client';
  ELSE
    v_roles := ARRAY['client']::TEXT[];
    v_active_role := 'client';
  END IF;
  
  -- Insert user roles
  INSERT INTO public.user_roles (user_id, roles, active_role)
  VALUES (NEW.id, v_roles, v_active_role);
  
  -- Insert profile with phone
  INSERT INTO public.profiles (user_id, phone)
  VALUES (NEW.id, v_phone);
  
  -- If professional intent, create professional_profiles stub
  IF v_intent IN ('professional', 'both') THEN
    INSERT INTO public.professional_profiles (user_id, onboarding_phase, verification_status)
    VALUES (NEW.id, 'not_started', 'unverified');
  END IF;
  
  RETURN NEW;
END;
$$;
```

---

## Technical Summary

| Task | File(s) | Type |
|------|---------|------|
| Flip flow order (intent first) | `Auth.tsx` | UI change |
| Update Asker/Tasker terminology | `IntentSelector.tsx` | UI change |
| Add phone input field | `Auth.tsx` | UI change |
| Create `profiles` table | Migration | DB change |
| Update `handle_new_user` trigger | Migration | DB change |

---

## Why This Matters

- **Clarity**: Users immediately understand what the platform offers based on their role
- **Phone numbers**: Critical for WhatsApp-first community - pros can contact clients directly
- **Terminology**: "Asker" and "Tasker" are memorable and self-explanatory for non-technical users

