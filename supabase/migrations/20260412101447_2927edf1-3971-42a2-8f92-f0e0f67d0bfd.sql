-- Phase 1: Add AI content generation columns to jobs table
ALTER TABLE public.jobs ADD COLUMN ai_generated_title boolean DEFAULT null;
ALTER TABLE public.jobs ADD COLUMN worker_brief text DEFAULT null;