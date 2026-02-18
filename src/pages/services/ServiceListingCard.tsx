import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, MapPin } from 'lucide-react';
import type { ServiceListingCard as ServiceListingCardType } from './queries/serviceListings.query';

function formatStartingPrice(price: number | null, unit: string | null): string {
  if (!price || price <= 0) return '';
  const unitLabel = unit === 'hour' ? '/hr' : unit === 'day' ? '/day' : unit === 'sqm' ? '/m²' : '';
  return `From ${price} €${unitLabel}`;
}

export function ServiceListingCardComponent({ listing }: { listing: ServiceListingCardType }) {
  const priceLabel = formatStartingPrice(listing.starting_price, listing.starting_price_unit);

  return (
    <Link to={`/services/listing/${listing.id}`}>
      <Card className="h-full card-grounded transition-all hover:shadow-soft hover:border-accent/50 cursor-pointer group overflow-hidden">
        {/* Image */}
        <div className="aspect-[16/10] bg-muted overflow-hidden">
          {listing.hero_image_url ? (
            <img
              src={listing.hero_image_url}
              alt={listing.display_title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Category badge */}
          {listing.category_name && (
            <Badge variant="secondary" className="text-xs font-normal">
              {listing.category_name}
            </Badge>
          )}

          {/* Title */}
          <h3 className="font-display text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {listing.display_title}
          </h3>

          {/* Provider */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={listing.provider_avatar ?? undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {(listing.provider_name ?? '?')[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              {listing.provider_name ?? 'Professional'}
            </span>
          </div>

          {/* Price + meta */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            {priceLabel ? (
              <span className="text-sm font-semibold text-primary">{priceLabel}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Quote required</span>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {listing.location_base && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {listing.location_base}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {listing.view_count}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
