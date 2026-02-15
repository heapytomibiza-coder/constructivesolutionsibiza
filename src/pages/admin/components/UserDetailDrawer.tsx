/**
 * User Detail Drawer
 * Shows full user/pro context + admin actions in a right-side Sheet.
 */
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  User, Briefcase, MessageSquare, Headset, CheckCircle, XCircle,
  Ban, Shield, MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAdminDrawer } from "../context/AdminDrawerContext";
import { useAdminUserDetails } from "../queries/adminUserDetails.query";
import { suspendUser, unsuspendUser } from "../actions/suspendUser.action";
import { verifyProfessional } from "../actions/verifyProfessional.action";
import { adminKeys } from "../queries/keys";

export function UserDetailDrawer() {
  const { state, open, closeDrawer } = useAdminDrawer();
  const userId = state?.type === "user" ? state.id : null;
  const { data: user, isLoading } = useAdminUserDetails(userId);
  const queryClient = useQueryClient();

  const isOpen = open && state?.type === "user";

  const handleSuspend = async () => {
    if (!user) return;
    const reason = window.prompt("Suspension reason (optional):");
    const result = await suspendUser({ userId: user.user_id, reason: reason || undefined });
    if (result.success) {
      toast.success("User suspended");
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    } else {
      toast.error(result.error || "Failed to suspend");
    }
  };

  const handleUnsuspend = async () => {
    if (!user) return;
    const result = await unsuspendUser(user.user_id);
    if (result.success) {
      toast.success("User unsuspended");
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    } else {
      toast.error(result.error || "Failed to unsuspend");
    }
  };

  const handleVerify = async (status: "verified" | "rejected") => {
    if (!user) return;
    const result = await verifyProfessional({ userId: user.user_id, status });
    if (result.success) {
      toast.success(`Professional ${status}`);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    } else {
      toast.error(result.error || "Failed to update verification");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && closeDrawer()}>
      <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
        {isLoading || !user ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {user.display_name ?? "Unnamed User"}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 mt-1">
                {user.roles.map((r) => (
                  <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="capitalize">
                    {r}
                  </Badge>
                ))}
                {user.suspended_at && <Badge variant="destructive">Suspended</Badge>}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium">{user.phone ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Active Role</span>
                  <p className="font-medium capitalize">{user.active_role}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Joined</span>
                  <p className="font-medium">
                    {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "—"}
                  </p>
                </div>
                {user.suspension_reason && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Suspension Reason</span>
                    <p className="font-medium text-destructive">{user.suspension_reason}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Activity Counts */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 rounded-lg border">
                  <Briefcase className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="text-lg font-bold">{user.jobs_count}</span>
                  <span className="text-xs text-muted-foreground">Jobs</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg border">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="text-lg font-bold">{user.conversations_count}</span>
                  <span className="text-xs text-muted-foreground">Convos</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg border">
                  <Headset className="h-4 w-4 text-muted-foreground mb-1" />
                  <span className="text-lg font-bold">{user.support_tickets_count}</span>
                  <span className="text-xs text-muted-foreground">Tickets</span>
                </div>
              </div>

              {/* Pro Section */}
              {user.pro && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Professional Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Verification</span>
                        <p className="font-medium capitalize">{user.pro.verification_status}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Onboarding</span>
                        <p className="font-medium capitalize">{user.pro.onboarding_phase.replace(/_/g, " ")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Services</span>
                        <p className="font-medium">{user.pro.services_count}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Listed</span>
                        <p className="font-medium">{user.pro.is_publicly_listed ? "Yes" : "No"}</p>
                      </div>
                      {user.pro.business_name && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Business</span>
                          <p className="font-medium">{user.pro.business_name}</p>
                        </div>
                      )}
                      {user.pro.tagline && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Tagline</span>
                          <p className="font-medium italic">{user.pro.tagline}</p>
                        </div>
                      )}
                    </div>

                    {/* Service Zones */}
                    {user.pro.service_zones && user.pro.service_zones.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Service Zones</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {user.pro.service_zones.map((z) => (
                            <Badge key={z} variant="outline" className="text-xs">{z}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Admin Actions */}
              <div className="flex flex-wrap gap-2 pb-4">
                {user.pro && user.pro.verification_status !== "verified" && (
                  <>
                    <Button size="sm" onClick={() => handleVerify("verified")}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Verify Pro
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleVerify("rejected")}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject Pro
                    </Button>
                  </>
                )}
                {user.suspended_at ? (
                  <Button size="sm" variant="outline" onClick={handleUnsuspend}>
                    <Shield className="h-4 w-4 mr-1" /> Unsuspend
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={handleSuspend}>
                    <Ban className="h-4 w-4 mr-1" /> Suspend
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
