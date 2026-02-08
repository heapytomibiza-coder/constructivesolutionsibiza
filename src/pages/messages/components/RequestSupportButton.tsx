/**
 * Button to request support - shows in conversation header
 */
import { useState } from "react";
import { Headset, Loader2 } from "lucide-react";
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
      <Button variant="outline" size="sm" disabled className="text-muted-foreground">
        <Headset className="h-4 w-4 mr-2" />
        Support Requested
      </Button>
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
