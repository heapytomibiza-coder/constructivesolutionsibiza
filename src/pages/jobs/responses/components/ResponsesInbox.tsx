/**
 * ResponsesInbox — client-side three-section inbox.
 *
 * Sections (top to bottom): Shortlisted → With quote → Interested.
 * Declined / withdrawn / expired collapse into a togglable group.
 *
 * All mutations route through the existing RPCs via mutations.ts.
 * Hire flow is gated by HireConfirmModal — the only path to accept_response
 * from the UI.
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResponseCard } from "./ResponseCard";
import { HireConfirmModal } from "./HireConfirmModal";
import {
  useAcceptResponse,
  useShortlistResponse,
} from "../mutations";
import type { EnrichedResponse } from "../types";

interface Props {
  jobId: string;
  responses: EnrichedResponse[];
}

interface Sections {
  shortlisted: EnrichedResponse[];
  quoted: EnrichedResponse[];
  interested: EnrichedResponse[];
  archived: EnrichedResponse[];
}

function bucket(responses: EnrichedResponse[]): Sections {
  const out: Sections = { shortlisted: [], quoted: [], interested: [], archived: [] };
  for (const r of responses) {
    const s = r.response.status;
    if (s === "shortlisted") out.shortlisted.push(r);
    else if (s === "accepted" || s === "declined" || s === "withdrawn" || s === "expired")
      out.archived.push(r);
    else if (s === "quoted" || r.quote) out.quoted.push(r);
    else out.interested.push(r);
  }
  return out;
}

function formatPriceForModal(r: EnrichedResponse, fallback: string): string {
  const q = r.quote;
  if (!q) return fallback;
  if (q.total != null) return `€${q.total.toLocaleString()}`;
  if (q.priceFixed != null) return `€${q.priceFixed.toLocaleString()}`;
  if (q.priceMin != null && q.priceMax != null)
    return `€${q.priceMin.toLocaleString()}–€${q.priceMax.toLocaleString()}`;
  return fallback;
}

export function ResponsesInbox({ jobId, responses }: Props) {
  const { t } = useTranslation("responses");
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const [hireTarget, setHireTarget] = useState<EnrichedResponse | null>(null);

  const sections = useMemo(() => bucket(responses), [responses]);
  const shortlist = useShortlistResponse();
  const accept = useAcceptResponse();

  const liveResponsesCount =
    sections.shortlisted.length + sections.quoted.length + sections.interested.length;

  function handleShortlist(r: EnrichedResponse) {
    shortlist.mutate(
      { responseId: r.response.id, jobId },
      {
        onSuccess: () => toast.success(t("client.shortlistedToast")),
        onError: (err) =>
          toast.error(t("client.shortlistFailed"), {
            description: err instanceof Error ? err.message : undefined,
          }),
      }
    );
  }

  function handleHireConfirm() {
    if (!hireTarget) return;
    const target = hireTarget;
    accept.mutate(
      { responseId: target.response.id, jobId },
      {
        onSuccess: () => {
          toast.success(t("client.acceptedToast"));
          setHireTarget(null);
          navigate(`/dashboard/jobs/${jobId}`);
        },
        onError: (err) => {
          toast.error(t("client.acceptFailed"), {
            description: err instanceof Error ? err.message : undefined,
          });
        },
      }
    );
  }

  if (liveResponsesCount === 0 && sections.archived.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">{t("page.empty")}</div>
    );
  }

  const section = (title: string, items: EnrichedResponse[]) =>
    items.length > 0 && (
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          {title} ({items.length})
        </h3>
        {items.map((r) => (
          <ResponseCard
            key={r.response.id}
            enriched={r}
            isShortlisted={r.response.status === "shortlisted"}
            canHire={r.response.status === "shortlisted" || r.response.status === "quoted"}
            onShortlist={() => handleShortlist(r)}
            onHire={() => setHireTarget(r)}
            onViewProfile={() => navigate(`/professionals/${r.response.professional_id}`)}
            isMutating={shortlist.isPending || accept.isPending}
          />
        ))}
      </section>
    );

  const otherProsCount = hireTarget
    ? Math.max(
        0,
        liveResponsesCount - 1 // every other live response will be auto-declined
      )
    : 0;

  return (
    <div className="space-y-6">
      {section(t("sections.shortlisted"), sections.shortlisted)}
      {section(t("sections.withQuote"), sections.quoted)}
      {section(t("sections.interested"), sections.interested)}

      {sections.archived.length > 0 && (
        <div className="pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
            className="text-muted-foreground"
          >
            {showArchived
              ? t("sections.hideDeclined")
              : t("sections.showDeclined", { count: sections.archived.length })}
          </Button>
          {showArchived && (
            <div className="mt-3 space-y-2 opacity-70">
              {sections.archived.map((r) => (
                <ResponseCard
                  key={r.response.id}
                  enriched={r}
                  isShortlisted={false}
                  canHire={false}
                  onShortlist={() => {}}
                  onHire={() => {}}
                  isMutating={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <HireConfirmModal
        open={!!hireTarget}
        proName={
          hireTarget?.pro?.businessName ||
          hireTarget?.pro?.displayName ||
          "this professional"
        }
        priceLabel={hireTarget ? formatPriceForModal(hireTarget, "—") : "—"}
        otherProsCount={otherProsCount}
        isSubmitting={accept.isPending}
        onConfirm={handleHireConfirm}
        onCancel={() => setHireTarget(null)}
      />
    </div>
  );
}
