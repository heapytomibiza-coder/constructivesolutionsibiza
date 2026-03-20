import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  disputeId: string;
  isCounterparty: boolean;
  hasResponded: boolean;
  responseDeadline: string | null;
}

export function CounterpartyBanner({ disputeId, isCounterparty, hasResponded, responseDeadline }: Props) {
  const navigate = useNavigate();

  if (!isCounterparty) return null;

  const deadline = responseDeadline ? new Date(responseDeadline) : null;
  const isOverdue = deadline && deadline < new Date();
  const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  if (hasResponded) {
    return (
      <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Your response has been recorded
          </span>
        </div>
        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
          Both parties' statements will be reviewed to reach a fair outcome.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      isOverdue
        ? 'bg-destructive/10 border-destructive/20'
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isOverdue ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${
            isOverdue ? 'text-destructive' : 'text-amber-800 dark:text-amber-200'
          }`}>
            {isOverdue
              ? 'Your response is overdue'
              : 'Awaiting your response'}
          </p>
          <p className={`text-xs mt-1 ${
            isOverdue ? 'text-destructive/80' : 'text-amber-700 dark:text-amber-300'
          }`}>
            {isOverdue
              ? 'Please respond as soon as possible. Delays may affect the outcome.'
              : daysLeft !== null
                ? `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to respond.`
                : 'Please respond at your earliest convenience.'}
          </p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => navigate(`/disputes/${disputeId}/respond`)}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Respond to Dispute
          </Button>
        </div>
      </div>
    </div>
  );
}