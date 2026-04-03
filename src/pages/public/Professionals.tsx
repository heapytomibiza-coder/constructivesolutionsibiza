import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, X, CheckCircle2, ArrowLeft, MapPin } from 'lucide-react';
import heroProfessionals from '@/assets/heroes/hero-professionals.webp';
import { getRankedProfessionals, getMicroIdsForFilter, type RankedProfessional } from './queries/rankedProfessionals.query';
import { buildWizardLink } from '@/features/wizard/lib/wizardLink';

/**
 * PROFESSIONALS DIRECTORY PAGE
 * 
 * Public page - queries public_professionals_preview view.
 * Supports category/subcategory filtering via URL params.
 * No authentication required.
 */

interface Professional {
  id: string;
  user_id?: string;
  display_name: string | null;
  avatar_url: string | null;
  services_count: number | null;
  verification_status: string | null;
  match_score?: number;
  coverage?: number;
  bio?: string | null;
  tagline?: string | null;
  top_services?: string[];
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
        .select('id, user_id, display_name, avatar_url, avatar_thumb_url, services_count, verification_status, bio, tagline, service_zones')
        .eq('is_publicly_listed', true)
        .eq('onboarding_phase', 'complete')
        .not('display_name', 'is', null);

      if (error) throw error;
      
      const pros: Professional[] = (data || []).map(p => ({ ...p, match_score: 0, coverage: 0 }));
      
      // In select mode, fetch top services for richer cards
      if (selectMode && pros.length > 0) {
        const userIds = pros.map(p => p.user_id).filter(Boolean) as string[];
        if (userIds.length > 0) {
          const { data: services } = await supabase
            .from('professional_services')
            .select('user_id, micro_id')
            .in('user_id', userIds)
            .eq('status', 'offered');
          
          if (services?.length) {
            const microIds = [...new Set(services.map(s => s.micro_id))];
            const { data: micros } = await supabase
              .from('service_micro_categories')
              .select('id, name')
              .in('id', microIds);
            
            const microMap = new Map(micros?.map(m => [m.id, m.name]) || []);
            const userServicesMap = new Map<string, string[]>();
            
            for (const s of services) {
              const name = microMap.get(s.micro_id);
              if (name) {
                const existing = userServicesMap.get(s.user_id) || [];
                if (existing.length < 3) existing.push(name);
                userServicesMap.set(s.user_id, existing);
              }
            }
            
            for (const pro of pros) {
              if (pro.user_id) {
                pro.top_services = userServicesMap.get(pro.user_id) || [];
              }
            }
          }
        }
      }
      
      return pros;
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

  // Handle professional selection in select mode - use centralized link builder
  const handleSelectProfessional = (pro: Professional) => {
    if (pro.user_id) {
      const url = buildWizardLink({ mode: 'direct', professionalId: pro.user_id });
      navigate(url);
    }
  };

  return (
    <PublicLayout>
      {/* Select Mode Banner */}
      {selectMode && (
        <div className="bg-primary/10 border-b border-primary/20 py-3">
          <div className="container flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/professionals')} className="gap-2">
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


      {/* Filter Badges - no border on mobile */}
      {hasFilters && (
        <div className="md:border-b md:border-border bg-muted/30 py-3">
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
              <Card key={pro.id} className="card-mobile-clean md:card-grounded hover:md:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-3">
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
                    
                    {/* Tagline or bio excerpt — always show if available */}
                    {(pro.tagline || pro.bio) && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {(pro.tagline || pro.bio || '').slice(0, 120)}
                      </p>
                    )}

                    {/* Service zones */}
                    {(pro as any).service_zones && (pro as any).service_zones.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{(pro as any).service_zones.slice(0, 3).join(', ')}</span>
                      </div>
                    )}

                    {/* Top services badges in select mode */}
                    {selectMode && pro.top_services && pro.top_services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {pro.top_services.map((svc, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {svc}
                          </Badge>
                        ))}
                      </div>
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

        {/* Cross-link to services marketplace */}
        <div className="mt-8 text-center">
          <Link to="/services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Or browse services →
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Professionals;
