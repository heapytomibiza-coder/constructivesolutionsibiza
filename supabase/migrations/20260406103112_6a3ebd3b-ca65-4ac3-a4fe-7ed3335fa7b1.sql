
-- =============================================
-- Table: pricing_rules
-- =============================================
CREATE TABLE public.pricing_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  subcategory text NOT NULL,
  micro_slug text NOT NULL UNIQUE,
  micro_name text NOT NULL,
  base_labour_unit text NOT NULL DEFAULT 'm2',
  base_labour_min numeric NOT NULL DEFAULT 0,
  base_labour_max numeric NOT NULL DEFAULT 0,
  base_material_min numeric NOT NULL DEFAULT 0,
  base_material_max numeric NOT NULL DEFAULT 0,
  location_modifier numeric NOT NULL DEFAULT 1.0,
  difficulty_modifier numeric NOT NULL DEFAULT 1.0,
  urgency_modifier numeric NOT NULL DEFAULT 1.0,
  adjustment_factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- Anyone can read active rules
CREATE POLICY "Anyone can read active pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage pricing rules"
  ON public.pricing_rules FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::text) AND is_admin_email())
  WITH CHECK (has_role(auth.uid(), 'admin'::text) AND is_admin_email());

-- Updated_at trigger
CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Table: price_estimates
-- =============================================
CREATE TABLE public.price_estimates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category text NOT NULL,
  subcategory text NOT NULL,
  micro_slug text NOT NULL,
  micro_name text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  materials_min numeric NOT NULL DEFAULT 0,
  materials_max numeric NOT NULL DEFAULT 0,
  labour_min numeric NOT NULL DEFAULT 0,
  labour_max numeric NOT NULL DEFAULT 0,
  additional_min numeric NOT NULL DEFAULT 0,
  additional_max numeric NOT NULL DEFAULT 0,
  total_min numeric NOT NULL DEFAULT 0,
  total_max numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  confidence_level text NOT NULL DEFAULT 'low',
  pricing_source text NOT NULL DEFAULT 'manual_rule',
  disclaimer_version text NOT NULL DEFAULT 'v1',
  status text NOT NULL DEFAULT 'draft',
  linked_job_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.price_estimates ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own estimates
CREATE POLICY "Users can view own estimates"
  ON public.price_estimates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own estimates"
  ON public.price_estimates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own estimates"
  ON public.price_estimates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own estimates"
  ON public.price_estimates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all estimates
CREATE POLICY "Admins can read all estimates"
  ON public.price_estimates FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::text) AND is_admin_email());

-- Updated_at trigger
CREATE TRIGGER update_price_estimates_updated_at
  BEFORE UPDATE ON public.price_estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Seed: 5 pricing rules
