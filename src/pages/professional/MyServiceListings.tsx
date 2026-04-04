/**
 * My Service Listings - Provider management page
 * Tabs: Draft / Live / Paused
 */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, Eye, Globe, Pause, Play, Wrench } from 'lucide-react';
import { useMyListings, type MyListing } from './hooks/useMyListings';
import { usePublishListing, usePauseListing, useUnpauseListing } from './hooks/useListingEditor';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { evaluateListingReadiness } from '@/lib/listingPublishRules';
import { txMicro } from '@/i18n/taxonomyTranslations';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';

/** Calculate profile completeness for a listing */
function getCompleteness(listing: MyListing): number {
  let score = 0;
  if (listing.display_title?.trim()) score += 20;
  if (listing.short_description?.trim()) score += 20;
  if (listing.hero_image_url) score += 30;
  if (listing.starting_price) score += 20;
  if (listing.location_base) score += 10;
  return score;
}

/** Get localized display title, preferring i18n map then falling back to raw */
function getDisplayTitle(listing: MyListing, lang: string): string {
  if (listing.display_title_i18n && typeof listing.display_title_i18n === 'object') {
    const translated = (listing.display_title_i18n as Record<string, string>)[lang];
    if (translated?.trim()) return translated;
  }
  return listing.display_title || '';
}

