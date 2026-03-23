import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertTriangle, Clock, MessageSquare, Bell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnansweredJobs, useNoProReplyJobs, type UnansweredJob } from "../hooks/useUnansweredJobs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useAdminDrawer } from "../context/AdminDrawerContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActionOutcomes } from "../hooks/useActionOutcomes";
import { ActionOutcomeBadge } from "../components/ActionOutcomeBadge";

function urgencyColor(hours: number) {
  if (hours >= 48) return "bg-red-100 text-red-800 border-red-200";
  if (hours >= 24) return "bg-amber-100 text-amber-800 border-amber-200";
  if (hours >= 6) return "bg-yellow-50 text-yellow-800 border-yellow-200";
  return "bg-muted text-muted-foreground";
}

function BreakdownCards({ data }: { data: UnansweredJob[] | undefined }) {
  const areaBreakdown = new Map<string, number>();
  const catBreakdown = new Map<string, number>();
  data?.forEach((j) => {
    if (j.area) areaBreakdown.set(j.area, (areaBreakdown.get(j.area) ?? 0) + 1);
    if (j.category) catBreakdown.set(j.category, (catBreakdown.get(j.category) ?? 0) + 1);
  });

  if (areaBreakdown.size === 0 && catBreakdown.size === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">By Area</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[...areaBreakdown.entries()].sort((a, b) => b[1] - a[1]).map(([area, count]) => (
            <div key={area} className="flex justify-between items-center p-2 rounded-lg border">
              <span className="font-medium">{area}</span>
              <Badge variant="destructive">{count} jobs</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">By Category</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[...catBreakdown.entries()].sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <div key={cat} className="flex justify-between items-center p-2 rounded-lg border">
              <span className="font-medium capitalize">{cat.replace(/-/g, " ")}</span>
              <Badge variant="destructive">{count} jobs</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function NotifyProsButton({ jobId, outcome }: { jobId: string; outcome?: import("../hooks/useActionOutcomes").ActionOutcome }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("admin_notify_matching_pros", { p_job_id: jobId });
      if (error) throw error;
      return data as unknown as { success: boolean; pros_notified: number };
    },
    onSuccess: (result) => {
      const count = (result as any)?.pros_notified ?? 0;
      if (count > 0) {
        toast.success(`Notified ${count} matching pro${count !== 1 ? "s" : ""}`);
      } else {
        toast.info("No matching pros found to notify");
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "unanswered_jobs"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to notify pros");
    },
  });

  return (
    <div className="flex items-center gap-1">
      {outcome && (
        <ActionOutcomeBadge
          status={outcome.outcome_status}
          createdAt={outcome.created_at}
          details={outcome.outcome_details}
          compact
        />
      )}
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1"
        onClick={(e) => { e.stopPropagation(); mutation.mutate(); }}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
        Notify Pros
      </Button>
    </div>
  );
}

function JobTable({ data, isLoading, threshold, notifyOutcomes }: { data: UnansweredJob[] | undefined; isLoading: boolean; threshold: number; notifyOutcomes?: import("../hooks/useActionOutcomes").ActionOutcome[] }) {
  const { openDrawer } = useAdminDrawer();
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <p className="text-center text-muted-foreground py-8">
        🎉 No jobs waiting longer than {threshold}h — great responsiveness!
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Waiting</TableHead>
            <TableHead>Posted</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((job) => (
            <TableRow key={job.id} className="cursor-pointer" onClick={() => openDrawer({ type: "job", id: job.id })}>
              <TableCell className="font-medium max-w-[200px] truncate">{job.title}</TableCell>
              <TableCell className="capitalize">{job.category?.replace(/-/g, " ") ?? "—"}</TableCell>
              <TableCell>{job.area ?? "—"}</TableCell>
              <TableCell>
                {job.budget_value ? `€${job.budget_value.toLocaleString()}` : job.budget_type ?? "—"}
              </TableCell>
              <TableCell>
                <Badge className={urgencyColor(job.hours_waiting)}>
                  {Math.round(job.hours_waiting)}h
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {format(new Date(job.created_at), "MMM d, HH:mm")}
              </TableCell>
              <TableCell className="text-right">
                <NotifyProsButton jobId={job.id} outcome={notifyOutcomes?.find((o) => o.target_id === job.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function UnansweredJobsPage() {
  const navigate = useNavigate();
  const [threshold, setThreshold] = useState(6);
  const [tier, setTier] = useState<"no_conversation" | "no_reply">("no_conversation");

  const { data: noConvoData, isLoading: noConvoLoading } = useUnansweredJobs(threshold);
  const { data: noReplyData, isLoading: noReplyLoading } = useNoProReplyJobs(threshold);
  const { data: notifyOutcomes } = useActionOutcomes(["notify_matching_pros"]);

  const activeData = tier === "no_conversation" ? noConvoData : noReplyData;
  const activeLoading = tier === "no_conversation" ? noConvoLoading : noReplyLoading;

  const thresholds = [2, 6, 24, 48];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold">Unanswered Jobs</h1>
            <p className="text-sm text-muted-foreground">
              Two tiers of marketplace failure — supply gaps and responsiveness gaps.
            </p>
          </div>
        </div>

        {/* Threshold selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Waiting longer than:</span>
          {thresholds.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={threshold === t ? "default" : "outline"}
              onClick={() => setThreshold(t)}
            >
              {t}h
            </Button>
          ))}
        </div>

        {/* Two-tier tabs */}
        <Tabs value={tier} onValueChange={(v) => setTier(v as typeof tier)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="no_conversation" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              No Conversation
              {noConvoData && (
                <Badge variant="destructive" className="ml-1 text-xs">{noConvoData.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="no_reply" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              No Pro Reply
              {noReplyData && (
                <Badge variant="secondary" className="ml-1 text-xs">{noReplyData.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="no_conversation" className="space-y-6 mt-4">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-1" />
                  <div className="text-2xl font-bold">{noConvoData?.length ?? 0}</div>
                  <div className="text-xs text-muted-foreground">No Conversation</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-2xl font-bold">
                    {noConvoData?.length ? Math.round(noConvoData.reduce((s, j) => s + j.hours_waiting, 0) / noConvoData.length) : 0}h
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Wait Time</div>
                </CardContent>
              </Card>
            </div>
            <BreakdownCards data={noConvoData} />
            <Card>
              <CardHeader><CardTitle className="text-base">Jobs With No Conversation</CardTitle></CardHeader>
              <CardContent>
                <JobTable data={noConvoData} isLoading={noConvoLoading} threshold={threshold} notifyOutcomes={notifyOutcomes} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="no_reply" className="space-y-6 mt-4">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <MessageSquare className="h-5 w-5 text-secondary-foreground mx-auto mb-1" />
                  <div className="text-2xl font-bold">{noReplyData?.length ?? 0}</div>
                  <div className="text-xs text-muted-foreground">No Pro Reply</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-2xl font-bold">
                    {noReplyData?.length ? Math.round(noReplyData.reduce((s, j) => s + j.hours_waiting, 0) / noReplyData.length) : 0}h
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Wait Time</div>
                </CardContent>
              </Card>
            </div>
            <BreakdownCards data={noReplyData} />
            <Card>
              <CardHeader><CardTitle className="text-base">Jobs With Conversation But No Pro Reply</CardTitle></CardHeader>
              <CardContent>
                <JobTable data={noReplyData} isLoading={noReplyLoading} threshold={threshold} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

