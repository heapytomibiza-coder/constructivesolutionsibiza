
# V1 Pro Ready Gate: Minimal Marketplace Protection

## Summary
Add a single `proReady` gate to the messaging action to protect the marketplace flow. This is the minimum viable implementation that:
- Prevents incomplete professionals from messaging clients
- Provides clear feedback via UI and action-level guards
- Leaves the database RPC unchanged (V2 work)
- Does not require new modules or major restructuring

---

## Changes Overview

```text
+-----------------------------------+-------------------------------------------+
| File                              | Change                                    |
+-----------------------------------+-------------------------------------------+
| src/guard/proReadiness.ts         | NEW - Centralized proReady check          |
| src/pages/jobs/actions/index.ts   | Add requireProReady guard                 |
| src/pages/jobs/actions/           | Add guard before RPC call                 |
|   messageJob.action.ts            |                                           |
| src/pages/jobs/JobDetailsModal.tsx| Disable Message button when !isProReady   |
+-----------------------------------+-------------------------------------------+
```

---

## Implementation Details

### 1. Create Centralized Pro Readiness Check

**New file: `src/guard/proReadiness.ts`**

A pure function that evaluates professional readiness and returns both a boolean and reason codes. This ensures the same logic is used by both UI and action layers.

```typescript
import type { ProfessionalProfileData } from '@/hooks/useSessionSnapshot';

export interface ProReadinessResult {
  isReady: boolean;
  reasons: ProReadinessReason[];
}

export type ProReadinessReason = 
  | 'NO_PROFILE'
  | 'NOT_VERIFIED'
  | 'ONBOARDING_INCOMPLETE'
  | 'NO_SERVICES';

export function getProReadiness(
  profile: ProfessionalProfileData | null
): ProReadinessResult {
  const reasons: ProReadinessReason[] = [];

  if (!profile) {
    return { isReady: false, reasons: ['NO_PROFILE'] };
  }

  if (profile.verificationStatus !== 'verified') {
    reasons.push('NOT_VERIFIED');
  }

  const validPhases = ['service_setup', 'complete'];
  if (!validPhases.includes(profile.onboardingPhase)) {
    reasons.push('ONBOARDING_INCOMPLETE');
  }

  if (profile.servicesCount === 0) {
    reasons.push('NO_SERVICES');
  }

  return {
    isReady: reasons.length === 0,
    reasons,
  };
}
```

This centralizes the logic currently duplicated in `useSessionSnapshot.ts` (lines 210-214).

---

### 2. Add Action-Level Guard

**File: `src/pages/jobs/actions/messageJob.action.ts`**

Add a pre-flight check before calling the RPC. This prevents the action from even attempting the database call if the professional isn't ready.

```typescript
import { supabase } from "@/integrations/supabase/client";
import { UserError } from "@/shared/lib/userError";
import { getProReadiness } from "@/guard/proReadiness";
import type { ProfessionalProfileData } from "@/hooks/useSessionSnapshot";

/**
 * Verify professional is ready before allowing marketplace actions.
 * Throws UserError with code PRO_NOT_READY if requirements not met.
 */
export function requireProReady(
  profile: ProfessionalProfileData | null
): void {
  const { isReady, reasons } = getProReadiness(profile);
  
  if (!isReady) {
    const message = reasons.includes('NO_SERVICES')
      ? "Complete your service setup to message clients"
      : reasons.includes('NOT_VERIFIED')
      ? "Complete verification to message clients"
      : "Complete your professional setup to message clients";
      
    throw new UserError(message, "PRO_NOT_READY");
  }
}

/**
 * Start or get existing conversation between a professional and a job.
 * Now accepts optional profile for pre-flight proReady check.
 */
export async function startConversation(
  jobId: string,
  proId: string,
  profile?: ProfessionalProfileData | null
): Promise<string> {
  // Pre-flight guard: check proReady before hitting DB
  if (profile !== undefined) {
    requireProReady(profile);
  }

  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    p_job_id: jobId,
    p_pro_id: proId,
  });

  // ... existing error handling unchanged
}
```

The profile parameter is optional for backward compatibility, but the UI will always pass it.

---

### 3. Update UI to Gate Message Button

**File: `src/pages/jobs/JobDetailsModal.tsx`**

