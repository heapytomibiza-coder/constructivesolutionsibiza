/**
 * Admin row-level actions for the dispute queue
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MoreHorizontal, ExternalLink, ArrowRight, Brain,
  AlertTriangle, MessageSquare, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { advanceDisputeStatus } from '@/pages/disputes/actions/advanceDisputeStatus.action';
import { analyzeDispute } from '@/pages/disputes/actions/analyzeDispute.action';
import { adminKeys } from '../../queries/keys';
import type { AdminDisputeRow } from '../../queries/adminDisputes.query';

const TRANSITION_MAP: Record<string, string[]> = {
  draft: ['open'],
  open: ['awaiting_counterparty'],
  awaiting_counterparty: ['evidence_collection'],
  evidence_collection: ['assessment'],
  assessment: ['resolution_offered', 'escalated'],
  resolution_offered: ['awaiting_acceptance', 'escalated'],
  awaiting_acceptance: ['resolved', 'escalated'],
  resolved: ['closed'],
  escalated: ['closed'],
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function DisputeRowActions({ dispute }: { dispute: AdminDisputeRow }) {
  const qc = useQueryClient();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: [...adminKeys.all, 'disputes'] });

  const advanceMutation = useMutation({
    mutationFn: (newStatus: string) => advanceDisputeStatus(dispute.id, newStatus),
    onSuccess: (_, status) => {
      toast.success(`Status updated to ${statusLabel(status)}`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeDispute(dispute.id),
    onSuccess: () => {
      toast.success('Re-analysis triggered');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const noteMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('dispute_inputs' as any).insert({
        dispute_id: dispute.id,
        user_id: user.id,
        input_type: 'admin_note',
        raw_text: text,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Admin note added');
      setNoteOpen(false);
      setNoteText('');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const nextStatuses = TRANSITION_MAP[dispute.status] ?? [];
  const canEscalate = nextStatuses.includes('escalated');
  const nonEscalated = nextStatuses.filter(s => s !== 'escalated');
  const isPending = advanceMutation.isPending || analyzeMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <a href={`/disputes/${dispute.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              View Case
            </a>
          </DropdownMenuItem>

          {nonEscalated.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRight className="h-3.5 w-3.5 mr-2" />
                Advance Status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {nonEscalated.map(s => (
                  <DropdownMenuItem key={s} onClick={() => advanceMutation.mutate(s)}>
                    {statusLabel(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {!['resolved', 'closed', 'draft'].includes(dispute.status) && (
            <DropdownMenuItem onClick={() => analyzeMutation.mutate()}>
              <Brain className="h-3.5 w-3.5 mr-2" />
              Trigger Re-analysis
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {canEscalate && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => advanceMutation.mutate('escalated')}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-2" />
              Escalate
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => setNoteOpen(true)}>
            <MessageSquare className="h-3.5 w-3.5 mr-2" />
            Add Admin Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Internal note about this dispute..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button
              onClick={() => noteMutation.mutate(noteText)}
              disabled={!noteText.trim() || noteMutation.isPending}
            >
              {noteMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
