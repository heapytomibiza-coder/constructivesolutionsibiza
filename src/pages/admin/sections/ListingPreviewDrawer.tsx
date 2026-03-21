import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Image as ImageIcon, MapPin, Euro } from "lucide-react";

interface ListingPreviewDrawerProps {
  listingId: string | null;
  onClose: () => void;
}

export default function ListingPreviewDrawer({ listingId, onClose }: ListingPreviewDrawerProps) {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async ({ newStatus }: { newStatus: string }) => {
      const updateFields: Record<string, any> = { status: newStatus };
      if (newStatus === 'live') updateFields.published_at = new Date().toISOString();
      const { error } = await supabase
        .from('service_listings')
        .update(updateFields)
        .eq('id', listingId!);
      if (error) throw error;
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listing-preview', listingId] });
      toast.success(newStatus === 'live' ? 'Listing approved and set to Live' : `Listing set to ${newStatus}`);
    },
    onError: (error: any) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-listing-preview", listingId],
    enabled: !!listingId,
    retry: 2,
    queryFn: async () => {
      // Use browse view first (security_invoker=false, works for any user)
      // Fall back to direct table query for non-live listings
      const { data: browseData } = await supabase
        .from("service_listings_browse")
        .select("*")
        .eq("id", listingId!)
        .maybeSingle();

      let listing: any;

      if (browseData) {
        listing = browseData;
      } else {
        // Direct query for draft/paused listings (admin RLS)
        const { data: directData, error: directError } = await supabase
          .from("service_listings")
          .select("*")
          .eq("id", listingId!)
          .single();
        if (directError) throw directError;
        listing = directData;
      }

      const [pricingRes, providerRes, microRes] = await Promise.all([
        supabase
          .from("service_pricing_items")
          .select("*")
          .eq("service_listing_id", listingId!)
          .order("sort_order", { ascending: true }),
        supabase
          .from("professional_profiles")
          .select("display_name, avatar_url, verification_status, business_name")
          .eq("user_id", listing.provider_id)
          .single(),
        supabase
          .from("service_micro_categories")
          .select("name, slug")
          .eq("id", listing.micro_id)
          .single(),
      ]);

      return {
        listing,
        pricingItems: pricingRes.data ?? [],
        provider: providerRes.data,
        micro: microRes.data,
      };
    },
  });

  return (
    <Sheet open={!!listingId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Listing Preview</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <p className="text-center text-muted-foreground py-16">
            {error ? `Error: ${error.message}` : 'Could not load listing.'}
          </p>
        ) : (
          <div className="space-y-6 pt-4">
            {/* Hero image */}
            {data.listing.hero_image_url ? (
              <img
                src={data.listing.hero_image_url}
                alt={data.listing.display_title}
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">No hero image</span>
              </div>
            )}

            {/* Gallery */}
            {data.listing.gallery && data.listing.gallery.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {data.listing.gallery.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Gallery ${i + 1}`}
                    className="w-20 h-20 object-cover rounded flex-shrink-0"
                  />
                ))}
              </div>
            )}

            {/* Status + Category */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{data.listing.status}</Badge>
              {data.micro && (
                <Badge variant="secondary">{data.micro.name}</Badge>
              )}
              {data.listing.location_base && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {data.listing.location_base}
                </span>
              )}
            </div>

            {/* Title + Description */}
            <div>
              <h3 className="text-lg font-semibold">
                {data.listing.display_title || "Untitled"}
              </h3>
              {data.listing.short_description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {data.listing.short_description}
                </p>
              )}
            </div>

            <Separator />

            {/* Provider */}
            <div>
              <h4 className="text-sm font-medium mb-2">Provider</h4>
              <div className="flex items-center gap-3">
                {data.provider?.avatar_url ? (
                  <img
                    src={data.provider.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {data.provider?.display_name || data.provider?.business_name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.provider?.verification_status ?? "unverified"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Pricing items */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Pricing ({data.pricingItems.length} items)
              </h4>
              {data.pricingItems.length === 0 ? (
                <p className="text-sm text-destructive">⚠ No pricing items — cannot go live</p>
              ) : (
                <div className="space-y-2">
                  {data.pricingItems.map((item: any) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        !item.is_enabled ? "opacity-50" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.info_description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.info_description}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        {item.price_amount && item.price_amount > 0 ? (
                          <span className="text-sm font-semibold flex items-center gap-0.5">
                            <Euro className="h-3 w-3" />
                            {item.price_amount}
                            <span className="text-xs text-muted-foreground font-normal">
                              /{item.unit}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-destructive">No price</span>
                        )}
                        {!item.is_enabled && (
                          <span className="text-xs text-muted-foreground block">disabled</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing summary */}
            {data.listing.pricing_summary && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1">Pricing Summary</h4>
                  <p className="text-sm text-muted-foreground">{data.listing.pricing_summary}</p>
                </div>
              </>
            )}


            {/* Admin Actions */}
            <Separator />
            <div className="flex gap-2">
              {data.listing.status !== 'live' && (
                <Button
                  className="flex-1 gap-2"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ newStatus: 'live' })}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve &amp; Set Live
                </Button>
              )}
              {data.listing.status === 'live' && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ newStatus: 'paused' })}
                >
                  <PauseCircle className="h-4 w-4" />
                  Pause Listing
                </Button>
              )}
              {data.listing.status === 'paused' && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ newStatus: 'draft' })}
                >
                  Revert to Draft
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
