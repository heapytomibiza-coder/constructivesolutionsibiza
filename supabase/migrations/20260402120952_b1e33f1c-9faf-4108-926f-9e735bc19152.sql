-- Add post-acceptance tracking fields to quote_line_items
ALTER TABLE public.quote_line_items
  ADD COLUMN is_addition boolean NOT NULL DEFAULT false,
  ADD COLUMN added_by uuid REFERENCES auth.users(id),
  ADD COLUMN client_acknowledged_at timestamptz;

-- Index for quickly finding unacknowledged additions
CREATE INDEX idx_quote_line_items_unacknowledged
  ON public.quote_line_items (quote_id)
  WHERE is_addition = true AND client_acknowledged_at IS NULL;