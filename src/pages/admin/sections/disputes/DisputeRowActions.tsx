/**
 * Admin row-level actions for the dispute queue
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MoreHorizontal, ExternalLink, ArrowRight, Brain,
  AlertTriangle, MessageSquare, Loader2, Handshake,
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

const RESOLUTION_PATHWAYS = [
  { value: 'corrective_work', label: 'Corrective Work' },
  { value: 'financial_adjustment', label: 'Financial Adjustment' },
  { value: 'shared_responsibility', label: 'Shared Responsibility' },
  { value: 'expert_review', label: 'Expert Review' },
];

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function DisputeRowActions({ dispute }: { dispute: AdminDisputeRow }) {
  const qc = useQueryClient();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionDesc, setResolutionDesc] = useState('');

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

  const offerResolutionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('rpc_offer_resolution', {
        p_dispute_id: dispute.id,
        p_resolution_type: resolutionType,
        p_resolution_description: resolutionDesc,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Resolution offered');
      setResolutionOpen(false);
      setResolutionType('');
      setResolutionDesc('');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const nextStatuses = TRANSITION_MAP[dispute.status] ?? [];
  const canEscalate = nextStatuses.includes('escalated');
  const nonEscalated = nextStatuses.filter(s => s !== 'escalated');
  const canOfferResolution = dispute.status === 'assessment';
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

          {canOfferResolution && (
            <DropdownMenuItem onClick={() => setResolutionOpen(true)}>
              <Handshake className="h-3.5 w-3.5 mr-2" />
              Offer Resolution
            </DropdownMenuItem>
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

      {/* Admin Note Dialog */}
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

      {/* Offer Resolution Dialog */}
      <Dialog open={resolutionOpen} onOpenChange={setResolutionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Offer Resolution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution Type</Label>
              <Select value={resolutionType} onValueChange={setResolutionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution type..." />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTION_PATHWAYS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={resolutionDesc}
                onChange={e => setResolutionDesc(e.target.value)}
                placeholder="Describe the proposed resolution..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolutionOpen(false)}>Cancel</Button>
            <Button
              onClick={() => offerResolutionMutation.mutate()}
              disabled={!resolutionType || !resolutionDesc.trim() || offerResolutionMutation.isPending}
            >
              {offerResolutionMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