-- =============================================
INSERT INTO public.pricing_rules (category, subcategory, micro_slug, micro_name, base_labour_unit, base_labour_min, base_labour_max, base_material_min, base_material_max, location_modifier, adjustment_factors)
VALUES
  -- Wall Painting (covers both wall-painting and paint-walls)
  ('Painting & Decorating', 'Interior Painting', 'wall-painting', 'Wall Painting', 'm2',
   8, 15, 3, 7, 1.15,
   '{"fields": [
     {"key": "area_m2", "label": "Wall area (m²)", "type": "number", "min": 1, "max": 500, "default": 20},
     {"key": "coats", "label": "Number of coats", "type": "number", "min": 1, "max": 4, "default": 2},
     {"key": "finish_level", "label": "Finish level", "type": "select", "options": [
       {"label": "Standard", "value": "standard", "modifier": 1.0},
       {"label": "Premium", "value": "premium", "modifier": 1.3},
       {"label": "High-end", "value": "high_end", "modifier": 1.6}
     ]},
     {"key": "surface_prep", "label": "Surface preparation needed", "type": "select", "options": [
       {"label": "Minimal", "value": "minimal", "modifier": 1.0},
       {"label": "Moderate (patching/sanding)", "value": "moderate", "modifier": 1.2},
       {"label": "Heavy (strip & re-prep)", "value": "heavy", "modifier": 1.5}
     ]}
   ]}'::jsonb),

  -- Build shelving
  ('Construction', 'Carpentry', 'build-shelving', 'Build shelving', 'item',
   250, 600, 80, 200, 1.15,
   '{"fields": [
     {"key": "quantity", "label": "Number of shelving units", "type": "number", "min": 1, "max": 20, "default": 1},
     {"key": "material_type", "label": "Material", "type": "select", "options": [
       {"label": "MDF / Melamine", "value": "mdf", "modifier": 1.0},
       {"label": "Plywood", "value": "plywood", "modifier": 1.2},
       {"label": "Solid wood", "value": "solid_wood", "modifier": 1.8}
     ]},
     {"key": "complexity", "label": "Complexity", "type": "select", "options": [
       {"label": "Simple (wall-mounted)", "value": "simple", "modifier": 1.0},
       {"label": "Built-in (alcove/niche)", "value": "built_in", "modifier": 1.4},
       {"label": "Custom design", "value": "custom", "modifier": 1.8}
     ]}
   ]}'::jsonb),

  -- Shelving Units (custom furniture)
  ('Carpentry', 'Custom Furniture', 'shelving-units', 'Shelving Units', 'item',
   400, 900, 150, 350, 1.15,
   '{"fields": [
     {"key": "quantity", "label": "Number of units", "type": "number", "min": 1, "max": 10, "default": 1},
     {"key": "size", "label": "Size", "type": "select", "options": [
       {"label": "Small (under 1m wide)", "value": "small", "modifier": 0.8},
       {"label": "Medium (1–2m wide)", "value": "medium", "modifier": 1.0},
       {"label": "Large (over 2m wide)", "value": "large", "modifier": 1.4}
     ]},
     {"key": "finish_level", "label": "Finish", "type": "select", "options": [
       {"label": "Paint-ready", "value": "paint_ready", "modifier": 1.0},
       {"label": "Painted", "value": "painted", "modifier": 1.2},
       {"label": "Lacquered / Stained", "value": "lacquered", "modifier": 1.4}
     ]}
   ]}'::jsonb),

  -- Install ceiling lights
  ('Electrical', 'Lighting', 'install-ceiling-lights', 'Install ceiling lights', 'item',
   60, 120, 20, 80, 1.15,
   '{"fields": [
     {"key": "quantity", "label": "Number of light fittings", "type": "number", "min": 1, "max": 50, "default": 4},
     {"key": "wiring", "label": "Wiring situation", "type": "select", "options": [
       {"label": "Existing wiring (swap only)", "value": "existing", "modifier": 1.0},
       {"label": "New wiring run needed", "value": "new_run", "modifier": 1.8},
       {"label": "New circuit required", "value": "new_circuit", "modifier": 2.5}
     ]},
     {"key": "fixture_type", "label": "Fixture type", "type": "select", "options": [
       {"label": "Standard pendant / flush", "value": "standard", "modifier": 1.0},
       {"label": "Recessed / Spotlights", "value": "recessed", "modifier": 1.3},
       {"label": "Chandelier / Feature", "value": "feature", "modifier": 1.6}
     ]}
   ]}'::jsonb),

  -- Tree pruning
  ('Gardening & Landscaping', 'Maintenance', 'tree-pruning', 'Tree pruning', 'item',
   80, 200, 10, 30, 1.15,
   '{"fields": [
     {"key": "quantity", "label": "Number of trees", "type": "number", "min": 1, "max": 50, "default": 2},
     {"key": "tree_size", "label": "Tree size", "type": "select", "options": [
       {"label": "Small (under 3m)", "value": "small", "modifier": 0.7},
       {"label": "Medium (3–6m)", "value": "medium", "modifier": 1.0},
       {"label": "Large (over 6m)", "value": "large", "modifier": 1.6}
     ]},
     {"key": "access", "label": "Site access", "type": "select", "options": [
       {"label": "Easy (ground level)", "value": "easy", "modifier": 1.0},
       {"label": "Moderate (slopes/walls)", "value": "moderate", "modifier": 1.2},
       {"label": "Difficult (crane/platform needed)", "value": "difficult", "modifier": 1.8}
     ]},
     {"key": "waste_removal", "label": "Waste removal", "type": "boolean", "modifier_true": 1.15, "modifier_false": 1.0, "default": true}
   ]}'::jsonb);