Update `JobDetailsActions` to:
1. Check `isProReady` from session context
2. Disable button and show tooltip when not ready
3. Pass profile to the action for server-side validation

```typescript
function JobDetailsActions({ jobPack, onClose }: JobDetailsActionsProps) {
  const navigate = useNavigate();
  const { 
    user, 
    isLoading: sessionLoading,
    hasRole,
    isProReady,
    professionalProfile 
  } = useSession();
  const [isMessaging, setIsMessaging] = useState(false);

  // Determine if this user should see the pro gate
  const isPro = hasRole('professional');
  const canMessage = !isPro || isProReady;

  const handleMessage = async () => {
    if (!user) {
      onClose();
      navigate(`/auth?returnTo=/jobs`);
      return;
    }

    setIsMessaging(true);
    try {
      // Pass profile for action-level validation
      const convId = await startConversation(
        jobPack.id, 
        user.id,
        professionalProfile
      );
      onClose();
      navigate(`/messages/${convId}`);
    } catch (err) {
      if (isUserError(err)) {
        if (err.code === 'PRO_NOT_READY') {
          toast.error(err.message, {
            action: {
              label: 'Complete Setup',
              onClick: () => {
                onClose();
                navigate('/dashboard/pro');
              },
            },
          });
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Failed to start conversation");
        console.error("Message error:", err);
      }
    } finally {
      setIsMessaging(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {!user ? (
        <Button onClick={handleMessage} className="gap-2">
          <LogIn className="h-4 w-4" />
          Sign in to message
        </Button>
      ) : jobPack.isOwner ? null : (
        <div className="relative">
          <Button 
            onClick={handleMessage} 
            disabled={isMessaging || sessionLoading || !canMessage}
            className="gap-2"
            title={!canMessage ? "Complete your setup to message clients" : undefined}
          >
            {isMessaging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            {isMessaging ? "Starting chat..." : "Message"}
          </Button>
          {!canMessage && (
            <div className="mt-1 text-xs text-muted-foreground">
              Complete setup to message
            </div>
          )}
        </div>
      )}
      <Button variant="outline" disabled className="gap-2">
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
```

---

### 4. Update Guard Barrel Export

**File: `src/guard/index.ts`**

Add export for the new proReadiness module:

```typescript
export * from './access';
export * from './redirects';
export * from './RouteGuard';
export * from './proReadiness';
```

---

## Technical Notes

### Why Not Gate in the Database RPC?

The database function `get_or_create_conversation` is the true security boundary, but modifying it requires:
- Understanding the current SQL implementation
- Testing RPC error propagation
- Potential migration work

For V1, the action-level guard is sufficient because:
- The UI is the only surface calling this action
- The action throws before the RPC is called
- The error code allows proper UX handling

**V2**: Add the check inside the RPC for bulletproof enforcement.

### Backward Compatibility

The `profile` parameter in `startConversation` is optional. Existing callers (if any) continue to work, but without the pre-flight check.

### Error Handling Flow

```text
User clicks Message
        |
        v
+------------------+
| UI: canMessage?  |--No--> Button disabled + hint text
+------------------+
        |
       Yes
        v
+------------------+
| Action: profile  |--Not Ready--> Toast + "Complete Setup" action
| proReady check   |
+------------------+
        |
       Ready
        v
+------------------+
| RPC: database    |--Error--> Toast with error message
| validation       |
+------------------+
        |
      Success
        v
  Navigate to /messages/:id
```

---

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/guard/proReadiness.ts` | New | Centralized readiness check with reason codes |
| `src/guard/index.ts` | Edit | Add proReadiness export |
| `src/pages/jobs/actions/messageJob.action.ts` | Edit | Add requireProReady guard |
| `src/pages/jobs/JobDetailsModal.tsx` | Edit | Disable button + pass profile to action |

---

## Testing Checklist

| Scenario | Expected |
|----------|----------|
| Client user viewing job | Message button enabled, no gate |
| Pro ready user viewing job | Message button enabled |
| Pro not ready (no services) | Button disabled + "Complete setup" hint |
| Pro not ready clicks (bypass) | Toast with error + link to dashboard |
| Pro not ready (not verified) | Button disabled + appropriate message |
| Pro clicks own job | Button hidden (existing behavior) |

