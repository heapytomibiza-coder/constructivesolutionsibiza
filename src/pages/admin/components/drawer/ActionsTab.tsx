import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Ban, Shield } from "lucide-react";
import { toast } from "sonner";
import { suspendUser, unsuspendUser } from "../../actions/suspendUser.action";
import { verifyProfessional } from "../../actions/verifyProfessional.action";
import type { AdminUserDetails } from "../../queries/adminUserDetails.query";

interface Props {
  user: AdminUserDetails;
  onActionComplete: () => void;
}

export function ActionsTab({ user, onActionComplete }: Props) {
  const handleSuspend = async () => {
    const reason = window.prompt("Suspension reason (optional):");
    const result = await suspendUser({ userId: user.user_id, reason: reason || undefined });
    if (result.success) {
      toast.success("User suspended");
      onActionComplete();
    } else {
      toast.error(result.error || "Failed to suspend");
    }
  };

  const handleUnsuspend = async () => {
    const result = await unsuspendUser(user.user_id);
    if (result.success) {
      toast.success("User unsuspended");
      onActionComplete();
    } else {
      toast.error(result.error || "Failed to unsuspend");
    }
  };

  const handleVerify = async (status: "verified" | "rejected") => {
    const result = await verifyProfessional({ userId: user.user_id, status });
    if (result.success) {
      toast.success(`Professional ${status}`);
      onActionComplete();
    } else {
      toast.error(result.error || "Failed to update verification");
    }
  };

  return (
    <div className="space-y-5">
      {/* Verification */}
      {user.pro && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Verification
          </h3>
          <p className="text-sm text-muted-foreground">
            Current status: <span className="font-medium capitalize text-foreground">{user.pro.verification_status}</span>
          </p>
          {user.pro.verification_status !== "verified" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleVerify("verified")}>
                <CheckCircle className="h-4 w-4 mr-1" /> Verify Pro
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleVerify("rejected")}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          )}
          {user.pro.verification_status === "verified" && (
            <Button size="sm" variant="outline" onClick={() => handleVerify("rejected")}>
              <XCircle className="h-4 w-4 mr-1" /> Revoke Verification
            </Button>
          )}
        </div>
      )}

      {user.pro && <Separator />}

      {/* Suspension */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Account Status
        </h3>
        {user.suspended_at ? (
          <>
            <p className="text-sm text-destructive">
              Suspended{user.suspension_reason ? `: ${user.suspension_reason}` : ""}
            </p>
            <Button size="sm" variant="outline" onClick={handleUnsuspend}>
              <Shield className="h-4 w-4 mr-1" /> Unsuspend User
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Account is active</p>
            <Button size="sm" variant="destructive" onClick={handleSuspend}>
              <Ban className="h-4 w-4 mr-1" /> Suspend User
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
