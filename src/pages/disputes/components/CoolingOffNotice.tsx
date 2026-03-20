import { Clock, MessageSquare, Camera } from 'lucide-react';

export function CoolingOffNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
          Before you continue
        </h3>
      </div>
      <p className="text-sm text-amber-700 dark:text-amber-300">
        Most issues can be resolved by communicating directly. Before raising a formal dispute, consider:
      </p>
      <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
        <li className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Requesting correction or clarification via the messaging thread</span>
        </li>
        <li className="flex items-start gap-2">
          <Camera className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Sharing photos showing the specific issue to help the other party understand</span>
        </li>
      </ul>
      <p className="text-xs text-amber-600 dark:text-amber-400">
        Minor variations in finish work are common in construction. If you still need to proceed, this process will help structure a fair resolution.
      </p>
    </div>
  );
}
