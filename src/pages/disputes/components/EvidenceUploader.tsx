import { useState, useCallback } from 'react';
import { Upload, X, Image, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EVIDENCE_CATEGORIES = [
  { value: 'photo', label: 'Photo' },
  { value: 'video', label: 'Video' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'message', label: 'Message / Screenshot' },
  { value: 'plan', label: 'Plan / Drawing' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'document', label: 'Other Document' },
];

interface EvidenceFile {
  file: File;
  description: string;
  category: string;
  preview?: string;
}

interface Props {
  files: EvidenceFile[];
  onChange: (files: EvidenceFile[]) => void;
}

function inferCategory(file: File): string {
  if (file.type.startsWith('image/')) return 'photo';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
}

export function EvidenceUploader({ files, onChange }: Props) {
  const handleAdd = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []).map((file) => ({
        file,
        description: '',
        category: inferCategory(file),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      onChange([...files, ...newFiles]);
      e.target.value = '';
    },
    [files, onChange]
  );

  const remove = (idx: number) => {
    const updated = [...files];
    if (updated[idx].preview) URL.revokeObjectURL(updated[idx].preview!);
    updated.splice(idx, 1);
    onChange(updated);
  };

  const updateDescription = (idx: number, desc: string) => {
    const updated = [...files];
    updated[idx] = { ...updated[idx], description: desc };
    onChange(updated);
  };

  const updateCategory = (idx: number, category: string) => {
    const updated = [...files];
    updated[idx] = { ...updated[idx], category };
    onChange(updated);
  };

  const getIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">Upload evidence</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Photos, videos, documents, invoices, or messages that support your case
        </p>
      </div>

      <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Click to upload files</span>
        <span className="text-xs text-muted-foreground">Images, videos, PDFs up to 10MB</span>
        <input
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleAdd}
          className="hidden"
        />
      </label>

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((f, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              {f.preview ? (
                <img src={f.preview} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  {getIcon(f.file.type)}
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm font-medium truncate">{f.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(f.file.size / 1024).toFixed(0)} KB
                </p>
                <Select value={f.category} onValueChange={(v) => updateCategory(idx, v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-xs">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Describe this evidence..."
                  value={f.description}
                  onChange={(e) => updateDescription(idx, e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(idx)} className="flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { EvidenceFile };
