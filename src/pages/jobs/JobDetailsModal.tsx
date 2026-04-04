import * as React from "react";
import { trackEvent } from "@/lib/trackEvent";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "@/contexts/SessionContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, Share2, Camera, FileText, AlertTriangle, LogIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { JobFlagBadges } from "./components/JobFlagBadges";
import { QuotesTab } from "./components/QuotesTab";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import { useJobDetails, useQuestionPacks } from "./queries";
import { startConversation } from "./actions";
import { buildJobPack, type JobPack } from "./lib/buildJobPack";
import { extractMicroAnswers } from "./lib/answerResolver";
import { getI18nField, getContentLang } from "@/lib/i18nContent";
import { txCategory, txSubcategory, txMicro } from "@/i18n/taxonomyTranslations";
import { FormattedAnswers } from "./components/FormattedAnswers";
import { isUserError } from "@/shared/lib/userError";
import { isRolloutActive } from "@/domain/rollout";
import { useListingsForJob } from "./hooks/useListingsForJob";
import { ServiceListingCardComponent } from "@/pages/services/ServiceListingCard";
import type { JobAnswers } from "./types";

function safeAnswers(a: unknown): JobAnswers | null {
  if (!a || typeof a !== "object") return null;
  const obj = a as Record<string, unknown>;
  if (!("selected" in obj) || !("logistics" in obj) || !("extras" in obj)) return null;
  return a as JobAnswers;
}

function statusVariant(
  status?: string | null
): "default" | "warning" | "success" | "secondary" | "outline" {
  switch (status) {
    case "open": return "default";
    case "in_progress": return "warning";
    case "completed": return "success";
    case "draft": return "secondary";
    default: return "outline";
  }
}

const STATUS_KEYS: Record<string, string> = {
  open: 'status.open',
  draft: 'status.draft',
  ready: 'status.ready',
  in_progress: 'status.inProgress',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
};

