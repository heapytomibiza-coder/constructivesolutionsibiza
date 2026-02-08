import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { assignProfessional } from '@/pages/jobs/actions/assignProfessional.action';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ConversationRow {
  pro_id: string | null;
}

interface ProProfileRow {
  user_id: string;
  display_name: string | null;
}

interface ConversationPro {
  pro_id: string;
  display_name: string | null;
}

interface AssignProSelectorProps {
  jobId: string;
  onAssigned: () => void;
}

/**
 * Dropdown to select and assign a professional from job conversations.
 * Only shows pros who have messaged about this specific job.
 * Deduplicates professionals and handles missing display names.
 */
export const AssignProSelector = ({ jobId, onAssigned }: AssignProSelectorProps) => {
  const { t } = useTranslation('dashboard');
  const [selectedProId, setSelectedProId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch professionals who have conversations about this job
  const { data: pros, isLoading } = useQuery({
    queryKey: ['job-conversation-pros', jobId],
    queryFn: async (): Promise<ConversationPro[]> => {
      // Get conversations for this job
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('pro_id')
        .eq('job_id', jobId);

      if (convError) throw convError;

      // Extract and dedupe pro IDs
      const ids = (conversations as ConversationRow[] | null)
        ?.map((c) => c.pro_id)
        .filter((id): id is string => !!id) ?? [];

      const proIds = Array.from(new Set(ids));
      if (proIds.length === 0) return [];

      // Fetch professional profiles
      const { data: profiles, error: profileError } = await supabase
        .from('professional_profiles')
        .select('user_id, display_name')
        .in('user_id', proIds);

      if (profileError) throw profileError;

      // Map profile data
      const profileMap = new Map<string, string | null>();
      (profiles as ProProfileRow[] | null)?.forEach((p) => 
        profileMap.set(p.user_id, p.display_name)
      );

      return proIds.map((id) => ({
        pro_id: id,
        display_name: profileMap.get(id) ?? null,
      }));
    },
  });

  const canAssign = useMemo(
    () => !!selectedProId && !isAssigning,
    [selectedProId, isAssigning]
  );

  const handleAssign = async () => {
    if (!selectedProId) return;

    setIsAssigning(true);
    try {
      const result = await assignProfessional(jobId, selectedProId);
      if (result.success) {
        toast.success(t('client.assignedSuccess', 'Professional assigned successfully'));
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
        {t('client.noProsYet', 'No professionals have messaged yet')}
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
            <SelectItem key={pro.pro_id} value={pro.pro_id}>
              {pro.display_name || t('client.professionalFallback', 'Professional')}
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
