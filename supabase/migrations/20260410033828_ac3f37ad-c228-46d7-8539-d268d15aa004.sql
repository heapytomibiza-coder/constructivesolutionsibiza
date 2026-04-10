-- ============================================================
-- FIX 1: Storage — scope dispute-evidence reads to parties/admins
-- ============================================================

-- Drop the overly permissive storage SELECT policy
DROP POLICY IF EXISTS "Users can view dispute evidence files" ON storage.objects;

-- Create a properly scoped storage SELECT policy
CREATE POLICY "Dispute parties can view evidence files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'dispute-evidence'
  AND (
    -- User is a party to the dispute that owns this evidence file
    EXISTS (
      SELECT 1
      FROM public.dispute_evidence de
      JOIN public.disputes d ON d.id = de.dispute_id
      WHERE de.file_path = name
        AND (d.raised_by = auth.uid() OR d.counterparty_id = auth.uid())
    )
    -- Or user is an admin
    OR (has_role(auth.uid(), 'admin'::text) AND is_admin_email())
  )
);

-- ============================================================
-- FIX 3: Remove weak duplicate INSERT policy on dispute_inputs
-- ============================================================

DROP POLICY IF EXISTS "Users can add dispute inputs" ON public.dispute_inputs;

-- Also remove duplicate SELECT policy (identical to "Dispute parties can view inputs")
DROP POLICY IF EXISTS "Users can view dispute inputs" ON public.dispute_inputs;

-- ============================================================
-- FIX 4: Remove weak duplicate INSERT policy on dispute_evidence
-- ============================================================

DROP POLICY IF EXISTS "Users can add dispute evidence" ON public.dispute_evidence;

-- Also remove duplicate SELECT policy (identical to "Dispute parties can view evidence")
DROP POLICY IF EXISTS "Users can view dispute evidence" ON public.dispute_evidence;