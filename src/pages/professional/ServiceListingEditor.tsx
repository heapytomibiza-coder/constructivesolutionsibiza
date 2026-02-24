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
import { ArrowLeft, Globe, ImagePlus, Loader2, Plus, Save, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useListingDetail, useUpdateListing, useUpsertPricingItem, useDeletePricingItem, usePublishListing, type PricingItem } from './hooks/useListingEditor';
import { IBIZA_ZONES, getAllZones } from '@/shared/components/professional/zones';

export default function ServiceListingEditor() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: listing, isLoading } = useListingDetail(listingId);
  const updateListing = useUpdateListing();
  const upsertPricing = useUpsertPricingItem();
  const deletePricing = useDeletePricingItem();
  const publishListing = usePublishListing();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [locationBase, setLocationBase] = useState<string>('');
  const [pricingSummary, setPricingSummary] = useState('');
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // Sync form state from loaded data
  useEffect(() => {
    if (listing) {
      setTitle(listing.display_title || '');
      setDescription(listing.short_description || '');
      setHeroUrl(listing.hero_image_url);
      setGallery(listing.gallery || []);
      setLocationBase(listing.location_base || '');
      setPricingSummary(listing.pricing_summary || '');
      setPricingItems(listing.pricing_items);
    }
  }, [listing]);

  const handleSave = async () => {
    if (!listingId) return;
    try {
      await updateListing.mutateAsync({
        id: listingId,
        display_title: title,
        short_description: description,
        hero_image_url: heroUrl,
        gallery,
        location_base: locationBase || null,
        pricing_summary: pricingSummary || null,
      });
      toast.success('Listing saved');
    } catch (err) {
      toast.error('Failed to save listing');
    }
  };

  const handlePublish = async () => {
    if (!listingId) return;
    if (!title.trim() || !description.trim() || !heroUrl) {
      toast.error('Please fill in title, description, and upload a hero image before publishing');
      return;
    }
    // Save first, then publish
    await handleSave();
    publishListing.mutate(listingId, {
      onSuccess: () => navigate('/professional/listings'),
    });
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
          toast.error('Maximum 3 gallery images');
        }
      }
    } catch (err) {
      toast.error('Upload failed');
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

  const canPublish = title.trim() && description.trim() && heroUrl;
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
        <p className="text-muted-foreground">Listing not found</p>
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
            <h1 className="font-display text-lg font-semibold truncate">Edit Listing</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={updateListing.isPending}
            >
              {updateListing.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save
            </Button>
            {listing.status === 'draft' && (
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={!canPublish || publishListing.isPending}
              >
                {publishListing.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4 mr-1.5" />}
                Publish
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container py-5 sm:py-8 max-w-2xl space-y-6">
        {/* Listing Details */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Listing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Display Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Professional Plumbing Services"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Short Description *</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe your service (max 200 chars)"
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/200</p>
            </div>

            {/* Hero Image */}
            <div className="space-y-2">
              <Label>Hero Image *</Label>
              {heroUrl ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                  <img src={heroUrl} alt="Hero" className="w-full h-full object-cover" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => setHeroUrl(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload hero image</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'hero')} />
                </label>
              )}
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <Label>Gallery (up to 3)</Label>
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
                  <label className="flex items-center justify-center aspect-square rounded-md border-2 border-dashed border-border cursor-pointer hover:border-primary/50">
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'gallery')} />
                  </label>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location Base</Label>
              <Select value={locationBase} onValueChange={setLocationBase}>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
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

            {/* Pricing Summary */}
            <div className="space-y-2">
              <Label>Pricing Summary</Label>
              <Input
                value={pricingSummary}
                onChange={e => setPricingSummary(e.target.value)}
                placeholder="e.g. Starting at 40 EUR/hr"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Items */}
        <Card className="border-border/70">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pricing Menu</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddPricingItem} disabled={upsertPricing.isPending}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pricingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pricing items yet. Add your first one above.</p>
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
          placeholder="Item label"
          value={label}
          onChange={e => { setLabel(e.target.value); markDirty(); }}
          onBlur={handleBlur}
          className="sm:col-span-2"
        />
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Price"
            value={price}
            onChange={e => { setPrice(e.target.value); markDirty(); }}
            onBlur={handleBlur}
            className="w-24"
          />
          <Select value={unit} onValueChange={v => { setUnit(v); markDirty(); setTimeout(handleBlur, 0); }}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Input
        placeholder="Info / description (optional)"
        value={info}
        onChange={e => { setInfo(e.target.value); markDirty(); }}
        onBlur={handleBlur}
        className="text-sm"
      />
    </div>
  );
}
