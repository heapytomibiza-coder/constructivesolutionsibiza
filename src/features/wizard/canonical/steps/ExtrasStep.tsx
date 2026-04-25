/**
 * Extras Step
 * Photos, notes, and additional information.
 *
 * Photo flow:
 * - Authenticated user → upload immediately to `job-photos` bucket, store storage path.
 * - Unauthenticated user → keep File in module-level pending map, store "pending:<id>" marker.
 *   Markers are resolved to storage paths at submit time (after auth).
 * - Renders previews from storage paths (getPublicUrl) or pending Files (object URLs).
 * - Drops legacy "[photo]" / "data:" values that may arrive from old drafts.
 */

import { useState, useRef, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import {
  uploadJobPhoto,
  registerPendingFile,
  resolveJobPhotoUrl,
  isPendingMarker,
} from '../lib/persistJobPhotos';
import type { WizardState } from '../types';

interface ExtrasStepProps {
  extras: WizardState['extras'];
  onChange: (extras: Partial<WizardState['extras']>) => void;
}

const MAX_PHOTOS = 6;

export function ExtrasStep({ extras, onChange }: ExtrasStepProps) {
  const { t } = useTranslation('wizard');
  const { user, isAuthenticated } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Memoize resolved URLs so object URLs are stable across renders
  const resolvedPhotos = useMemo(
    () =>
      extras.photos.map((value) => ({
        value,
        url: resolveJobPhotoUrl(value),
        pending: isPendingMarker(value),
      })),
    [extras.photos],
  );

  // Revoke any object URLs we created when the component unmounts
  useEffect(() => {
    const urls = resolvedPhotos.map((p) => p.url).filter((u): u is string => !!u && u.startsWith('blob:'));
    return () => {
      urls.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch { /* noop */ }
      });
    };
  }, [resolvedPhotos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newValues: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (extras.photos.length + newValues.length >= MAX_PHOTOS) break;

        if (isAuthenticated && user) {
          try {
            const path = await uploadJobPhoto(file, user.id);
            newValues.push(path);
          } catch (err: any) {
            toast.error(err?.message || t('extras.uploadFailed', 'Photo upload failed'));
          }
        } else {
          // Pre-auth: keep File in memory, store marker
          const marker = registerPendingFile(file);
          newValues.push(marker);
        }
      }

      if (newValues.length > 0) {
        onChange({ photos: [...extras.photos, ...newValues] });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = extras.photos.filter((_, i) => i !== index);
    onChange({ photos: newPhotos });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-semibold">
        {t('extras.title')}
      </h3>
      <p className="text-sm text-muted-foreground -mt-2">
        {t('extras.subtitle')}
      </p>

      {/* Photos */}
      <div className="space-y-2">
        <Label className="font-normal">
          {t('extras.photosLabel')}{' '}
          <span className="text-muted-foreground">({t('extras.photosOptional')})</span>
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          {t('extras.photosHelp')}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {resolvedPhotos.map((photo, index) => (
            <div
              key={`${photo.value}-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
            >
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={`${t('extras.photosLabel')} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground p-2 text-center">
                  {t('extras.photoUnavailable', 'Photo unavailable — please re-add')}
                </div>
              )}
              {photo.pending && photo.url && (
                <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-wide bg-background/80 text-foreground px-2 py-0.5 rounded">
                    {t('extras.photoPending', 'Pending sign-in')}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1.5 right-1.5 p-2 rounded-full bg-background/80 hover:bg-background text-foreground touch-target-min flex items-center justify-center"
                aria-label={t('extras.removePhoto', 'Remove photo')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {extras.photos.length < MAX_PHOTOS && (
            <Button
              type="button"
              variant="outline"
              className="aspect-square flex flex-col items-center justify-center gap-2 min-h-[100px]"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {uploading ? t('extras.adding') : t('extras.addPhoto')}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t('extras.notesLabel')}</Label>
        <Textarea
          id="notes"
          value={extras.notes || ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder={t('extras.notesPlaceholder')}
          rows={4}
        />
      </div>

      {/* Permits concern */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30 min-h-[64px] md:min-h-0">
        <Checkbox
          id="permits"
          checked={extras.permitsConcern || false}
          onCheckedChange={(checked) =>
            onChange({ permitsConcern: checked === true })
          }
          className="mt-0.5"
        />
        <div className="space-y-1 flex-1">
          <Label htmlFor="permits" className="cursor-pointer">
            {t('extras.permitsLabel')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('extras.permitsHelp')}
          </p>
        </div>
      </div>
    </div>
  );
}
