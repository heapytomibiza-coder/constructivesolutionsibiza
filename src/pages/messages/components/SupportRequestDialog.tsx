/**
 * Dialog for creating a support request
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Clock, 
  UserX, 
  Scale, 
  CreditCard, 
  AlertTriangle, 
  HelpCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { createSupportRequest } from "../actions/createSupportRequest.action";

type IssueType = 'no_response' | 'no_show' | 'dispute' | 'payment' | 'safety_concern' | 'other';

interface IssueOption {
  value: IssueType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ISSUE_OPTIONS: IssueOption[] = [
  {
    value: 'no_response',
    label: 'No Response',
    description: 'The other party is not responding to messages',
    icon: Clock,
  },
  {
    value: 'no_show',
    label: 'No Show',
    description: 'The professional did not show up as scheduled',
    icon: UserX,
  },
  {
    value: 'dispute',
    label: 'Dispute',
    description: 'There is a disagreement about the work or terms',
    icon: Scale,
  },
  {
    value: 'payment',
    label: 'Payment Issue',
    description: 'Problems with payment or pricing',
    icon: CreditCard,
  },
  {
    value: 'safety_concern',
    label: 'Safety Concern',
    description: 'Report unsafe behavior or conditions',
    icon: AlertTriangle,
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Something else not listed above',
    icon: HelpCircle,
  },
];

interface SupportRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  jobId?: string | null;
  userRole: 'client' | 'professional';
}

export function SupportRequestDialog({
  open,
  onOpenChange,
  conversationId,
  jobId,
  userRole,
}: SupportRequestDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [issueType, setIssueType] = useState<IssueType>('no_response');
  const [summary, setSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!issueType) {
      toast.error("Please select an issue type");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createSupportRequest({
        conversationId,
        jobId,
        issueType,
        summary: summary.trim() || undefined,
        userRole,
      });

      if (result.success) {
        toast.success(`Support request created: ${result.ticketNumber}`);
        // Invalidate queries to refresh messages and status
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["support-request-status", conversationId] });
        onOpenChange(false);
        // Reset form
        setIssueType('no_response');
        setSummary("");
      } else {
        toast.error(result.error || "Failed to create support request");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Support</DialogTitle>
          <DialogDescription>
            Let us know what's happening. We usually respond within a few hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Issue Type Selection */}
          <div className="space-y-3">
            <Label>What's the issue?</Label>
            <RadioGroup
              value={issueType}
              onValueChange={(v) => setIssueType(v as IssueType)}
              className="grid gap-2"
            >
              {ISSUE_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value} className="flex items-start">
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="mt-1"
                    />
                    <label
                      htmlFor={option.value}
                      className="flex-1 ml-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{option.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    </label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">
              Additional details <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value.slice(0, 500))}
              placeholder="Briefly describe the issue..."
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {summary.length}/500
            </p>
          </div>

          {/* Safety Notice */}
          {issueType === 'safety_concern' && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive font-medium">
                Safety concerns are treated with high priority.
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                If you are in immediate danger, please contact local emergency services.
              </p>
            </div>
          )}

          {/* Dispute escalation banner */}
          {issueType === 'dispute' && jobId && (
            <div className="rounded-md bg-muted border border-border p-3">
              <p className="text-sm font-medium text-foreground">
                Need a formal resolution?
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                If this is a serious issue, you can start a structured dispute process instead.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-1.5 text-destructive hover:text-destructive"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/disputes/raise?job=${jobId}`);
                }}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Start Formal Dispute
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