function ListingCard({ listing }: { listing: MyListing }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('dashboard');
  const { t: tAll } = useTranslation(['common', 'micros']);
  const publish = usePublishListing();
  const pause = usePauseListing();
  const unpause = useUnpauseListing();

  const { canPublish } = evaluateListingReadiness({
    display_title: listing.display_title,
    short_description: listing.short_description,
    hero_image_url: listing.hero_image_url,
    hasPricing: !!(listing.starting_price && listing.starting_price > 0),
  });
  const canPublishNow = listing.status === 'draft' && canPublish;

  const microLabel = txMicro(listing.micro_slug ?? null, tAll, listing.micro_name);
  const title = getDisplayTitle(listing, i18n.language) || t('pro.untitled', 'Untitled');

  const statusKey = listing.status as 'live' | 'draft' | 'paused';
  const statusLabel = t(`status.${statusKey}`, listing.status);

  return (
    <Card className="border-border/70 overflow-hidden">
      <div className="flex gap-0">
        {/* Thumbnail */}
        <div className="w-24 sm:w-32 shrink-0 bg-muted">
          {listing.hero_image_url ? (
            <img
              src={listing.hero_image_url}
              alt={title}
              className="w-full h-full object-cover aspect-square"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs aspect-square">
              {t('pro.noImage', 'No image')}
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {statusKey === 'live' ? (
                <Badge variant="default" className="bg-success text-success-foreground">{statusLabel}</Badge>
              ) : statusKey === 'draft' ? (
                <Badge variant="secondary">{statusLabel}</Badge>
              ) : (
                <Badge variant="outline">{statusLabel}</Badge>
              )}
              <span className="text-xs text-muted-foreground">{microLabel}</span>
            </div>
            <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-1">
              {title}
            </h3>
            {listing.starting_price && (
              <p className="text-xs text-primary font-medium mt-0.5">
                {t('pro.fromPrice', 'From {{price}} €', { price: listing.starting_price })}
              </p>
            )}
            {listing.status === 'draft' && (() => {
              const pct = getCompleteness(listing);
              return (
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress value={pct} className="h-1.5 flex-1 max-w-[100px]" />
                  <span className="text-[11px] text-muted-foreground font-medium">{pct}%</span>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
              <Link to={`/dashboard/pro/listings/${listing.id}/edit`}>
                <Edit className="h-3.5 w-3.5" /> {t('common.edit', 'Edit')}
              </Link>
            </Button>

            {listing.status === 'draft' && (
              <Button
                size="sm"
                className="h-8 gap-1.5"
                disabled={!canPublishNow || publish.isPending}
                onClick={() => publish.mutate(listing.id)}
              >
                <Globe className="h-3.5 w-3.5" /> {t('pro.publish', 'Publish')}
              </Button>
            )}

            {listing.status === 'live' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => pause.mutate(listing.id)}
                  disabled={pause.isPending}
                >
                  <Pause className="h-3.5 w-3.5" /> {t('pro.pause', 'Pause')}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5" asChild>
                  <Link to={`/services/listing/${listing.id}`}>
                    <Eye className="h-3.5 w-3.5" /> {t('pro.view', 'View')}
                  </Link>
                </Button>
              </>
            )}

            {listing.status === 'paused' && (
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => unpause.mutate(listing.id)}
                disabled={unpause.isPending}
              >
                <Play className="h-3.5 w-3.5" /> {t('pro.unpause', 'Unpause')}
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default function MyServiceListings() {
  const { t } = useTranslation('dashboard');
  const { data: listings, isLoading } = useMyListings();
  const [searchParams, setSearchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Auto-reconcile on page load: self-heal any drift from failed syncs
  useEffect(() => {
    if (!user?.id) return;
    supabase.rpc('sync_service_listings_for_provider', { p_provider_id: user.id })
      .then(({ error }) => {
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['my-listings'] });
        }
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear welcome param from URL after first render (keeps URL clean)
  const handleDismissWelcome = () => {
    searchParams.delete('welcome');
    setSearchParams(searchParams, { replace: true });
  };

  const drafts = listings?.filter(l => l.status === 'draft') ?? [];
  const live = listings?.filter(l => l.status === 'live') ?? [];
  const paused = listings?.filter(l => l.status === 'paused') ?? [];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link to="/dashboard/pro"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="font-display text-lg font-semibold">
            {t('pro.manageListings', 'Manage Listings')}
          </h1>
        </div>
      </nav>

      <div className="container py-5 sm:py-8">
        {/* Post-onboarding welcome banner */}
        {isWelcome && (
          <div className="mb-6 rounded-xl border-2 border-primary/40 bg-primary/10 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 shrink-0">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <h2 className="font-semibold text-base text-foreground">
                    {t('pro.welcomeTitle', 'Your profile is live!')}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('pro.welcomeDescription', 'Clients can now find you in the directory. To appear in the services marketplace, edit and publish your service listings below.')}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {drafts.length > 0 && (
                    <Button size="sm" asChild>
                      <Link to={`/dashboard/pro/listings/${drafts[0].id}/edit`}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        {t('pro.editFirstListing', 'Complete Your First Listing')}
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={handleDismissWelcome} className="text-xs text-muted-foreground">
                    {t('common.dismiss', 'Dismiss')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {t('pro.manageListingsPageHint', 'Edit and publish your services to appear on the platform.')}
          </p>
          <Button size="sm" asChild className="shrink-0 gap-1.5">
            <Link to="/professional/services">
              <Wrench className="h-3.5 w-3.5" />
              {t('pro.addRemoveCategories', 'Add / Remove Categories')}
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="draft">
          <TabsList className="mb-4">
            <TabsTrigger value="draft">{t('status.draft', 'Draft')} ({drafts.length})</TabsTrigger>
            <TabsTrigger value="live">{t('status.live', 'Live')} ({live.length})</TabsTrigger>
            <TabsTrigger value="paused">{t('status.paused', 'Paused')} ({paused.length})</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
            </div>
          ) : (
            <>
              <TabsContent value="draft" className="space-y-3">
                {drafts.length === 0 ? (
                  <EmptyTab message={t('pro.emptyDrafts', 'No draft listings. Add categories to create drafts.')} />
                ) : (
                  drafts.map(l => <ListingCard key={l.id} listing={l} />)
                )}
              </TabsContent>

              <TabsContent value="live" className="space-y-3">
                {live.length === 0 ? (
                  <EmptyTab message={t('pro.emptyLive', 'No live listings yet. Edit and publish your drafts to go live.')} />
                ) : (
                  live.map(l => <ListingCard key={l.id} listing={l} />)
                )}
              </TabsContent>

              <TabsContent value="paused" className="space-y-3">
                {paused.length === 0 ? (
                  <EmptyTab message={t('pro.emptyPaused', 'No paused listings.')} />
                ) : (
                  paused.map(l => <ListingCard key={l.id} listing={l} />)
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  const { t } = useTranslation('dashboard');
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      <Button variant="outline" size="sm" asChild>
        <Link to="/professional/services">
          <Wrench className="h-4 w-4 mr-1.5" /> {t('pro.addRemoveCategories', 'Add / Remove Categories')}
        </Link>
      </Button>
    </div>
  );
}
