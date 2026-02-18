/**
 * My Service Listings - Provider management page
 * Tabs: Draft / Live / Paused
 */
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, Eye, Globe, Pause, Play, Plus, Wrench } from 'lucide-react';
import { useMyListings, type MyListing } from './hooks/useMyListings';
import { usePublishListing, usePauseListing, useUnpauseListing } from './hooks/useListingEditor';
import { useTranslation } from 'react-i18next';

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

function statusBadge(status: string) {
  switch (status) {
    case 'live': return <Badge variant="default" className="bg-success text-success-foreground">Live</Badge>;
    case 'draft': return <Badge variant="secondary">Draft</Badge>;
    case 'paused': return <Badge variant="outline">Paused</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function ListingCard({ listing }: { listing: MyListing }) {
  const navigate = useNavigate();
  const publish = usePublishListing();
  const pause = usePauseListing();
  const unpause = useUnpauseListing();

  const canPublish = listing.status === 'draft' &&
    listing.display_title?.trim() &&
    listing.short_description?.trim() &&
    listing.hero_image_url;

  return (
    <Card className="border-border/70 overflow-hidden">
      <div className="flex gap-0">
        {/* Thumbnail */}
        <div className="w-24 sm:w-32 shrink-0 bg-muted">
          {listing.hero_image_url ? (
            <img
              src={listing.hero_image_url}
              alt={listing.display_title}
              className="w-full h-full object-cover aspect-square"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs aspect-square">
              No image
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {statusBadge(listing.status)}
              <span className="text-xs text-muted-foreground">{listing.micro_name}</span>
            </div>
            <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-1">
              {listing.display_title || 'Untitled'}
            </h3>
            {listing.starting_price && (
              <p className="text-xs text-primary font-medium mt-0.5">
                From {listing.starting_price} €
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
              <Link to={`/professional/listings/${listing.id}/edit`}>
                <Edit className="h-3.5 w-3.5" /> Edit
              </Link>
            </Button>

            {listing.status === 'draft' && (
              <Button
                size="sm"
                className="h-8 gap-1.5"
                disabled={!canPublish || publish.isPending}
                onClick={() => publish.mutate(listing.id)}
              >
                <Globe className="h-3.5 w-3.5" /> Publish
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
                  <Pause className="h-3.5 w-3.5" /> Pause
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5" asChild>
                  <Link to={`/services/listing/${listing.id}`}>
                    <Eye className="h-3.5 w-3.5" /> View
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
                <Play className="h-3.5 w-3.5" /> Unpause
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
        {/* Hub header with hint + Add/Remove Categories */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {t('pro.manageListingsPageHint', 'Edit and publish your services to appear on the platform.')}
          </p>
          <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
            <Link to="/onboarding/professional?edit=1&step=services">
              <Wrench className="h-3.5 w-3.5" />
              {t('pro.addRemoveCategories', 'Add / Remove Categories')}
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="draft">
          <TabsList className="mb-4">
            <TabsTrigger value="draft">Draft ({drafts.length})</TabsTrigger>
            <TabsTrigger value="live">Live ({live.length})</TabsTrigger>
            <TabsTrigger value="paused">Paused ({paused.length})</TabsTrigger>
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
        <Link to="/onboarding/professional?edit=1&step=services">
          <Wrench className="h-4 w-4 mr-1.5" /> {t('pro.addRemoveCategories', 'Add / Remove Categories')}
        </Link>
      </Button>
    </div>
  );
}
