/**
 * StockPhotoPicker - Dialog to browse and select curated trade photos
 * No external API needed — all images are bundled locally.
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StockPhoto {
  id: string;
  src: string;
  label: string;
  category: string;
}

const STOCK_PHOTOS: StockPhoto[] = [
  { id: 'plumbing-01', src: '/stock-photos/plumbing-01.jpg', label: 'Plumbing', category: 'plumbing' },
  { id: 'electrical-01', src: '/stock-photos/electrical-01.jpg', label: 'Electrical', category: 'electrical' },
  { id: 'painting-01', src: '/stock-photos/painting-01.jpg', label: 'Painting', category: 'painting' },
  { id: 'tiling-01', src: '/stock-photos/tiling-01.jpg', label: 'Tiling', category: 'tiling' },
  { id: 'carpentry-01', src: '/stock-photos/carpentry-01.jpg', label: 'Carpentry', category: 'carpentry' },
  { id: 'pool-01', src: '/stock-photos/pool-01.jpg', label: 'Pool', category: 'pool' },
  { id: 'garden-01', src: '/stock-photos/garden-01.jpg', label: 'Garden', category: 'garden' },
  { id: 'cleaning-01', src: '/stock-photos/cleaning-01.jpg', label: 'Cleaning', category: 'cleaning' },
  { id: 'kitchen-renovation-01', src: '/stock-photos/kitchen-renovation-01.jpg', label: 'Kitchen', category: 'renovation' },
  { id: 'bathroom-01', src: '/stock-photos/bathroom-01.jpg', label: 'Bathroom', category: 'renovation' },
  { id: 'construction-01', src: '/stock-photos/construction-01.jpg', label: 'Construction', category: 'construction' },
  { id: 'aircon-01', src: '/stock-photos/aircon-01.jpg', label: 'Air Con', category: 'hvac' },
  { id: 'locksmith-01', src: '/stock-photos/locksmith-01.jpg', label: 'Locksmith', category: 'security' },
  { id: 'moving-01', src: '/stock-photos/moving-01.jpg', label: 'Moving', category: 'moving' },
  { id: 'windows-01', src: '/stock-photos/windows-01.jpg', label: 'Windows', category: 'windows' },
  { id: 'terrace-01', src: '/stock-photos/terrace-01.jpg', label: 'Terrace', category: 'outdoor' },
  { id: 'solar-01', src: '/stock-photos/solar-01.jpg', label: 'Solar', category: 'electrical' },
  { id: 'pest-control-01', src: '/stock-photos/pest-control-01.jpg', label: 'Pest Control', category: 'pest-control' },
  { id: 'metalwork-01', src: '/stock-photos/metalwork-01.jpg', label: 'Metalwork', category: 'metalwork' },
  { id: 'interior-design-01', src: '/stock-photos/interior-design-01.jpg', label: 'Interior', category: 'renovation' },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'renovation', label: 'Renovation' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'painting', label: 'Painting' },
  { id: 'construction', label: 'Construction' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'cleaning', label: 'Cleaning' },
];

interface StockPhotoPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  defaultSearch?: string;
}

export function StockPhotoPicker({ open, onOpenChange, onSelect }: StockPhotoPickerProps) {
  const { t } = useTranslation('professional');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return STOCK_PHOTOS;
    return STOCK_PHOTOS.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  const handleSelect = (photo: StockPhoto) => {
    onSelect(photo.src);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('stockPhotos.title', 'Choose a Photo')}</DialogTitle>
          <DialogDescription>{t('stockPhotos.description', 'Select a professional image for your listing')}</DialogDescription>
        </DialogHeader>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto mt-3">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => handleSelect(photo)}
                  className="relative aspect-video rounded-md overflow-hidden border border-border hover:border-primary/50 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer group"
                >
                  <img
                    src={photo.src}
                    alt={photo.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <span className="absolute bottom-1 left-1 text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded">
                    {photo.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('stockPhotos.noResults', 'No photos in this category')}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
