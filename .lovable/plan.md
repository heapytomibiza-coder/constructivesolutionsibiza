

# Connect Support Request → Dispute Escalation Funnel

## What This Does

When a user selects the "Dispute" issue type in the Support Request dialog (inside messaging), and also after any support request is created, give them a clear path to escalate to the formal dispute system. This creates the conflict funnel: **Conversation → Support → Formal Dispute**.

## Changes

### 1. Add "Escalate to Formal Dispute" button in SupportRequestDialog
**File**: `src/pages/messages/components/SupportRequestDialog.tsx`

When user selects `dispute` issue type, show an info banner below the form:
- Text: "If this is a serious issue, you can start a formal, structured dispute instead."
- Button: "Start Formal Dispute" → navigates to `/disputes/raise?job=${jobId}`
- Only visible when `jobId` is available and issue type is `dispute`

### 2. Add escalation option after support request is created
**File**: `src/pages/messages/components/RequestSupportButton.tsx`

When `hasOpenRequest` is true, change the disabled "Support Requested" button to show a small link underneath:
- Text: "Not resolved? Escalate to formal dispute"
- Links to `/disputes/raise?job=${jobId}`
- Only visible when `jobId` exists

### 3. Add micro-copy to "Raise Issue" buttons
**Files**: `ClientJobCard.tsx`, `JobTicketDetail.tsx`, `JobDetailsModal.tsx`

Add a small helper text beneath or as tooltip on the "Raise Issue" button:
- "Having an issue with this job? Start a structured resolution."

## Files Changed

| File | Change |
|---|---|
| `src/pages/messages/components/SupportRequestDialog.tsx` | Add dispute escalation banner when issue type is `dispute` |
| `src/pages/messages/components/RequestSupportButton.tsx` | Add escalation link when support already requested |
| `src/pages/dashboard/client/components/ClientJobCard.tsx` | Add micro-copy tooltip |
| `src/pages/dashboard/client/JobTicketDetail.tsx` | Add micro-copy tooltip |
| `src/pages/jobs/JobDetailsModal.tsx` | Add micro-copy tooltip |

