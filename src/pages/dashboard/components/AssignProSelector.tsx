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
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          pro_id,
          professional_profiles!inner(display_name)
        `)
        .eq('job_id', jobId);

      if (error) throw error;

      return (data || []).map((row) => ({
        pro_id: row.pro_id,
        display_name: (row.professional_profiles as { display_name: string | null })?.display_name,
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
