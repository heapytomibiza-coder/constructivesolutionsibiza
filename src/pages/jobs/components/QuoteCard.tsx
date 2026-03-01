/**
 * QuoteCard — Displays a single quote with role-based actions.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { acceptQuote } from "../actions/acceptQuote.action";
import { withdrawQuote } from "../actions/withdrawQuote.action";
import { quoteKeys } from "../queries/quotes.query";
import { jobKeys } from "../queries/keys";
import type { Quote } from "../types";

const STATUS_VARIANTS: Record<string, "default" | "success" | "secondary" | "destructive" | "outline"> = {
  submitted: "default",
  revised: "secondary",
  accepted: "success",
  rejected: "destructive",
  withdrawn: "outline",
};

interface QuoteCardProps {
  quote: Quote;
  role: "client" | "pro";
  onRevise?: () => void;
}

export function QuoteCard({ quote, role, onRevise }: QuoteCardProps) {
  const { t, i18n } = useTranslation("jobs");
  const queryClient = useQueryClient();
  const [acting, setActing] = useState(false);
  const isEs = i18n.language?.startsWith("es");
  const dateLocale = isEs ? { locale: es } : undefined;

  const isActive = quote.status === "submitted" || quote.status === "revised";

  const priceDisplay = (() => {
    switch (quote.price_type) {
      case "fixed":
        return quote.price_fixed != null ? `€${quote.price_fixed.toLocaleString()}` : "—";
      case "estimate":
        return quote.price_min != null && quote.price_max != null
          ? `€${quote.price_min.toLocaleString()} – €${quote.price_max.toLocaleString()}`
          : "—";
      case "hourly":
        return quote.hourly_rate != null ? `€${quote.hourly_rate}/h` : "—";
      default:
        return "—";
    }
  })();

  const handleAccept = async () => {
    setActing(true);
    const result = await acceptQuote(quote.id, quote.job_id, quote.professional_id);
    setActing(false);
    if (result.success) {
      toast.success(t("quotes.accepted"));
      queryClient.invalidateQueries({ queryKey: quoteKeys.forJob(quote.job_id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.details(quote.job_id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.board() });
    } else {
      toast.error(result.error ?? t("quotes.acceptFailed"));
    }
  };

  const handleWithdraw = async () => {
    setActing(true);
    const result = await withdrawQuote(quote.id, quote.job_id);
    setActing(false);
    if (result.success) {
      toast.success(t("quotes.withdrawn"));
      queryClient.invalidateQueries({ queryKey: quoteKeys.myQuote(quote.job_id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.forJob(quote.job_id) });
    } else {
      toast.error(result.error ?? t("quotes.withdrawFailed"));
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {isActive && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary/40" />}
      <CardContent className="space-y-3 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{priceDisplay}</div>
          <Badge variant={STATUS_VARIANTS[quote.status] ?? "outline"}>
            {t(`quotes.status.${quote.status}`)}
          </Badge>
        </div>

        {/* Price type + time */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{t(`quotes.${quote.price_type}`)}</span>
          {quote.time_estimate_days && (
            <span>• {t("quotes.estimatedDays", { count: quote.time_estimate_days })}</span>
          )}
          {quote.revision_number > 1 && (
            <span>• {t("quotes.revision", { number: quote.revision_number })}</span>
          )}
        </div>

        {/* Line Items (Bookipi-style) */}
        {quote.line_items && quote.line_items.length > 0 ? (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">{t("proposal.items")}</div>
            <div className="divide-y divide-border/40 rounded-md border border-border/50 bg-muted/20">
              {quote.line_items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(item => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{item.description}</span>
                      {item.quantity > 1 && (
                        <span className="ml-1 text-xs text-muted-foreground">×{item.quantity}</span>
                      )}
                    </div>
                    <span className="ml-2 font-medium shrink-0">€{item.line_total.toFixed(2)}</span>
                  </div>
                ))}
            </div>
            {/* Subtotal / VAT / Total */}
            {quote.subtotal != null && (
              <div className="space-y-0.5 text-right text-sm">
                <div className="text-muted-foreground">
                  {t("proposal.subtotal")}: €{quote.subtotal.toFixed(2)}
                </div>
                {(quote.vat_percent ?? 0) > 0 && (
                  <div className="text-muted-foreground">
                    {t("proposal.vat")} ({quote.vat_percent}%): €{((quote.subtotal * (quote.vat_percent ?? 0)) / 100).toFixed(2)}
                  </div>
                )}
                <div className="font-bold text-base">
                  {t("proposal.total")}: €{(quote.total ?? quote.subtotal).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Legacy scope text fallback */}
            {quote.scope_text && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">{t("quotes.scope")}</div>
                <p className="text-sm whitespace-pre-line">{quote.scope_text}</p>
              </div>
            )}
          </>
        )}

        {/* Exclusions */}
        {quote.exclusions_text && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">{t("quotes.exclusions")}</div>
            <p className="text-sm whitespace-pre-line text-muted-foreground">{quote.exclusions_text}</p>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(quote.updated_at), { addSuffix: true, ...dateLocale })}
        </div>

        {/* Actions */}
        {isActive && (
          <div className="flex flex-wrap gap-2 pt-1">
            {role === "client" && (
              <>
                <Button size="sm" onClick={handleAccept} disabled={acting} className="gap-1.5">
                  {acting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {t("quotes.accept")}
                </Button>
                <Button size="sm" variant="outline" disabled={acting} onClick={() => {
                  // Reject is implicit when accepting another — just a visual placeholder
                }}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  {t("quotes.reject")}
                </Button>
              </>
            )}
            {role === "pro" && (
              <>
                {onRevise && (
                  <Button size="sm" variant="outline" onClick={onRevise} disabled={acting} className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("quotes.revise")}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={handleWithdraw} disabled={acting} className="gap-1.5 text-destructive hover:text-destructive">
                  {acting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {t("quotes.withdraw")}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
