/**
 * Button to request support - shows in conversation header
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Headset, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupportRequestStatus } from "../hooks/useSupportRequestStatus";
import { SupportRequestDialog } from "./SupportRequestDialog";

interface RequestSupportButtonProps {
  conversationId: string;
  jobId?: string | null;
  userRole: 'client' | 'professional';
}

export function RequestSupportButton({
  conversationId,
  jobId,
  userRole,
}: RequestSupportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { hasOpenRequest, isLoading } = useSupportRequestStatus(conversationId);

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (hasOpenRequest) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button variant="outline" size="sm" disabled className="text-muted-foreground">
          <Headset className="h-4 w-4 mr-2" />
          Support Requested
        </Button>
        {jobId && (
          <Link
            to={`/contact?subject=issue&job=${jobId}`}
            className="text-xs text-destructive hover:underline"
          >
            Not resolved? Escalate to formal dispute
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setDialogOpen(true)}
      >
        <Headset className="h-4 w-4 mr-2" />
        Request Support
      </Button>
      <SupportRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        conversationId={conversationId}
        jobId={jobId}
        userRole={userRole}
      />
    </>
  );
}
