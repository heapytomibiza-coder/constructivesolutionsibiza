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
      const { data, error } = await supabase
        .from('service_listings_browse')
        .select('*')
        .order('published_at', { ascending: false });

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
 */
export function useServiceListingDetail(listingId: string | undefined) {
  return useQuery({
    queryKey: ['service-listing-detail', listingId],
    enabled: !!listingId,
    queryFn: async () => {
      // Fetch listing
      const { data: listing, error: listingError } = await supabase
        .from('service_listings')
        .select('*')
        .eq('id', listingId!)
        .eq('status', 'live')
        .single();

      if (listingError) throw listingError;

      // Fetch pricing items
      const { data: pricingItems, error: pricingError } = await supabase
        .from('service_pricing_items')
        .select('*')
        .eq('service_listing_id', listingId!)
        .eq('is_enabled', true)
        .order('sort_order', { ascending: true });

      if (pricingError) throw pricingError;

      // Fetch provider info
      const { data: provider } = await supabase
        .from('professional_profiles')
        .select('display_name, avatar_url, verification_status, bio, tagline, service_zones')
        .eq('user_id', listing.provider_id)
        .single();

      // Fetch micro info
      const { data: micro } = await supabase
        .from('service_micro_categories')
        .select('name, slug')
        .eq('id', listing.micro_id)
        .single();

      // Record view
      supabase
        .from('service_views')
        .insert({ service_listing_id: listingId! })
        .then(() => {});

      return {
        listing: listing as ServiceListingDetail,
        pricingItems: (pricingItems ?? []) as ServicePricingItem[],
        provider: provider ?? { display_name: null, avatar_url: null, verification_status: null, bio: null, tagline: null, service_zones: [] },
        micro: micro ?? { name: null, slug: null },
      };
    },
    staleTime: 60_000,
  });
}
