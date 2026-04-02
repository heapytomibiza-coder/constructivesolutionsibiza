/**
 * ProjectGallery — Aggregates all photos from progress updates into a visual grid.
 * Shown on the job ticket as a gallery view of the project story.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Images, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface ProjectGalleryProps {
  jobId: string;
  jobStatus: string;
}

interface GalleryPhoto {
  id: string;
  photo_url: string;
  note: string | null;
  created_at: string;
  author_id: string;
}

export function ProjectGallery({ jobId, jobStatus }: ProjectGalleryProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useSession();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { data: photos = [] } = useQuery({
    queryKey: ['job_gallery_photos', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_progress_updates')
        .select('id, photo_url, note, created_at, author_id')
        .eq('job_id', jobId)
        .not('photo_url', 'is', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as GalleryPhoto[];
    },
    enabled: !!jobId && !!user,
  });

  // Only show if there are photos and job is in_progress or completed
  if (photos.length === 0 || !['in_progress', 'completed'].includes(jobStatus)) return null;

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  const goNext = () => setSelectedIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : prev));
  const goPrev = () => setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));

  return (
    <>
      <Card className="rounded-[22px] border-border/70 shadow-sm overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Images className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold font-display text-foreground">
              {t('gallery.title', 'Project Gallery')}
            </h3>
            <span className="text-[12px] text-muted-foreground ml-auto">
              {t('gallery.count', '{{count}} photos', { count: photos.length })}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => openLightbox(index)}
                className="aspect-square rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <img
                  src={photo.photo_url}
                  alt={photo.note || t('gallery.photoAlt', 'Project photo')}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-3xl p-0 bg-black/95 border-none">
          {selectedIndex !== null && photos[selectedIndex] && (
            <div className="relative">
              <img
                src={photos[selectedIndex].photo_url}
                alt={photos[selectedIndex].note || ''}
                className="w-full max-h-[80vh] object-contain"
              />

              {/* Nav buttons */}
              {selectedIndex > 0 && (
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {selectedIndex < photos.length - 1 && (
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {photos[selectedIndex].note && (
                  <p className="text-white text-sm mb-1">{photos[selectedIndex].note}</p>
                )}
                <p className="text-white/60 text-xs">
                  {format(new Date(photos[selectedIndex].created_at), 'dd MMM yyyy, HH:mm')}
                </p>
                <p className="text-white/40 text-xs">
                  {selectedIndex + 1} / {photos.length}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
