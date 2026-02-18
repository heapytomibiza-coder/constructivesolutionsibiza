import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { MAIN_CATEGORIES } from '@/domain/scope';
import { CATEGORY_KEYS } from '@/i18n/categoryTranslations';
import { 
  Hammer, Wrench, Droplets, Zap, Wind, Paintbrush, 
  Sparkles, TreePine, Waves, PenTool, Truck, 
  ChefHat, DoorOpen, Settings, Building2, FileCheck,
  ArrowRight, Shield, Store
} from 'lucide-react';
import heroServices from '@/assets/heroes/hero-services.jpg';
import { useServiceListingsBrowse } from '@/pages/services/queries/serviceListings.query';
import { ServiceListingCardComponent } from '@/pages/services/ServiceListingCard';

/**
 * SERVICES PAGE - Browse all service categories
 * 
 * SCOPE: Construction & property services ONLY.
 * Construction-grade professional styling.
 */

const categoryIcons: Record<string, React.ReactNode> = {
  'Construction': <Hammer className="h-6 w-6" />,
  'Carpentry': <Wrench className="h-6 w-6" />,
  'Plumbing': <Droplets className="h-6 w-6" />,
  'Electrical': <Zap className="h-6 w-6" />,
  'HVAC': <Wind className="h-6 w-6" />,
  'Painting & Decorating': <Paintbrush className="h-6 w-6" />,
  'Cleaning': <Sparkles className="h-6 w-6" />,
  'Gardening & Landscaping': <TreePine className="h-6 w-6" />,
  'Pool & Spa': <Waves className="h-6 w-6" />,
  'Architects & Design': <PenTool className="h-6 w-6" />,
  'Transport & Logistics': <Truck className="h-6 w-6" />,
  'Kitchen & Bathroom': <ChefHat className="h-6 w-6" />,
  'Floors, Doors & Windows': <DoorOpen className="h-6 w-6" />,
  'Handyman & General': <Settings className="h-6 w-6" />,
  'Commercial & Industrial': <Building2 className="h-6 w-6" />,
  'Legal & Regulatory': <FileCheck className="h-6 w-6" />,
};

const Services = () => {
  const { t } = useTranslation('common');
  const { data: listings, isLoading: listingsLoading } = useServiceListingsBrowse();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <HeroBanner
        imageSrc={heroServices}
        title={t('services.title')}
        subtitle={t('services.subtitle')}
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Shield className="h-4 w-4" />
            {t('services.trustBadge')}
          </div>
        }
      />

      <div className="container py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MAIN_CATEGORIES.map((category) => {
            const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            return (
              <Link key={category} to={`/services/${slug}`}>
                <Card className="h-full card-grounded transition-all hover:shadow-soft hover:border-accent/50 cursor-pointer group">
                  <CardHeader>
                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {categoryIcons[category] || <Hammer className="h-6 w-6" />}
                    </div>
                    <CardTitle className="font-display text-lg">{t(CATEGORY_KEYS[category] || category)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="flex items-center gap-1">
                      {t('services.viewServices')} <ArrowRight className="h-3 w-3" />
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Featured Services */}
        {(listingsLoading || (listings && listings.length > 0)) && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold">Featured Services</h2>
                <p className="text-sm text-muted-foreground mt-1">Live service listings from Ibiza professionals</p>
              </div>
            </div>
            {listingsLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings!.slice(0, 8).map((listing) => (
                  <ServiceListingCardComponent key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-accent rounded-lg p-8">
          <p className="text-accent-foreground/80 mb-4">
            {t('services.cantFind')}
          </p>
          <Button variant="secondary" asChild>
            <Link to="/post">{t('services.postCustomJob')}</Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Services;
