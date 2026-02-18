import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { Shield, Store } from 'lucide-react';
import heroServices from '@/assets/heroes/hero-services.jpg';
import { useServiceListingsBrowse } from '@/pages/services/queries/serviceListings.query';
import { ServiceListingCardComponent } from '@/pages/services/ServiceListingCard';

const Services = () => {
  const { t } = useTranslation('common');
  const { data: listings, isLoading } = useServiceListingsBrowse();

  return (
    <PublicLayout>
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
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ServiceListingCardComponent key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Store className="h-8 w-8" />}
            message={t('services.emptyState', 'No services available yet. Be the first to post a job!')}
            action={
              <Button asChild>
                <Link to="/post">{t('services.postCustomJob')}</Link>
              </Button>
            }
          />
        )}

        {/* Wizard CTA */}
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
