import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EstimateResult, EstimateInputs } from '../lib/calculateEstimate';

export interface SavedEstimate {
  id: string;
  user_id: string;
  category: string;
  subcategory: string;
  micro_slug: string;
  micro_name: string;
  inputs: EstimateInputs;
  materials_min: number;
  materials_max: number;
  labour_min: number;
  labour_max: number;
  additional_min: number;
  additional_max: number;
  total_min: number;
  total_max: number;
  currency: string;
  confidence_level: string;
  pricing_source: string;
  disclaimer_version: string;
  status: string;
  linked_job_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useEstimateHistory() {
  return useQuery({
    queryKey: ['price-estimates'],
    queryFn: async (): Promise<SavedEstimate[]> => {
      const { data, error } = await supabase
        .from('price_estimates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as SavedEstimate[];
    },
  });
}

export function useEstimateById(id: string | undefined) {
  return useQuery({
    queryKey: ['price-estimate', id],
    queryFn: async (): Promise<SavedEstimate | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('price_estimates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as SavedEstimate | null;
    },
    enabled: !!id,
  });
}

interface RuleSnapshot {
  rule_id: string;
  location_modifier: number;
  base_labour_min: number;
  base_labour_max: number;
  base_material_min: number;
  base_material_max: number;
  rule_updated_at: string;
}

interface SaveEstimateArgs {
  userId: string;
  category: string;
  subcategory: string;
  micro_slug: string;
  micro_name: string;
  inputs: EstimateInputs;
  result: EstimateResult;
  ruleSnapshot: RuleSnapshot;
}

export function useSaveEstimate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: SaveEstimateArgs) => {
      const { data, error } = await supabase
        .from('price_estimates')
        .insert({
          user_id: args.userId,
          category: args.category,
          subcategory: args.subcategory,
          micro_slug: args.micro_slug,
          micro_name: args.micro_name,
          inputs: args.inputs as any,
          materials_min: args.result.materials_min,
          materials_max: args.result.materials_max,
          labour_min: args.result.labour_min,
          labour_max: args.result.labour_max,
          additional_min: args.result.additional_min,
          additional_max: args.result.additional_max,
          total_min: args.result.total_min,
          total_max: args.result.total_max,
          confidence_level: args.result.confidence_level,
          pricing_source: args.result.pricing_source,
          rule_snapshot: args.ruleSnapshot as any,
          status: 'saved',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-estimates'] });
    },
  });
}

export function useDuplicateEstimate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (estimate: SavedEstimate) => {
      const { data, error } = await supabase
        .from('price_estimates')
        .insert({
          user_id: estimate.user_id,
          category: estimate.category,
          subcategory: estimate.subcategory,
          micro_slug: estimate.micro_slug,
          micro_name: estimate.micro_name,
          inputs: estimate.inputs as any,
          materials_min: estimate.materials_min,
          materials_max: estimate.materials_max,
          labour_min: estimate.labour_min,
          labour_max: estimate.labour_max,
          additional_min: estimate.additional_min,
          additional_max: estimate.additional_max,
          total_min: estimate.total_min,
          total_max: estimate.total_max,
          confidence_level: estimate.confidence_level,
          pricing_source: estimate.pricing_source,
          status: 'draft',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-estimates'] });
    },
  });
}
