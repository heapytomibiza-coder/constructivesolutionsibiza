/**
 * ProResponseActionBar — sticky CTA strip shown to professionals on a job detail.
 *
 * Renders one primary action based on the pro's response state. Performs all
 * state-aware copy and mutation routing in one place so consumers (job detail
 * pages) only need to drop it in.
 *
 * Authority gate: only renders meaningful actions when the user has the
 * professional role and onboarding is ready. Otherwise shows a guidance line.
 */

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/contexts/SessionContext";
import { useMyResponse } from "../queries/useMyResponse";
import {
  useExpressInterest,
  useWithdrawResponse,
} from "../mutations";
import { ResponseStateTimeline } from "./ResponseStateTimeline";
import type { ResponseStatus } from "../types";

interface Props {
  jobId: string;
  /** Optional handler — when provided, replaces default scroll-to-quote. */
  onSendQuote?: () => void;
}

export function ProResponseActionBar({ jobId, onSendQuote }: Props) {
  const { t } = useTranslation("responses");
  const navigate = useNavigate();
  const { user, hasRole, isProReady, activeRole } = useSession();

  const { data: myResponse, isLoading } = useMyResponse(jobId, user?.id ?? null);
  const expressInterest = useExpressInterest();
  const withdraw = useWithdrawResponse();

  // Authority gate — present but inert for non-pros / not-ready pros
  if (!user) return null;
  const canAct = hasRole("professional") && isProReady && activeRole === "professional";

  if (!canAct) {
    return (
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {!hasRole("professional")
          ? t("pro.needsProRole")
          : !isProReady
          ? t("pro.needsOnboarding")
          : t("pro.needsProRole")}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
        {t("page.loading")}
      </div>
    );
  }

  const status = (myResponse?.status as ResponseStatus | undefined) ?? null;

  function handleExpress() {
    expressInterest.mutate(
      { jobId },
      {
        onSuccess: () => toast.success(t("pro.expressedToast")),
        onError: (err) =>
          toast.error(t("pro.expressFailed"), {
            description: err instanceof Error ? err.message : undefined,
          }),
      }
    );
  }

  function handleWithdraw() {
    withdraw.mutate(
      { jobId },
      {
        onSuccess: () => toast.success(t("pro.withdrawnToast")),
        onError: (err) =>
          toast.error(t("pro.withdrawFailed"), {
            description: err instanceof Error ? err.message : undefined,
          }),
      }
    );
  }

  function handleSendQuote() {
    if (onSendQuote) {
      onSendQuote();
      return;
    }
    // Sensible default: scroll to a quote section if it exists on the page
    document
      .getElementById("quote-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ─── State-aware UI ───────────────────────────────────────────────
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {status && <ResponseStateTimeline status={status} />}

      {!status && (
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            onClick={handleExpress}
            disabled={expressInterest.isPending}
          >
            {t("pro.ctaInterested")}
          </Button>
        </div>
      )}

      {status === "interested" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{t("pro.statusInterested")}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t("pro.nudgeAddQuote")}</p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSendQuote}>
              {t("pro.ctaSendQuote")}
            </Button>
            <Button
              variant="ghost"
              onClick={handleWithdraw}
              disabled={withdraw.isPending}
            >
              {t("pro.ctaWithdraw")}
            </Button>
          </div>
        </div>
      )}

      {status === "quoted" && (
        <div className="space-y-2">
          <Badge variant="secondary">{t("pro.statusQuoted")}</Badge>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleSendQuote}>
              {t("pro.ctaEditQuote")}
            </Button>
            <Button
              variant="ghost"
              onClick={handleWithdraw}
              disabled={withdraw.isPending}
            >
              {t("pro.ctaWithdraw")}
            </Button>
          </div>
        </div>
      )}

      {status === "shortlisted" && (
        <div className="space-y-2">
          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/15">
            {t("pro.statusShortlisted")}
          </Badge>
          <Button variant="outline" className="w-full" onClick={handleSendQuote}>
            {t("pro.ctaSendRevised")}
          </Button>
        </div>
      )}

      {status === "accepted" && (
        <div className="space-y-2">
          <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
            {t("pro.statusAccepted")}
          </Badge>
          <Button
            className="w-full"
            onClick={() => navigate(`/dashboard/pro/job/${jobId}`)}
          >
            {t("pro.ctaOpenWorkspace")}
          </Button>
        </div>
      )}

      {(status === "declined" || status === "withdrawn" || status === "expired") && (
        <div className="space-y-2">
          <Badge variant="outline">{t("pro.statusDeclined")}</Badge>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/jobs")}
          >
            {t("pro.ctaViewSimilar")}
          </Button>
        </div>
      )}
    </div>
  );
}
