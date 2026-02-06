import { useState } from 'react';
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
 */
export const AssignProSelector = ({ jobId, onAssigned }: AssignProSelectorProps) => {
  const [selectedProId, setSelectedProId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch professionals who have conversations about this job
  const { data: pros, isLoading } = useQuery({
    queryKey: ['job-conversation-pros', jobId],
    queryFn: async (): Promise<ConversationPro[]> => {
      // First get conversations for this job
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('pro_id')
        .eq('job_id', jobId);

      if (convError) throw convError;
      if (!conversations || conversations.length === 0) return [];

      const proIds = conversations.map((c) => c.pro_id);

      // Then fetch professional profiles
      const { data: profiles, error: profileError } = await supabase
        .from('professional_profiles')
        .select('user_id, display_name')
        .in('user_id', proIds);

      if (profileError) throw profileError;

      return (profiles || []).map((p) => ({
        pro_id: p.user_id,
        display_name: p.display_name,
      }));
    },
  });

  const handleAssign = async () => {
    if (!selectedProId) return;

    setIsAssigning(true);
    try {
      const result = await assignProfessional(jobId, selectedProId);
      if (result.success) {
        toast.success('Professional assigned successfully');
        onAssigned();
      } else {
        toast.error(result.error || 'Failed to assign professional');
      }
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!pros || pros.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        No professionals have messaged yet
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedProId} onValueChange={setSelectedProId}>
        <SelectTrigger className="h-8 w-[180px] text-sm">
          <SelectValue placeholder="Select pro" />
        </SelectTrigger>
        <SelectContent>
          {pros.map((pro) => (
            <SelectItem key={pro.pro_id} value={pro.pro_id}>
              {pro.display_name || 'Professional'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={handleAssign}
        disabled={!selectedProId || isAssigning}
      >
        {isAssigning ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UserCheck className="h-3.5 w-3.5" />
        )}
        Assign
      </Button>
    </div>
  );
};
