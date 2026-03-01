/**
 * QuotesTab — Shows quotes on a job.
 * Client sees all quotes + can accept. Pro sees own quote or submit form.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/contexts/SessionContext";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText } from "lucide-react";
import { useQuotesForJob, useMyQuoteForJob } from "../queries/quotes.query";
import { QuoteCard } from "./QuoteCard";
import { ProposalBuilder } from "./ProposalBuilder";

interface QuotesTabProps {
  jobId: string;
  isOwner: boolean;
}

export function QuotesTab({ jobId, isOwner }: QuotesTabProps) {
  const { t } = useTranslation("jobs");
  const { user, hasRole } = useSession();
  const isPro = hasRole("professional");

  // Client: all quotes. Pro: own quote.
  const { data: allQuotes, isLoading: loadingAll } = useQuotesForJob(jobId, isOwner);
  const { data: myQuote, isLoading: loadingMine } = useMyQuoteForJob(jobId, user?.id ?? null, isPro && !isOwner);

  const [showForm, setShowForm] = useState(false);

  const isLoading = isOwner ? loadingAll : loadingMine;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("quotes.loading")}
      </div>
    );
  }

  // Client view
  if (isOwner) {
    const quotes = allQuotes ?? [];
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4" />
          {t("quotes.title")} {quotes.length > 0 && `(${quotes.length})`}
        </div>
        {quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("quotes.noQuotes")}</p>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <QuoteCard key={q.id} quote={q} role="client" />
            ))}
          </div>
        )}
      </section>
    );
  }

  // Pro view
  if (isPro && user) {
    const hasActiveQuote = myQuote && (myQuote.status === "submitted" || myQuote.status === "revised");

    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4" />
          {t("quotes.yourQuote")}
        </div>
        {myQuote ? (
          <QuoteCard
            quote={myQuote}
            role="pro"
            onRevise={hasActiveQuote ? () => setShowForm(true) : undefined}
          />
        ) : null}
        {(!myQuote || showForm) && (
          <>
            {myQuote && <Separator className="bg-border/60" />}
            <ProposalBuilder
              jobId={jobId}
              existingQuote={showForm ? myQuote : undefined}
              onSuccess={() => setShowForm(false)}
            />
          </>
        )}
      </section>
    );
  }

  return null;
}
