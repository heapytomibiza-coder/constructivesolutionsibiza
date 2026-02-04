import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, Share2, Camera, FileText, AlertTriangle, LogIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { JobFlagBadges } from "./components/JobFlagBadges";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { useJobDetails, useQuestionPacks } from "./queries";
import { startConversation } from "./actions";
import { buildJobPack, type JobPack } from "./lib/buildJobPack";
import { extractMicroAnswers } from "./lib/answerResolver";
import { FormattedAnswers } from "./components/FormattedAnswers";
import { isUserError } from "@/shared/lib/userError";
import type { JobAnswers } from "./types";

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

function prettyStatus(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function statusVariant(
  status?: string | null
): "default" | "warning" | "success" | "secondary" | "outline" {
  switch (status) {
    case "open":
      return "default";
    case "in_progress":
      return "warning";
    case "completed":
      return "success";
    case "draft":
      return "secondary";
    default:
      return "outline";
  }
}

function getSpecBadge(jobPack: JobPack): {
  label: string;
  variant: "success" | "secondary" | "outline";
} {
  const score =
    (jobPack.services?.length ?? 0) +
    (jobPack.hasPhotos ? 2 : 0) +
    (jobPack.budget?.display && jobPack.budget.display !== "To be discussed" ? 1 : 0);

  if (score >= 4) return { label: "Good spec", variant: "success" };
  if (score >= 2) return { label: "Basic spec", variant: "secondary" };
  return { label: "Needs detail", variant: "outline" };
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

/* ─────────────────────────────────────────────────────────────
   Photo Lightbox Component
   ───────────────────────────────────────────────────────────── */

function PhotoLightbox({
  photos,
  index,
  onClose,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
}) {
  const [i, setI] = React.useState(index);

  React.useEffect(() => setI(index), [index]);

  const hasMany = photos.length > 1;
  const next = React.useCallback(() => setI((x) => (x + 1) % photos.length), [photos.length]);
  const prev = React.useCallback(() => setI((x) => (x - 1 + photos.length) % photos.length), [photos.length]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!hasMany) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasMany, onClose, next, prev]);

  // Prevent background scroll while lightbox is open
  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const src = photos[i];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl">
        <img
          src={src}
          alt={`Photo ${i + 1} of ${photos.length}`}
          className="max-h-[85vh] w-full rounded-lg object-contain"
          draggable={false}
        />

        {/* Close button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="absolute right-2 top-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {hasMany && (
          <>
            {/* Prev button */}
            <Button
              variant="secondary"
              size="icon"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>

            {/* Next button */}
            <Button
              variant="secondary"
              size="icon"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>

            {/* Counter */}
            <div className="mt-3 text-center text-sm text-white/80">
              {i + 1} / {photos.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Modal Component
   ───────────────────────────────────────────────────────────── */

export function JobDetailsModal({
  jobId,
  open,
  onOpenChange,
}: {
  jobId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: row, isLoading, isError, error, refetch } = useJobDetails(jobId, open);

  // Extract micro slugs from the row to fetch question packs
  const microSlugs = React.useMemo(() => {
    if (!row) return [];
    const answers = safeAnswers(row.answers);
    const microAnswers = extractMicroAnswers(
      (answers?.microAnswers ?? null) as Record<string, Record<string, unknown>> | null
    );
    return Object.keys(microAnswers);
  }, [row]);

  // Fetch question packs for resolving answer labels
  const { data: packs, isLoading: packsLoading } = useQuestionPacks(microSlugs, open && !!row);

  // Build the display model (JobPack) from raw data + packs
  const jobPack = React.useMemo(() => {
    if (!row) return null;
    return buildJobPack(row, packs ?? []);
  }, [row, packs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[85vh] flex-col p-0 sm:max-w-3xl">
        {/* Fixed Header */}
        <div className="shrink-0 border-b border-border/70 p-6">
          <DialogHeader className="p-0">
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
        </div>

        {/* Scroll Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
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
          ) : jobPack ? (
            <JobDetailsBodyContent jobPack={jobPack} />
          ) : null}
        </div>

        {/* Fixed Footer */}
        {jobPack && (
          <div className="shrink-0 border-t border-border/70 bg-background/90 px-6 py-4 backdrop-blur">
            <JobDetailsActions jobPack={jobPack} onClose={() => onOpenChange(false)} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface JobDetailsBodyContentProps {
  jobPack: JobPack;
}

function JobDetailsBodyContent({ jobPack }: JobDetailsBodyContentProps) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const specBadge = getSpecBadge(jobPack);
  const isAsap = jobPack.timing?.display?.toLowerCase().includes("asap");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {jobPack.category && <Badge variant="secondary">{jobPack.category}</Badge>}
          {jobPack.subcategory && <Badge variant="outline">{jobPack.subcategory}</Badge>}
          
          {jobPack.status && (
            <Badge variant={statusVariant(jobPack.status)}>
              {prettyStatus(jobPack.status)}
            </Badge>
          )}

          {jobPack.isOwner && <Badge variant="outline">Your job</Badge>}

          {isAsap && <Badge variant="accent">ASAP</Badge>}

          <Badge variant={specBadge.variant}>{specBadge.label}</Badge>

          <JobFlagBadges 
            flags={jobPack.flags} 
            inspectionBias={jobPack.inspectionBias} 
            safety={jobPack.safety}
          />
          {jobPack.hasPhotos && (
            <Badge variant="outline" className="gap-1">
              <Camera className="h-3 w-3" /> Photos
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-xl font-semibold leading-snug">{jobPack.title}</div>
          {jobPack.teaser && (
            <p className="text-sm text-muted-foreground">{jobPack.teaser}</p>
          )}
          <div className="text-xs text-muted-foreground">
            Posted {formatDistanceToNow(new Date(jobPack.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Summary cards - using JobPack display values */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="relative overflow-hidden">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-accent/40"
          />
          <CardContent className="p-4 pl-6">
            <div className="text-xs text-muted-foreground">Area</div>
            <div className="text-sm font-semibold">{jobPack.location.display}</div>
            {jobPack.location.town && (
              <div className="text-xs text-muted-foreground">{jobPack.location.town}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Budget</div>
            <div className="text-sm font-semibold">{jobPack.budget.display}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Timing</div>
            <div className="text-sm font-semibold">{jobPack.timing.display}</div>
          </CardContent>
        </Card>
      </div>

      {/* Services - display from JobPack */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">Services</div>
        {jobPack.services.length > 0 ? (
          <ul className="grid gap-1.5 text-sm text-muted-foreground">
            {jobPack.services.map((s) => (
              <li key={s.slug} className="flex items-start gap-2">
                <span className="mt-1 text-primary/60">•</span>
                <span>{s.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">
            {jobPack.subcategory ?? jobPack.category ?? "—"}
          </div>
        )}
      </section>

      <Separator className="bg-border/60" />

      {/* Scope & Specifications - using resolved services from JobPack */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">Scope & Specifications</div>
        <div className="rounded-lg border border-border/70 bg-card">
          <div className="p-4">
            <FormattedAnswers services={jobPack.services} />
          </div>
        </div>
      </section>

      <Separator className="bg-border/60" />

      {/* Logistics */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">Logistics</div>
        <Card>
          <CardContent className="space-y-2 p-4">
            <InfoRow label="Location" value={jobPack.location.display} />
            <InfoRow label="Start timing" value={jobPack.timing.display} />
            {jobPack.timing.date && (
              <InfoRow label="Start date" value={jobPack.timing.date} />
            )}
          </CardContent>
        </Card>
      </section>

      <Separator className="bg-border/60" />

      {/* Extras */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">Extras</div>
        <Card>
          <CardContent className="space-y-4 p-4">
            {/* Notes */}
            {jobPack.notes && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Notes
                </div>
                <p className="text-sm">{jobPack.notes}</p>
              </div>
            )}

            {/* Photos with lightbox */}
            {jobPack.photos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Camera className="h-3.5 w-3.5" />
                  Photos ({jobPack.photos.length})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {jobPack.photos.slice(0, 6).map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      className="aspect-square overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <img
                        src={url}
                        alt={`Job photo ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>

                {/* Lightbox */}
                {lightboxIndex !== null && (
                  <PhotoLightbox
                    photos={jobPack.photos}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                  />
                )}
              </div>
            )}

            {/* Permits concern */}
            {jobPack.permitsConcern && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Client has permit concerns
              </div>
            )}

            {!jobPack.notes && jobPack.photos.length === 0 && !jobPack.permitsConcern && (
              <div className="text-sm text-muted-foreground">No extras provided.</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

interface JobDetailsActionsProps {
  jobPack: JobPack;
  onClose: () => void;
}

function JobDetailsActions({ jobPack, onClose }: JobDetailsActionsProps) {
  const navigate = useNavigate();
  const { 
    user, 
    isLoading: sessionLoading,
    hasRole,
    isProReady,
    professionalProfile 
  } = useSession();
  const [isMessaging, setIsMessaging] = useState(false);

  // Determine if this user should see the pro gate
  const isPro = hasRole('professional');
  const canMessage = !isPro || isProReady;

  const handleMessage = async () => {
    if (!user) {
      onClose();
      navigate(`/auth?returnTo=/jobs`);
      return;
    }

    setIsMessaging(true);
    try {
      // Pass profile for action-level validation (only for professionals)
      // proId is derived from session inside the action for security
      const convId = await startConversation(
        jobPack.id,
        isPro ? professionalProfile : undefined
      );
      onClose();
      navigate(`/messages/${convId}`);
    } catch (err) {
      if (isUserError(err)) {
        if (err.code === 'PRO_NOT_READY') {
          toast.error(err.message, {
            action: {
              label: 'Complete Setup',
              onClick: () => {
                onClose();
                navigate('/dashboard/pro');
              },
            },
          });
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Failed to start conversation");
        console.error("Message error:", err);
      }
    } finally {
      setIsMessaging(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {!user ? (
        <Button onClick={handleMessage} className="gap-2">
          <LogIn className="h-4 w-4" />
          Sign in to message
        </Button>
      ) : jobPack.isOwner ? null : (
        <div className="flex flex-col gap-1">
          <Button 
            onClick={handleMessage} 
            disabled={isMessaging || sessionLoading || !canMessage}
            className="gap-2"
            title={!canMessage ? "Complete your setup to message clients" : undefined}
          >
            {isMessaging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            {isMessaging ? "Starting chat..." : "Message"}
          </Button>
          {!canMessage && (
            <span className="text-xs text-muted-foreground">
              Complete setup to message
            </span>
          )}
        </div>
      )}
      <Button variant="outline" disabled className="gap-2">
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
