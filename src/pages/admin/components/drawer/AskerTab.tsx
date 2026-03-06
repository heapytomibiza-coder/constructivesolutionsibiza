import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Briefcase, MessageSquare, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { AdminUserDetails } from "../../queries/adminUserDetails.query";

export function AskerTab({ user }: { user: AdminUserDetails }) {
  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <Briefcase className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-bold">{user.asker_jobs.length}</p>
          <p className="text-[10px] text-muted-foreground">Jobs Posted</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <MessageSquare className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-bold">{user.asker_conversations_count}</p>
          <p className="text-[10px] text-muted-foreground">Conversations</p>
        </div>
      </div>

      <Separator />

      {/* Job List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Jobs
        </h3>
        {user.asker_jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No jobs posted yet</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {user.asker_jobs.map((job) => (
              <div key={job.id} className="rounded-lg border p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight line-clamp-2">{job.title}</p>
                  <Badge
                    variant={job.status === "open" ? "default" : "secondary"}
                    className="text-[10px] capitalize shrink-0"
                  >
                    {job.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {job.category && (
                    <span className="capitalize">{job.category.replace(/-/g, " ")}</span>
                  )}
                  {job.area && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {job.area}
                    </span>
                  )}
                  <span>{format(new Date(job.created_at), "MMM d")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
