-- ==============================================================
-- PROFESSIONAL MATCHING & VERIFICATION SYSTEM
-- Micro-level preferences, stats, and auto-verification
-- ==============================================================

-- 1. Professional Micro Preferences
-- Tracks what pros love/like/avoid per micro-category
CREATE TABLE public.professional_micro_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  micro_id UUID NOT NULL REFERENCES public.service_micro_categories(id) ON DELETE CASCADE,
  preference TEXT NOT NULL DEFAULT 'neutral' CHECK (preference IN ('love', 'like', 'neutral', 'avoid')),
  max_distance_km INTEGER,
  min_budget_eur INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, micro_id)
);

-- Enable RLS
ALTER TABLE public.professional_micro_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users manage own preferences"
ON public.professional_micro_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_professional_micro_preferences_updated_at
BEFORE UPDATE ON public.professional_micro_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 2. Professional Micro Stats
-- Tracks earned verification at micro level
CREATE TABLE public.professional_micro_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  micro_id UUID NOT NULL REFERENCES public.service_micro_categories(id) ON DELETE CASCADE,
  
  -- Job counts
  completed_jobs_count INTEGER NOT NULL DEFAULT 0,
  accepted_jobs_count INTEGER NOT NULL DEFAULT 0,
  declined_jobs_count INTEGER NOT NULL DEFAULT 0,
  
  -- Quality metrics
  total_rating_sum NUMERIC NOT NULL DEFAULT 0, -- Sum for averaging
  rating_count INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC GENERATED ALWAYS AS (
    CASE WHEN rating_count > 0 THEN total_rating_sum / rating_count ELSE NULL END
  ) STORED,
  
  -- Response metrics
  avg_response_minutes INTEGER,
  
  -- Verification (auto-calculated)
  verification_level TEXT NOT NULL DEFAULT 'unverified' CHECK (
    verification_level IN ('unverified', 'progressing', 'verified', 'expert')
  ),
  
  -- Timestamps
  last_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, micro_id)
);

-- Enable RLS
ALTER TABLE public.professional_micro_stats ENABLE ROW LEVEL SECURITY;

-- Users can read their own stats
CREATE POLICY "Users read own stats"
ON public.professional_micro_stats
FOR SELECT
USING (auth.uid() = user_id);

-- System updates stats (via triggers/functions), users can't directly modify
-- No INSERT/UPDATE/DELETE policy for users - only through system functions

-- Trigger for updated_at
CREATE TRIGGER update_professional_micro_stats_updated_at
BEFORE UPDATE ON public.professional_micro_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 3. Function to increment stats on job completion
CREATE OR REPLACE FUNCTION public.increment_professional_micro_stats(
  p_user_id UUID,
  p_micro_id UUID,
  p_rating INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_completed INTEGER;
  v_avg_rating NUMERIC;
  v_new_level TEXT;
BEGIN
  -- Upsert the stats record
  INSERT INTO public.professional_micro_stats (user_id, micro_id, completed_jobs_count, total_rating_sum, rating_count, last_completed_at)
  VALUES (
    p_user_id, 
    p_micro_id, 
    1, 
    COALESCE(p_rating, 0), 
    CASE WHEN p_rating IS NOT NULL THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (user_id, micro_id) DO UPDATE SET
    completed_jobs_count = professional_micro_stats.completed_jobs_count + 1,
    total_rating_sum = professional_micro_stats.total_rating_sum + COALESCE(p_rating, 0),
    rating_count = professional_micro_stats.rating_count + CASE WHEN p_rating IS NOT NULL THEN 1 ELSE 0 END,
    last_completed_at = now(),
    updated_at = now();
  
  -- Get updated values for verification check
  SELECT completed_jobs_count, avg_rating INTO v_completed, v_avg_rating
  FROM public.professional_micro_stats
  WHERE user_id = p_user_id AND micro_id = p_micro_id;
  
  -- Auto-verification thresholds
  -- unverified → progressing: 1 completed job
  -- progressing → verified: 3 completed + 4.0+ rating
  -- verified → expert: 10 completed + 4.5+ rating
  IF v_completed >= 10 AND v_avg_rating >= 4.5 THEN
    v_new_level := 'expert';
  ELSIF v_completed >= 3 AND v_avg_rating >= 4.0 THEN
    v_new_level := 'verified';
  ELSIF v_completed >= 1 THEN
    v_new_level := 'progressing';
  ELSE
    v_new_level := 'unverified';
  END IF;
  
  UPDATE public.professional_micro_stats
  SET verification_level = v_new_level
  WHERE user_id = p_user_id AND micro_id = p_micro_id;
END;
$$;


-- 4. Add status column to professional_services if not exists
-- This allows: offered | quote_only | paused
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professional_services' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.professional_services 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'offered' 
    CHECK (status IN ('offered', 'quote_only', 'paused'));
  END IF;
END $$;


-- 5. Index for matching queries
CREATE INDEX IF NOT EXISTS idx_professional_micro_preferences_user_micro 
ON public.professional_micro_preferences(user_id, micro_id);

CREATE INDEX IF NOT EXISTS idx_professional_micro_stats_user_micro 
ON public.professional_micro_stats(user_id, micro_id);

CREATE INDEX IF NOT EXISTS idx_professional_micro_stats_verification 
ON public.professional_micro_stats(micro_id, verification_level);


-- 6. View for matching with scoring
CREATE OR REPLACE VIEW public.professional_matching_scores AS
SELECT 
  ps.user_id,
  ps.micro_id,
  ps.status,
  ps.notify,
  ps.searchable,
  COALESCE(pmp.preference, 'neutral') AS preference,
  COALESCE(pms.completed_jobs_count, 0) AS completed_jobs_count,
  pms.avg_rating,
  COALESCE(pms.verification_level, 'unverified') AS verification_level,
  -- Scoring formula (higher = better match)
  (
    CASE pmp.preference 
      WHEN 'love' THEN 30
      WHEN 'like' THEN 20
      WHEN 'neutral' THEN 10
      WHEN 'avoid' THEN -50
      ELSE 10
    END
    + COALESCE(pms.completed_jobs_count, 0) * 2
    + COALESCE(pms.avg_rating, 0) * 5
    + CASE pms.verification_level
        WHEN 'expert' THEN 50
        WHEN 'verified' THEN 30
        WHEN 'progressing' THEN 10
        ELSE 0
      END
  ) AS match_score
FROM public.professional_services ps
LEFT JOIN public.professional_micro_preferences pmp 
  ON ps.user_id = pmp.user_id AND ps.micro_id = pmp.micro_id
LEFT JOIN public.professional_micro_stats pms 
  ON ps.user_id = pms.user_id AND ps.micro_id = pms.micro_id
WHERE ps.searchable = true;