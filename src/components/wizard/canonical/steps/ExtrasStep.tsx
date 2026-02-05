/**
 * Extras Step
 * Photos, notes, and additional information
 */

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import type { WizardState } from '../types';

interface ExtrasStepProps {
  extras: WizardState['extras'];
  onChange: (extras: Partial<WizardState['extras']>) => void;
}

export function ExtrasStep({ extras, onChange }: ExtrasStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    
    const newPhotos: string[] = [];
    
    for (const file of Array.from(files)) {
      // Convert to base64
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            newPhotos.push(reader.result);
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    onChange({ photos: [...extras.photos, ...newPhotos] });
    setUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = extras.photos.filter((_, i) => i !== index);
    onChange({ photos: newPhotos });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-semibold">
        Photos & Additional Details
      </h3>

      {/* Photos */}
      <div className="space-y-2">
        <Label className="font-normal">Photos <span className="text-muted-foreground">(optional)</span></Label>
        <p className="text-xs text-muted-foreground mb-3">
          Add photos to help professionals understand the job better
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="grid grid-cols-3 gap-3">
          {extras.photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
              <img 
                src={photo} 
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {extras.photos.length < 6 && (
            <Button
              type="button"
              variant="outline"
              className="aspect-square flex flex-col items-center justify-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {uploading ? 'Adding...' : 'Add Photo'}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional notes (optional)</Label>
        <Textarea
          id="notes"
          value={extras.notes || ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Any other details you'd like to share..."
          rows={4}
        />
      </div>

      {/* Permits concern */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
        <Checkbox
          id="permits"
          checked={extras.permitsConcern || false}
          onCheckedChange={(checked) => 
            onChange({ permitsConcern: checked === true })
          }
        />
        <div className="space-y-1">
          <Label htmlFor="permits" className="cursor-pointer">
            I'm unsure if permits are needed
          </Label>
          <p className="text-xs text-muted-foreground">
            Check this if you'd like the professional to advise on permit requirements
          </p>
        </div>
      </div>
    </div>
  );
}
