import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowLeft, Briefcase, Eye, MapPin, MessageCircle, Info, 
  CheckCircle2, Clock, Star 
} from 'lucide-react';
import { useServiceListingDetail } from './queries/serviceListings.query';
import { buildWizardLink } from '@/features/wizard/lib/wizardLink';
import { txCategory, txSubcategory, txMicro } from '@/i18n/taxonomyTranslations';

function formatUnit(unit: string): string {
  switch (unit) {
    case 'hour': return '/hr';
    case 'day': return '/day';
    case 'sqm': return '/m²';
    case 'job': return '/job';
    case 'item': return '/item';
    default: return '';
  }
}

const ServiceListingDetail = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const { t } = useTranslation();
  const { data, isLoading, error } = useServiceListingDetail(listingId);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !data) {
    return (
      <PublicLayout>
        <div className="container py-16 text-center">
          <h1 className="text-xl font-semibold mb-4">Service not found</h1>
          <Button variant="outline" asChild>
            <Link to="/services"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Services</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const { listing, pricingItems, provider, micro, categoryName, subcategoryName } = data;

  const wizardUrl = buildWizardLink(
    micro.slug
      ? { mode: 'directWithService', professionalId: listing.provider_id, microSlug: micro.slug }
      : { mode: 'direct', professionalId: listing.provider_id }
  );

  return (
    <PublicLayout>
      <div className="container py-8 pb-24 lg:pb-8">
        {/* Back link */}
        <Link to="/services" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Services
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image */}
            {listing.hero_image_url && (
              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted">
                <img
                  src={listing.hero_image_url}
                  alt={listing.display_title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Gallery */}
            {listing.gallery && listing.gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {listing.gallery.map((url, i) => (
                  <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted">
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}

            {/* Taxonomy breadcrumbs */}
            {(categoryName || subcategoryName || micro.name) && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                {categoryName && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {txCategory(categoryName, t) ?? categoryName}
                  </Badge>
                )}
                {subcategoryName && (
                  <>
                    <span className="text-muted-foreground/50">›</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {txSubcategory(subcategoryName, t) ?? subcategoryName}
                    </Badge>
                  </>
                )}
                {micro.name && (
                  <>
                    <span className="text-muted-foreground/50">›</span>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {txMicro(micro.slug, t, micro.name)}
                    </Badge>
                  </>
                )}
              </div>
            )}

            {/* Title + description */}
            <div>
              <h1 className="font-display text-2xl font-bold mb-2">{listing.display_title}</h1>
              {listing.short_description && (
                <p className="text-muted-foreground leading-relaxed">{listing.short_description}</p>
              )}
            </div>

            {/* Pricing Menu */}
            {pricingItems.length > 0 && (
              <Card className="card-grounded">
                <CardHeader>
                  <CardTitle className="text-lg">Services & Pricing</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {pricingItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.info_description && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{item.info_description}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-primary whitespace-nowrap">
                          {item.price_amount ? (
                            <>{item.price_amount} €{formatUnit(item.unit)}</>
                          ) : (
                            <span className="text-muted-foreground font-normal">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Provider card */}
            <Card className="card-grounded sticky top-24">
              <CardContent className="p-6 space-y-4">
                {/* Provider header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={provider.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {(provider.display_name ?? '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{provider.display_name ?? 'Tasker'}</h3>
                    {provider.verification_status === 'verified' && (
                      <Badge variant="outline" className="text-xs text-success border-success/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {provider.tagline && (
                  <p className="text-sm text-muted-foreground italic">{provider.tagline}</p>
                )}

                {/* Meta */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {listing.location_base && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {listing.location_base}
                    </div>
                  )}
                  {listing.view_count >= 10 && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {listing.view_count} views
                    </div>
                  )}
                  {listing.published_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Listed {new Date(listing.published_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Pricing summary */}
                {listing.pricing_summary && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-lg font-bold text-primary">{listing.pricing_summary}</p>
                  </div>
                )}

                {/* CTA — Start a Job with context */}
                <Button className="w-full" size="lg" asChild>
                  <Link to={wizardUrl}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Start a Job
                  </Link>
                </Button>

                {/* Secondary — View profile */}
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link to={`/professionals/${listing.provider_id}`}>
                    View Tasker Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm p-3 lg:hidden">
        <Button className="w-full gap-2" asChild>
          <Link to={wizardUrl}>
            <Briefcase className="h-4 w-4" />
            Start a Job
          </Link>
        </Button>
      </div>
    </PublicLayout>
  );
};

export default ServiceListingDetail;
