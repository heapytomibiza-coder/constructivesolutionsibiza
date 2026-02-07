/**
 * useServiceTaxonomy - Fetches the full service taxonomy in one query
 * Returns categories with nested subcategories and micros
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Micro {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  micros: Micro[];
}

interface Category {
  id: string;
  name: string;
  icon_emoji: string | null;
  subcategories: Subcategory[];
}

export function useServiceTaxonomy() {
  return useQuery({
    queryKey: ['service-taxonomy-full'],
    queryFn: async (): Promise<Category[]> => {
      // Fetch all active categories, subcategories, and micros in one query
      const { data, error } = await supabase
        .from('service_search_index')
        .select('*');

      if (error) throw error;
      if (!data) return [];

      // Also get category icons
      const { data: categories } = await supabase
        .from('service_categories')
        .select('id, icon_emoji')
        .eq('is_active', true);

      const iconMap = new Map(categories?.map(c => [c.id, c.icon_emoji]) || []);

      // Group by category → subcategory → micro
      const categoryMap = new Map<string, Category>();

      for (const row of data) {
        if (!row.category_id || !row.subcategory_id || !row.micro_id) continue;

        if (!categoryMap.has(row.category_id)) {
          categoryMap.set(row.category_id, {
            id: row.category_id,
            name: row.category_name || '',
            icon_emoji: iconMap.get(row.category_id) || null,
            subcategories: [],
          });
        }

        const category = categoryMap.get(row.category_id)!;
        let subcategory = category.subcategories.find(s => s.id === row.subcategory_id);

        if (!subcategory) {
          subcategory = {
            id: row.subcategory_id,
            name: row.subcategory_name || '',
            micros: [],
          };
          category.subcategories.push(subcategory);
        }

        // Avoid duplicates
        if (!subcategory.micros.find(m => m.id === row.micro_id)) {
          subcategory.micros.push({
            id: row.micro_id,
            name: row.micro_name || '',
            slug: row.micro_slug || '',
          });
        }
      }

      return Array.from(categoryMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
