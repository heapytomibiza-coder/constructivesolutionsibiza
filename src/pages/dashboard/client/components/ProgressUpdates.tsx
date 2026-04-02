/**
 * ProgressUpdates — Feed of progress updates with photo support.
 * Professionals can post updates during in_progress; clients see them read-only.
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, ImagePlus, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ProgressUpdatesProps {
  jobId: string;
  jobStatus: string;
  isClient: boolean;
  assignedProId: string | null;
}

export function ProgressUpdates({ jobId, jobStatus, isClient, assignedProId }: ProgressUpdatesProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['job_progress_updates', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_progress_updates')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!jobId && !!user,
  });

  const canPost = !isClient && jobStatus === 'in_progress' && user?.id === assignedProId;

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!note.trim() && !selectedFile) {
        throw new Error('Add a note or photo');
      }

      let photoUrl: string | null = null;

      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop() || 'jpg';
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('progress-photos')
          .upload(path, selectedFile, { contentType: selectedFile.type });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('progress-photos')
          .getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('job_progress_updates')
        .insert({
          job_id: jobId,
          author_id: user!.id,
          note: note.trim() || null,
          photo_url: photoUrl,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote('');
      setSelectedFile(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['job_progress_updates', jobId] });
      toast.success(t('progressUpdates.posted', 'Update posted'));
    },
    onError: () => {
      toast.error(t('progressUpdates.postFailed', 'Failed to post update'));
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('progressUpdates.fileTooLarge', 'File must be under 10MB'));
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Don't show at all if no updates and user can't post
  if (!canPost && updates.length === 0) return null;

  return (
    <Card id="progress-updates">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          {t('progressUpdates.title', 'Progress Updates')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Post form — pro only during in_progress */}
        {canPost && (
          <div className="space-y-3 pb-4 border-b border-border">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('progressUpdates.placeholder', 'What did you work on today?')}
              className="min-h-[60px] resize-none"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                {t('progressUpdates.addPhoto', 'Add Photo')}
              </Button>

              {selectedFile && (
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {selectedFile.name}
                </span>
              )}

              <div className="flex-1" />

              <Button
                size="sm"
                onClick={() => postMutation.mutate()}
                disabled={postMutation.isPending || (!note.trim() && !selectedFile)}
                className="gap-1.5"
              >
                {postMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {t('progressUpdates.post', 'Post')}
              </Button>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="relative w-full max-w-xs">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="rounded-lg border border-border object-cover w-full h-32"
                />
                <button
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 text-foreground text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        {/* Updates feed */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : updates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('progressUpdates.noUpdates', 'No progress updates yet.')}
          </p>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => (
              <div key={update.id} className="space-y-2">
                {update.photo_url && (
                  <img
                    src={update.photo_url}
                    alt={update.note || 'Progress photo'}
                    className="rounded-lg border border-border w-full max-h-64 object-cover"
                    loading="lazy"
                  />
                )}
                {update.note && (
                  <p className="text-sm text-foreground">{update.note}</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