function translateStatus(s: string | null | undefined, t: (k: string) => string): string {
  if (!s) return "";
  const key = STATUS_KEYS[s];
  return key ? t(key) : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

/* ───────────────────────────────────────────────────────────────
   Photo Lightbox Component
   ─────────────────────────────────────────────────────────────── */

function PhotoLightbox({
  photos,
  index,
  onClose,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
}) {
  const { t } = useTranslation("jobs");
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

  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const src = photos[i];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}
    >
      <div className="relative w-full max-w-5xl">
        <img src={src} alt={t('detail.lightbox.photo', { current: i + 1, total: photos.length })} className="max-h-[85vh] w-full rounded-lg object-contain" draggable={false} />
        <Button variant="secondary" size="icon" onClick={onClose} className="absolute right-2 top-2">
          <X className="h-4 w-4" /><span className="sr-only">{t('detail.lightbox.close')}</span>
        </Button>
        {hasMany && (
          <>
            <Button variant="secondary" size="icon" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2">
              <ChevronLeft className="h-5 w-5" /><span className="sr-only">{t('detail.lightbox.previous')}</span>
            </Button>
            <Button variant="secondary" size="icon" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2">
              <ChevronRight className="h-5 w-5" /><span className="sr-only">{t('detail.lightbox.next')}</span>
            </Button>
            <div className="mt-3 text-center text-sm text-white/80">{i + 1} / {photos.length}</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Main Modal Component
   ─────────────────────────────────────────────────────────────── */

export function JobDetailsModal({
  jobId,
  open,
  onOpenChange,
}: {
  jobId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation("jobs");
  const { data: row, isLoading, isError, error, refetch } = useJobDetails(jobId, open);

  // Track worker_viewed_job — resets on close so reopening the same job logs again
  const viewedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!open) {
      viewedRef.current = null;
      return;
    }
    if (row && jobId && viewedRef.current !== jobId) {
      viewedRef.current = jobId;
      trackEvent(
        "worker_viewed_job",
        "professional",
        { status: row.status },
        { job_id: jobId, category: row.category ?? undefined },
      );
    }
  }, [open, row, jobId]);


  const microSlugs = React.useMemo(() => {
    if (!row) return [];
    const answers = safeAnswers(row.answers);
    const microAnswers = extractMicroAnswers(
      (answers?.microAnswers ?? null) as Record<string, Record<string, unknown>> | null
    );
    return Object.keys(microAnswers);
  }, [row]);

  const { data: packs, isLoading: packsLoading } = useQuestionPacks(microSlugs, open && !!row);

  const jobPack = React.useMemo(() => {
    if (!row) return null;
    return buildJobPack(row, packs ?? [], t);
  }, [row, packs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[85vh] flex-col p-0 sm:max-w-3xl">
        <div className="shrink-0 border-b border-border/70 p-6">
          <DialogHeader className="p-0">
            <DialogTitle>{t('detail.title')}</DialogTitle>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('detail.loadingDetails')}
            </div>
          ) : isError ? (
            <div className="space-y-3">
              <div className="text-sm text-destructive">
                {t('detail.loadError', { error: (error as Error)?.message ?? t('detail.unknownError') })}
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                {t('detail.retry')}
              </Button>
            </div>
          ) : jobPack ? (
            <JobDetailsBodyContent jobPack={jobPack} />
          ) : null}
        </div>

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
  const { data: matchedListings } = useListingsForJob(jobPack.services?.[0]?.slug);
  const { t, i18n } = useTranslation("jobs");
  const isEs = i18n.language?.startsWith("es");
  const dateLocale = isEs ? { locale: es } : undefined;
  const contentLang = getContentLang(i18n.language);

  const getSpecBadge = (jp: JobPack): { label: string; variant: "success" | "secondary" | "outline" } => {
    const score = (jp.services?.length ?? 0) + (jp.hasPhotos ? 2 : 0) + (jp.budget?.display && jp.budget?.type !== 'tbd' ? 1 : 0);
    if (score >= 4) return { label: t('card.goodSpec'), variant: "success" };
    if (score >= 2) return { label: t('card.basicSpec'), variant: "secondary" };
    return { label: t('card.needsDetail'), variant: "outline" };
  };

  const specBadge = getSpecBadge(jobPack);
  const isAsap = jobPack.timing?.preset === "asap";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {jobPack.category && <Badge variant="secondary">{txCategory(jobPack.category, t)}</Badge>}
          {jobPack.subcategory && <Badge variant="outline">{txSubcategory(jobPack.subcategory, t)}</Badge>}
          {jobPack.status && <Badge variant={statusVariant(jobPack.status)}>{translateStatus(jobPack.status, t)}</Badge>}
          {jobPack.isOwner && <Badge variant="outline">{t('card.yourJob')}</Badge>}
          {isAsap && <Badge variant="accent">{t('board.asap')}</Badge>}
          <Badge variant={specBadge.variant}>{specBadge.label}</Badge>
          <JobFlagBadges flags={jobPack.flags} inspectionBias={jobPack.inspectionBias} safety={jobPack.safety} />
          {jobPack.hasPhotos && (
            <Badge variant="outline" className="gap-1">
              <Camera className="h-3 w-3" /> {t('detail.photosLabel')}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-xl font-semibold leading-snug">{getI18nField(jobPack.title, jobPack.titleI18n, contentLang)}</div>
          {jobPack.teaser && <p className="text-sm text-muted-foreground">{getI18nField(jobPack.teaser, jobPack.teaserI18n, contentLang)}</p>}
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(jobPack.createdAt), { addSuffix: true, ...dateLocale })}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="relative overflow-hidden">
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-accent/40" />
          <CardContent className="p-4 pl-6">
            <div className="text-xs text-muted-foreground">{t('detail.area')}</div>
            <div className="text-sm font-semibold">{jobPack.location.display}</div>
            {jobPack.location.town && <div className="text-xs text-muted-foreground">{jobPack.location.town}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{t('detail.budget')}</div>
            <div className="text-sm font-semibold">{jobPack.budget.display}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{t('detail.timing')}</div>
            <div className="text-sm font-semibold">{jobPack.timing.display}</div>
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">{t('detail.services')}</div>
        {jobPack.services.length > 0 ? (
          <ul className="grid gap-1.5 text-sm text-muted-foreground">
            {jobPack.services.map((s) => (
              <li key={s.slug} className="flex items-start gap-2">
                <span className="mt-1 text-primary/60">•</span>
                <span>{txMicro(s.slug, t, s.title)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">{txSubcategory(jobPack.subcategory, t) ?? txCategory(jobPack.category, t) ?? "—"}</div>
        )}
      </section>

      <Separator className="bg-border/60" />

      {/* Scope */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">{t('detail.scope')}</div>
        <div className="rounded-lg border border-border/70 bg-card">
          <div className="p-4">
            <FormattedAnswers services={jobPack.services} />
          </div>
        </div>
      </section>

      <Separator className="bg-border/60" />

      {/* Logistics */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">{t('detail.logistics')}</div>
        <Card>
          <CardContent className="space-y-2 p-4">
            <InfoRow label={t('detail.location')} value={jobPack.location.display} />
            <InfoRow label={t('detail.startTiming')} value={jobPack.timing.display} />
            {jobPack.timing.date && <InfoRow label={t('detail.startDate')} value={jobPack.timing.date} />}
          </CardContent>
        </Card>
      </section>

      <Separator className="bg-border/60" />

      {/* Extras */}
      <section className="space-y-2">
        <div className="text-sm font-semibold">{t('detail.extras')}</div>
        <Card>
          <CardContent className="space-y-4 p-4">
            {jobPack.notes && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {t('detail.notes')}
                </div>
                <p className="text-sm">{jobPack.notes}</p>
              </div>
            )}
            {jobPack.photos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Camera className="h-3.5 w-3.5" />
                  {t('detail.photos', { count: jobPack.photos.length })}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {jobPack.photos.slice(0, 6).map((url, idx) => (
                    <button key={url} type="button" className="aspect-square overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => setLightboxIndex(idx)}>
                      <img src={url} alt={t('detail.lightbox.photo', { current: idx + 1, total: jobPack.photos.length })} className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" />
                    </button>
                  ))}
                </div>
                {lightboxIndex !== null && (
                  <PhotoLightbox photos={jobPack.photos} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
                )}
              </div>
            )}
            {jobPack.permitsConcern && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                {t('detail.permitConcerns')}
              </div>
            )}
            {!jobPack.notes && jobPack.photos.length === 0 && !jobPack.permitsConcern && (
              <div className="text-sm text-muted-foreground">{t('detail.noExtras')}</div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quotes Section — only for job owners (clients). Pros quote from the conversation thread. */}
      {isRolloutActive('service-layer') && !!jobPack.isOwner && (
        <>
          <Separator className="bg-border/60" />
          <QuotesTab jobId={jobPack.id} isOwner />
        </>
      )}

      {/* Compare Service Providers */}
      {matchedListings && matchedListings.length > 0 && (
        <>
          <Separator className="bg-border/60" />
          <section className="space-y-3">
            <div className="text-sm font-semibold">{t('detail.compareProviders')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matchedListings.slice(0, 4).map((listing) => (
                <ServiceListingCardComponent key={listing.id} listing={listing as any} />
              ))}
            </div>
            {matchedListings.length > 4 && (
              <div className="text-center">
                <Link to="/services" className="text-sm text-primary hover:underline">
                  {t('detail.viewAllMarketplace')}
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

interface JobDetailsActionsProps {
  jobPack: JobPack;
  onClose: () => void;
}

function JobDetailsActions({ jobPack, onClose }: JobDetailsActionsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("jobs");
  const { user, isLoading: sessionLoading, hasRole, isProReady, professionalProfile } = useSession();
  const [isMessaging, setIsMessaging] = useState(false);

  const isPro = hasRole('professional');
  const canMessage = !isPro || isProReady;

  const handleMessage = async () => {
    if (!user) {
      onClose();
      navigate(`/auth?returnUrl=/jobs`);
      return;
    }
    setIsMessaging(true);
    try {
      const convId = await startConversation(jobPack.id, isPro ? professionalProfile : undefined);
      onClose();
      navigate(`/messages/${convId}`);
    } catch (err) {
      if (isUserError(err)) {
        if (err.code === 'PRO_NOT_READY') {
          toast.error(err.message, {
            action: {
              label: t('detail.completeSetup'),
              onClick: () => { onClose(); navigate('/dashboard/pro'); },
            },
          });
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error(t('detail.startConversationFailed'));
        console.error("Message error:", err);
      }
    } finally {
      setIsMessaging(false);
    }
  };

  const showMessageButton = isPro && !jobPack.isOwner;

  return (
    <div className="flex flex-wrap gap-2">
      {!user ? (
        <Button onClick={handleMessage} className="gap-2">
          <LogIn className="h-4 w-4" />
          {t('detail.signInToRespond')}
        </Button>
      ) : showMessageButton ? (
        <div className="flex flex-col gap-1">
          <Button 
            onClick={handleMessage} 
            disabled={isMessaging || sessionLoading || !canMessage}
            className="gap-2"
            title={!canMessage ? t('detail.completeSetup') : undefined}
          >
            {isMessaging ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            {isMessaging ? t('detail.startingChat') : t('detail.message')}
          </Button>
          {!canMessage && (
            <span className="text-xs text-muted-foreground">{t('detail.completeSetup')}</span>
          )}
        </div>
      ) : null}
      {user && ['in_progress', 'completed'].includes(jobPack.status ?? '') && !jobPack.isOwner && (
        <Button
          variant="outline"
          className="gap-2 text-destructive hover:text-destructive"
          title="Having an issue with this job? Start a structured resolution."
          onClick={() => { onClose(); navigate(`/contact?subject=issue&job=${jobPack.id}`); }}
        >
          <AlertTriangle className="h-4 w-4" />
          {t('detail.raiseIssue', 'Raise Issue')}
        </Button>
      )}
      <Button variant="outline" disabled className="gap-2">
        <Share2 className="h-4 w-4" />
        {t('detail.share')}
      </Button>
    </div>
  );
}
