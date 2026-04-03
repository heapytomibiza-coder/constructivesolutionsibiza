/**
 * Service Listing Editor - Edit form for a single listing
 * Handles: title, description, hero image, gallery, location, pricing items, publish
 */
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Globe, ImagePlus, Loader2, Plus, Save, Trash2, ArrowUp, ArrowDown, ImageIcon, Sparkles } from 'lucide-react';
import { StockPhotoPicker } from './components/StockPhotoPicker';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useListingDetail, useUpdateListing, useUpsertPricingItem, useDeletePricingItem, type PricingItem } from './hooks/useListingEditor';
import { IBIZA_ZONES, getAllZones } from '@/shared/components/professional/zones';
import { evaluateListingReadiness } from '@/lib/listingPublishRules';
import { resolveRequiredIssuesMessage } from '@/lib/publishIssueMessages';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useQuery } from '@tanstack/react-query';

export default function ServiceListingEditor() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('professional');
  const { user } = useSession();
  const { data: listing, isLoading } = useListingDetail(listingId);
  const updateListing = useUpdateListing();
  const upsertPricing = useUpsertPricingItem();
  const deletePricing = useDeletePricingItem();
  const { limit: getLimit } = useEntitlements();
  const listingLimit = getLimit('listing_limit');

  // Count current live listings for this provider (excludes current listing if already live)
  const { data: liveCount = 0 } = useQuery({
    queryKey: ['live-listing-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('service_listings')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', user.id)
        .eq('status', 'live');
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });
  // publishListing now handled inline in handlePublish for atomic write

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [locationBase, setLocationBase] = useState<string>('');
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aiAssisting, setAiAssisting] = useState(false);
  const [stockPickerOpen, setStockPickerOpen] = useState(false);
  const [stockPickerTarget, setStockPickerTarget] = useState<'hero' | 'gallery'>('hero');

  // Track whether we've done the initial sync from server
  const [initialSynced, setInitialSynced] = useState(false);

  // Sync form state from loaded data — only on initial load
  useEffect(() => {
    if (listing && !initialSynced) {
      setTitle(listing.display_title || '');
      setDescription(listing.short_description || '');
      setHeroUrl(listing.hero_image_url);
      setGallery(listing.gallery || []);
      setLocationBase(listing.location_base || '');
      setPricingItems(listing.pricing_items);
      setInitialSynced(true);
    }
  }, [listing, initialSynced]);

  // Keep pricing items in sync with server (they're managed server-side)
  useEffect(() => {
    if (listing && initialSynced) {
      setPricingItems(listing.pricing_items);
    }
  }, [listing?.pricing_items]);

  const handleSave = async () => {
    if (!listingId) return;

    // Guard: prevent breaking live listings by blanking required fields
    if (listing?.status === 'live') {
      const hasPricing = pricingItems.some(p => p.is_enabled && p.price_amount && p.price_amount > 0);
      const { canPublish } = evaluateListingReadiness({
        display_title: title,
        short_description: description,
        hero_image_url: heroUrl,
        hasPricing,
      });
      if (!canPublish) {
        toast.error(t('listingEditor.liveListingMustRemainComplete', 'Live listings must keep title, description, and pricing complete'));
        return;
      }
    }

    try {
      // Auto-compute pricing_summary from lowest enabled pricing item
      const unitLabels: Record<string, string> = { hour: 'hr', day: 'day', sqm: 'm²', job: 'job', item: 'item' };
      const enabledWithPrice = pricingItems
        .filter(p => p.is_enabled && p.price_amount && p.price_amount > 0)
        .sort((a, b) => (a.price_amount ?? 0) - (b.price_amount ?? 0));
      const cheapest = enabledWithPrice[0];
      const pricingSummary = cheapest
        ? `From ${cheapest.price_amount} €/${unitLabels[cheapest.unit] || cheapest.unit}`
        : null;

      await updateListing.mutateAsync({
        id: listingId,
        display_title: title,
        short_description: description,
        hero_image_url: heroUrl,
        gallery,
        location_base: locationBase || null,
        pricing_summary: pricingSummary,
      });

      // Fire-and-forget: translate user-generated content
      if (title.trim() || description.trim()) {
        supabase.functions.invoke('translate-content', {
          body: {
            entity: 'service_listings',
            id: listingId,
            fields: {
              display_title: title,
              short_description: description,
            },
          },
        }).catch(() => { /* translation is best-effort */ });
      }

      toast.success(t('listingEditor.listingSaved'));
    } catch (err) {
      toast.error(t('listingEditor.saveFailed'));
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!listingId || !listing) return;
    const hasPricing = pricingItems.some(p => p.is_enabled && p.price_amount && p.price_amount > 0);
    // If this listing is already live, it doesn't count against the limit for re-publish
    const effectiveLiveCount = listing.status === 'live' ? liveCount - 1 : liveCount;
    const { canPublish, issues } = evaluateListingReadiness({
      display_title: title,
      short_description: description,
      hero_image_url: heroUrl,
      hasPricing,
      currentLiveCount: effectiveLiveCount,
      listingLimit,
    });
    if (!canPublish) {
      const requiredIssues = issues.filter(i => i.severity === 'required');
      if (requiredIssues.some(i => i.field === 'listing_limit')) {
        toast.error(t('listingEditor.listingLimitReached', 'You have reached your live listing limit. Upgrade your plan to publish more listings.'));
      } else {
        toast.error(requiredIssues.map(i => t(i.messageKey, i.field)).join('. '));
      }
      return;
    }

    // Flush any unsaved pricing items before publishing
    // This handles the edge case where user edits a price but clicks Publish before blurring
    try {
      const dirtyItems = pricingItems.filter(p => p.id);
      await Promise.all(dirtyItems.map(item =>
        upsertPricing.mutateAsync({
          id: item.id,
          service_listing_id: listingId,
          label: item.label,
          price_amount: item.price_amount,
          unit: item.unit,
          info_description: item.info_description,
          is_enabled: item.is_enabled,
          sort_order: item.sort_order,
        })
      ));
    } catch {
      toast.error(t('listingEditor.saveFailed'));
      return;
    }

    // Atomic publish: single write combining save + status change
    // The DB trigger handles published_at automatically
    try {
      setIsPublishing(true);

      const unitLabels: Record<string, string> = { hour: 'hr', day: 'day', sqm: 'm²', job: 'job', item: 'item' };
      const enabledWithPrice = pricingItems
        .filter(p => p.is_enabled && p.price_amount && p.price_amount > 0)
        .sort((a, b) => (a.price_amount ?? 0) - (b.price_amount ?? 0));
      const cheapest = enabledWithPrice[0];
      const pricingSummary = cheapest
        ? `From ${cheapest.price_amount} €/${unitLabels[cheapest.unit] || cheapest.unit}`
        : null;

      const { error } = await supabase
        .from('service_listings')
        .update({
          display_title: title,
          short_description: description,
          hero_image_url: heroUrl,
          gallery,
          location_base: locationBase || null,
          pricing_summary: pricingSummary,
          status: 'live',
        })
        .eq('id', listingId);

      if (error) throw error;

      // Fire-and-forget translation
      if (title.trim() || description.trim()) {
        supabase.functions.invoke('translate-content', {
          body: {
            entity: 'service_listings',
            id: listingId,
            fields: { display_title: title, short_description: description },
          },
        }).catch(() => {});
      }

      toast.success(t('listingEditor.listingPublished', 'Listing published'));
      navigate('/professional/listings');
    } catch (err: any) {
      const msg = err?.message || err?.toString() || '';
      if (msg.includes('LISTING_LIMIT_REACHED')) {
        toast.error(t('listingEditor.listingLimitReached', 'You have reached your live listing limit. Upgrade your plan to publish more listings.'));
      } else {
        toast.error(t('listingEditor.publishFailed', 'Failed to publish listing'));
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('service-images')
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(path);

      if (type === 'hero') {
        setHeroUrl(publicUrl);
      } else {
        if (gallery.length < 3) {
          setGallery(prev => [...prev, publicUrl]);
        } else {
          toast.error(t('listingEditor.maxGallery'));
        }
      }

      // Fire-and-forget: optimize image in background
      supabase.functions.invoke('optimize-image', {
        body: { bucket: 'service-images', path },
      }).then(({ data, error }) => {
        if (error) {
          console.warn('Image optimization failed (non-blocking):', error);
          return;
        }
        // If hero image, store variant URLs on the listing
        if (type === 'hero' && listingId && data?.variants) {
          supabase.from('service_listings').update({
            hero_thumb_url: data.variants.thumb_url ?? null,
            hero_card_url: data.variants.card_url ?? null,
            hero_large_url: data.variants.large_url ?? null,
          }).eq('id', listingId).then(() => {});
        }
      });
    } catch (err) {
      toast.error(t('listingEditor.uploadFailed'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGallery(prev => prev.filter((_, i) => i !== idx));
  };

  // Pricing items handlers
  const handleAddPricingItem = async () => {
    if (!listingId) return;
    await upsertPricing.mutateAsync({
      service_listing_id: listingId,
      label: 'New service item',
      price_amount: null,
      unit: 'hour',
      sort_order: pricingItems.length,
    });
  };

  const handleSavePricingItem = async (item: PricingItem) => {
    if (!listingId) return;
    await upsertPricing.mutateAsync({
      id: item.id,
      service_listing_id: listingId,
      label: item.label,
      price_amount: item.price_amount,
      unit: item.unit,
      info_description: item.info_description,
      is_enabled: item.is_enabled,
      sort_order: item.sort_order,
    });
  };

  const handleDeletePricingItem = async (itemId: string) => {
    await deletePricing.mutateAsync(itemId);
  };

  const handleMovePricingItem = (idx: number, direction: 'up' | 'down') => {
    const newItems = [...pricingItems];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newItems.length) return;
    
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    newItems.forEach((item, i) => item.sort_order = i);
    setPricingItems(newItems);
    
    // Save both swapped items
    handleSavePricingItem(newItems[idx]);
    handleSavePricingItem(newItems[swapIdx]);
  };

  const hasPricingForGate = pricingItems.some(p => p.is_enabled && p.price_amount && p.price_amount > 0);
  const { canPublish } = evaluateListingReadiness({
    display_title: title,
    short_description: description,
    hero_image_url: heroUrl,
    hasPricing: hasPricingForGate,
  });
  const allZones = getAllZones();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
          <div className="container flex h-14 items-center gap-3">
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
        </nav>
        <div className="container py-8 max-w-2xl space-y-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('listingEditor.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link to="/professional/listings"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="font-display text-lg font-semibold truncate">{t('listingEditor.editListing')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={updateListing.isPending}
            >
              {updateListing.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              {t('listingEditor.save')}
            </Button>
            {listing.status === 'draft' && (
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={!canPublish || isPublishing}
              >
                {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4 mr-1.5" />}
                {t('listingEditor.publish')}
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container py-5 sm:py-8 max-w-2xl space-y-6">
        {/* Listing Details */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('listingEditor.listingDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('listingEditor.displayTitle')} *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('listingEditor.displayTitlePlaceholder')}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">{t('listingEditor.shortDescription')} *</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 200))}
                placeholder={t('listingEditor.shortDescPlaceholder')}
                maxLength={200}
                rows={2}
              />
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 text-primary hover:text-primary/80 px-1 h-7"
                  disabled={aiAssisting || !title.trim() || !description.trim()}
                  onClick={async () => {
                    setAiAssisting(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('listing-description-assist', {
                        body: { title, sentence: description, lang: i18n.language },
                      });
                      if (error) throw error;
                      if (data?.description) {
                        setDescription(data.description);
                        toast.success(t('listingEditor.aiAssisted'));
                      }
                    } catch (err) {
                      console.error('AI assist failed:', err);
                      toast.error(t('listingEditor.aiAssistFailed'));
                    } finally {
                      setAiAssisting(false);
                    }
                  }}
                >
                  {aiAssisting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {t('listingEditor.needHelp')}
                </Button>
                <p className="text-xs text-muted-foreground">{description.length}/200</p>
              </div>
            </div>

            {/* Hero Image */}
            <div className="space-y-2">
              <Label>{t('listingEditor.heroImage')} <span className="text-xs font-normal text-muted-foreground">({t('common.recommended', 'recommended')})</span></Label>
              {heroUrl ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                  <img src={heroUrl} alt="Hero" className="w-full h-full object-cover" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => setHeroUrl(null)}
                  >
                    {t('listingEditor.change')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">{t('listingEditor.heroImageUpload')}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'hero')} />
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => { setStockPickerTarget('hero'); setStockPickerOpen(true); }}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {t('listingEditor.browseStockPhotos', 'Browse Stock Photos')}
                  </Button>
                </div>
              )}
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <Label>{t('listingEditor.gallery')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-border">
                    <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => handleRemoveGalleryImage(idx)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {gallery.length < 3 && (
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center justify-center aspect-square rounded-md border-2 border-dashed border-border cursor-pointer hover:border-primary/50">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'gallery')} />
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1 text-xs h-7"
                      onClick={() => { setStockPickerTarget('gallery'); setStockPickerOpen(true); }}
                    >
                      <ImageIcon className="h-3 w-3" />
                      {t('listingEditor.stockPhoto', 'Stock')}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>{t('listingEditor.locationBase')}</Label>
              <Select value={locationBase} onValueChange={setLocationBase}>
                <SelectTrigger>
                  <SelectValue placeholder={t('listingEditor.selectZone')} />
                </SelectTrigger>
                <SelectContent>
                  {IBIZA_ZONES.map(group => (
                    group.zones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id}>{zone.label}</SelectItem>
                    ))
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* Pricing Items */}
        <Card className="border-border/70">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{t('listingEditor.pricingMenu')} *</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('listingEditor.pricingRequired', 'At least one price is required to publish')}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddPricingItem} disabled={upsertPricing.isPending}>
              <Plus className="h-4 w-4 mr-1.5" /> {t('listingEditor.addItem')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pricingItems.length === 0 ? (
              <button
                type="button"
                onClick={handleAddPricingItem}
                className="w-full flex flex-col items-center justify-center py-8 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Plus className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium text-primary">
                  {t('listingEditor.addFirstPrice', 'Add your first price')}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {t('listingEditor.addFirstPriceHint', 'e.g. "Standard clean — 25 €/hr"')}
                </span>
              </button>
            ) : (
              pricingItems.map((item, idx) => (
                <PricingItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  total={pricingItems.length}
                  onSave={handleSavePricingItem}
                  onDelete={handleDeletePricingItem}
                  onMove={handleMovePricingItem}
                />
              ))
            )}
          </CardContent>
        </Card>
        {/* Stock Photo Picker */}
        <StockPhotoPicker
          open={stockPickerOpen}
          onOpenChange={setStockPickerOpen}
          defaultSearch={title || ''}
          onSelect={(url) => {
            if (stockPickerTarget === 'hero') {
              setHeroUrl(url);
            } else {
              if (gallery.length < 3) {
                setGallery(prev => [...prev, url]);
              }
            }
          }}
        />
      </div>
    </div>
  );
}

function PricingItemRow({
  item,
  index,
  total,
  onSave,
  onDelete,
  onMove,
}: {
  item: PricingItem;
  index: number;
  total: number;
  onSave: (item: PricingItem) => void;
  onDelete: (id: string) => void;
  onMove: (idx: number, dir: 'up' | 'down') => void;
}) {
  const { t } = useTranslation('professional');
  const [label, setLabel] = useState(item.label);
  const [price, setPrice] = useState(item.price_amount?.toString() ?? '');
  const [unit, setUnit] = useState(item.unit);
  const [info, setInfo] = useState(item.info_description ?? '');
  const [enabled, setEnabled] = useState(item.is_enabled);
  const [dirty, setDirty] = useState(false);

  const handleBlur = () => {
    if (!dirty) return;
    onSave({
      ...item,
      label,
      price_amount: price ? parseFloat(price) : null,
      unit,
      info_description: info || null,
      is_enabled: enabled,
    });
    setDirty(false);
  };

  const markDirty = () => setDirty(true);

  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => onMove(index, 'up')}>
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === total - 1} onClick={() => onMove(index, 'down')}>
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={enabled}
            onCheckedChange={v => { setEnabled(v); markDirty(); setTimeout(handleBlur, 0); }}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input
          placeholder={t('listingEditor.itemLabelPlaceholder')}
          value={label}
          onChange={e => { setLabel(e.target.value); markDirty(); }}
          onBlur={handleBlur}
          className="sm:col-span-2"
        />
        <div className="flex gap-2">
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={e => { setPrice(e.target.value); markDirty(); }}
              onBlur={handleBlur}
              className={`w-24 ${!price || parseFloat(price) <= 0 ? 'border-destructive/50' : ''}`}
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <Select value={unit} onValueChange={v => { setUnit(v); markDirty(); setTimeout(handleBlur, 0); }}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['hour', 'day', 'sqm', 'job', 'item'] as const).map(u => (
                <SelectItem key={u} value={u}>{t(`listingEditor.units.${u}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Input
        placeholder={t('listingEditor.infoPlaceholder')}
        value={info}
        onChange={e => { setInfo(e.target.value); markDirty(); }}
        onBlur={handleBlur}
        className="text-sm"
      />
    </div>
  );
}
