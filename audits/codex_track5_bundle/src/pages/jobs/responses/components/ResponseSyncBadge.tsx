/**
 * ResponseSyncBadge — subtle operational indicator for the professional.
 *
 * Surfaces whether a saved quote is correctly linked to the pro's
 * job_responses row (and therefore visible in the client's inbox).
 *
 * Calculation (read-only, no schema/RPC changes):
 *   - Linked: a response row exists and response.quote_id === quote.id
 *   - Unlinked: quote exists but response is missing or response.quote_id
 *               is null / mismatched
 *
 * Designed to be operational, not scary: a small dot + label with a tooltip.
 */

import { CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ResponseSyncState = "linked" | "unlinked";

interface Props {
  state: ResponseSyncState;
  className?: string;
}

export function ResponseSyncBadge({ state, className }: Props) {
  const { t } = useTranslation("responses");
  const linked = state === "linked";

  const Icon = linked ? CheckCircle2 : AlertCircle;
  const label = linked ? t("pro.syncLinked") : t("pro.syncUnlinked");
  const tooltip = linked
    ? t("pro.syncLinkedTooltip")
    : t("pro.syncUnlinkedTooltip");

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] leading-none",
              linked ? "text-muted-foreground" : "text-amber-600",
              className
            )}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span>{label}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Decide whether to show the badge and which state to render.
 * Returns null when the badge should be hidden (e.g. quote withdrawn/rejected,
 * or no quote at all — sync is irrelevant).
 */
export function deriveSyncState(input: {
  quoteId: string | null | undefined;
  quoteStatus: string | null | undefined;
  responseQuoteId: string | null | undefined;
  hasResponse: boolean;
}): ResponseSyncState | null {
  const { quoteId, quoteStatus, responseQuoteId, hasResponse } = input;
  if (!quoteId) return null;
  // Operational noise — don't surface sync state for terminal quote states
  if (quoteStatus === "withdrawn" || quoteStatus === "rejected") return null;
  if (hasResponse && responseQuoteId === quoteId) return "linked";
  return "unlinked";
}
