import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCheck, Loader2 } from 'lucide-react';
import { acceptQuote } from '@/pages/jobs/actions/acceptQuote.action';
import { quoteKeys } from '@/pages/jobs/queries/quotes.query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface HireablePro {
  proId: string;
  quoteId: string;
  displayName: string | null;
}

interface AssignProSelectorProps {
  jobId: string;
  onAssigned: () => void;
}

export const AssignProSelector = ({ jobId, onAssigned }: AssignProSelectorProps) => {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const [selectedProId, setSelectedProId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch professionals who have an active quote on this job
  const { data: pros, isLoading } = useQuery({
    queryKey: ['job-hireable-pros', jobId],
    queryFn: async (): Promise<HireablePro[]> => {
      // Get active quotes for this job
      const { data: quotes, error: quotesErr } = await supabase
        .from('quotes')
        .select('id, professional_id')
        .eq('job_id', jobId)
        .in('status', ['submitted', 'revised']);

      if (quotesErr) throw quotesErr;
      if (!quotes?.length) return [];

      // Deduplicate by pro, keeping the first (most recent) quote per pro
      const proQuoteMap = new Map<string, string>();
      for (const q of quotes) {
        if (!proQuoteMap.has(q.professional_id)) {
          proQuoteMap.set(q.professional_id, q.id);
        }
      }

      const proIds = Array.from(proQuoteMap.keys());

      // Fetch display names
      const { data: profiles } = await supabase
        .from('professional_profiles')
        .select('user_id, display_name')
        .in('user_id', proIds);

      const nameMap = new Map<string, string | null>();
      profiles?.forEach(p => nameMap.set(p.user_id, p.display_name));

      return proIds.map(id => ({
        proId: id,
        quoteId: proQuoteMap.get(id)!,
        displayName: nameMap.get(id) ?? null,
      }));
    },
  });

  const selectedPro = useMemo(
    () => pros?.find(p => p.proId === selectedProId),
    [pros, selectedProId]
  );

  const canAssign = !!selectedPro && !isAssigning;

  const handleAssign = async () => {
    if (!selectedPro) return;

    setIsAssigning(true);
    try {
      const result = await acceptQuote(selectedPro.quoteId, jobId, selectedPro.proId);
      if (result.success) {
        toast.success(t('client.assignedSuccess', 'Professional assigned successfully'));
        queryClient.invalidateQueries({ queryKey: quoteKeys.forJob(jobId) });
        onAssigned();
        setSelectedProId('');
      } else {
        toast.error(result.error || t('client.assignedFail', 'Failed to assign professional'));
      }
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('client.loading', 'Loading...')}
      </div>
    );
  }

  if (!pros || pros.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        {t('client.noQuotesYet', 'No quotes received yet')}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedProId} onValueChange={setSelectedProId}>
        <SelectTrigger className="h-8 w-[180px] text-sm">
          <SelectValue placeholder={t('client.selectPro', 'Select pro')} />
        </SelectTrigger>
        <SelectContent>
          {pros.map((pro) => (
            <SelectItem key={pro.proId} value={pro.proId}>
              {pro.displayName || t('client.professionalFallback', 'Professional')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={handleAssign}
        disabled={!canAssign}
      >
        {isAssigning ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UserCheck className="h-3.5 w-3.5" />
        )}
        {t('client.assign', 'Assign')}
      </Button>
    </div>
  );
};
