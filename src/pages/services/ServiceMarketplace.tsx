import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { Shield, Store } from 'lucide-react';
import heroServices from '@/assets/heroes/hero-services.webp';
import { useServiceListingsBrowse } from './queries/serviceListings.query';
import { ServiceListingCardComponent } from './ServiceListingCard';
import { CardSkeleton } from '@/components/CardSkeleton';
import { EmptyState } from '@/shared/components';

/**
 * SERVICE MARKETPLACE - Browse live service listings from professionals
 */
const ServiceMarketplace = () => {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') ?? undefined;

  const { data: listings, isLoading } = useServiceListingsBrowse(categoryFilter);

  return (
    <PublicLayout>
      <HeroBanner
        imageSrc={heroServices}
        title="Service Marketplace"
        subtitle="Browse priced services from Ibiza professionals — compare, contact, and hire"
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Shield className="h-4 w-4" />
            Ibiza-based professionals
          </div>
        }
      />

      <div className="container py-10">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <CardSkeleton count={8} />
          </div>
        ) : !listings?.length ? (
          <EmptyState
            icon={<Store className="h-10 w-10 text-muted-foreground" />}
            message="No service listings yet — professionals are setting up their services. Check back soon!"
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ServiceListingCardComponent key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default ServiceMarketplace;
