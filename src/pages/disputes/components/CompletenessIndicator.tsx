import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';

interface CompletenessData {
  has_statement: boolean;
  has_questionnaire: boolean;
  evidence_count: number;
  has_counterparty_response: boolean;
  has_scope: boolean;
  score: number;
  max_score: number;
  level: 'low' | 'medium' | 'high';
}

export function CompletenessIndicator({ disputeId }: { disputeId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['dispute-completeness', disputeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_dispute_completeness', {
        p_dispute_id: disputeId,
      } as any);
      if (error) throw error;
      return data as CompletenessData;
    },
  });

  if (isLoading || !data) return null;

  const levelConfig = {
    low: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Low' },
    medium: { icon: Circle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Medium' },
    high: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'High' },
  };

  const config = levelConfig[data.level];
  const Icon = config.icon;

  const items = [
    { label: 'Statement', done: data.has_statement },
    { label: 'Questionnaire', done: data.has_questionnaire },
    { label: 'Evidence', done: data.evidence_count > 0 },
    { label: 'Counterparty response', done: data.has_counterparty_response },
    { label: 'Scope defined', done: data.has_scope },
  ];

  return (
    <div className={`p-3 rounded-lg border ${config.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          Case Strength: {config.label}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {data.score}/{data.max_score}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <span key={item.label} className={`text-xs ${item.done ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
            {item.done ? '✓' : '○'} {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
