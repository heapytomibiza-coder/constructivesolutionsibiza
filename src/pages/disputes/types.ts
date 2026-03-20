/**
 * Dispute domain types
 */

export type DisputeStatus =
  | 'draft'
  | 'open'
  | 'awaiting_counterparty'
  | 'evidence_collection'
  | 'assessment'
  | 'resolution_offered'
  | 'awaiting_acceptance'
  | 'resolved'
  | 'closed'
  | 'escalated';

export type DisputeIssueType =
  | 'quality'
  | 'completion'
  | 'delay'
  | 'payment'
  | 'scope_change'
  | 'materials'
  | 'access_site_conditions'
  | 'communication_conduct'
  | 'damage'
  | 'abandonment'
  | 'pricing_variation';

export type ResolutionPathway =
  | 'corrective_work'
  | 'financial_adjustment'
  | 'shared_responsibility'
  | 'expert_review';

export interface DisputeRecord {
  id: string;
  job_id: string;
  milestone_label: string | null;
  raised_by: string;
  raised_by_role: string;
  issue_types: DisputeIssueType[];
  secondary_tags: string[];
  status: DisputeStatus;
  summary_neutral: string | null;
  requested_outcome: string | null;
  ai_confidence_score: number | null;
  recommended_pathway: ResolutionPathway | null;
  human_review_required: boolean;
  counterparty_id: string | null;
  counterparty_responded_at: string | null;
  resolution_type: ResolutionPathway | null;
  resolution_description: string | null;
  resolution_accepted_at: string | null;
  evidence_deadline: string | null;
  response_deadline: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface DisputeAnalysis {
  id: string;
  dispute_id: string;
  issue_types: DisputeIssueType[];
  agreed_facts: string[];
  disputed_points: string[];
  missing_evidence: string[];
  summary_neutral: string | null;
  suggested_pathway: ResolutionPathway | null;
  confidence_score: number | null;
  requires_human_review: boolean;
  created_at: string;
}

export interface DisputeEvidence {
  id: string;
  dispute_id: string;
  user_id: string;
  file_path: string;
  file_type: string;
  file_name: string | null;
  file_size_bytes: number | null;
  description: string | null;
  submitted_by_role: string | null;
  evidence_category: string;
  related_issue_type: string | null;
  is_visible_to_counterparty: boolean;
  created_at: string;
}

export const EVIDENCE_CATEGORIES = [
  { value: 'photo', label: 'Photo' },
  { value: 'video', label: 'Video' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'message', label: 'Message / Screenshot' },
  { value: 'plan', label: 'Plan / Drawing' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'document', label: 'Other Document' },
] as const;

export interface DisputeInput {
  id: string;
  dispute_id: string;
  user_id: string;
  input_type: string;
  raw_text: string | null;
  transcript: string | null;
  questionnaire_answers: Record<string, string> | null;
  voice_file_path: string | null;
  created_at: string;
}

// Questionnaire option sets
export const ISSUE_TYPE_OPTIONS: { value: DisputeIssueType; label: string; description: string }[] = [
  { value: 'quality', label: 'Poor quality', description: 'Work does not meet expected standards' },
  { value: 'completion', label: 'Work not completed', description: 'Job was left unfinished' },
  { value: 'delay', label: 'Delay', description: 'Work is significantly behind schedule' },
  { value: 'payment', label: 'Payment disagreement', description: 'Dispute about amount or timing' },
  { value: 'scope_change', label: 'Scope misunderstanding', description: 'Disagreement about what was included' },
  { value: 'materials', label: 'Materials issue', description: 'Wrong or poor materials used' },
  { value: 'damage', label: 'Damage', description: 'Property was damaged during work' },
  { value: 'communication_conduct', label: 'Communication/Conduct', description: 'Unprofessional behavior or lack of communication' },
  { value: 'abandonment', label: 'Abandonment', description: 'Professional stopped responding or left' },
];

export const OUTCOME_OPTIONS = [
  { value: 'corrective_work', label: 'Work completed or corrected' },
  { value: 'partial_refund', label: 'Partial refund' },
  { value: 'full_refund', label: 'Full refund' },
  { value: 'independent_review', label: 'Independent expert review' },
];

export const COMPLETION_OPTIONS = [
  { value: 'fully', label: 'Fully completed' },
  { value: 'partially', label: 'Partially completed' },
  { value: 'not_started', label: 'Not started' },
];

export const SCOPE_AGREEMENT_OPTIONS = [
  { value: 'written', label: 'Yes (written agreement)' },
  { value: 'verbal', label: 'Yes (verbal agreement)' },
  { value: 'partially', label: 'Partially agreed' },
  { value: 'no', label: 'No clear agreement' },
];
