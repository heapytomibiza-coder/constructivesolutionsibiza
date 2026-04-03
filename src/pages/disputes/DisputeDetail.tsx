import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Brain, Clock, FileText, Upload, RefreshCw } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { fetchDisputeDetail } from './queries/disputes.query';
import { analyzeDispute } from './actions/analyzeDispute.action';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { CompletenessIndicator } from './components/CompletenessIndicator';
import { CounterpartyBanner } from './components/CounterpartyBanner';
import { ResolutionBanner } from './components/ResolutionBanner';
import { DisputeTimeline } from './components/DisputeTimeline';
import type { DisputeStatus } from './types';

const STATUS_META: Record<DisputeStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  awaiting_counterparty: { label: 'Awaiting Response', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  evidence_collection: { label: 'Collecting Evidence', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  assessment: { label: 'Under Assessment', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  resolution_offered: { label: 'Resolution Offered', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  awaiting_acceptance: { label: 'Awaiting Acceptance', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground' },
  escalated: { label: 'Escalated', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export default function DisputeDetail() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => fetchDisputeDetail(disputeId!),
    enabled: !!disputeId,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeDispute(disputeId!),
    onSuccess: () => {
      toast.success('Analysis complete');
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Analysis failed');
    },
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PublicLayout>
    );
  }

  if (!data?.dispute) {
    return (
      <PublicLayout>
        <div className="container max-w-2xl py-16 text-center">
          <p className="text-muted-foreground">Dispute not found</p>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const { dispute, inputs, evidence, analysis, history, aiEvents } = data;
  const d = dispute as any;
  const statusMeta = STATUS_META[d.status as DisputeStatus] || STATUS_META.open;
  const job = d.jobs;
  const hasCurrentAnalysis = !!analysis;

  const isCounterparty = currentUser?.id === d.counterparty_id;
  const isParty = currentUser?.id === d.raised_by || currentUser?.id === d.counterparty_id;
  const hasResponded = !!d.counterparty_responded_at || inputs.some(
    (i: any) => i.user_id === d.counterparty_id
  );

  return (
    <PublicLayout>
      <div className="container max-w-3xl py-8 space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(d?.job_id ? `/dashboard/jobs/${d.job_id}` : '/dashboard')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dispute</h1>
              {job && (
                <p className="text-sm text-muted-foreground mt-1">
                  {job.title} • {job.area || 'Ibiza'}
                </p>
              )}
            </div>
            <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
          </div>
        </div>

        {/* Issue Types */}
        <div className="flex flex-wrap gap-1.5">
          {(d.issue_types || []).map((type: string) => (
            <Badge key={type} variant="outline" className="capitalize text-xs">
              {type.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>

        {/* Requested Outcome */}
        {d.requested_outcome && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground mb-1">Requested Outcome</p>
            <p className="text-sm capitalize">{d.requested_outcome.replace(/_/g, ' ')}</p>
          </div>
        )}

        {/* Deadlines */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          {d.evidence_deadline && (
            <span className="flex items-center gap-1">
              <Upload className="h-3 w-3" />
              Evidence by: {new Date(d.evidence_deadline).toLocaleDateString()}
            </span>
          )}
          {d.response_deadline && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Response by: {new Date(d.response_deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Counterparty Banner */}
        {disputeId && (
          <CounterpartyBanner
            disputeId={disputeId}
            isCounterparty={isCounterparty}
            hasResponded={hasResponded}
            responseDeadline={d.response_deadline}
          />
        )}

        {/* Resolution Banner */}
        {disputeId && (
          <ResolutionBanner
            disputeId={disputeId}
            resolutionType={d.resolution_type}
            resolutionDescription={d.resolution_description}
            status={d.status}
            isParty={isParty}
          />
        )}

        <Separator />

        {/* Statements */}
        {inputs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Statements
            </h2>
            {inputs.map((input: any) => (
              <div key={input.id} className="p-3 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground mb-1 capitalize">
                  {input.input_type} statement
                </p>
                {input.raw_text && (
                  <p className="text-sm whitespace-pre-wrap">{input.raw_text}</p>
                )}
                {input.questionnaire_answers && Object.keys(input.questionnaire_answers).length > 0 && (
                  <div className="text-sm space-y-1 mt-1">
                    {Object.entries(input.questionnaire_answers).map(([k, v]) => (
                      <p key={k}>
                        <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                        <span className="capitalize">{String(v).replace(/_/g, ' ')}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Evidence */}
        {evidence.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Evidence ({evidence.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {evidence.map((e: any) => (
                <div key={e.id} className="p-2 rounded-lg border bg-card text-center">
                  <div className="w-full h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground capitalize">
                    {e.evidence_category || e.file_type}
                  </div>
                  {e.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{e.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Case Completeness */}
        {disputeId && <CompletenessIndicator disputeId={disputeId} />}

        {/* AI Analysis */}
        {hasCurrentAnalysis ? (
          <div className="space-y-3">
            <AnalysisDisplay analysis={analysis as any} />
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('This will generate a new analysis, superseding the current one. Continue?')) {
                    analyzeMutation.mutate();
                  }
                }}
                disabled={analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Re-analyze
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <Brain className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              AI analysis not yet generated
            </p>
            <Button
              variant="outline"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-1" />
              )}
              Generate Analysis
            </Button>
          </div>
        )}

        {/* Timeline */}
        <Separator />
        <DisputeTimeline
          history={history}
          inputs={inputs}
          evidence={evidence}
          aiEvents={aiEvents}
        />
      </div>
    </PublicLayout>
  );
}
