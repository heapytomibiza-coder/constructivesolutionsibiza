
# Dispatch Mode Implementation: Direct vs Broadcast

## Overview

Add a **dispatch mode** choice to the job wizard that determines where the job spec is sent after the same 7-step flow completes:

- **Direct Mode** (`direct`): Send to a specific professional → creates private conversation, job NOT publicly listed
- **Broadcast Mode** (`broadcast`): Send to the collective → job publicly listed on marketplace

The wizard itself remains unchanged. The only difference is what happens at submission.

---

## Architecture Diagram

```text
┌──────────────────────────────────────────────────────────────────┐
│                     SAME 7-STEP WIZARD                           │
│  [Category] → [Subcategory] → [Micro] → [Questions]              │
│           → [Logistics] → [Extras] → [Review]                    │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   DISPATCH CHOICE   │
                    │ (on Review step)    │
                    └─────────┬───────────┘
                              │
           ┌──────────────────┴──────────────────┐
           │                                     │
           ▼                                     ▼
    ┌─────────────────┐               ┌─────────────────┐
    │  DIRECT MODE    │               │  BROADCAST MODE │
    │  ─────────────  │               │  ────────────── │
    │  targetProId    │               │  No target      │
    │  is_publicly_   │               │  is_publicly_   │
    │  listed: false  │               │  listed: true   │
    │                 │               │                 │
    │  Creates:       │               │  Creates:       │
    │  - Job (hidden) │               │  - Job (public) │
    │  - Conversation │               │                 │
    │  - Initial msg  │               │  Pros respond   │
    └─────────────────┘               └─────────────────┘
```

---

## Implementation Details

### 1. Extend WizardState Type

**File: `src/components/wizard/canonical/types.ts`**

Add dispatch mode and target professional fields:

```typescript
export interface WizardState {
  // ... existing fields ...

  // === DISPATCH MODE (set outside the form, determines submission outcome) ===
  dispatchMode: 'direct' | 'broadcast';
  targetProfessionalId?: string;
  targetProfessionalName?: string; // For display in Review
}
```

Update `EMPTY_WIZARD_STATE`:
```typescript
export const EMPTY_WIZARD_STATE: WizardState = {
  // ... existing fields ...
  dispatchMode: 'broadcast', // Default: send to marketplace
  targetProfessionalId: undefined,
  targetProfessionalName: undefined,
};
```

---

### 2. Add Deep-Link Support for Direct Mode

**File: `src/components/wizard/canonical/CanonicalJobWizard.tsx`**

Parse `?pro=<uuid>` parameter to enable direct mode:

```typescript
// In pendingDeepLinkRef
pendingDeepLinkRef.current = { 
  categoryId, 
  subcategoryId,
  targetProfessionalId: sp.get('pro') || undefined 
};

// In applyDeepLink
if (targetProfessionalId) {
  // Fetch professional name for display
  const { data: pro } = await supabase
    .from('professional_profiles')
    .select('display_name')
    .eq('user_id', targetProfessionalId)
    .single();
  
  setWizardState(prev => ({
    ...prev,
    dispatchMode: 'direct',
    targetProfessionalId,
    targetProfessionalName: pro?.display_name || 'Professional',
  }));
}
```

---

### 3. Add Dispatch Mode Toggle to Review Step

**File: `src/components/wizard/canonical/steps/ReviewStep.tsx`**

Add a section above the submit button that shows dispatch intent:

```typescript
interface ReviewStepProps {
  wizardState: WizardState;
  onEdit: (step: WizardStep) => void;
  onDispatchModeChange: (mode: 'direct' | 'broadcast') => void; // NEW
  isAuthenticated: boolean;
}

// In component:
{/* Dispatch Mode Selection */}
<div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
  <span className="text-xs text-muted-foreground uppercase tracking-wide">
    How would you like to send this job?
  </span>
  
  <RadioGroup 
    value={wizardState.dispatchMode} 
    onValueChange={onDispatchModeChange}
    className="space-y-3"
  >
    <label className="flex items-start gap-3 cursor-pointer">
      <RadioGroupItem value="broadcast" />
      <div>
        <p className="font-medium">Send to available professionals</p>
        <p className="text-sm text-muted-foreground">
          Your job will be visible to matching professionals who can respond
        </p>
      </div>
    </label>
    
    <label className="flex items-start gap-3 cursor-pointer">
      <RadioGroupItem value="direct" />
      <div>
        <p className="font-medium">Send to a specific professional</p>
        <p className="text-sm text-muted-foreground">
          Start a private conversation - no public listing
        </p>
      </div>
    </label>
  </RadioGroup>
  
  {/* Show selected professional if in direct mode */}
  {wizardState.dispatchMode === 'direct' && (
    <div className="mt-3 pt-3 border-t border-border">
      {wizardState.targetProfessionalId ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{wizardState.targetProfessionalName}</p>
            <p className="text-xs text-muted-foreground">Selected professional</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/professionals">Change</Link>
          </Button>
        </div>
      ) : (
        <Button variant="outline" asChild className="w-full">
          <Link to="/professionals?select=true">Choose a Professional</Link>
        </Button>
      )}
    </div>
  )}
</div>
```

---

### 4. Update Submission Logic

**File: `src/components/wizard/canonical/CanonicalJobWizard.tsx`**

Modify `handleSubmit` to branch based on dispatch mode:

