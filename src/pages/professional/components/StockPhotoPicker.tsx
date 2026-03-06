/**
 * StockPhotoPicker - Dialog to search and select stock photos from Unsplash
 */
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string | null;
  user: { name: string; links: { html: string } };
}

interface StockPhotoPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  defaultSearch?: string;
}

export function StockPhotoPicker({ open, onOpenChange, onSelect, defaultSearch = '' }: StockPhotoPickerProps) {
  const { t } = useTranslation('professional');
  const [query, setQuery] = useState(defaultSearch);
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-stock-photos', {
        body: { query: query.trim(), per_page: 12 },
      });
      if (error) throw error;
      setPhotos(data?.results ?? []);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleSelect = (photo: UnsplashPhoto) => {
    // Use regular size for hero images (Unsplash requires hotlinking, no re-upload)
    onSelect(photo.urls.regular);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('stockPhotos.title', 'Choose a Stock Photo')}</DialogTitle>
          <DialogDescription>{t('stockPhotos.description', 'Search free photos from Unsplash')}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder={t('stockPhotos.searchPlaceholder', 'e.g. kitchen renovation, plumbing...')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()} size="sm" className="shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => handleSelect(photo)}
                    className="relative aspect-video rounded-md overflow-hidden border border-border hover:border-primary/50 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer group"
                  >
                    <img
                      src={photo.urls.small}
                      alt={photo.alt_description || 'Stock photo'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <span className="absolute bottom-1 left-1 text-[9px] text-white/80 bg-black/40 px-1 rounded">
                      {photo.user.name}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-3">
                {t('stockPhotos.attribution', 'Photos by Unsplash')}
              </p>
            </>
          ) : searched ? (
            <div className="text-center py-12">
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('stockPhotos.noResults', 'No photos found. Try a different search.')}</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('stockPhotos.hint', 'Search for photos related to your service')}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
