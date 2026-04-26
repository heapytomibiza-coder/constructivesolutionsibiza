/**
 * /dashboard/jobs/:jobId/responses — client-only inbox page.
 *
 * Guard layers (defense in depth):
 *   1. RouteGuard already requires auth via the parent Route.
 *   2. This page additionally checks job ownership: the caller must be the
 *      job's client_id (admins are allowed too via RLS).
 *   3. RLS on job_responses is the final authority — even if UI guards are
 *      bypassed, no rows are returned.
 *
 * This is the first route in the new `/dashboard/jobs/:jobId/responses`
 * subtree. No global routing refactor — the route is added in App.tsx
 * alongside the existing shared job ticket routes.
 */

import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import { useJobDetails } from "@/pages/jobs/queries/jobDetails.query";
import { ResponsesInbox } from "../responses/components/ResponsesInbox";
import { useJobResponses } from "../responses/queries/useJobResponses";

export default function JobResponsesPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("responses");
  const { user, hasRole, isReady } = useSession();

  const { data: job, isLoading: jobLoading } = useJobDetails(jobId ?? null, !!jobId);
  const { data: responses, isLoading: respLoading, error } = useJobResponses(
    jobId ?? null,
    !!jobId
  );

  useEffect(() => {
    document.title = `${t("page.title")} · Constructive Solutions Ibiza`;
  }, [t]);

  if (!jobId) return <Navigate to="/dashboard/client/jobs" replace />;

  if (!isReady || jobLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Ownership check (UI layer). RLS is still authoritative.
  const jobOwnerId = (job as unknown as { client_id?: string } | null)?.client_id;
  const isOwner = !!user && !!jobOwnerId && user.id === jobOwnerId;
  const isAdmin = hasRole("admin");

  if (!isOwner && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-muted-foreground">{t("page.notOwner")}</p>
        <Button variant="outline" onClick={() => navigate(`/dashboard/jobs/${jobId}`)}>
          {t("page.backToJob")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <header className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/dashboard/jobs/${jobId}`)}
          className="text-muted-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("page.backToJob")}
        </Button>
        <h1 className="text-2xl font-semibold">{t("page.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("page.subtitle")}</p>
      </header>

      {respLoading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">{t("page.loadError")}</div>
      ) : (
        <ResponsesInbox jobId={jobId} responses={responses ?? []} />
      )}
    </div>
  );
}
