import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

interface ProfessionalService {
  id: string;
  micro_id: string;
  notify: boolean;
  searchable: boolean;
  created_at: string;
  // Joined data
  micro_name?: string;
  micro_slug?: string;
  subcategory_name?: string;
  category_name?: string;
}

interface AddServiceParams {
  microId: string;
  notify?: boolean;
  searchable?: boolean;
}

export function useProfessionalServices() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ['professional_services', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('professional_services')
        .select(`
          id,
          micro_id,
          notify,
          searchable,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProfessionalService[];
    },
    enabled: !!user?.id,
  });

  // Fetch services with joined taxonomy data for display
  const servicesWithDetailsQuery = useQuery({
    queryKey: ['professional_services_details', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user's selected services
      const { data: services, error: servicesError } = await supabase
        .from('professional_services')
        .select('id, micro_id, notify, searchable, created_at')
        .eq('user_id', user.id);

      if (servicesError) throw servicesError;
      if (!services?.length) return [];

      // Get micro category details
      const microIds = services.map(s => s.micro_id);
      const { data: micros, error: microsError } = await supabase
        .from('service_micro_categories')
        .select(`
          id,
          name,
          slug,
          subcategory_id
        `)
        .in('id', microIds);

      if (microsError) throw microsError;

      // Get subcategory details
      const subcategoryIds = [...new Set(micros?.map(m => m.subcategory_id) || [])];
      const { data: subcategories, error: subError } = await supabase
        .from('service_subcategories')
        .select('id, name, category_id')
        .in('id', subcategoryIds);

      if (subError) throw subError;

      // Get category details
      const categoryIds = [...new Set(subcategories?.map(s => s.category_id) || [])];
      const { data: categories, error: catError } = await supabase
        .from('service_categories')
        .select('id, name')
        .in('id', categoryIds);

      if (catError) throw catError;

      // Build lookup maps
      const microMap = new Map(micros?.map(m => [m.id, m]) || []);
      const subMap = new Map(subcategories?.map(s => [s.id, s]) || []);
      const catMap = new Map(categories?.map(c => [c.id, c]) || []);

      // Merge data
      return services.map(service => {
        const micro = microMap.get(service.micro_id);
        const sub = micro ? subMap.get(micro.subcategory_id) : null;
        const cat = sub ? catMap.get(sub.category_id) : null;

        return {
          ...service,
          micro_name: micro?.name || 'Unknown',
          micro_slug: micro?.slug || '',
          subcategory_name: sub?.name || 'Unknown',
          category_name: cat?.name || 'Unknown',
        };
      });
    },
    enabled: !!user?.id,
  });

  const addServiceMutation = useMutation({
    mutationFn: async ({ microId, notify = true, searchable = true }: AddServiceParams) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('professional_services')
        .insert({
          user_id: user.id,
          micro_id: microId,
          notify,
          searchable,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional_services'] });
      queryClient.invalidateQueries({ queryKey: ['professional_services_details'] });
    },
  });

  const removeServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('professional_services')
        .delete()
        .eq('id', serviceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional_services'] });
      queryClient.invalidateQueries({ queryKey: ['professional_services_details'] });
    },
  });

  const addMultipleServicesMutation = useMutation({
    mutationFn: async (microIds: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');

      const inserts = microIds.map(microId => ({
        user_id: user.id,
        micro_id: microId,
        notify: true,
        searchable: true,
      }));

      const { data, error } = await supabase
        .from('professional_services')
        .upsert(inserts, { onConflict: 'user_id,micro_id' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional_services'] });
      queryClient.invalidateQueries({ queryKey: ['professional_services_details'] });
    },
  });

  const removeMultipleServicesMutation = useMutation({
    mutationFn: async (microIds: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('professional_services')
        .delete()
        .eq('user_id', user.id)
        .in('micro_id', microIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional_services'] });
      queryClient.invalidateQueries({ queryKey: ['professional_services_details'] });
    },
  });

  return {
    services: servicesQuery.data || [],
    servicesWithDetails: servicesWithDetailsQuery.data || [],
    servicesCount: servicesQuery.data?.length || 0,
    isLoading: servicesQuery.isLoading,
    isLoadingDetails: servicesWithDetailsQuery.isLoading,
    error: servicesQuery.error,
    
    addService: addServiceMutation.mutateAsync,
    removeService: removeServiceMutation.mutateAsync,
    addMultipleServices: addMultipleServicesMutation.mutateAsync,
    removeMultipleServices: removeMultipleServicesMutation.mutateAsync,
    
    isAdding: addServiceMutation.isPending || addMultipleServicesMutation.isPending,
    isRemoving: removeServiceMutation.isPending || removeMultipleServicesMutation.isPending,
  };
}
