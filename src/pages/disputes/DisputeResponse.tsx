import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Send, Clock, AlertTriangle } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { EvidenceUploader, type EvidenceFile } from './components';
import { uploadDisputeEvidence } from './actions/uploadDisputeEvidence.action';
import { submitCounterpartyResponse } from './actions/submitCounterpartyResponse.action';
import { fetchDisputeDetail } from './queries/disputes.query';
import { QuestionnaireStep } from './components/QuestionnaireStep';

export default function DisputeResponse() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();

  const [responseText, setResponseText] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [step, setStep] = useState<'review' | 'respond' | 'evidence' | 'confirm'>('review');

  const { data, isLoading } = useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => fetchDisputeDetail(disputeId!),
    enabled: !!disputeId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!disputeId) throw new Error('No dispute ID');

      await submitCounterpartyResponse({
        disputeId,
        responseText,
        questionnaireAnswers: answers,
      });

      for (const ef of evidenceFiles) {
        await uploadDisputeEvidence(disputeId, ef.file, ef.description, ef.category);
      }

      return true;
    },
    onSuccess: () => {
      toast.success('Your response has been submitted');
      navigate(`/disputes/${disputeId}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to submit response');
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

  const d = data.dispute as any;
  const job = d.jobs;
  const issueTypes = d.issue_types || [];
  const responseDeadline = d.response_deadline ? new Date(d.response_deadline) : null;
  const evidenceDeadline = d.evidence_deadline ? new Date(d.evidence_deadline) : null;
  const isOverdue = responseDeadline && responseDeadline < new Date();

  const hasResponded = data.inputs.some((i: any) => i.user_id === currentUser?.id);

  const complainantStatements = data.inputs.filter(
    (i: any) => i.user_id === d.raised_by
  );

  return (
    <PublicLayout>
      <div className="container max-w-2xl py-8 space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Respond to Dispute</h1>
          {job && (
            <p className="text-sm text-muted-foreground mt-1">
              {job.title} • {job.area || 'Ibiza'}
            </p>
          )}
        </div>

        {/* Deadlines */}
        <div className="flex flex-col gap-2">
          {responseDeadline && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${
              isOverdue
                ? 'bg-destructive/10 border-destructive/20 text-destructive'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            }`}>
              {isOverdue ? (
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Clock className="h-4 w-4 flex-shrink-0" />
              )}
              <span>
                {isOverdue
                  ? 'Response deadline has passed'
                  : `Response deadline: ${responseDeadline.toLocaleDateString()}`}
              </span>
            </div>
          )}
          {evidenceDeadline && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-lg border bg-muted/50 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Evidence deadline: {evidenceDeadline.toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* What was raised */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Issues Raised</h2>
          <div className="flex flex-wrap gap-1.5">
            {issueTypes.map((type: string) => (
              <Badge key={type} variant="outline" className="capitalize text-xs">
                {type.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
          {d.requested_outcome && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Requested Outcome</p>
              <p className="text-sm capitalize">{d.requested_outcome.replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>

        {/* Complainant statements */}
        {complainantStatements.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Their Statement</h2>
            {complainantStatements.map((input: any) => (
              <div key={input.id} className="p-3 rounded-lg border bg-card">
                {input.raw_text && (
                  <p className="text-sm whitespace-pre-wrap">{input.raw_text}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Already responded */}
        {hasResponded ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-muted-foreground">
              You have already submitted your response to this dispute.
            </p>
            <Button variant="outline" onClick={() => navigate(`/disputes/${disputeId}`)}>
              View Dispute Details
            </Button>
          </div>
        ) : (
          <>
            {/* Step progress */}
            <div className="flex gap-1">
              {(['review', 'respond', 'evidence', 'confirm'] as const).map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    ['review', 'respond', 'evidence', 'confirm'].indexOf(step) >= i
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Step content */}
            <div className="min-h-[250px]">
              {step === 'review' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Review the complaint</h3>
                  <p className="text-sm text-muted-foreground">
                    Please read the issues raised above carefully before providing your response.
                    Your response will be recorded and used alongside the other party's statement to reach a fair outcome.
                  </p>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    <p className="font-medium text-foreground mb-1">Important</p>
                    <p className="text-muted-foreground">
                      All responses are recorded and used to reach a fair outcome.
                      Stick to facts and provide evidence where possible.
                    </p>
                  </div>
                </div>
              )}

              {step === 'respond' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Your response</h3>
                  <QuestionnaireStep answers={answers} onChange={setAnswers} />
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Describe your perspective on the situation. Stick to facts.
                    </p>
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Describe your side of the situation..."
                      rows={6}
                    />
                  </div>
                </div>
              )}

              {step === 'evidence' && (
                <EvidenceUploader files={evidenceFiles} onChange={setEvidenceFiles} />
              )}

              {step === 'confirm' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Confirm your response</h3>
                  <div className="space-y-3 text-sm">
                    {responseText && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Your statement</p>
                        <p className="whitespace-pre-wrap">{responseText}</p>
                      </div>
                    )}
                    {Object.keys(answers).length > 0 && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Questionnaire</p>
                        {Object.entries(answers).map(([k, v]) => (
                          <p key={k} className="text-sm">
                            <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                            <span className="capitalize">{String(v).replace(/_/g, ' ')}</span>
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Evidence</p>
                      <p>{evidenceFiles.length} file(s) attached</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All responses are recorded and used to reach a fair outcome.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  const steps = ['review', 'respond', 'evidence', 'confirm'] as const;
                  const idx = steps.indexOf(step);
                  if (idx > 0) setStep(steps[idx - 1]);
                }}
                disabled={step === 'review'}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>

              {step === 'confirm' ? (
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending || (!responseText && Object.keys(answers).length === 0)}
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Submit Response
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const steps = ['review', 'respond', 'evidence', 'confirm'] as const;
                    const idx = steps.indexOf(step);
                    setStep(steps[idx + 1]);
                  }}
                >
                  Continue
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}