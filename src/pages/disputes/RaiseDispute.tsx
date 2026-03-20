import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PublicLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  IssueTypeSelector,
  QuestionnaireStep,
  EvidenceUploader,
  CoolingOffNotice,
  type EvidenceFile,
} from './components';
import { createDispute } from './actions/createDispute.action';
import { uploadDisputeEvidence } from './actions/uploadDisputeEvidence.action';
import { analyzeDispute } from './actions/analyzeDispute.action';
import type { DisputeIssueType } from './types';

type Step = 'cooling' | 'issues' | 'questions' | 'describe' | 'evidence' | 'review';
const STEPS: Step[] = ['cooling', 'issues', 'questions', 'describe', 'evidence', 'review'];

export default function RaiseDispute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('job');

  const [step, setStep] = useState<Step>('cooling');
  const [issueTypes, setIssueTypes] = useState<DisputeIssueType[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);

  // Fetch job info
  const { data: job } = useQuery({
    queryKey: ['dispute-job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const { data } = await supabase
        .from('jobs')
        .select('id, title, category, area')
        .eq('id', jobId)
        .single();
      return data;
    },
    enabled: !!jobId,
  });

  const stepIdx = STEPS.indexOf(step);
  const canNext = () => {
    if (step === 'cooling') return true;
    if (step === 'issues') return issueTypes.length > 0;
    if (step === 'questions') return answers.desired_outcome && answers.completion_status;
    if (step === 'describe') return true; // description optional
    if (step === 'evidence') return true; // evidence optional
    return true;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('No job selected');

      // 1. Create dispute
      const dispute = await createDispute({
        job_id: jobId,
        issue_types: issueTypes,
        requested_outcome: answers.desired_outcome || '',
        description,
        questionnaire_answers: answers,
      });

      // 2. Upload evidence
      for (const ef of evidenceFiles) {
        await uploadDisputeEvidence(dispute.id, ef.file, ef.description);
      }

      // 3. Trigger AI analysis
      try {
        await analyzeDispute(dispute.id);
      } catch (e) {
        console.warn('AI analysis deferred:', e);
      }

      return dispute;
    },
    onSuccess: (dispute) => {
      toast.success('Dispute submitted successfully');
      navigate(`/disputes/${dispute.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to submit dispute');
    },
  });

  if (!jobId) {
    return (
      <PublicLayout>
        <div className="container max-w-2xl py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold">Raise a Dispute</h1>
          <p className="text-muted-foreground">
            Disputes can only be raised from an active job. Go to your dashboard and select a job to raise an issue.
          </p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container max-w-2xl py-8 space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Raise an Issue</h1>
          {job && (
            <p className="text-sm text-muted-foreground mt-1">
              Regarding: <span className="font-medium">{job.title}</span>
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIdx ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === 'cooling' && <CoolingOffNotice />}
          {step === 'issues' && (
            <IssueTypeSelector selected={issueTypes} onChange={setIssueTypes} />
          )}
          {step === 'questions' && (
            <QuestionnaireStep answers={answers} onChange={setAnswers} />
          )}
          {step === 'describe' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Describe the situation</h3>
              <p className="text-xs text-muted-foreground">
                Explain what happened in your own words. Stick to facts — this will be shared with the other party.
              </p>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue..."
                rows={6}
              />
            </div>
          )}
          {step === 'evidence' && (
            <EvidenceUploader files={evidenceFiles} onChange={setEvidenceFiles} />
          )}
          {step === 'review' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Review your submission</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Issues</p>
                  <p>{issueTypes.map((t) => t.replace(/_/g, ' ')).join(', ')}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Desired outcome</p>
                  <p>{answers.desired_outcome?.replace(/_/g, ' ') || 'Not specified'}</p>
                </div>
                {description && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="whitespace-pre-wrap">{description}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Evidence</p>
                  <p>{evidenceFiles.length} file(s) attached</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Both parties will be able to view submitted information. Our AI will structure your case into agreed facts and disputed points to help reach a fair outcome.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(STEPS[stepIdx - 1])}
            disabled={stepIdx === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          {step === 'review' ? (
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Submit Dispute
            </Button>
          ) : (
            <Button
              onClick={() => setStep(STEPS[stepIdx + 1])}
              disabled={!canNext()}
            >
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