```typescript
const handleSubmit = useCallback(async () => {
  // ... existing auth/validation ...

  setIsSubmitting(true);

  try {
    const payload = buildJobInsert(user.id, wizardState);
    
    // Set public visibility based on dispatch mode
    if (wizardState.dispatchMode === 'direct') {
      payload.is_publicly_listed = false;
      payload.assigned_professional_id = wizardState.targetProfessionalId;
    }
    
    // Create the job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert([payload])
      .select('id')
      .single();

    if (error) throw error;

    // For direct mode: also create conversation
    if (wizardState.dispatchMode === 'direct' && wizardState.targetProfessionalId) {
      // Create conversation using existing RPC
      const { data: convoId, error: convoError } = await supabase.rpc(
        'create_direct_conversation',
        {
          p_job_id: job.id,
          p_client_id: user.id,
          p_pro_id: wizardState.targetProfessionalId,
        }
      );

      if (convoError) {
        console.error('Failed to create conversation:', convoError);
        // Job still created, just navigate to dashboard
        toast.warning('Job saved but could not start conversation');
        navigate('/dashboard');
        return;
      }

      // Success - navigate to conversation
      clearDraft();
      resetSession();
      toast.success('Job sent to professional!');
      navigate(`/messages/${convoId}`);
      return;
    }

    // Broadcast mode: standard flow
    clearDraft();
    resetSession();
    queryClient.invalidateQueries({ queryKey: ['jobs_board'] });
    toast.success('Job posted to marketplace!');
    navigate(`/jobs?highlight=${job.id}`);
    
  } catch (error) {
    console.error('Submit error:', error);
    toast.error('Failed to post job. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
}, [wizardState, user, ...]);
```

---

### 5. Create Database RPC for Direct Conversations

**New Migration**

Create a new RPC that allows clients to create conversations (current RPC is pro-initiated):

```sql
CREATE OR REPLACE FUNCTION create_direct_conversation(
  p_job_id UUID,
  p_client_id UUID,
  p_pro_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_job_owner UUID;
BEGIN
  -- Verify client owns the job
  SELECT user_id INTO v_job_owner
  FROM jobs
  WHERE id = p_job_id;
  
  IF v_job_owner IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  
  IF v_job_owner != p_client_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check for existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE job_id = p_job_id 
    AND client_id = p_client_id 
    AND pro_id = p_pro_id;
  
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;
  
  -- Create new conversation
  INSERT INTO conversations (job_id, client_id, pro_id)
  VALUES (p_job_id, p_client_id, p_pro_id)
  RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$;
```

---

### 6. Update Professional Details/Directory for Selection

**File: `src/pages/public/Professionals.tsx`**

Add selection mode when `?select=true`:

```typescript
const selectMode = params.get('select') === 'true';

// In the pro card:
{selectMode ? (
  <Button 
    onClick={() => {
      // Store selection and go back to wizard
      navigate(`/post?pro=${pro.user_id}`);
    }}
  >
    Select
  </Button>
) : (
  <Link to={`/professionals/${pro.id}`}>View</Link>
)}
```

---

## Entry Points Summary

| Entry | URL | Dispatch Mode | Target |
|-------|-----|---------------|--------|
| Post Job (Services) | `/post?category=...` | `broadcast` | None |
| Post Job (Direct) | `/post?category=...&pro=<uuid>` | `direct` | Pre-set |
| Post Job (Blank) | `/post` | `broadcast` | None |
| Choose Pro (Wizard) | `/professionals?select=true` | (returns to wizard) | User chooses |

---

## User Experience Flow

### Broadcast Path (Default)
1. User goes to `/services/hvac` → clicks "Post Job"
2. Completes wizard
3. Review step shows: "Send to available professionals" (default selected)
4. Submits → Job appears on marketplace
5. Pros can respond

### Direct Path (From Professional)
1. User browses `/professionals` → finds Maria
2. Clicks "Start Job" on Maria's profile
3. URL becomes `/post?pro=maria-uuid`
4. Completes same wizard
5. Review step shows: "Send to a specific professional" (pre-selected), Maria shown
6. Submits → Private job created, conversation opened
7. Maria sees it in her messages

### Direct Path (Choose During Review)
1. User starts wizard normally
2. On Review step, switches to "Send to a specific professional"
3. Clicks "Choose a Professional"
4. Selects from directory → returns to wizard
5. Submits → Private job + conversation

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/wizard/canonical/types.ts` | Add `dispatchMode`, `targetProfessionalId`, `targetProfessionalName` |
| `src/components/wizard/canonical/CanonicalJobWizard.tsx` | Parse `?pro=` param, update submit logic |
| `src/components/wizard/canonical/steps/ReviewStep.tsx` | Add dispatch mode selection UI |
| `src/pages/public/Professionals.tsx` | Add selection mode for `?select=true` |
| `src/pages/public/ProfessionalDetails.tsx` | Add "Start Job" CTA linking to `/post?pro=<id>` |
| **New Migration** | `create_direct_conversation` RPC |

---

## Key Design Decisions

1. **Same wizard, always**: No branching inside the 7 steps
2. **Mode set outside form**: Via URL param (`?pro=`) or Review step toggle
3. **Default is broadcast**: Simpler UX for most users
4. **Direct = hidden + conversation**: Job exists but isn't public
5. **Clear copy**: "Send to available" vs "Send to specific" - no jargon
