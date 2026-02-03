-- Add GIN index on flags for efficient filtering
CREATE INDEX IF NOT EXISTS jobs_flags_gin ON jobs USING GIN (flags);