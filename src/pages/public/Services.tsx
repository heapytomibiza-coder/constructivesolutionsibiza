import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { CardSkeleton } from '@/components/CardSkeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { Shield, Store, X, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import heroServices from '@/assets/heroes/hero-services.webp';
import {
  useServiceListingsBrowse,
  useServiceFilterOptions,
  type BrowseFilters,
} from '@/pages/services/queries/serviceListings.query';
import { ServiceListingCardComponent } from '@/pages/services/ServiceListingCard';

const ALL = '__all__';

const Services = () => {
  const { t } = useTranslation('common');
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') ?? '';
  const subcategory = searchParams.get('subcategory') ?? '';
  const micro = searchParams.get('micro') ?? '';
  const sort = (searchParams.get('sort') as BrowseFilters['sort']) ?? 'newest';

  const filters: BrowseFilters = {
    ...(category && { category }),
    ...(subcategory && { subcategory }),
    ...(micro && { micro }),
    sort,
  };

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useServiceListingsBrowse(filters);

  const { data: filterOptions } = useServiceFilterOptions(filters);

  const listings = data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const hasActiveFilters = category || subcategory || micro;

  function setFilter(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === ALL) {
        next.delete(key);
        if (key === 'category') { next.delete('subcategory'); next.delete('micro'); }
        if (key === 'subcategory') { next.delete('micro'); }
      } else {
        next.set(key, value);
        if (key === 'category') { next.delete('subcategory'); next.delete('micro'); }
        if (key === 'subcategory') { next.delete('micro'); }
      }
      return next;
    });
  }

  function clearFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('category');
      next.delete('subcategory');
      next.delete('micro');
      return next;
    });
  }

  const categories = filterOptions?.categories ?? [];
  const subcategories = filterOptions?.subcategories ?? [];
  const micros = filterOptions?.micros ?? [];

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

      <div className="container py-12 overflow-x-hidden">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={category || ALL} onValueChange={(v) => setFilter('category', v)}>
              <SelectTrigger className="w-[calc(50vw-2rem)] sm:w-[180px] bg-card">
                <SelectValue placeholder={t('services.filterCategory', 'Category')} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value={ALL}>{t('services.allCategories', 'All Categories')}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {category && subcategories.length > 0 && (
              <Select value={subcategory || ALL} onValueChange={(v) => setFilter('subcategory', v)}>
                <SelectTrigger className="w-[calc(50vw-2rem)] sm:w-[180px] bg-card">
                  <SelectValue placeholder={t('services.filterService', 'Service')} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value={ALL}>{t('services.allServices', 'All Services')}</SelectItem>
                  {subcategories.map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {subcategory && micros.length > 0 && (
              <Select value={micro || ALL} onValueChange={(v) => setFilter('micro', v)}>
                <SelectTrigger className="w-[calc(50vw-2rem)] sm:w-[180px] bg-card">
                  <SelectValue placeholder={t('services.filterTask', 'Task')} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value={ALL}>{t('services.allTasks', 'All Tasks')}</SelectItem>
                  {micros.map((m) => (
                    <SelectItem key={m.slug} value={m.slug}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-3.5 w-3.5" />
                {t('professionals.clearAll')}
              </Button>
            )}
          </div>

          {/* Sort — full width on mobile, right-aligned on desktop */}
          <Select
            value={sort}
            onValueChange={(v) =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (v === 'newest') next.delete('sort');
                else next.set('sort', v);
                return next;
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-card sm:ml-auto">
              <SelectValue placeholder={t('services.sortBy', 'Sort by')} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="newest">{t('services.sortNewest', 'Newest')}</SelectItem>
              <SelectItem value="price_asc">{t('services.sortPrice', 'Lowest price')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <CardSkeleton count={8} />
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 w-full min-w-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-full">
              {listings.map((listing) => (
                <ServiceListingCardComponent key={listing.id} listing={listing} />
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center mt-10">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('services.loading', 'Loading…')}
                    </>
                  ) : (
                    t('services.loadMore', {
                      defaultValue: 'Load More ({{count}} remaining)',
                      count: totalCount - listings.length,
                    })
                  )}
                </Button>
              </div>
            )}
          </>
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
