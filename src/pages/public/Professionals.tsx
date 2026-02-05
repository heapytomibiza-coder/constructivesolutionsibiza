import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { supabase } from '@/integrations/supabase/client';
import { Search, Shield, Users, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import heroProfessionals from '@/assets/heroes/hero-professionals.jpg';

/**
 * PROFESSIONALS DIRECTORY PAGE
 * 
 * Public page - queries public_professionals_preview view.
 * Supports category/subcategory filtering via URL params.
 * No authentication required.
 */

interface Professional {
  id: string;
  user_id?: string; // For selection mode
  display_name: string | null;
  avatar_url: string | null;
  services_count: number | null;
  verification_status: string | null;
}

interface FilterNames {
  categoryName: string | null;
  subcategoryName: string | null;
}

const Professionals = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const subcategoryId = searchParams.get('subcategory');
  const selectMode = searchParams.get('select') === 'true';

  // Fetch filter names for display
  const { data: filterNames } = useQuery({
    queryKey: ['filter_names', categoryId, subcategoryId],
    enabled: !!(categoryId || subcategoryId),
    queryFn: async (): Promise<FilterNames> => {
      let categoryName: string | null = null;
      let subcategoryName: string | null = null;

      if (categoryId) {
        const { data } = await supabase
          .from('service_categories')
          .select('name')
          .eq('id', categoryId)
          .single();
        categoryName = data?.name || null;
      }

      if (subcategoryId) {
        const { data } = await supabase
          .from('service_subcategories')
          .select('name')
          .eq('id', subcategoryId)
          .single();
        subcategoryName = data?.name || null;
      }

      return { categoryName, subcategoryName };
    },
  });

  // Fetch professionals - with filtering if params present
  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals', categoryId, subcategoryId],
    queryFn: async (): Promise<Professional[]> => {
      // If we have filters, we need to join through the service tables
      if (categoryId || subcategoryId) {
        // Build query that joins professional_profiles → professional_services → service_micro_categories → service_subcategories
        // Since we can't do complex joins with the JS client, we'll use a different approach:
        // 1. Find all micro_ids that match our category/subcategory filter
        // 2. Find all user_ids that have those micro_ids in professional_services
        // 3. Fetch professional_profiles for those user_ids

        // Step 1: Get micro IDs matching the filter
        let microQuery = supabase
          .from('service_micro_categories')
          .select('id, subcategory_id');

        if (subcategoryId) {
          microQuery = microQuery.eq('subcategory_id', subcategoryId);
        }

        const { data: micros, error: microError } = await microQuery;
        if (microError) throw microError;

        // If filtering by category but not subcategory, we need to filter by subcategory's category
        let filteredMicroIds: string[] = [];
        
        if (subcategoryId) {
          filteredMicroIds = (micros || []).map(m => m.id);
        } else if (categoryId) {
          // Get all subcategories for this category
          const { data: subs } = await supabase
            .from('service_subcategories')
            .select('id')
            .eq('category_id', categoryId);
          
          const subIds = (subs || []).map(s => s.id);
          filteredMicroIds = (micros || []).filter(m => subIds.includes(m.subcategory_id)).map(m => m.id);
        }

        if (filteredMicroIds.length === 0) {
          return [];
        }

        // Step 2: Get user_ids from professional_services that have these micro_ids
        const { data: services, error: servicesError } = await supabase
          .from('professional_services')
          .select('user_id')
          .in('micro_id', filteredMicroIds);

        if (servicesError) throw servicesError;

        const userIds = [...new Set((services || []).map(s => s.user_id))];
        
        if (userIds.length === 0) {
          return [];
        }

      // Step 3: Get professional profiles for these users (that are publicly listed)
        const { data: profiles, error: profilesError } = await supabase
          .from('professional_profiles')
          .select('id, user_id, display_name, avatar_url, services_count, verification_status')
          .in('user_id', userIds)
          .eq('is_publicly_listed', true);

        if (profilesError) throw profilesError;

        return (profiles || []) as Professional[];
      }

      // No filters - just get all publicly listed professionals
      // Note: For unfiltered view, we need to query professional_profiles to get user_id
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('id, user_id, display_name, avatar_url, services_count, verification_status')
        .eq('is_publicly_listed', true);

      if (error) throw error;
      return (data || []) as Professional[];
    },
  });

  const clearFilter = (key: 'category' | 'subcategory') => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    // If clearing category, also clear subcategory
    if (key === 'category') {
      next.delete('subcategory');
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const hasFilters = !!(categoryId || subcategoryId);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <HeroBanner
        imageSrc={heroProfessionals}
        title="Browse Professionals"
        subtitle="Discover verified professionals offering premium services across Ibiza"
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Shield className="h-4 w-4" />
            All professionals are verified
          </div>
        }
      />

      {/* Search Section */}
      <div className="border-b border-border bg-background py-6">
        <div className="container">
          <div className="flex gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search professionals..." 
                className="pl-10"
              />
            </div>
            <Button>Search</Button>
          </div>
        </div>
      </div>

      {/* Filter Badges */}
      {hasFilters && (
        <div className="border-b border-border bg-muted/30 py-3">
          <div className="container">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filtering by:</span>
              
              {categoryId && filterNames?.categoryName && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {filterNames.categoryName}
                  <button
                    onClick={() => clearFilter('category')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {subcategoryId && filterNames?.subcategoryName && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {filterNames.subcategoryName}
                  <button
                    onClick={() => clearFilter('subcategory')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-xs h-7"
              >
                Clear all
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Listings */}
      <div className="container py-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="card-grounded">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : professionals && professionals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professionals.map((pro) => (
              <Card key={pro.id} className="card-grounded hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <Link to={`/professionals/${pro.id}`} className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={pro.avatar_url || undefined} alt={pro.display_name || 'Professional'} />
                      <AvatarFallback>
                        {(pro.display_name || 'P').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">
                          {pro.display_name || 'Professional'}
                        </h3>
                        {pro.verification_status === 'verified' && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pro.services_count || 0} services offered
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed col-span-full card-grounded">
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-sm bg-muted flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                {hasFilters 
                  ? 'No professionals found matching these filters.'
                  : 'No professionals listed yet. Check back soon!'
                }
              </p>
              {hasFilters ? (
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link to="/auth?mode=pro">Join as Professional</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
};

export default Professionals;
