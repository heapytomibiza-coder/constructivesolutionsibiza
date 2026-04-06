/**
 * calculateEstimate — pure function
 * Takes a pricing rule + user inputs → returns min/max estimate ranges
 */

export interface PricingRule {
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
  difficulty_modifier: number;
  urgency_modifier: number;
  adjustment_factors: AdjustmentFactors;
  is_active: boolean;
}

export interface AdjustmentFactors {
  fields: AdjustmentField[];
}

export interface AdjustmentField {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  min?: number;
  max?: number;
  default?: number | string | boolean;
  options?: { label: string; value: string; modifier: number }[];
  modifier_true?: number;
  modifier_false?: number;
}

export interface EstimateInputs {
  [key: string]: number | string | boolean;
}

export interface EstimateResult {
  materials_min: number;
  materials_max: number;
  labour_min: number;
  labour_max: number;
  additional_min: number;
  additional_max: number;
  total_min: number;
  total_max: number;
  confidence_level: 'low' | 'medium' | 'high';
  pricing_source: string;
}

export function calculateEstimate(
  rule: PricingRule,
  inputs: EstimateInputs
): EstimateResult {
  const fields = rule.adjustment_factors?.fields ?? [];

  // Determine multiplier: area_m2 or quantity, fallback to 1
  const multiplier = Number(inputs.area_m2 || inputs.quantity || 1);

  // Coats (painting-specific)
  const coats = Number(inputs.coats || 1);

  // Calculate combined modifier from select and boolean fields
  let modifiers = 1;
  for (const field of fields) {
    if (field.type === 'select' && field.options) {
      const selected = inputs[field.key];
      const option = field.options.find(o => o.value === selected);
      if (option) {
        modifiers *= option.modifier;
      }
    }
    if (field.type === 'boolean') {
      const val = inputs[field.key];
      if (val === true && field.modifier_true) {
        modifiers *= field.modifier_true;
      } else if (val === false && field.modifier_false) {
        modifiers *= field.modifier_false;
      }
    }
  }

  const locationFactor = rule.location_modifier || 1;

  const labour_min = round(rule.base_labour_min * multiplier * modifiers * coats * locationFactor);
  const labour_max = round(rule.base_labour_max * multiplier * modifiers * coats * locationFactor);

  const materials_min = round(rule.base_material_min * multiplier * modifiers * coats * locationFactor);
  const materials_max = round(rule.base_material_max * multiplier * modifiers * coats * locationFactor);

  // Additional: 5–15% of labour (transport, access, waste — Ibiza uplift)
  const additional_min = round(labour_min * 0.05);
  const additional_max = round(labour_max * 0.15);

  const total_min = round(labour_min + materials_min + additional_min);
  const total_max = round(labour_max + materials_max + additional_max);

  return {
    materials_min,
    materials_max,
    labour_min,
    labour_max,
    additional_min,
    additional_max,
    total_min,
    total_max,
    confidence_level: 'medium',
    pricing_source: 'manual_rule',
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
