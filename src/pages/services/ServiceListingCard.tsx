import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, ShieldCheck } from 'lucide-react';
import { CategoryPlaceholder } from '@/components/CategoryPlaceholder';
import { getCategoryIcon } from '@/lib/categoryIcons';
import type { ServiceListingCard as ServiceListingCardType } from './queries/serviceListings.query';

function formatStartingPrice(price: number | null, unit: string | null): string {
  if (!price || price <= 0) return '';
  const unitLabel = unit === 'hour' ? '/hr' : unit === 'day' ? '/day' : unit === 'sqm' ? '/m²' : '';
  return `From ${price} €${unitLabel}`;
}

function TrustBadge({ verification }: { verification: string | null }) {
  if (verification === 'verified') {
    return (
      <span className="flex items-center gap-1 text-xs text-primary font-medium">
        <ShieldCheck className="h-3.5 w-3.5" />
        Verified
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-success inline-block" />
      New Professional
    </span>
  );
}

export function ServiceListingCardComponent({ listing }: { listing: ServiceListingCardType }) {
  const priceLabel = formatStartingPrice(listing.starting_price, listing.starting_price_unit);
  const CategoryIcon = listing.category_slug ? getCategoryIcon(listing.category_slug) : null;

  return (
    <Link to={`/services/listing/${listing.id}`}>
      <Card className="h-full card-grounded transition-all hover:shadow-soft hover:border-accent/50 cursor-pointer group overflow-hidden flex flex-col min-w-0">
        {/* Fixed aspect ratio image area — always present */}
        <div className="aspect-[4/3] overflow-hidden relative">
          {(listing.hero_card_url || listing.hero_image_url) ? (
            <img
              src={listing.hero_card_url || listing.hero_image_url!}
              alt={listing.display_title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
              width={400}
              height={300}
            />
          ) : (
            <CategoryPlaceholder
              categorySlug={listing.category_slug}
              categoryName={listing.category_name}
              className="w-full h-full"
            />
          )}
        </div>

        <CardContent className="p-4 space-y-2.5 flex-1 flex flex-col">
          {/* Category context tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {listing.category_name && (
              <Badge variant="secondary" className="text-xs font-normal gap-1 px-2">
                {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                {listing.category_name}
              </Badge>
            )}
            {listing.subcategory_name && (
              <span className="text-xs text-muted-foreground">
                {listing.subcategory_name}
              </span>
            )}
          </div>

          {/* Title — micro category as primary title, clamped to 2 lines */}
          <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {listing.display_title}
          </h3>

          {/* Spacer to push bottom content down */}
          <div className="flex-1" />

          {/* Price row */}
          <div className="flex items-center justify-between">
            {priceLabel ? (
              <span className="text-sm font-semibold text-primary">{priceLabel}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Quote on request</span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {listing.view_count}
            </span>
          </div>

          {/* Provider + trust */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={listing.provider_avatar_thumb || listing.provider_avatar || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {(listing.provider_name ?? '?')[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground truncate">
                {listing.provider_name ?? 'Tasker'}
              </span>
            </div>
            <TrustBadge verification={listing.provider_verification ?? null} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
