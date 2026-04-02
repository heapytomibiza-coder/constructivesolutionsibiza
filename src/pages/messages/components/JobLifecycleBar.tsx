/**
 * JobLifecycleBar — context-aware status bar with lifecycle actions.
 * Replaces QuoteNudgeBanner with full lifecycle support.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DollarSign, ArrowRight, Clock, Hammer, CheckCircle2, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobLifecycleBarProps {
  jobId: string;
  jobStatus?: string;
  userRole: "client" | "professional";
  messageCount: number;
  hasQuote: boolean;
  onStartQuote: () => void;
  onComplete: () => Promise<void>;
  hidden?: boolean;
}

export function JobLifecycleBar({
  jobId,
  jobStatus,
  userRole,
  messageCount,
  hasQuote,
  onStartQuote,
  onComplete,
  hidden,
}: JobLifecycleBarProps) {
  const { t } = useTranslation("messages");
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [completing, setCompleting] = useState(false);

  if (hidden) return null;

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete();
    } finally {
      setCompleting(false);
      setShowConfirm(false);
    }
  };

  // Determine what to render based on status + role + quote state
  let icon: React.ReactNode = null;
  let text: string | null = null;
  let subtext: string | null = null;
  let action: React.ReactNode = null;
  let variant: "nudge" | "waiting" | "active" | "done" = "nudge";

  if (jobStatus === "open") {
    if (!hasQuote && userRole === "professional") {
      const isUrgent = messageCount >= 5;
      icon = <DollarSign className="h-4 w-4 text-primary" />;
      text = isUrgent
        ? t("lifecycle.urgentQuoteTitle", "You've discussed the job — send your quote to move forward")
        : t("lifecycle.quoteTitle", "Ready to send a formal quote?");
      subtext = t("lifecycle.quoteSubtitle", "The client can't hire you until you submit one.");
      variant = "nudge";
      action = (
        <Button size="sm" className="shrink-0 gap-1.5" onClick={onStartQuote}>
          <DollarSign className="h-3.5 w-3.5" />
          {t("lifecycle.startQuote", "Start your quote")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      );
    } else if (hasQuote && userRole === "professional") {
      icon = <Clock className="h-4 w-4 text-muted-foreground" />;
      text = t("lifecycle.quoteSentWaiting", "Quote sent — waiting for response");
      variant = "waiting";
    } else if (hasQuote && userRole === "client") {
      icon = <DollarSign className="h-4 w-4 text-primary" />;
      text = t("lifecycle.quoteReceivedClient", "You received a quote — review it above");
      variant = "nudge";
    } else if (!hasQuote && userRole === "client") {
      icon = <Clock className="h-4 w-4 text-muted-foreground" />;
      text = t("lifecycle.waitingForQuote", "Waiting for a quote from the professional");
      variant = "waiting";
    } else {
      return null;
    }
  } else if (jobStatus === "in_progress") {
    icon = <Hammer className="h-4 w-4 text-primary" />;
    text = t("lifecycle.workInProgress", "Work in progress");
    variant = "active";
    if (userRole === "client") {
      action = (
        <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => setShowConfirm(true)}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t("lifecycle.markComplete", "Mark Complete")}
        </Button>
      );
    }
  } else if (jobStatus === "completed") {
    icon = <CheckCircle2 className="h-4 w-4 text-primary" />;
    text = t("lifecycle.jobCompleted", "Job completed");
    variant = "done";
    action = (
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-1.5"
        onClick={() => navigate(`/dashboard/jobs/${jobId}`)}
      >
        <Star className="h-3.5 w-3.5" />
        {t("lifecycle.leaveReview", "Leave a review")}
      </Button>
    );
  } else {
    return null;
  }

  const bgMap = {
    nudge: "border-primary/20 bg-primary/5",
    waiting: "border-border bg-muted/30",
    active: "border-primary/20 bg-primary/5",
    done: "border-primary/30 bg-primary/10",
  };

  return (
    <>
      <div className={cn("mx-3 mb-2 rounded-lg border px-3 py-2.5 flex items-center gap-3", bgMap[variant])}>
        <div className="shrink-0 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{text}</p>
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
        {action}
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("lifecycle.confirmCompleteTitle", "Mark this job as complete?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("lifecycle.confirmCompleteDesc", "This confirms the work is finished. Both parties will be prompted to leave a review.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>{t("lifecycle.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={completing}>
              {completing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("lifecycle.confirmComplete", "Yes, mark complete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
