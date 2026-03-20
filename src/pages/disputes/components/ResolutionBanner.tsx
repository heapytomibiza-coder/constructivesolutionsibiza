/**
 * Banner shown to dispute parties when a resolution has been offered.
 * Allows accepting or rejecting the proposed resolution.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface ResolutionBannerProps {
  disputeId: string;
  resolutionType: string | null;
  resolutionDescription: string | null;
  status: string;
  isParty: boolean;
}

const PATHWAY_LABELS: Record<string, string> = {
  corrective_work: 'Corrective Work',
  financial_adjustment: 'Financial Adjustment',
  shared_responsibility: 'Shared Responsibility',
  expert_review: 'Expert Review',
};

export function ResolutionBanner({
  disputeId,
  resolutionType,
  resolutionDescription,
  status,
  isParty,
}: ResolutionBannerProps) {
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isVisible = ['resolution_offered', 'awaiting_acceptance'].includes(status);
  if (!isVisible || !resolutionType) return null;

  const respondMutation = useMutation({
    mutationFn: async ({ accept, reason }: { accept: boolean; reason?: string }) => {
      const { error } = await supabase.rpc('rpc_respond_to_resolution', {
        p_dispute_id: disputeId,
        p_accept: accept,
        p_rejection_reason: reason ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, { accept }) => {
      toast.success(accept ? 'Resolution accepted' : 'Resolution rejected — case escalated');
      setRejectOpen(false);
      qc.invalidateQueries({ queryKey: ['dispute', disputeId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Handshake className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-semibold text-foreground">Resolution Proposed</p>
            <Badge variant="outline" className="capitalize text-xs">
              {PATHWAY_LABELS[resolutionType] ?? resolutionType.replace(/_/g, ' ')}
            </Badge>
            {resolutionDescription && (
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                {resolutionDescription}
              </p>
            )}
          </div>
        </div>

        {isParty && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => respondMutation.mutate({ accept: true })}
              disabled={respondMutation.isPending}
            >
              {respondMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              )}
              Accept Resolution
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectOpen(true)}
              disabled={respondMutation.isPending}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Resolution</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Rejecting the proposed resolution will escalate this dispute for further review.
            Please explain why this resolution doesn't work for you.
          </p>
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => respondMutation.mutate({ accept: false, reason: rejectReason })}
              disabled={!rejectReason.trim() || respondMutation.isPending}
            >
              {respondMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Reject & Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
