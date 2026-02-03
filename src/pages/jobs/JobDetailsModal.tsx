import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, Share2, Camera, FileText, AlertTriangle, LogIn } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { JobDetailsRow, JobAnswers } from "@/pages/jobs/types";
import { FormattedAnswers } from "@/pages/jobs/components/FormattedAnswers";
import { extractMicroAnswers, formatLocation } from "@/pages/jobs/lib/answerResolver";
import { useJobDetails } from "./queries";
import { startConversation } from "./actions";
import { isUserError } from "@/shared/lib/userError";

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
  const { data, isLoading, isError, error, refetch } = useJobDetails(jobId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading details…
          </div>
        ) : isError ? (
          <div className="space-y-3">
            <div className="text-sm text-destructive">
              Failed to load details: {(error as Error)?.message ?? "Unknown error"}
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : data ? (
          <JobDetailsBody job={data} onClose={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function JobDetailsBody({ job, onClose }: { job: JobDetailsRow; onClose: () => void }) {
  const navigate = useNavigate();
  const { user, isLoading: sessionLoading } = useSession();
  const [isMessaging, setIsMessaging] = useState(false);

  const answers = safeAnswers(job.answers);

  const selected = answers?.selected;
  const logistics = answers?.logistics;
  const extras = answers?.extras;

  // Extract micro answers from nested structure
  const microAnswers = extractMicroAnswers(answers?.microAnswers as Record<string, unknown> | null);
  const microSlugs = Object.keys(microAnswers);

  // Message button gating
  const handleMessage = async () => {
    if (!user) {
      onClose();
      navigate(`/auth?returnTo=/jobs`);
      return;
    }

    setIsMessaging(true);
    try {
      const convId = await startConversation(job.id, user.id);
      onClose();
      navigate(`/messages/${convId}`);
    } catch (err) {
      if (isUserError(err)) {
        toast.error(err.message);
      } else {
        toast.error("Failed to start conversation");
        console.error("Message error:", err);
      }
    } finally {
      setIsMessaging(false);
    }
  };

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
            <div className="text-sm font-medium">
              {formatLocation(logistics?.location, logistics?.customLocation) || job.area || "Ibiza"}
            </div>
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

      {/* Scope & Specifications - Now with proper formatted answers */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">Scope & Specifications</div>
        <FormattedAnswers microAnswers={microAnswers} microSlugs={microSlugs} />
      </section>

      <Separator />

      {/* Logistics */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">Logistics</div>
        <Card>
          <CardContent className="p-4 space-y-2">
            <InfoRow 
              label="Location" 
              value={formatLocation(logistics?.location, logistics?.customLocation)} 
            />
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
        {!user ? (
          <Button onClick={handleMessage} className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign in to message
          </Button>
        ) : job.is_owner ? null : (
          <Button 
            onClick={handleMessage} 
            disabled={isMessaging || sessionLoading}
            className="gap-2"
          >
            {isMessaging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            {isMessaging ? "Starting chat..." : "Message"}
          </Button>
        )}
        <Button variant="outline" disabled className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
