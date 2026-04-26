/**
 * ResponseCard — single pro card in the client-side inbox.
 *
 * Soft action: shortlist (toggleable).
 * Hard action: hire (opens HireConfirmModal owned by parent).
 *
 * Stays presentational — all mutations are passed in via props from ResponsesInbox
 * so optimistic UI / batching can live in one place.
 */

import { Star, ShieldCheck, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EnrichedResponse } from "../types";

interface Props {
  enriched: EnrichedResponse;
  isShortlisted: boolean;
  canHire: boolean;
  onShortlist: () => void;
  onAskForQuote?: () => void;
  onHire: () => void;
  onMessage?: () => void;
  onViewProfile?: () => void;
  isMutating?: boolean;
}

function formatPrice(quote: EnrichedResponse["quote"]): string | null {
  if (!quote) return null;
  if (quote.total != null) return `€${quote.total.toLocaleString()}`;
  if (quote.priceFixed != null) return `€${quote.priceFixed.toLocaleString()}`;
  if (quote.priceMin != null && quote.priceMax != null)
    return `€${quote.priceMin.toLocaleString()}–€${quote.priceMax.toLocaleString()}`;
  if (quote.priceMin != null) return `€${quote.priceMin.toLocaleString()}+`;
  return null;
}

export function ResponseCard({
  enriched,
  isShortlisted,
  canHire,
  onShortlist,
  onAskForQuote,
  onHire,
  onMessage,
  onViewProfile,
  isMutating,
}: Props) {
  const { t } = useTranslation("responses");
  const { response, pro, quote } = enriched;
  const name = pro?.businessName || pro?.displayName || "Professional";
  const price = formatPrice(quote);
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <Card className={cn("transition-shadow", isShortlisted && "ring-1 ring-primary/30")}>
      <CardContent className="p-4 flex gap-3">
        <Avatar className="h-12 w-12 flex-shrink-0">
          {pro?.avatarUrl && <AvatarImage src={pro.avatarUrl} alt={name} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{name}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                {pro?.rating != null && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {pro.rating.toFixed(1)}
                  </span>
                )}
                {pro?.isVerified && (
                  <span className="flex items-center gap-1 text-primary">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              {price ? (
                <p className="font-semibold text-sm">{price}</p>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  {t("card.quotePending")}
                </Badge>
              )}
            </div>
          </div>

          {response.message && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              "{response.message}"
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {canHire && (
              <Button size="sm" onClick={onHire} disabled={isMutating}>
                {t("card.hireShort")}
              </Button>
            )}
            <Button
              size="sm"
              variant={isShortlisted ? "secondary" : "outline"}
              onClick={onShortlist}
              disabled={isMutating || isShortlisted}
              aria-pressed={isShortlisted}
            >
              {isShortlisted ? t("card.shortlisted") : t("card.shortlist")}
            </Button>
            {!quote && onAskForQuote && (
              <Button size="sm" variant="ghost" onClick={onAskForQuote}>
                {t("card.askForQuote")}
              </Button>
            )}
            {onMessage && (
              <Button size="sm" variant="ghost" onClick={onMessage}>
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                {t("card.message")}
              </Button>
            )}
            {onViewProfile && (
              <Button size="sm" variant="link" onClick={onViewProfile} className="ml-auto">
                {t("card.viewProfile")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
