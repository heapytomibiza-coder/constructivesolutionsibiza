

# Final Onboarding Hardening: ServiceUnlockStep refresh() Guard

## Current State

All 4 onboarding steps have been audited. Here is the status:

| Step | refresh() guarded | trackEvent on error | Real error msg | Button alignment |
|------|-------------------|---------------------|----------------|-----------------|
| BasicInfoStep | Yes (line 107-111) | Yes (line 119) | Yes | OK (full-width) |
| ServiceAreaStep | Yes (line 80-85) | Yes (line 93-96) | Yes | OK (flex gap-4) |
| ServiceUnlockStep | **NO -- line 203** | Yes (line 206-209) | Yes | OK (flex gap-4) |
| ReviewStep | Yes (line 79-83) | Yes (line 91) | Yes | OK (flex gap-4) |

**ProfessionalOnboarding.tsx** step entry tracking: Done (lines 104, 110, 131-132, 137-138, 143-144).

## The One Remaining Bug

In `ServiceUnlockStep.tsx` lines 197-211, `await refresh()` (line 203) is inside the **same** try/catch as the Supabase update (line 198-201). If the DB write succeeds but `refresh()` throws:

1. The catch fires
2. `trackEvent('onboarding_step_failed')` logs a false positive
3. But `onComplete()` (line 213) still runs because it's outside the try/catch

This means the user advances correctly, but the analytics log a phantom failure. The fix is to separate `refresh()` into its own try/catch, matching the pattern used in all other steps.

## Change

**File:** `src/pages/onboarding/steps/ServiceUnlockStep.tsx`

Replace lines 196-211 (the phase advancement block inside `handleContinue`):

```typescript
// Current (broken):
if (newPhase !== currentPhase) {
  try {
    await supabase
      .from('professional_profiles')
      .update({ onboarding_phase: newPhase })
      .eq('user_id', user.id);
    await refresh();  // <-- if this throws, catch logs false failure
  } catch (err) {
    console.error('Error advancing phase:', err);
    const msg = err instanceof Error ? err.message : String(err);
    trackEvent('onboarding_step_failed', 'professional', {
      step: 'service_unlock',
      error_message: msg,
    });
  }
}
```

With:

```typescript
// Fixed (separated):
if (newPhase !== currentPhase) {
  try {
    const { error } = await supabase
      .from('professional_profiles')
      .update({ onboarding_phase: newPhase })
      .eq('user_id', user.id);
    if (error) throw error;
  } catch (err) {
    console.error('Error advancing phase:', err);
    const msg = err instanceof Error ? err.message : String(err);
    trackEvent('onboarding_step_failed', 'professional', {
      step: 'services',
      error_message: msg,
    });
  }

  try {
    await refresh();
  } catch (e) {
    console.warn('Session refresh failed after services save:', e);
  }
}
```

Key improvements:
- `refresh()` gets its own try/catch (no false failure tracking)
- Supabase response is checked with `if (error) throw error` (surfaces real DB errors)
- Step name changed from `'service_unlock'` to `'services'` to match the canonical step ID used in ProfessionalOnboarding.tsx

## Verification Checklist (Post-Merge)

After this change, all 4 steps will follow the identical pattern:

1. mutationFn / DB call throws only on real DB error
2. refresh() is in its own try/catch -- never blocks user progression
3. onError / catch shows the real error message via toast
4. trackEvent fires with step name + error_message on real failures only
5. Buttons use consistent flex gap-4, h-12, outline variant for "Go Back"

## What This Does NOT Change

- No database or RLS changes
- No changes to phaseProgression.ts (logic confirmed correct)
- No changes to BasicInfoStep, ServiceAreaStep, or ReviewStep (already hardened)
- No changes to ProfessionalOnboarding.tsx (step entry tracking already in place)
