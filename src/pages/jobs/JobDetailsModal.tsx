import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, Share2, Camera, FileText, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { JobDetailsRow, JobAnswers } from "@/pages/jobs/types";

async function fetchJobDetails(jobId: string): Promise<JobDetailsRow> {
  const { data, error } = await supabase
    .from("job_details")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) throw error;
  return data as JobDetailsRow;
}

function safeAnswers(a: unknown): JobAnswers | null {
  if (!a || typeof a !== "object") return null;
  const obj = a as Record<string, unknown>;
  if (!("selected" in obj) || !("logistics" in obj) || !("extras" in obj)) return null;
  return a as JobAnswers;
}

function renderConsultation(type: string | null | undefined) {
  if (!type) return "Not specified";
  if (type === "site_visit") return "On-site visit";
  if (type === "phone_call") return "Phone call";
  if (type === "video_call") return "Video call";
  return type;
}

function renderStartPreset(preset: string | null | undefined, startDateIso?: string | null) {
  if (preset === "asap") return "ASAP";
  if (preset === "this_week") return "This week";
  if (preset === "this_month") return "This month";
  if (preset === "flexible") return "Flexible";
  if (preset === "specific" || preset === "date") return startDateIso ? `Specific: ${startDateIso}` : "Specific date";
  if (startDateIso) return `Start: ${startDateIso}`;
  return preset ?? "Flexible";
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function JobDetailsModal({
  jobId,
  open,
  onOpenChange,
}: {
  jobId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const query = useQuery({
    queryKey: ["job_details", jobId],
    queryFn: () => fetchJobDetails(jobId as string),
    enabled: open && !!jobId,
    staleTime: 30_000,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
        </DialogHeader>

        {query.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading details…
          </div>
        ) : query.isError ? (
          <div className="space-y-3">
            <div className="text-sm text-destructive">
              Failed to load details: {(query.error as Error)?.message ?? "Unknown error"}
            </div>
            <Button variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        ) : query.data ? (
          <JobDetailsBody job={query.data} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function JobDetailsBody({ job }: { job: JobDetailsRow }) {
  const answers = safeAnswers(job.answers);

  const selected = answers?.selected;
  const logistics = answers?.logistics;
  const extras = answers?.extras;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {job.category && <Badge variant="secondary">{job.category}</Badge>}
          {job.subcategory && <Badge variant="outline">{job.subcategory}</Badge>}
          {job.status && <Badge>{job.status}</Badge>}
          {job.has_photos && <Badge variant="outline" className="gap-1"><Camera className="h-3 w-3" /> Photos</Badge>}
        </div>

        <div className="text-lg font-semibold">{job.title}</div>

        {job.teaser && (
          <p className="text-sm text-muted-foreground">{job.teaser}</p>
        )}

        <div className="text-xs text-muted-foreground">
          Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Area</div>
            <div className="text-sm font-medium">{job.area ?? job.location?.area ?? "Ibiza"}</div>
            {job.location?.town && (
              <div className="text-xs text-muted-foreground">{job.location.town}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Budget</div>
            <div className="text-sm font-medium">
              {job.budget_type === "range" && job.budget_min != null && job.budget_max != null
                ? `€${job.budget_min}–€${job.budget_max}`
                : job.budget_type === "fixed" && job.budget_value != null
                  ? `€${job.budget_value}`
                  : logistics?.budgetRange ?? "TBD"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Timing</div>
            <div className="text-sm font-medium">
              {renderStartPreset(logistics?.startDatePreset ?? job.start_timing ?? null, logistics?.startDate ?? job.start_date)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Services */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">Services</div>
        <div className="text-sm text-muted-foreground">
          {selected?.microNames?.length ? (
            <ul className="list-disc pl-5 space-y-1">
              {selected.microNames.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : (
            <div>{selected?.subcategory ?? job.subcategory ?? job.category ?? "—"}</div>
          )}
        </div>
      </section>

      <Separator />

      {/* Scope & Specifications */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">Scope & Specifications</div>
        {!answers?.microAnswers || Object.keys(answers.microAnswers).length === 0 ? (
          <div className="text-sm text-muted-foreground">No specific answers provided.</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(answers.microAnswers).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2">{key}</div>
                  <div className="text-sm">
                    {typeof value === "object" && value !== null ? (
                      <div className="space-y-1">
                        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-muted-foreground">{k}:</span>
                            <span className="font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>{String(value)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Logistics */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">Logistics</div>
        <Card>
          <CardContent className="p-4 space-y-2">
            <InfoRow label="Location" value={logistics?.location} />
            <InfoRow label="Custom location" value={logistics?.customLocation} />
            <InfoRow label="Consultation type" value={renderConsultation(logistics?.consultationType)} />
            <InfoRow label="Consultation date" value={logistics?.consultationDate} />
            <InfoRow label="Consultation time" value={logistics?.consultationTime} />
            <InfoRow label="Completion date" value={logistics?.completionDate} />
            {logistics?.accessDetails && logistics.accessDetails.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Access details:</span>
                <ul className="list-disc pl-5 mt-1">
                  {logistics.accessDetails.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Extras */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">Extras</div>
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Notes */}
            {extras?.notes && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Notes
                </div>
                <p className="text-sm">{extras.notes}</p>
              </div>
            )}

            {/* Photos */}
            {extras?.photos && extras.photos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Camera className="h-3.5 w-3.5" />
                  Photos ({extras.photos.length})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {extras.photos.slice(0, 6).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Job photo ${i + 1}`}
                      className="rounded-md object-cover aspect-square"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Permits concern */}
            {extras?.permitsConcern && (
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertTriangle className="h-4 w-4" />
                Client has permit concerns
              </div>
            )}

            {!extras?.notes && (!extras?.photos || extras.photos.length === 0) && !extras?.permitsConcern && (
              <div className="text-sm text-muted-foreground">No extras provided.</div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button disabled className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Message (coming soon)
        </Button>
        <Button variant="outline" disabled className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
