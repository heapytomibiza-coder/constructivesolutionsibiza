/**
 * PortfolioPrompt — Shown to professionals on completed jobs.
 * Lets them select photos from progress updates to feature on their profile.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Check, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PortfolioPromptProps {
  jobId: string;
  jobStatus: string;
  isClient: boolean;
  jobTitle: string;
}

export function PortfolioPrompt({ jobId, jobStatus, isClient, jobTitle }: PortfolioPromptProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useSession();
  const { limit: getLimit } = useEntitlements();
  const portfolioLimit = getLimit('portfolio_limit');
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(jobTitle);
  const [description, setDescription] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Only show for pro on completed jobs
  if (isClient || jobStatus !== 'completed') return null;

  // Check if already has a portfolio entry
  const { data: existingEntry, isLoading: checkingExisting } = useQuery({
    queryKey: ['portfolio_entry', jobId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('portfolio_projects')
        .select('id')
        .eq('job_id', jobId)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && jobStatus === 'completed',
  });

  // Get photos from progress updates
  const { data: photos = [] } = useQuery({
    queryKey: ['job_gallery_photos_for_portfolio', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_progress_updates')
        .select('id, photo_url')
        .eq('job_id', jobId)
        .not('photo_url', 'is', null)
        .order('created_at', { ascending: true });
      return (data || []).map((d) => d.photo_url!);
    },
    enabled: showForm && !!user,
  });

  // Advisory portfolio count check — if this query fails, the DB trigger is authoritative
  const { data: portfolioCount = 0 } = useQuery({
    queryKey: ['portfolio_count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('portfolio_projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_published', true);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const isAtPortfolioLimit = portfolioCount >= portfolioLimit;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('portfolio_projects').insert({
        user_id: user!.id,
        job_id: jobId,
        title: title.trim(),
        description: description.trim() || null,
        photo_urls: selectedPhotos,
        is_published: true,
      });
      if (error) {
        if (error.message?.includes('PORTFOLIO_LIMIT_REACHED')) {
          throw new Error('portfolio_limit');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(t('portfolio.saved', 'Added to your portfolio!'));
      queryClient.invalidateQueries({ queryKey: ['portfolio_entry', jobId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio_count'] });
      setShowForm(false);
    },
    onError: (err: Error) => {
      if (err.message === 'portfolio_limit') {
        toast.error(t('portfolio.limitReached', 'You have reached your portfolio limit. Upgrade your plan to add more projects.'));
      } else {
        toast.error(t('portfolio.saveFailed', 'Failed to save'));
      }
    },
  });

  const togglePhoto = (url: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(url) ? prev.filter((p) => p !== url) : [...prev, url]
    );
  };

  if (checkingExisting) return null;

  // Already added
  if (existingEntry) {
    return (
      <Card className="rounded-[18px] border-border/70 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Star className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('portfolio.alreadyAdded', 'This project is featured in your portfolio.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!showForm) {
    return (
      <Card className="rounded-[18px] border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">
                {t('portfolio.promptTitle', 'Add this to your portfolio?')}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAtPortfolioLimit
                  ? t('portfolio.limitReached', 'You have reached your portfolio limit. Upgrade your plan to add more projects.')
                  : t('portfolio.promptDesc', 'Showcase this completed project on your profile to attract new clients.')}
              </p>
              <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5" disabled={isAtPortfolioLimit}>
                <Briefcase className="h-3.5 w-3.5" />
                {t('portfolio.addToPortfolio', 'Add to Portfolio')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[22px] border-primary/20 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold font-display text-foreground">
            {t('portfolio.formTitle', 'Portfolio Entry')}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('portfolio.projectTitle', 'Project title')}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('portfolio.projectDesc', 'Short description (optional)')}</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('portfolio.descPlaceholder', 'What work was done?')}
              rows={2}
            />
          </div>
        </div>

        {photos.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('portfolio.selectPhotos', 'Select photos to feature')}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {photos.map((url) => (
                <button
                  key={url}
                  onClick={() => togglePhoto(url)}
                  className={cn(
                    'aspect-square rounded-lg overflow-hidden border-2 transition-colors relative',
                    selectedPhotos.includes(url)
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border/50 hover:border-primary/30'
                  )}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  {selectedPhotos.includes(url) && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="h-5 w-5 text-primary-foreground drop-shadow-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={!title.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            {t('portfolio.publish', 'Publish to Portfolio')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
