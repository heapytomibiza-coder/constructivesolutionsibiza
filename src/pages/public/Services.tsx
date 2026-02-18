import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { Shield, Store, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import heroServices from '@/assets/heroes/hero-services.jpg';
import { useServiceListingsBrowse } from '@/pages/services/queries/serviceListings.query';
import { ServiceListingCardComponent } from '@/pages/services/ServiceListingCard';

const ALL = '__all__';

const Services = () => {
  const { t } = useTranslation('common');
  const { data: listings, isLoading } = useServiceListingsBrowse();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') ?? '';
  const subcategory = searchParams.get('subcategory') ?? '';
  const micro = searchParams.get('micro') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';

  // Derive filter options from data
  const { categories, subcategories, micros } = useMemo(() => {
    if (!listings) return { categories: [], subcategories: [], micros: [] };

    const catMap = new Map<string, string>();
    const subMap = new Map<string, string>();
    const microMap = new Map<string, string>();

    for (const l of listings) {
      if (l.category_slug && l.category_name) catMap.set(l.category_slug, l.category_name);
      if (category && l.category_slug === category && l.subcategory_slug && l.subcategory_name)
        subMap.set(l.subcategory_slug, l.subcategory_name);
      if (subcategory && l.subcategory_slug === subcategory && l.micro_slug && l.micro_name)
        microMap.set(l.micro_slug, l.micro_name);
    }

    return {
      categories: Array.from(catMap.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      subcategories: Array.from(subMap.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      micros: Array.from(microMap.entries()).sort((a, b) => a[1].localeCompare(b[1])),
    };
  }, [listings, category, subcategory]);

  // Filter + sort
  const filtered = useMemo(() => {
    if (!listings) return [];
    let result = [...listings];

    if (micro) {
      result = result.filter((l) => l.micro_slug === micro);
    } else if (subcategory) {
      result = result.filter((l) => l.subcategory_slug === subcategory);
    } else if (category) {
      result = result.filter((l) => l.category_slug === category);
    }

    if (sort === 'price_asc') {
      result.sort((a, b) => (a.starting_price ?? Infinity) - (b.starting_price ?? Infinity));
    } else {
      result.sort(
        (a, b) =>
          new Date(b.published_at ?? b.created_at).getTime() -
          new Date(a.published_at ?? a.created_at).getTime()
      );
    }

    return result;
  }, [listings, category, subcategory, micro, sort]);

  const hasActiveFilters = category || subcategory || micro;

  function setFilter(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === ALL) {
        next.delete(key);
        // Cascade reset
        if (key === 'category') {
          next.delete('subcategory');
          next.delete('micro');
        }
        if (key === 'subcategory') {
          next.delete('micro');
        }
      } else {
        next.set(key, value);
        if (key === 'category') {
          next.delete('subcategory');
          next.delete('micro');
        }
        if (key === 'subcategory') {
          next.delete('micro');
        }
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
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Select
            value={category || ALL}
            onValueChange={(v) => setFilter('category', v)}
          >
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder={t('services.filterCategory', 'Category')} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value={ALL}>{t('services.allCategories', 'All Categories')}</SelectItem>
              {categories.map(([slug, name]) => (
                <SelectItem key={slug} value={slug}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {category && subcategories.length > 0 && (
            <Select
              value={subcategory || ALL}
              onValueChange={(v) => setFilter('subcategory', v)}
            >
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder={t('services.filterService', 'Service')} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value={ALL}>{t('services.allServices', 'All Services')}</SelectItem>
                {subcategories.map(([slug, name]) => (
                  <SelectItem key={slug} value={slug}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {subcategory && micros.length > 0 && (
            <Select
              value={micro || ALL}
              onValueChange={(v) => setFilter('micro', v)}
            >
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder={t('services.filterTask', 'Task')} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value={ALL}>{t('services.allTasks', 'All Tasks')}</SelectItem>
                {micros.map(([slug, name]) => (
                  <SelectItem key={slug} value={slug}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
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
            <SelectTrigger className="w-[160px] bg-card ml-auto">
              <SelectValue placeholder={t('services.sortBy', 'Sort by')} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="newest">{t('services.sortNewest', 'Newest')}</SelectItem>
              <SelectItem value="price_asc">{t('services.sortPrice', 'Lowest price')}</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-3.5 w-3.5" />
              {t('professionals.clearAll')}
            </Button>
          )}
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((listing) => (
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
