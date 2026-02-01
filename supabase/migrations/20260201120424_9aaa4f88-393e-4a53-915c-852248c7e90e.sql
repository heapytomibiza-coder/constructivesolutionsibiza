-- =====================================================
-- TAXONOMY TABLES FOR DB-POWERED CATEGORY SELECTION
-- Imported from prototype: service_categories, service_subcategories, service_micro_categories
-- =====================================================

-- 1. SERVICE CATEGORIES (Main categories like Construction, Plumbing, etc.)
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_emoji TEXT,
  icon_name TEXT,
  examples TEXT[],
  category_group TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. SERVICE SUBCATEGORIES (e.g., under Carpentry: Custom Furniture, Doors & Windows, etc.)
CREATE TABLE public.service_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT,
  icon_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- 3. SERVICE MICRO-CATEGORIES (specific tasks, e.g., under Custom Furniture: Table, Shelving, etc.)
CREATE TABLE public.service_micro_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcategory_id UUID NOT NULL REFERENCES public.service_subcategories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subcategory_id, slug)
);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_micro_categories ENABLE ROW LEVEL SECURITY;

-- Public read access (taxonomy is public reference data)
CREATE POLICY "Anyone can view active categories"
ON public.service_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can view active subcategories"
ON public.service_subcategories FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can view active micro-categories"
ON public.service_micro_categories FOR SELECT
USING (is_active = true);

-- Indexes for performance
CREATE INDEX idx_service_categories_slug ON public.service_categories(slug);
CREATE INDEX idx_service_categories_active ON public.service_categories(is_active, display_order);
CREATE INDEX idx_service_subcategories_category ON public.service_subcategories(category_id);
CREATE INDEX idx_service_subcategories_slug ON public.service_subcategories(category_id, slug);
CREATE INDEX idx_service_micro_categories_subcategory ON public.service_micro_categories(subcategory_id);

-- Triggers for updated_at
CREATE TRIGGER update_service_categories_updated_at
BEFORE UPDATE ON public.service_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_subcategories_updated_at
BEFORE UPDATE ON public.service_subcategories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_micro_categories_updated_at
BEFORE UPDATE ON public.service_micro_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();