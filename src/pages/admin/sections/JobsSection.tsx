/**
 * Admin Jobs Section
 * Lists jobs with moderation tools: filter by flags/status, force complete, archive.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, AlertTriangle, CheckCircle, Archive, ExternalLink, Copy, MessageSquare, DollarSign } from "lucide-react";
import { useAdminDrawer } from "../context/AdminDrawerContext";
import { formatWhatsAppPost, copyToClipboard } from "../lib/formatWhatsAppPost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAdminJobs, type AdminJobsFilter, type AdminJobRow } from "../hooks/useAdminJobs";
import { forceCompleteJob } from "../actions/forceCompleteJob.action";
import { archiveJob } from "../actions/archiveJob.action";
import type { JobsBoardRow } from "@/pages/jobs/types";

type ActionType = "force_complete" | "archive" | null;

export default function JobsSection() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AdminJobsFilter>("all");
  const [selectedJob, setSelectedJob] = useState<JobsBoardRow | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { openDrawer } = useAdminDrawer();

  const queryClient = useQueryClient();
  const { data: jobs, isLoading } = useAdminJobs({ filter, search });

  const openActionDialog = (job: JobsBoardRow, action: ActionType) => {
    setSelectedJob(job);
    setActionType(action);
    setReason("");
  };

  const closeDialog = () => {
    setSelectedJob(null);
    setActionType(null);
    setReason("");
  };

  const handleAction = async () => {
    if (!selectedJob || !actionType || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      let result;
      if (actionType === "force_complete") {
        result = await forceCompleteJob(selectedJob.id, reason);
      } else if (actionType === "archive") {
        result = await archiveJob(selectedJob.id, reason);
      }

      if (result?.success) {
        toast.success(
          actionType === "force_complete"
            ? "Job marked as completed"
            : "Job archived successfully"
        );
        queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
        closeDialog();
      } else {
        toast.error(result?.error || "Action failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "open":
        return <Badge variant="secondary">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-primary text-primary-foreground">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-accent text-accent-foreground">Completed</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const getSafetyBadge = (safety: string | null) => {
    if (!safety) return null;
    switch (safety) {
      case "red":
        return <Badge variant="destructive">High Risk</Badge>;
      case "amber":
        return <Badge className="bg-secondary text-secondary-foreground">Caution</Badge>;
      case "green":
        return <Badge className="bg-accent text-accent-foreground">Safe</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Moderation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as AdminJobsFilter)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="needs_quote">💬 Needs Quote</SelectItem>
              <SelectItem value="flagged">⚠️ Flagged</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Jobs Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Safety</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !jobs?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No jobs found
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} className="cursor-pointer" onClick={() => openDrawer({ type: "job", id: job.id })}>
                    <TableCell>
                      <div className="font-medium truncate max-w-[200px]">
                        {job.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.area || "No location"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {job.category || "—"}
                        {job.subcategory && (
                          <span className="text-muted-foreground">
                            {" / "}
                            {job.subcategory}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-0.5 text-muted-foreground" title="Conversations">
                          <MessageSquare className="h-3 w-3" />
                          {(job as AdminJobRow).conversation_count ?? 0}
                        </span>
                        <span className="flex items-center gap-0.5 text-muted-foreground" title="Quotes">
                          <DollarSign className="h-3 w-3" />
                          {(job as AdminJobRow).quote_count ?? 0}
                        </span>
                        {(job as AdminJobRow).needs_quote && (
                          <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                            Needs Quote
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getSafetyBadge(job.computed_safety)}</TableCell>
                    <TableCell>
                      {job.flags && job.flags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {job.flags.slice(0, 2).map((flag) => (
                            <Badge key={flag} variant="outline" className="text-xs">
                              {flag}
                            </Badge>
                          ))}
                          {job.flags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.flags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Copy WhatsApp"
                          onClick={async () => {
                            const text = formatWhatsAppPost(job, window.location.origin);
                            const ok = await copyToClipboard(text);
                            if (ok) toast.success("Copied to clipboard");
                            else toast.error("Copy failed");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        {job.status !== "completed" && job.status !== "archived" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openActionDialog(job, "force_complete")}
                            title="Force Complete"
                          >
                            <CheckCircle className="h-4 w-4 text-accent-foreground" />
                          </Button>
                        )}
                        {job.status !== "archived" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openActionDialog(job, "archive")}
                            title="Archive"
                          >
                            <Archive className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!selectedJob && !!actionType} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "force_complete" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-accent-foreground" />
                  Force Complete Job
                </>
              ) : (
                <>
                  <Archive className="h-5 w-5" />
                  Archive Job
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "force_complete"
                ? "This will mark the job as completed without client confirmation. This action is logged."
                : "This will remove the job from the marketplace. The data is preserved for audit. This action is logged."}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="py-2">
              <div className="text-sm font-medium">{selectedJob.title}</div>
              <div className="text-sm text-muted-foreground">
                {selectedJob.category} • {selectedJob.area || "No location"}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (required)</label>
            <Textarea
              placeholder="Enter reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={!reason.trim() || isSubmitting}
              variant={actionType === "archive" ? "destructive" : "default"}
            >
              {isSubmitting
                ? "Processing..."
                : actionType === "force_complete"
                ? "Force Complete"
                : "Archive Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
