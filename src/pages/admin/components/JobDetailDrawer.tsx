/**
 * Job Detail Drawer
 * Shows full job context + admin actions in a right-side Sheet.
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
  ExternalLink, Copy, CheckCircle, Archive, User, MessageSquare,
  Clock, ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAdminDrawer } from "../context/AdminDrawerContext";
import { useAdminJobDetails } from "../queries/adminJobDetails.query";
import { formatWhatsAppPost, copyToClipboard } from "../lib/formatWhatsAppPost";
import { ClassificationReviewPanel } from "./ClassificationReviewPanel";
import { JobTypeBadge } from "@/pages/jobs/components/JobTypeBadge";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "open": return <Badge variant="secondary">Open</Badge>;
    case "in_progress": return <Badge className="bg-primary text-primary-foreground">In Progress</Badge>;
    case "completed": return <Badge className="bg-accent text-accent-foreground">Completed</Badge>;
    case "archived": return <Badge variant="outline">Archived</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function SafetyBadge({ safety }: { safety: string | null }) {
  if (!safety) return null;
  switch (safety) {
    case "red": return <Badge variant="destructive">High Risk</Badge>;
    case "amber": return <Badge className="bg-secondary text-secondary-foreground">Caution</Badge>;
    case "green": return <Badge className="bg-accent text-accent-foreground">Safe</Badge>;
    default: return null;
  }
}

function formatBudget(type: string | null, value: number | null, min: number | null, max: number | null) {
  if (type === "fixed" && value) return `€${value.toLocaleString()}`;
  if (type === "range" && min && max) return `€${min.toLocaleString()} – €${max.toLocaleString()}`;
  if (type === "hourly" && value) return `€${value}/hr`;
  return "Quote required";
}

const TIMING_LABELS: Record<string, string> = {
  asap: "ASAP", this_week: "This week", next_week: "Next week",
  flexible: "Flexible", specific_date: "Specific date",
};

export function JobDetailDrawer() {
  const { state, open, closeDrawer, openDrawer } = useAdminDrawer();
  const jobId = state?.type === "job" ? state.id : null;
  const { data: job, isLoading } = useAdminJobDetails(jobId);
  const queryClient = useQueryClient();

  const isOpen = open && state?.type === "job";

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && closeDrawer()}>
      <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
        {isLoading || !job ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="pb-4">
              <SheetTitle className="text-lg leading-snug pr-6">{job.title}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 mt-1">
                <StatusBadge status={job.status} />
                <SafetyBadge safety={job.computed_safety} />
                {job.flags?.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                ))}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              <JobTypeBadge
                job={{
                  flags: job.flags,
                  computed_inspection_bias: job.computed_inspection_bias,
                  description: job.description,
                }}
                audience="admin"
                variant="card"
              />
              {/* Summary Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p className="font-medium capitalize">{job.category?.replace(/-/g, " ") ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Subcategory</span>
                  <p className="font-medium capitalize">{job.subcategory?.replace(/-/g, " ") ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Area</span>
                  <p className="font-medium">{job.area ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Budget</span>
                  <p className="font-medium">{formatBudget(job.budget_type, job.budget_value, job.budget_min, job.budget_max)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Timing</span>
                  <p className="font-medium">{TIMING_LABELS[job.start_timing ?? ""] ?? job.start_timing ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Posted</span>
                  <p className="font-medium">{format(new Date(job.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>

              {job.teaser && (
                <p className="text-sm text-muted-foreground italic">{job.teaser}</p>
              )}

              {/* AI Classification for custom requests */}
              {job.is_custom_request && (
                <>
                  <Separator />
                  <ClassificationReviewPanel
                    jobId={job.id}
                    isCustomRequest={job.is_custom_request}
                  />
                </>
              )}

              <Separator />

              {/* Client */}
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                onClick={() => openDrawer({ type: "user", id: job.user_id })}
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{job.client?.display_name ?? "Unknown Client"}</p>
                    <p className="text-xs text-muted-foreground">{job.client?.phone ?? "No phone"}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Assigned Pro */}
              {job.assigned_professional_id && (
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  onClick={() => openDrawer({ type: "user", id: job.assigned_professional_id! })}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {job.assigned_pro?.display_name ?? "Assigned Pro"}
                        {job.assigned_pro?.business_name && (
                          <span className="text-muted-foreground ml-1">({job.assigned_pro.business_name})</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{job.assigned_pro?.verification_status ?? "unknown"}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              )}

              <Separator />

              {/* Conversations */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{job.conversation_count} Conversation{job.conversation_count !== 1 ? "s" : ""}</span>
                </div>
                {job.conversations.length > 0 && (
                  <div className="space-y-2">
                    {job.conversations.slice(0, 5).map((c) => (
                      <div key={c.id} className="text-sm p-2 rounded border bg-muted/30">
                        <p className="truncate text-muted-foreground">{c.last_message_preview ?? "No messages yet"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.last_message_at ? format(new Date(c.last_message_at), "MMM d, HH:mm") : format(new Date(c.created_at), "MMM d, HH:mm")}
                        </p>
                      </div>
                    ))}
                    {job.conversations.length > 5 && (
                      <p className="text-xs text-muted-foreground">+{job.conversations.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Status Timeline */}
              {job.status_history.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Timeline</span>
                  </div>
                  <div className="space-y-1">
                    {job.status_history.map((h) => (
                      <div key={h.id} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-28 shrink-0">
                          {format(new Date(h.created_at), "MMM d, HH:mm")}
                        </span>
                        <span className="capitalize">
                          {h.from_status ? `${h.from_status} → ${h.to_status}` : h.to_status}
                        </span>
                        <span className="text-muted-foreground">({h.change_source})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Admin Actions */}
              <div className="flex flex-wrap gap-2 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const text = formatWhatsAppPost(job, window.location.origin);
                    const ok = await copyToClipboard(text);
                    if (ok) toast.success("Copied to clipboard");
                    else toast.error("Copy failed");
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" /> WhatsApp
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" /> View Public
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
