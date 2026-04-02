/**
 * ProgressUpdates — Feed of progress updates with photo support.
 * Latest update is shown as a dominant hero-tier card. Older updates in compact timeline.
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

  // Fetch updates with author names
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

  // Fetch author display names
  const authorIds = [...new Set(updates.map(u => u.author_id))];
  const { data: authorProfiles = [] } = useQuery({
    queryKey: ['update_authors', authorIds.join(',')],
    queryFn: async () => {
      if (!authorIds.length) return [];
      // Try professional_profiles first, then profiles
      const { data: proData } = await supabase
        .from('professional_profiles')
        .select('user_id, display_name')
        .in('user_id', authorIds);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', authorIds);
      // Merge: prefer professional display_name, fallback to profile
      const map = new Map<string, string>();
      profileData?.forEach(p => { if (p.display_name) map.set(p.user_id, p.display_name); });
      proData?.forEach(p => { if (p.display_name) map.set(p.user_id, p.display_name); });
      return Array.from(map.entries()).map(([user_id, display_name]) => ({ user_id, display_name }));
    },
    enabled: authorIds.length > 0,
  });

  const authorNameMap = new Map(authorProfiles.map(p => [p.user_id, p.display_name]));

  const isAssignedPro = !isClient && user?.id === assignedProId;
  const canPost = jobStatus === 'in_progress' && (isClient || isAssignedPro);

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

  const isCompleted = jobStatus === 'completed';

  return (
    <>
      <div id="progress-updates" className="space-y-4">
        {/* Section header — contextual microcopy */}
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <h3 className="text-lg sm:text-xl font-semibold font-display text-foreground">
            {isCompleted
              ? t('progressUpdates.titleCompleted', 'Work summary')
              : t('progressUpdates.titleActive', 'Latest from the job')}
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
          <div className="rounded-3xl border border-dashed border-border/60 bg-muted/10 py-10 px-6 text-center">
            <Camera className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {t('progressUpdates.noUpdatesEncouraging', 'No updates yet')}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {canPost
                ? t('progressUpdates.postFirst', 'Post the first update to keep everyone in the loop.')
                : t('progressUpdates.waitingForUpdates', 'Updates will appear here as work progresses.')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Latest Update — borderless, flows from hero */}
            {latestUpdate && (
              <LatestUpdateCard
                update={latestUpdate}
                authorName={authorNameMap.get(latestUpdate.author_id) || null}
                t={t}
              />
            )}

            {/* Older updates — progressively lighter */}
            {visibleOlder.length > 0 && (
              <div className="space-y-2">
                {visibleOlder.map((update) => (
                  <CompactUpdateRow
                    key={update.id}
                    update={update}
                    authorName={authorNameMap.get(update.author_id) || null}
                  />
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

/* ─── Latest Update Card — Hero-tier visual anchor ─── */

function LatestUpdateCard({ update, authorName, t }: { update: any; authorName: string | null; t: any }) {
  const hasPhoto = !!update.photo_url;

  return (
    <div className="overflow-hidden">
      {/* Photo-first: edge-to-edge, no border — content flows */}
      {hasPhoto && (
        <div className="rounded-3xl overflow-hidden">
          <img
            src={update.photo_url}
            alt={update.note || 'Progress photo'}
            className="w-full max-h-[420px] object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Content — no card border, just content flowing */}
      <div className={cn(
        'space-y-2',
        hasPhoto ? 'pt-4 px-1' : 'pt-1 px-1',
      )}>
        {/* Human meta line */}
        <div className="flex items-center gap-2">
          {authorName && (
            <span className="text-[13px] text-foreground font-semibold">{authorName}</span>
          )}
          {authorName && <span className="text-muted-foreground/40">·</span>}
          <span className="text-[12px] text-muted-foreground">
            {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Note — generous, readable */}
        {update.note && (
          <p className="text-[15px] text-foreground leading-relaxed">{update.note}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Compact Update Row ─── */

function CompactUpdateRow({ update, authorName }: { update: any; authorName: string | null }) {
  return (
    <div className="flex gap-3 px-1 py-2 border-t border-border/30">
      {update.photo_url && (
        <img
          src={update.photo_url}
          alt={update.note || 'Progress photo'}
          className="h-14 w-14 rounded-xl object-cover shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        {update.note && (
          <p className="text-[13px] text-foreground/80 line-clamp-2">{update.note}</p>
        )}
        <div className="flex items-center gap-1.5 mt-0.5">
          {authorName && (
            <>
              <span className="text-[11px] text-muted-foreground font-medium">{authorName}</span>
              <span className="text-muted-foreground/40">·</span>
            </>
          )}
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
          </span>
        </div>
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
