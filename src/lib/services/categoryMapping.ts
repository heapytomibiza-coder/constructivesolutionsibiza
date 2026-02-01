/**
 * Category Mapping Utility
 * Maps intro categories (user-friendly names) to database category UUIDs
 */

import { supabase } from "@/integrations/supabase/client";

interface CategoryMatch {
  id: string;
  name: string;
  slug: string;
  confidence: 'exact' | 'partial' | 'none';
}

/**
 * Find best matching database category for an intro category string
 */
export async function findCategoryMatch(introCategory: string): Promise<CategoryMatch | null> {
  const normalized = introCategory.toLowerCase().trim();
  
  // Query all active categories
  const { data: categories, error } = await supabase
    .from('service_categories')
    .select('id, name, slug')
    .eq('is_active', true);

  if (error || !categories) {
    console.error('Failed to fetch categories:', error);
    return null;
  }

  // Try exact slug match first
  let match = categories.find(c => c.slug === normalized);
  if (match) {
    return { ...match, confidence: 'exact' };
  }

  // Try exact name match (case-insensitive)
  match = categories.find(c => c.name.toLowerCase() === normalized);
  if (match) {
    return { ...match, confidence: 'exact' };
  }

  // Try partial match in slug or name
  match = categories.find(c => 
    c.slug.includes(normalized) || 
    normalized.includes(c.slug) ||
    c.name.toLowerCase().includes(normalized) ||
    normalized.includes(c.name.toLowerCase())
  );
  
  if (match) {
    return { ...match, confidence: 'partial' };
  }

  return null;
}

/**
 * Map multiple intro categories to database categories
 */
export async function mapIntroCategories(introCategories: string[]): Promise<{
  matched: Array<{ intro: string; category: CategoryMatch }>;
  unmatched: string[];
}> {
  const matched: Array<{ intro: string; category: CategoryMatch }> = [];
  const unmatched: string[] = [];

  for (const intro of introCategories) {
    const match = await findCategoryMatch(intro);
    if (match) {
      matched.push({ intro, category: match });
    } else {
      unmatched.push(intro);
    }
  }

  return { matched, unmatched };
}
