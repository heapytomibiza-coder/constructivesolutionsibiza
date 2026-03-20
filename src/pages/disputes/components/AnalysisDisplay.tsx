import { CheckCircle2, AlertCircle, HelpCircle, Scale, Wrench, DollarSign, Users, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { DisputeAnalysis, ResolutionPathway } from '../types';

interface Props {
  analysis: DisputeAnalysis;
}

const PATHWAY_META: Record<ResolutionPathway, { label: string; icon: React.ReactNode; color: string }> = {
  corrective_work: { label: 'Corrective Work', icon: <Wrench className="h-4 w-4" />, color: 'text-blue-600' },
  financial_adjustment: { label: 'Financial Adjustment', icon: <DollarSign className="h-4 w-4" />, color: 'text-amber-600' },
  shared_responsibility: { label: 'Shared Responsibility', icon: <Users className="h-4 w-4" />, color: 'text-purple-600' },
  expert_review: { label: 'Expert Review', icon: <Search className="h-4 w-4" />, color: 'text-red-600' },
};

export function AnalysisDisplay({ analysis }: Props) {
  const pathway = analysis.suggested_pathway ? PATHWAY_META[analysis.suggested_pathway] : null;
  const confidencePercent = (analysis.confidence_score || 0) * 100;
  const confidenceLabel =
    confidencePercent >= 85 ? 'High' : confidencePercent >= 65 ? 'Medium' : 'Low';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Scale className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-semibold text-foreground">Case Analysis</h3>
          <p className="text-xs text-muted-foreground">
            AI-assisted analysis — this is a suggestion, not a decision
          </p>
        </div>
      </div>

      {/* Neutral Summary */}
      {analysis.summary_neutral && (
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm text-foreground leading-relaxed">{analysis.summary_neutral}</p>
        </div>
      )}

      {/* Suggested Pathway */}
      {pathway && (
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-xs text-muted-foreground mb-1">Suggested Resolution Pathway</p>
          <div className={`flex items-center gap-2 font-semibold ${pathway.color}`}>
            {pathway.icon}
            <span>{pathway.label}</span>
          </div>
        </div>
      )}

      {/* Confidence Score */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Analysis confidence</span>
          <span className="font-medium">{confidenceLabel} ({Math.round(confidencePercent)}%)</span>
        </div>
        <Progress value={confidencePercent} className="h-2" />
        {analysis.requires_human_review && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            This case has been flagged for human review
          </p>
        )}
      </div>

      {/* Agreed Facts */}
      {analysis.agreed_facts && (analysis.agreed_facts as string[]).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Likely Agreed Facts
          </h4>
          <ul className="space-y-1">
            {(analysis.agreed_facts as string[]).map((fact, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-6">• {fact}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Disputed Points */}
      {analysis.disputed_points && (analysis.disputed_points as string[]).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Disputed Points
          </h4>
          <ul className="space-y-1">
            {(analysis.disputed_points as string[]).map((point, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-6">• {point}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Evidence */}
      {analysis.missing_evidence && (analysis.missing_evidence as string[]).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            Evidence That Would Help
          </h4>
          <ul className="space-y-1">
            {(analysis.missing_evidence as string[]).map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-6">• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Issue Types */}
      {analysis.issue_types && analysis.issue_types.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {analysis.issue_types.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs capitalize">
              {type.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
