import { supabase } from '@/integrations/supabase/client';

export interface PricingRuleRow {
  id: string;
  category: string;
  subcategory: string;
  micro_slug: string;
  micro_name: string;
  base_labour_unit: string;
  base_labour_min: number;
  base_labour_max: number;
  base_material_min: number;
  base_material_max: number;
  location_modifier: number;
  is_active: boolean;
  created_at: string;
}

export async function fetchPricingRules(): Promise<PricingRuleRow[]> {
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .order('category');
  if (error) throw error;
  return data as unknown as PricingRuleRow[];
}
