import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Euro, MapPin, Image as ImageIcon, MessageSquare, Send, LogIn } from "lucide-react";
import { JobDetailsModal } from "@/pages/jobs/JobDetailsModal";
import { JobFlagBadges } from "@/pages/jobs/components/JobFlagBadges";
import { useSession } from "@/contexts/SessionContext";
import { startConversation } from "@/pages/jobs/actions/messageJob.action";
import { toast } from "sonner";
import type { JobsBoardRow } from "@/pages/jobs/types";

interface JobListingCardProps {
  job: JobsBoardRow;
  isMatched?: boolean;
}

function budgetProxy(j: JobsBoardRow): number {
  return (j.budget_value ?? j.budget_max ?? j.budget_min ?? 0) as number;
}

function statusVariant(status?: string | null): "default" | "warning" | "success" | "secondary" | "outline" {
  switch (status) {
    case "open": return "default";
    case "in_progress": return "warning";
    case "completed": return "success";
    case "draft": return "secondary";
    default: return "outline";
  }
}

function prettyStatus(s: string | null): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function JobListingCard({ job, isMatched }: JobListingCardProps) {
  const [open, setOpen] = React.useState(false);
  const [isMessaging, setIsMessaging] = React.useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("jobs");
  const isEs = i18n.language?.startsWith("es");

  const getSpecBadge = (j: JobsBoardRow): { label: string; variant: "success" | "secondary" | "outline" } => {
    const score = (j.highlights?.length ?? 0) + (j.has_photos ? 2 : 0) + (budgetProxy(j) > 0 ? 1 : 0);
    if (score >= 4) return { label: t('card.goodSpec'), variant: "success" };
    if (score >= 2) return { label: t('card.basicSpec'), variant: "secondary" };
    return { label: t('card.needsDetail'), variant: "outline" };
  };

  const formatBudget = (j: JobsBoardRow): string => {
    if (j.budget_type === "range" && j.budget_min != null && j.budget_max != null) {
      return `${j.budget_min.toLocaleString()}–${j.budget_max.toLocaleString()} €`;
    }
    if (j.budget_type === "fixed" && j.budget_value != null) {
      return `${j.budget_value.toLocaleString()} €`;
    }
    if (budgetProxy(j) > 0) return `~${budgetProxy(j).toLocaleString()} €`;
    return t('card.tbd');
  };

  const formatTiming = (j: JobsBoardRow): string => {
    if (j.start_timing === "asap") return t('board.asap');
    if (j.start_timing === "date" && j.start_date) return t('card.start', { date: j.start_date });
    if (j.start_timing === "this_week") return t('card.thisWeek');
    if (j.start_timing === "this_month") return t('card.thisMonth');
    return t('card.flexible');
  };

  const formatHighlight = (highlight: string): string => {
    const HIGHLIGHT_BUDGET: Record<string, string> = {
      'under_500': t('card.under500'),
      '500_1000': t('card.500_1000'),
      '1000_2500': t('card.1000_2500'),
      '2500_5000': t('card.2500_5000'),
      'over_5000': t('card.over5000'),
      'need_quote': t('card.quoteNeeded'),
    };
    const stripped = highlight.replace(/^[\p{Emoji_Presentation}\p{Emoji}\uFE0F]+\s*/u, '').trim();
    if (HIGHLIGHT_BUDGET[stripped]) return HIGHLIGHT_BUDGET[stripped];
    if (HIGHLIGHT_BUDGET[highlight]) return HIGHLIGHT_BUDGET[highlight];
    const budgetRangeMatch = stripped.match(/^(\d+)_(\d+)$/);
    if (budgetRangeMatch) {
      const min = parseInt(budgetRangeMatch[1], 10);
      const max = parseInt(budgetRangeMatch[2], 10);
      return `${min.toLocaleString()}–${max.toLocaleString()} €`;
    }
    if (stripped.includes("_") && !stripped.includes(" ")) {
      return stripped.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
    }
    return highlight;
  };

  const specBadge = getSpecBadge(job);
  const { user, isAuthenticated, hasRole, isProReady, activeRole, professionalProfile } = useSession();

  const isJobOpen = job.status === "open";
  const isPro = hasRole("professional");
  const isClient = activeRole === "client";

  const proNeedsOnboarding = isPro && !isProReady && professionalProfile;
  const proNeedsServices = proNeedsOnboarding && (professionalProfile?.servicesCount ?? 0) === 0;
  const proNeedsSetup = proNeedsOnboarding && 
    professionalProfile?.onboardingPhase !== 'service_setup' && 
    professionalProfile?.onboardingPhase !== 'complete';
  
  const profileCompletionLink = proNeedsServices 
    ? '/onboarding/professional?step=services'
    : proNeedsSetup 
      ? '/onboarding/professional' 
      : '/dashboard/pro';

  const handleCardClick = () => setOpen(true);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); }
  };
  const handleButtonClick = (e: React.MouseEvent) => { e.stopPropagation(); setOpen(true); };

  const handleMessageClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.id) return;
    setIsMessaging(true);
    try {
      const conversationId = await startConversation(job.id);
      navigate(`/messages/${conversationId}`);
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsMessaging(false);
    }
  };

  const showProCTAs = isAuthenticated && isPro && isJobOpen;
  const showSignInCTA = !isAuthenticated && isJobOpen;
  const showCompleteProfileCTA = isAuthenticated && isPro && !isProReady && isJobOpen;

  const dateLocale = isEs ? { locale: es } : undefined;

  return (
    <>
      <Card
        data-job-id={job.id}
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="group relative overflow-hidden hover:shadow-md transition-all hover:border-accent/30 cursor-pointer"
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-transparent transition-colors group-hover:bg-accent" />
        <CardHeader className="space-y-2 pl-7">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {job.category && <Badge variant="secondary">{job.category}</Badge>}
                {job.subcategory && <Badge variant="outline">{job.subcategory}</Badge>}
                {job.status && <Badge variant={statusVariant(job.status)}>{prettyStatus(job.status)}</Badge>}
                {isMatched && <Badge variant="accent">{t('card.matched')}</Badge>}
                {job.start_timing === "asap" && <Badge variant="accent">{t('board.asap')}</Badge>}
                <Badge variant={specBadge.variant}>{specBadge.label}</Badge>
                <JobFlagBadges flags={job.flags} inspectionBias={job.computed_inspection_bias} safety={job.computed_safety} compact />
                {job.has_photos && (
                  <Badge variant="outline" className="gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> {t('board.photos')}
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              {job.teaser && <p className="text-sm text-muted-foreground line-clamp-2">{job.teaser}</p>}
            </div>
            <Button onClick={handleButtonClick} variant="outline" size="sm" className="hidden sm:inline-flex">
              {t('card.view')}
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
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, ...dateLocale })}
            </span>
          </div>
        </CardHeader>

        {job.highlights?.length > 0 && (
          <CardContent className="space-y-3 pl-7 pt-0">
            <Separator />
            <ul className="grid gap-1.5 text-sm">
              {job.highlights.slice(0, 3).map((h, idx) => (
                <li key={`${job.id}-h-${idx}`} className="text-muted-foreground flex items-start gap-2">
                  <span className="text-primary/60 mt-0.5">•</span>
                  <span>{formatHighlight(h)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}

        <CardContent className="pt-0 pl-7">
          <Separator className="mb-3" />
          <div className="flex flex-col sm:flex-row gap-2">
            {showSignInCTA && (
              <Button variant="outline" size="sm" asChild className="flex-1" onClick={(e) => e.stopPropagation()}>
                <Link to={`/auth?returnUrl=/jobs`}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {t('card.signInToRespond')}
                </Link>
              </Button>
            )}
            {showCompleteProfileCTA && (
              <Button variant="outline" size="sm" asChild className="flex-1" onClick={(e) => e.stopPropagation()}>
                <Link to={profileCompletionLink}>
                  <Send className="mr-2 h-4 w-4" />
                  {proNeedsServices 
                    ? t('card.addServicesToApply')
                    : proNeedsSetup 
                      ? t('card.completeOnboarding')
                      : t('card.setupProfile')}
                </Link>
              </Button>
            )}
            {showProCTAs && isProReady && (
              <>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleMessageClick} disabled={isMessaging}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {isMessaging ? t('card.opening') : t('card.message')}
                </Button>
                <Button variant="accent" size="sm" className="flex-1" onClick={handleButtonClick}>
                  <Send className="mr-2 h-4 w-4" />
                  {t('card.viewApply')}
                </Button>
              </>
            )}
            {isAuthenticated && isClient && (
              <Button variant="outline" size="sm" className="flex-1 sm:hidden" onClick={handleButtonClick}>
                {t('card.viewDetails')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <JobDetailsModal jobId={job.id} open={open} onOpenChange={setOpen} />
    </>
  );
}
