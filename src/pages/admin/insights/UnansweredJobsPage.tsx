import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnansweredJobs } from "../hooks/useUnansweredJobs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

function urgencyColor(hours: number) {
  if (hours >= 48) return "bg-red-100 text-red-800 border-red-200";
  if (hours >= 24) return "bg-amber-100 text-amber-800 border-amber-200";
  if (hours >= 6) return "bg-yellow-50 text-yellow-800 border-yellow-200";
  return "bg-muted text-muted-foreground";
}

export default function UnansweredJobsPage() {
  const navigate = useNavigate();
  const [threshold, setThreshold] = useState(6);
  const { data, isLoading } = useUnansweredJobs(threshold);

  const thresholds = [2, 6, 24, 48];

  // Build area/category breakdown
  const areaBreakdown = new Map<string, number>();
  const catBreakdown = new Map<string, number>();
  data?.forEach((j) => {
    if (j.area) areaBreakdown.set(j.area, (areaBreakdown.get(j.area) ?? 0) + 1);
    if (j.category) catBreakdown.set(j.category, (catBreakdown.get(j.category) ?? 0) + 1);
  });

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
              Jobs with zero pro responses — where you're failing to serve demand.
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

        {/* Summary cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-1" />
              <div className="text-2xl font-bold">{data?.length ?? 0}</div>
              <div className="text-xs text-muted-foreground">Unanswered Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold">
                {data?.length ? Math.round(data.reduce((s, j) => s + j.hours_waiting, 0) / data.length) : 0}h
              </div>
              <div className="text-xs text-muted-foreground">Avg Wait Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{areaBreakdown.size}</div>
              <div className="text-xs text-muted-foreground">Areas Affected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{catBreakdown.size}</div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap by area + category */}
        {(areaBreakdown.size > 0 || catBreakdown.size > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Area</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...areaBreakdown.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([area, count]) => (
                    <div key={area} className="flex justify-between items-center p-2 rounded-lg border">
                      <span className="font-medium">{area}</span>
                      <Badge variant="destructive">{count} jobs</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...catBreakdown.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => (
                    <div key={cat} className="flex justify-between items-center p-2 rounded-lg border">
                      <span className="font-medium capitalize">{cat.replace(/-/g, " ")}</span>
                      <Badge variant="destructive">{count} jobs</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detail table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Unanswered Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !data?.length ? (
              <p className="text-center text-muted-foreground py-8">
                🎉 No unanswered jobs waiting longer than {threshold}h — great responsiveness!
              </p>
            ) : (
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((job) => (
                      <TableRow key={job.id}>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
