import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
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

function prettyStatus(s: string | null): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function getSpecBadge(job: JobsBoardRow): { label: string; variant: "success" | "secondary" | "outline" } {
  const score =
    (job.highlights?.length ?? 0) +
    (job.has_photos ? 2 : 0) +
    (budgetProxy(job) > 0 ? 1 : 0);

  if (score >= 4) return { label: "Good spec", variant: "success" };
  if (score >= 2) return { label: "Basic spec", variant: "secondary" };
  return { label: "Needs detail", variant: "outline" };
}

function formatBudget(j: JobsBoardRow): string {
  if (j.budget_type === "range" && j.budget_min != null && j.budget_max != null) {
    return `${j.budget_min.toLocaleString()}–${j.budget_max.toLocaleString()} €`;
  }
  if (j.budget_type === "fixed" && j.budget_value != null) {
    return `${j.budget_value.toLocaleString()} €`;
  }
  if (budgetProxy(j) > 0) return `~${budgetProxy(j).toLocaleString()} €`;
  return "TBD";
}

function formatTiming(j: JobsBoardRow): string {
  if (j.start_timing === "asap") return "ASAP";
  if (j.start_timing === "date" && j.start_date) return `Start: ${j.start_date}`;
  if (j.start_timing === "this_week") return "This week";
  if (j.start_timing === "this_month") return "This month";
  return "Flexible";
}

/**
 * Format highlight strings - handles budget ranges like "1000_2500" → "€1,000–€2,500"
 */
function formatHighlight(highlight: string): string {
  // Check if it's a budget range pattern like "1000_2500"
  const budgetRangeMatch = highlight.match(/^(\d+)_(\d+)$/);
  if (budgetRangeMatch) {
    const min = parseInt(budgetRangeMatch[1], 10);
    const max = parseInt(budgetRangeMatch[2], 10);
    return `€${min.toLocaleString()}–€${max.toLocaleString()}`;
  }
  
  // Convert snake_case to readable text
  if (highlight.includes("_") && !highlight.includes(" ")) {
    return highlight
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());
  }
  
  return highlight;
}

export function JobListingCard({ job, isMatched }: JobListingCardProps) {
  const [open, setOpen] = React.useState(false);
  const [isMessaging, setIsMessaging] = React.useState(false);
  const navigate = useNavigate();
  const specBadge = getSpecBadge(job);
  const { user, isAuthenticated, hasRole, isProReady, activeRole } = useSession();

  // Check if job is open for actions
  const isJobOpen = job.status === "open";
  const isPro = hasRole("professional");
  const isClient = activeRole === "client";

  const handleCardClick = () => setOpen(true);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleMessageClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!job.id) return;
    
    setIsMessaging(true);
    try {
      const conversationId = await startConversation(job.id);
      // Use SPA navigation instead of hard reload
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsMessaging(false);
    }
  };

  // Determine which CTAs to show
  const showProCTAs = isAuthenticated && isPro && isJobOpen;
  const showSignInCTA = !isAuthenticated && isJobOpen;
  const showCompleteProfileCTA = isAuthenticated && isPro && !isProReady && isJobOpen;

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
        {/* Accent border indicator - no layout shift */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-transparent transition-colors group-hover:bg-accent"
        />
        <CardHeader className="space-y-2 pl-7">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {job.category && <Badge variant="secondary">{job.category}</Badge>}
                {job.subcategory && <Badge variant="outline">{job.subcategory}</Badge>}
                {job.status && (
                  <Badge variant={statusVariant(job.status)}>{prettyStatus(job.status)}</Badge>
                )}
                {isMatched && <Badge variant="accent">Matched</Badge>}
                {job.start_timing === "asap" && <Badge variant="accent">ASAP</Badge>}
                <Badge variant={specBadge.variant}>{specBadge.label}</Badge>
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

            <Button onClick={handleButtonClick} variant="outline" size="sm" className="hidden sm:inline-flex">
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

        {/* CTA Row */}
        <CardContent className="pt-0 pl-7">
          <Separator className="mb-3" />
          <div className="flex flex-col sm:flex-row gap-2">
            {showSignInCTA && (
              <Button variant="outline" size="sm" asChild className="flex-1" onClick={(e) => e.stopPropagation()}>
                <Link to={`/auth?returnUrl=/jobs`}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in to respond
                </Link>
              </Button>
            )}

            {showCompleteProfileCTA && (
              <Button variant="outline" size="sm" asChild className="flex-1" onClick={(e) => e.stopPropagation()}>
                <Link to="/dashboard/pro">
                  <Send className="mr-2 h-4 w-4" />
                  Complete profile to apply
                </Link>
              </Button>
            )}

            {showProCTAs && isProReady && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleMessageClick}
                  disabled={isMessaging}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {isMessaging ? "Opening..." : "Message"}
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  className="flex-1"
                  onClick={handleButtonClick}
                >
                  <Send className="mr-2 h-4 w-4" />
                  View & Apply
                </Button>
              </>
            )}

            {/* Clients just see View button on mobile */}
            {isAuthenticated && isClient && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:hidden"
                onClick={handleButtonClick}
              >
                View details
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <JobDetailsModal jobId={job.id} open={open} onOpenChange={setOpen} />
    </>
  );
}
