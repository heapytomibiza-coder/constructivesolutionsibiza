/**
 * useListingEditor - Mutations for updating a service listing + pricing items
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/trackEvent';

export interface PricingItem {
  id: string;
  label: string;
  price_amount: number | null;
  unit: string;
  info_description: string | null;
  is_enabled: boolean;
  sort_order: number;
}

export interface ListingDetail {
  id: string;
  micro_id: string;
  display_title: string;
  short_description: string | null;
  hero_image_url: string | null;
  gallery: string[];
  location_base: string | null;
  pricing_summary: string | null;
  status: string;
  pricing_items: PricingItem[];
}

export function useListingDetail(listingId: string | undefined) {
  const { user } = useSession();

  return useQuery({
    queryKey: ['listing-detail', listingId],
    enabled: !!listingId && !!user,
    queryFn: async () => {
      const { data: listing, error } = await supabase
        .from('service_listings')
        .select('*')
        .eq('id', listingId!)
        .eq('provider_id', user!.id)
        .single();

      if (error) throw error;

      const { data: items, error: itemsErr } = await supabase
        .from('service_pricing_items')
        .select('id, label, price_amount, unit, info_description, is_enabled, sort_order')
        .eq('service_listing_id', listingId!)
        .order('sort_order', { ascending: true });

      if (itemsErr) throw itemsErr;

      return {
        id: listing.id,
        micro_id: listing.micro_id,
        display_title: listing.display_title,
        short_description: listing.short_description,
        hero_image_url: listing.hero_image_url,
        gallery: listing.gallery ?? [],
        location_base: listing.location_base,
        pricing_summary: listing.pricing_summary,
        status: listing.status,
        pricing_items: items ?? [],
      } as ListingDetail;
    },
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      display_title?: string;
      short_description?: string;
      hero_image_url?: string | null;
      gallery?: string[];
      location_base?: string | null;
      pricing_summary?: string | null;
      status?: string;
    }) => {
      const { id, ...updates } = payload;
      const { error } = await supabase
        .from('service_listings')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['listing-detail', vars.id] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useUpsertPricingItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      id?: string;
      service_listing_id: string;
      label: string;
      price_amount: number | null;
      unit: string;
      info_description?: string | null;
      is_enabled?: boolean;
      sort_order?: number;
    }) => {
      if (item.id) {
        const { error } = await supabase
          .from('service_pricing_items')
          .update({
            label: item.label,
            price_amount: item.price_amount,
            unit: item.unit,
            info_description: item.info_description ?? null,
            is_enabled: item.is_enabled ?? true,
            sort_order: item.sort_order ?? 0,
          })
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('service_pricing_items')
          .insert({
            service_listing_id: item.service_listing_id,
            label: item.label,
            price_amount: item.price_amount,
            unit: item.unit,
            info_description: item.info_description ?? null,
            is_enabled: item.is_enabled ?? true,
            sort_order: item.sort_order ?? 0,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing-detail'] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useDeletePricingItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('service_pricing_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing-detail'] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function usePublishListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase
        .from('service_listings')
        .update({ status: 'live' })
        .eq('id', listingId);
      if (error) throw error;
    },
    onSuccess: (_, listingId) => {
      toast.success('Listing published successfully!');
      qc.invalidateQueries({ queryKey: ['listing-detail', listingId] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      trackEvent('listing_published', 'professional', { listing_id: listingId });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to publish listing');
    },
  });
}

export function usePauseListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase
        .from('service_listings')
        .update({ status: 'paused' })
        .eq('id', listingId);
      if (error) throw error;
    },
    onSuccess: (_, listingId) => {
      toast.success('Listing paused');
      qc.invalidateQueries({ queryKey: ['listing-detail', listingId] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      trackEvent('listing_paused', 'professional', { listing_id: listingId });
    },
  });
}

export function useUnpauseListing() {
  const qc = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Fetch the listing's micro_id
      const { data: listing, error: fetchErr } = await supabase
        .from('service_listings')
        .select('micro_id')
        .eq('id', listingId)
        .eq('provider_id', user.id)
        .single();

      if (fetchErr || !listing) throw new Error('Listing not found');

      // Guard: verify the micro is still in professional_services
      const { data: svc, error: svcErr } = await supabase
        .from('professional_services')
        .select('id')
        .eq('user_id', user.id)
        .eq('micro_id', listing.micro_id)
        .maybeSingle();

      if (svcErr) throw svcErr;
      if (!svc) {
        throw new Error('This service is no longer in your selected services. Re-add it first.');
      }

      const { error } = await supabase
        .from('service_listings')
        .update({ status: 'live' })
        .eq('id', listingId);
      if (error) throw error;
    },
    onSuccess: (_, listingId) => {
      toast.success('Listing is live again');
      qc.invalidateQueries({ queryKey: ['listing-detail', listingId] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to unpause listing');
    },
  });
}
