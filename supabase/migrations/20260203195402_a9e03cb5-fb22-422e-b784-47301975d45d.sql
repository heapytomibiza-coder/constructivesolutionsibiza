-- ============================================
-- FORUM MVP SCHEMA
-- ============================================

-- Forum categories table
CREATE TABLE public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Forum posts table
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  reply_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Forum replies table
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_forum_posts_category ON public.forum_posts(category_id);
CREATE INDEX idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX idx_forum_posts_created ON public.forum_posts(created_at DESC);
CREATE INDEX idx_forum_replies_post ON public.forum_replies(post_id);
CREATE INDEX idx_forum_replies_author ON public.forum_replies(author_id);

-- Enable RLS
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: forum_categories (public read)
-- ============================================
CREATE POLICY "Anyone can view active forum categories"
ON public.forum_categories FOR SELECT
USING (is_active = true);

-- ============================================
-- RLS POLICIES: forum_posts
-- ============================================
-- Public read
CREATE POLICY "Anyone can view forum posts"
ON public.forum_posts FOR SELECT
USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
ON public.forum_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Authors can update their own posts
CREATE POLICY "Authors can update their own posts"
ON public.forum_posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete their own posts"
ON public.forum_posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- ============================================
-- RLS POLICIES: forum_replies
-- ============================================
-- Public read
CREATE POLICY "Anyone can view forum replies"
ON public.forum_replies FOR SELECT
USING (true);

-- Authenticated users can create replies
CREATE POLICY "Authenticated users can create replies"
ON public.forum_replies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Authors can update their own replies
CREATE POLICY "Authors can update their own replies"
ON public.forum_replies FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own replies
CREATE POLICY "Authors can delete their own replies"
ON public.forum_replies FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- ============================================
-- TRIGGER: Auto-update reply_count on forum_posts
-- ============================================
CREATE OR REPLACE FUNCTION public.update_forum_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET reply_count = reply_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_reply_count
AFTER INSERT OR DELETE ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION public.update_forum_post_reply_count();

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at
BEFORE UPDATE ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEED: Initial forum categories
-- ============================================
INSERT INTO public.forum_categories (name, slug, description, icon, sort_order) VALUES
('Recommendations', 'recommendations', 'Share and request recommendations for tradespeople and services', '👍', 1),
('Where can I find...', 'where-can-i-find', 'Help finding specific materials, tools, or services in Ibiza', '🔍', 2),
('General Help', 'general-help', 'Questions and discussions about property and construction topics', '💬', 3),
('Warnings', 'warnings', 'Alert the community about issues, scams, or poor experiences', '⚠️', 4);