import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Euro, MapPin, Image as ImageIcon } from "lucide-react";
import { JobDetailsModal } from "@/pages/jobs/JobDetailsModal";
import { JobFlagBadges } from "@/pages/jobs/components/JobFlagBadges";
import type { JobsBoardRow } from "@/pages/jobs/types";

function budgetProxy(j: JobsBoardRow): number {
  return (j.budget_value ?? j.budget_max ?? j.budget_min ?? 0) as number;
}

function formatBudget(j: JobsBoardRow): string {
  if (j.budget_type === "range" && j.budget_min != null && j.budget_max != null) {
    return `€${j.budget_min}–€${j.budget_max}`;
  }
  if (j.budget_type === "fixed" && j.budget_value != null) {
    return `€${j.budget_value}`;
  }
  if (budgetProxy(j) > 0) return `~€${budgetProxy(j)}`;
  return "Budget: TBD";
}

function formatTiming(j: JobsBoardRow): string {
  if (j.start_timing === "asap") return "ASAP";
  if (j.start_timing === "date" && j.start_date) return `Start: ${j.start_date}`;
  if (j.start_timing === "this_week") return "This week";
  if (j.start_timing === "this_month") return "This month";
  return "Flexible";
}

export function JobListingCard({ job }: { job: JobsBoardRow }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Card 
        data-job-id={job.id} 
        className="overflow-hidden hover:shadow-md transition-all hover:border-accent/30 group border-l-2 border-l-transparent hover:border-l-accent"
      >
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {job.category && <Badge variant="secondary">{job.category}</Badge>}
                {job.subcategory && <Badge variant="outline">{job.subcategory}</Badge>}
                {job.status && <Badge>{job.status}</Badge>}
                <JobFlagBadges 
                  flags={job.flags} 
                  inspectionBias={job.computed_inspection_bias} 
                  safety={job.computed_safety}
                  compact
                />
                {job.has_photos && (
                  <Badge variant="outline" className="gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> Photos
                  </Badge>
                )}
              </div>

              <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                {job.title}
              </h3>

              {job.teaser && (
                <p className="text-sm text-muted-foreground line-clamp-2">{job.teaser}</p>
              )}
            </div>

            <Button onClick={() => setOpen(true)} variant="default" size="sm">
              View
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.area ?? job.location?.area ?? "Ibiza"}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Euro className="h-3.5 w-3.5" />
              {formatBudget(job)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatTiming(job)}
            </span>
            <span>
              Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardHeader>

        {job.highlights?.length > 0 && (
          <CardContent className="space-y-3">
            <Separator />
            <ul className="grid gap-1 text-sm">
              {job.highlights.slice(0, 5).map((h, idx) => (
                <li key={`${job.id}-h-${idx}`} className="text-muted-foreground">
                  {h}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      <JobDetailsModal
        jobId={job.id}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
