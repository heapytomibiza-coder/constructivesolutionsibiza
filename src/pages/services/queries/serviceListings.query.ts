import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceListingCard {
  id: string;
  provider_id: string;
  micro_id: string;
  display_title: string;
  short_description: string | null;
  hero_image_url: string | null;
  location_base: string | null;
  pricing_summary: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  provider_name: string | null;
  provider_avatar: string | null;
  provider_verification: string | null;
  micro_name: string | null;
  micro_slug: string | null;
  subcategory_name: string | null;
  subcategory_slug: string | null;
  category_name: string | null;
  category_slug: string | null;
  starting_price: number | null;
  starting_price_unit: string | null;
}

export interface ServicePricingItem {
  id: string;
  service_listing_id: string;
  label: string;
  info_description: string | null;
  price_amount: number | null;
  price_currency: string;
  unit: string;
  is_enabled: boolean;
  sort_order: number;
}

export interface ServiceListingDetail {
  id: string;
  provider_id: string;
  micro_id: string;
  display_title: string;
  short_description: string | null;
  hero_image_url: string | null;
  gallery: string[];
  location_base: string | null;
  pricing_summary: string | null;
  view_count: number;
  published_at: string | null;
  status: string;
  created_at: string;
}

/**
 * Fetch all live service listings for the browse page.
 */
export function useServiceListingsBrowse(categoryFilter?: string) {
  return useQuery({
    queryKey: ['service-listings-browse', categoryFilter],
    queryFn: async (): Promise<ServiceListingCard[]> => {
      let query = supabase
        .from('service_listings_browse')
        .select('*')
        .order('published_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      let results = (data ?? []) as ServiceListingCard[];
      
      if (categoryFilter) {
        results = results.filter(r => 
          r.category_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categoryFilter
        );
      }
      
      return results;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch a single service listing detail.
 * Parallelized queries for faster load.
 */
export function useServiceListingDetail(listingId: string | undefined) {
  return useQuery({
    queryKey: ['service-listing-detail', listingId],
    enabled: !!listingId,
    queryFn: async () => {
      // Step 1: Fetch listing first (needed for provider_id and micro_id)
      const { data: listing, error: listingError } = await supabase
        .from('service_listings')
        .select('*')
        .eq('id', listingId!)
        .eq('status', 'live')
        .maybeSingle();

      if (listingError) throw listingError;
      if (!listing) throw new Error('Listing not found');

      // Step 2: Fetch pricing, provider, and micro IN PARALLEL
      const [pricingResult, providerResult, microResult] = await Promise.all([
        supabase
          .from('service_pricing_items')
          .select('*')
          .eq('service_listing_id', listingId!)
          .eq('is_enabled', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('professional_profiles')
          .select('display_name, avatar_url, verification_status, bio, tagline, service_zones')
          .eq('user_id', listing.provider_id)
          .single(),
        supabase
          .from('service_micro_categories')
          .select('name, slug, subcategory_id')
          .eq('id', listing.micro_id)
          .single(),
      ]);

      if (pricingResult.error) throw pricingResult.error;

      const provider = providerResult.data ?? {
        display_name: null, avatar_url: null, verification_status: null,
        bio: null, tagline: null, service_zones: [],
      };
      const micro = microResult.data ?? { name: null, slug: null, subcategory_id: null };

      // Step 3: Fetch taxonomy (only if micro has subcategory)
      let categoryName: string | null = null;
      let subcategoryName: string | null = null;

      if (micro?.subcategory_id) {
        const { data: sub } = await supabase
          .from('service_subcategories')
          .select('name, category_id')
          .eq('id', micro.subcategory_id)
          .single();

        if (sub) {
          subcategoryName = sub.name;
          if (sub.category_id) {
            const { data: cat } = await supabase
              .from('service_categories')
              .select('name')
              .eq('id', sub.category_id)
              .single();
            categoryName = cat?.name ?? null;
          }
        }
      }

      // Fire-and-forget view tracking
      supabase
        .from('service_views')
        .insert({ service_listing_id: listingId! })
        .then(() => {});

      return {
        listing: listing as ServiceListingDetail,
        pricingItems: (pricingResult.data ?? []) as ServicePricingItem[],
        provider,
        micro,
        categoryName,
        subcategoryName,
      };
    },
    staleTime: 60_000,
  });
}
