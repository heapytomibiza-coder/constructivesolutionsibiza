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
  updated_at?: string;
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

  // Determine multiplier: room dimensions → wall area, or area_m2, or quantity
  let multiplier: number;
  const roomLength = Number(inputs.room_length);
  const roomWidth = Number(inputs.room_width);
  const roomHeight = Number(inputs.room_height);
  if (roomLength > 0 && roomWidth > 0 && roomHeight > 0) {
    multiplier = 2 * (roomLength + roomWidth) * roomHeight;
  } else {
    multiplier = Number(inputs.area_m2 || inputs.quantity || 1);
  }

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
    confidence_level: 'low',
    pricing_source: 'manual_rule',
  };
}

/** Pure validation — returns field-level error messages for invalid inputs */
export function validateInputs(
  fields: AdjustmentField[],
  inputs: EstimateInputs
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = inputs[field.key];

    if (field.type === 'number') {
      const num = Number(value);
      if (value === undefined || value === '' || Number.isNaN(num)) {
        errors[field.key] = 'This field is required';
        continue;
      }
      const min = field.min ?? 0;
      if (num < min) {
        errors[field.key] = `Must be at least ${min}`;
      }
      if (field.max !== undefined && num > field.max) {
        errors[field.key] = `Must be no more than ${field.max}`;
      }
    }

    if (field.type === 'select') {
      if (!value && value !== 0) {
        errors[field.key] = 'Please select an option';
      }
    }
    // boolean fields always have a valid state (true/false), no validation needed
  }

  return errors;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
