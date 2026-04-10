import { supabase } from '@/integrations/supabase/client';

export async function togglePricingRuleActive(id: string, is_active: boolean) {
  const { error } = await supabase
    .from('pricing_rules')
    .update({ is_active } as any)
    .eq('id', id);
  if (error) throw error;
}

export async function createPricingRule(rule: {
  category: string;
  subcategory: string;
  micro_slug: string;
  micro_name: string;
  base_labour_unit: string;
  base_labour_min: number;
  base_labour_max: number;
  base_material_min: number;
  base_material_max: number;
}) {
  const { error } = await supabase
    .from('pricing_rules')
    .insert({
      ...rule,
      location_modifier: 1.15,
      adjustment_factors: { fields: [] },
    } as any);
  if (error) throw error;
}
