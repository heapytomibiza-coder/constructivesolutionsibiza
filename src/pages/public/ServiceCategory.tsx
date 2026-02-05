import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Shield, Users } from 'lucide-react';
import heroServices from '@/assets/heroes/hero-services.jpg';

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
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

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

  // Auto-select first subcategory for "idiot-proof" UX
  useEffect(() => {
    if (!selectedSubcategoryId && subcategories?.length) {
      setSelectedSubcategoryId(subcategories[0].id);
    }
  }, [subcategories, selectedSubcategoryId]);

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
            Category Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            This service category doesn't exist or is no longer available.
          </p>
          <Button asChild>
            <Link to="/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  // Build deep-link URLs with category and optionally subcategory
  const postHref = selectedSubcategoryId
    ? `/post?category=${encodeURIComponent(category.id)}&subcategory=${encodeURIComponent(selectedSubcategoryId)}`
    : `/post?category=${encodeURIComponent(category.id)}`;

  const prosHref = selectedSubcategoryId
    ? `/professionals?category=${encodeURIComponent(category.id)}&subcategory=${encodeURIComponent(selectedSubcategoryId)}`
    : `/professionals?category=${encodeURIComponent(category.id)}`;

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <HeroBanner
        imageSrc={heroServices}
        title={category.name}
        subtitle={`Find trusted ${category.name.toLowerCase()} professionals in Ibiza`}
        height="compact"
        trustBadge={
          <div className="flex items-center justify-center gap-2 text-sm text-white/90">
            <Shield className="h-4 w-4" />
            <span>Verified professionals only</span>
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
          Back to Services
        </Link>
      </div>

      <div className="container py-8">
        {/* Subcategory Selection */}
        <Card className="mb-8 card-grounded">
          <CardHeader>
            <CardTitle className="font-display">Select a Subcategory</CardTitle>
            <CardDescription>
              Choose a specific service type to get started
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
              <RadioGroup 
                value={selectedSubcategoryId || ''} 
                onValueChange={setSelectedSubcategoryId}
                className="space-y-3"
              >
                {subcategories.map((sub) => (
                  <div
                    key={sub.id}
                    className={`
                      flex items-center space-x-3 p-4 rounded-md border cursor-pointer transition-colors
                      min-h-[56px] touch-target-min
                      ${selectedSubcategoryId === sub.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                    onClick={() => setSelectedSubcategoryId(sub.id)}
                  >
                    <RadioGroupItem value={sub.id} id={sub.id} />
                    <Label 
                      htmlFor={sub.id} 
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium">{sub.name}</span>
                      {sub.description && (
                        <span className="block text-sm text-muted-foreground mt-0.5">
                          {sub.description}
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 rounded-sm bg-muted flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No subcategories available for this service.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="flex-1">
            <Link to={postHref}>
              Post a {category.name} Job
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="flex-1">
            <Link to={prosHref}>
              Browse {category.name} Professionals
            </Link>
          </Button>
        </div>

        {/* Helper text */}
        {selectedSubcategoryId && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Your selection will be pre-filled in the next step
          </p>
        )}
      </div>
    </PublicLayout>
  );
};

export default ServiceCategory;
