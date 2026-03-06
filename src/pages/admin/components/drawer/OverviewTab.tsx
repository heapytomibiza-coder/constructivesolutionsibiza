import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase, MessageSquare, Headset, CheckCircle, Circle,
  Phone, Calendar, Shield, UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import type { AdminUserDetails } from "../../queries/adminUserDetails.query";

export function OverviewTab({ user }: { user: AdminUserDetails }) {
  return (
    <div className="space-y-5">
      {/* Completeness (Tasker only) */}
      {user.completeness && (
        <>
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Profile Completeness</h3>
              <Badge
                variant={user.completeness.score >= 80 ? "default" : user.completeness.score >= 50 ? "secondary" : "destructive"}
                className="text-xs"
              >
                {user.completeness.score}%
              </Badge>
            </div>
            <Progress value={user.completeness.score} className="h-2" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {user.completeness.checks.map((c) => (
                <div key={c.label} className="flex items-center gap-1.5 text-xs">
                  {c.done ? (
                    <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Identity */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoField icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={user.phone ?? "—"} />
          <InfoField icon={<UserCheck className="h-3.5 w-3.5" />} label="Active Role" value={user.active_role} capitalize />
          <InfoField icon={<Calendar className="h-3.5 w-3.5" />} label="Joined" value={user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "—"} />
          {user.pro && (
            <InfoField icon={<Shield className="h-3.5 w-3.5" />} label="Verification" value={user.pro.verification_status} capitalize />
          )}
        </div>
        {user.suspension_reason && (
          <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            <span className="font-medium">Suspension reason:</span> {user.suspension_reason}
          </div>
        )}
      </div>

      <Separator />

      {/* Activity Summary */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity</h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Briefcase className="h-4 w-4" />} value={user.jobs_count} label="Jobs Posted" />
          <StatCard icon={<MessageSquare className="h-4 w-4" />} value={user.conversations_count} label="Conversations" />
          <StatCard icon={<Headset className="h-4 w-4" />} value={user.support_tickets_count} label="Tickets" />
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon, label, value, capitalize }: { icon: React.ReactNode; label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`font-medium text-sm ${capitalize ? "capitalize" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg border text-center">
      <span className="text-muted-foreground mb-1">{icon}</span>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}
