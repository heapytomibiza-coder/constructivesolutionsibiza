/**
 * ProgressUpdates — Feed of progress updates with photo support.
 * Latest update is shown as a prominent card. Older updates in compact timeline.
 * Includes mobile FAB for professionals during in_progress.
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, ImagePlus, Loader2, Send, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

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
      if (!note.trim() && !selectedFile) throw new Error('Add a note or photo');

      let photoUrl: string | null = null;
      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop() || 'jpg';
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('progress-photos')
          .upload(path, selectedFile, { contentType: selectedFile.type });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('job_progress_updates').insert({
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

  if (!canPost && updates.length === 0) return null;

  const latestUpdate = updates[0];
  const olderUpdates = updates.slice(1);
  const visibleOlder = showAll ? olderUpdates : olderUpdates.slice(0, 2);
  const hasMore = olderUpdates.length > 2 && !showAll;

  return (
    <>
      <div id="progress-updates" className="space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <h3 className="text-lg sm:text-xl font-semibold font-display text-foreground">
            {t('progressUpdates.title', 'Progress Updates')}
          </h3>
          {updates.length > 0 && (
            <span className="text-[12px] text-muted-foreground ml-auto">
              {t('progressUpdates.count', '{{count}} updates', { count: updates.length })}
            </span>
          )}
        </div>

        {/* Post form — pro only during in_progress */}
        {canPost && <PostForm
          note={note}
          setNote={setNote}
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          onClearFile={() => { setSelectedFile(null); setPreviewUrl(null); }}
          onPost={() => postMutation.mutate()}
          isPending={postMutation.isPending}
          t={t}
        />}

        {/* Updates feed */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : updates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t('progressUpdates.noUpdates', 'No progress updates yet.')}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Latest Update — prominent card */}
            {latestUpdate && <LatestUpdateCard update={latestUpdate} t={t} />}

            {/* Older updates — compact timeline */}
            {visibleOlder.length > 0 && (
              <div className="space-y-2.5">
                {visibleOlder.map((update) => (
                  <CompactUpdateRow key={update.id} update={update} />
                ))}
              </div>
            )}

            {/* View all */}
            {hasMore && (
              <button
                onClick={() => setShowAll(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mx-auto"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                {t('progressUpdates.viewAll', 'View all updates')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile FAB for professionals — in_progress only */}
      {canPost && isMobile && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="h-14 rounded-full shadow-lg gap-2 px-5"
            onClick={() => {
              document.getElementById('progress-updates')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Camera className="h-5 w-5" />
            <span className="text-sm font-semibold">{t('progressUpdates.fabLabel', 'Update')}</span>
          </Button>
        </div>
      )}
    </>
  );
}

/* ─── Latest Update Card ─── */

function LatestUpdateCard({ update, t }: { update: any; t: any }) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg font-semibold font-display text-foreground">
          {t('progressUpdates.latestTitle', 'Latest update')}
        </p>
        <p className="text-[12px] text-muted-foreground">
          {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
        </p>
      </div>
      {update.photo_url && (
        <img
          src={update.photo_url}
          alt={update.note || 'Progress photo'}
          className="rounded-2xl w-full max-h-96 object-cover mb-3"
          loading="lazy"
        />
      )}
      {update.note && (
        <p className="text-[15px] text-foreground leading-relaxed">{update.note}</p>
      )}
    </div>
  );
}

/* ─── Compact Update Row ─── */

function CompactUpdateRow({ update }: { update: any }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-3.5 flex gap-3">
      {update.photo_url && (
        <img
          src={update.photo_url}
          alt={update.note || 'Progress photo'}
          className="h-16 w-16 rounded-xl object-cover shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        {update.note && (
          <p className="text-sm text-foreground line-clamp-2">{update.note}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

/* ─── Post Form ─── */

function PostForm({
  note,
  setNote,
  selectedFile,
  previewUrl,
  fileInputRef,
  handleFileChange,
  onClearFile,
  onPost,
  isPending,
  t,
}: {
  note: string;
  setNote: (v: string) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onPost: () => void;
  isPending: boolean;
  t: any;
}) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-card p-5 space-y-3">
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
          onClick={onPost}
          disabled={isPending || (!note.trim() && !selectedFile)}
          className="gap-1.5"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {t('progressUpdates.post', 'Post')}
        </Button>
      </div>
      {previewUrl && (
        <div className="relative w-full max-w-xs">
          <img
            src={previewUrl}
            alt="Preview"
            className="rounded-xl border border-border object-cover w-full h-32"
          />
          <button
            onClick={onClearFile}
            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 text-foreground text-xs flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
