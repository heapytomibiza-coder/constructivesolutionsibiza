import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 12;

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

export interface BrowseFilters {
  category?: string;
  subcategory?: string;
  micro?: string;
  sort?: 'newest' | 'price_asc';
}

// ─── Filter options (lightweight, no pagination) ───

interface FilterOption {
  slug: string;
  name: string;
}

export interface ServiceFilterOptions {
  categories: FilterOption[];
  subcategories: FilterOption[];
  micros: FilterOption[];
}

async function fetchFilterOptions(filters: BrowseFilters): Promise<ServiceFilterOptions> {
  // Always fetch categories
  const catQuery = supabase
    .from('service_listings_browse')
    .select('category_slug, category_name')
    .not('category_slug', 'is', null);

  const { data: catRows } = await catQuery;
  const catMap = new Map<string, string>();
  for (const r of catRows ?? []) {
    if (r.category_slug && r.category_name) catMap.set(r.category_slug, r.category_name);
  }

  let subMap = new Map<string, string>();
  let microMap = new Map<string, string>();

  // Fetch subcategories only if a category is selected
  if (filters.category) {
    const { data: subRows } = await supabase
      .from('service_listings_browse')
      .select('subcategory_slug, subcategory_name')
      .eq('category_slug', filters.category)
      .not('subcategory_slug', 'is', null);

    for (const r of subRows ?? []) {
      if (r.subcategory_slug && r.subcategory_name) subMap.set(r.subcategory_slug, r.subcategory_name);
    }
  }

  // Fetch micros only if a subcategory is selected
  if (filters.subcategory) {
    const { data: microRows } = await supabase
      .from('service_listings_browse')
      .select('micro_slug, micro_name')
      .eq('subcategory_slug', filters.subcategory)
      .not('micro_slug', 'is', null);

    for (const r of microRows ?? []) {
      if (r.micro_slug && r.micro_name) microMap.set(r.micro_slug, r.micro_name);
    }
  }

  const toSorted = (m: Map<string, string>): FilterOption[] =>
    Array.from(m.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

  return {
    categories: toSorted(catMap),
    subcategories: toSorted(subMap),
    micros: toSorted(microMap),
  };
}

export function useServiceFilterOptions(filters: BrowseFilters) {
  return useQuery({
    queryKey: ['service-filter-options', filters.category ?? null, filters.subcategory ?? null],
    queryFn: () => fetchFilterOptions(filters),
    staleTime: 60_000,
  });
}

// ─── Paginated browse ───

async function fetchListingsPage({
  page,
  filters,
}: {
  page: number;
  filters: BrowseFilters;
}) {
  const orderCol = filters.sort === 'price_asc' ? 'starting_price' : 'published_at';
  const ascending = filters.sort === 'price_asc';

  let query = supabase
    .from('service_listings_browse')
    .select('*', { count: 'exact' })
    .order(orderCol, { ascending, nullsFirst: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (filters.micro) {
    query = query.eq('micro_slug', filters.micro);
  } else if (filters.subcategory) {
    query = query.eq('subcategory_slug', filters.subcategory);
  } else if (filters.category) {
    query = query.eq('category_slug', filters.category);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as ServiceListingCard[],
    totalCount: count ?? 0,
    hasMore: (page + 1) * PAGE_SIZE < (count ?? 0),
  };
}

/**
 * Server-side paginated + filtered service listings browse.
 */
export function useServiceListingsBrowse(filters: BrowseFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['service-listings-browse', filters.category ?? null, filters.subcategory ?? null, filters.micro ?? null, filters.sort ?? 'newest'],
    queryFn: ({ pageParam = 0 }) =>
      fetchListingsPage({ page: pageParam, filters }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    staleTime: 30_000,
  });
}

// ─── Detail ───

export function useServiceListingDetail(listingId: string | undefined) {
  return useQuery({
    queryKey: ['service-listing-detail', listingId],
    enabled: !!listingId,
    queryFn: async () => {
      const { data: listing, error: listingError } = await supabase
        .from('service_listings')
        .select('*')
        .eq('id', listingId!)
        .eq('status', 'live')
        .maybeSingle();

      if (listingError) throw listingError;
      if (!listing) throw new Error('Listing not found');

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
