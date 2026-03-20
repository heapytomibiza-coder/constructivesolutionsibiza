/**
 * useMyListings - Query hook for provider's own service listings
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export interface MyListing {
  id: string;
  micro_id: string;
  display_title: string;
  display_title_i18n: Record<string, string> | null;
  short_description: string | null;
  hero_image_url: string | null;
  status: string;
  location_base: string | null;
  pricing_summary: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  micro_name?: string;
  micro_slug?: string;
  starting_price?: number | null;
}

export function useMyListings() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['my-listings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch the provider's active services (source of truth)
      const { data: activeServices, error: svcError } = await supabase
        .from('professional_services')
        .select('micro_id')
        .eq('user_id', user!.id);

      if (svcError) throw svcError;
      const activeMicroIds = new Set(activeServices?.map(s => s.micro_id) ?? []);

      const { data: listings, error } = await supabase
        .from('service_listings')
        .select(`
          id, micro_id, display_title, display_title_i18n, short_description, hero_image_url,
          status, location_base, pricing_summary, view_count, published_at,
          created_at, updated_at
        `)
        .eq('provider_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Filter: only show listings backed by an active professional_service
      const filteredListings = listings.filter(l => activeMicroIds.has(l.micro_id));

      // Fetch micro names for display
      const microIds = [...new Set(filteredListings.map(l => l.micro_id))];
      const { data: micros } = await supabase
        .from('service_micro_categories')
        .select('id, name, slug')
        .in('id', microIds.length > 0 ? microIds : ['__none__']);

      const microMap = new Map(micros?.map(m => [m.id, { name: m.name, slug: m.slug }]) ?? []);

      // Fetch starting prices
      const listingIds = filteredListings.map(l => l.id);
      const { data: pricingItems } = await supabase
        .from('service_pricing_items')
        .select('service_listing_id, price_amount')
        .in('service_listing_id', listingIds.length > 0 ? listingIds : ['__none__'])
        .eq('is_enabled', true)
        .order('price_amount', { ascending: true });

      const priceMap = new Map<string, number>();
      pricingItems?.forEach(pi => {
        if (pi.price_amount && !priceMap.has(pi.service_listing_id)) {
          priceMap.set(pi.service_listing_id, pi.price_amount);
        }
      });

      return filteredListings.map(l => {
        const micro = microMap.get(l.micro_id);
        return {
          ...l,
          display_title_i18n: (l as any).display_title_i18n ?? null,
          micro_name: micro?.name ?? 'Service',
          micro_slug: micro?.slug ?? undefined,
          starting_price: priceMap.get(l.id) ?? null,
        };
      }) as MyListing[];
    },
  });
}
