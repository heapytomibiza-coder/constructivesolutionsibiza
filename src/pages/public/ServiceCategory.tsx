import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Shield, Users } from 'lucide-react';
import heroServices from '@/assets/heroes/hero-services.jpg';
import { CATEGORY_KEYS } from '@/i18n/categoryTranslations';
import { buildWizardLink } from '@/lib/wizardLink';

/**
 * SERVICE CATEGORY PAGE - View subcategories and professionals
 * 
 * DB-driven: Fetches category by slug and its subcategories
 * Enables deep-linking to /post and /professionals with category/subcategory IDs
 */

interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

interface DbSubcategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const ServiceCategory = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  // Fetch category by slug
  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError,
  } = useQuery({
    queryKey: ['service_category_by_slug', categorySlug],
    enabled: !!categorySlug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name, slug')
        .eq('slug', categorySlug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as DbCategory;
    },
  });

  // Fetch subcategories for this category
  const {
    data: subcategories,
    isLoading: subsLoading,
  } = useQuery({
    queryKey: ['service_subcategories_by_category', category?.id],
    enabled: !!category?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_subcategories')
        .select('id, name, slug, description')
        .eq('category_id', category!.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as DbSubcategory[];
    },
  });

  // Navigate to wizard with pre-filled category + subcategory using centralized builder
  const handleSubcategoryClick = (subId: string) => {
    const url = buildWizardLink({ 
      mode: 'subcategory', 
      categoryId: category!.id, 
      subcategoryId: subId 
    });
    navigate(url);
  };

  // Loading state
  if (categoryLoading) {
    return (
      <PublicLayout>
        <div className="container py-20">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PublicLayout>
    );
  }

  // Category not found
  if (categoryError || !category) {
    return (
      <PublicLayout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            {t('serviceCategory.categoryNotFound')}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t('serviceCategory.categoryNotFoundDesc')}
          </p>
          <Button asChild>
            <Link to="/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('serviceCategory.backToServices')}
            </Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  // Translate category name
  const categoryLabel = t(CATEGORY_KEYS[category.name] || category.name);

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <HeroBanner
        imageSrc={heroServices}
        title={categoryLabel}
        subtitle={t('serviceCategory.heroSubtitle', { category: categoryLabel.toLowerCase() })}
        height="compact"
        trustBadge={
          <div className="flex items-center justify-center gap-2 text-sm text-white/90">
            <Shield className="h-4 w-4" />
            <span>{t('serviceCategory.verifiedOnly')}</span>
          </div>
        }
      />

      {/* Breadcrumb */}
      <div className="container pt-6">
        <Link 
          to="/services" 
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('serviceCategory.backToServices')}
        </Link>
      </div>

      <div className="container py-8">
        {/* Subcategory Selection - Auto-advance cards */}
        <Card className="card-grounded">
          <CardHeader>
            <CardTitle className="font-display">{t('serviceCategory.whatKindOfWork', 'What kind of work do you need?')}</CardTitle>
            <CardDescription>
              {t('serviceCategory.tapToContinue', 'Tap to continue — we\'ll ask a few quick questions')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : subcategories && subcategories.length > 0 ? (
              <div className="space-y-3">
                {subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubcategoryClick(sub.id)}
                    className="w-full text-left p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group min-h-[56px] touch-target-min"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <span className="font-medium">
                          {t(`subcategories.${sub.slug}`, { defaultValue: sub.name })}
                        </span>
                        {sub.description && (
                          <span className="block text-sm text-muted-foreground mt-0.5">
                            {sub.description}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 rounded-sm bg-muted flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {t('serviceCategory.noSubcategories')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alternative path - subtle, not blocking */}
        <p className="text-sm text-muted-foreground text-center mt-6">
          {t('serviceCategory.orBrowse')}{' '}
          <Link 
            to={`/professionals?category=${encodeURIComponent(category.id)}`} 
            className="underline hover:text-foreground transition-colors"
          >
            {t('serviceCategory.browseProsLink')}
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
};

export default ServiceCategory;
