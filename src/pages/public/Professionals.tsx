import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { getRankedProfessionals, getMicroIdsForFilter, type RankedProfessional } from './queries/rankedProfessionals.query';

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
  match_score?: number;
  coverage?: number;
}

interface FilterNames {
  categoryName: string | null;
  subcategoryName: string | null;
}

const Professionals = () => {
  const { t } = useTranslation('common');
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

  // Fetch professionals - with ranking when filters are present
  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals', categoryId, subcategoryId],
    queryFn: async (): Promise<Professional[]> => {
      // If we have filters, use the ranked query (preference + verification + completions)
      if (categoryId || subcategoryId) {
        const microIds = await getMicroIdsForFilter(categoryId, subcategoryId);
        
        if (microIds.length === 0) {
          return [];
        }

        // Use ranked query - professionals who "love" these tasks rank higher
        const ranked = await getRankedProfessionals(microIds);
        return ranked;
      }

      // No filters - just get all publicly listed professionals (no ranking needed)
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('id, user_id, display_name, avatar_url, services_count, verification_status')
        .eq('is_publicly_listed', true);

      if (error) throw error;
      return (data || []).map(p => ({ ...p, match_score: 0, coverage: 0 }));
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

  // Handle professional selection in select mode
  const handleSelectProfessional = (pro: Professional) => {
    if (pro.user_id) {
      // Navigate back to wizard with the professional selected
      navigate(`/post?pro=${pro.user_id}`);
    }
  };

  return (
    <PublicLayout>
      {/* Select Mode Banner */}
      {selectMode && (
        <div className="bg-primary/10 border-b border-primary/20 py-3">
          <div className="container flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('professionals.backToJob')}
            </Button>
            <span className="text-sm font-medium text-primary">
              {t('professionals.selectProBanner')}
            </span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <HeroBanner
        imageSrc={heroProfessionals}
        title={selectMode ? t('professionals.titleSelect') : t('professionals.title')}
        subtitle={selectMode 
          ? t('professionals.subtitleSelect')
          : t('professionals.subtitle')
        }
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Shield className="h-4 w-4" />
            {t('professionals.trustBadge')}
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
                placeholder={t('professionals.searchPlaceholder')} 
                className="pl-10"
              />
            </div>
            <Button>{t('professionals.searchButton')}</Button>
          </div>
        </div>
      </div>

      {/* Filter Badges */}
      {hasFilters && (
        <div className="border-b border-border bg-muted/30 py-3">
          <div className="container">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">{t('professionals.filteringBy')}</span>
              
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
                {t('professionals.clearAll')}
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
                  <div className="flex items-center gap-4">
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
                        {t('professionals.servicesOffered', { count: pro.services_count || 0 })}
                      </p>
                    </div>
                    {/* Action button - Select in select mode, View otherwise */}
                    {selectMode ? (
                      <Button 
                        size="sm" 
                        onClick={() => handleSelectProfessional(pro)}
                        disabled={!pro.user_id}
                      >
                        {t('professionals.selectButton')}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/professionals/${pro.id}`}>{t('professionals.viewButton')}</Link>
                      </Button>
                    )}
                  </div>
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
                  ? t('professionals.noResultsFiltered')
                  : t('professionals.noResultsEmpty')
                }
              </p>
              {hasFilters ? (
                <Button variant="outline" onClick={clearAllFilters}>
                  {t('professionals.clearFilters')}
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link to="/auth?mode=pro">{t('professionals.joinAsPro')}</Link>
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
