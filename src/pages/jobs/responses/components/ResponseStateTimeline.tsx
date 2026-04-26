/**
 * ResponseStateTimeline — visual 4-step indicator shown to both pro and client.
 *
 * Pure UI: derives current step from a status string. No data fetching, no writes.
 */

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ResponseStatus } from "../types";

interface Props {
  status: ResponseStatus | string | null | undefined;
  className?: string;
}

const STEPS: ResponseStatus[] = ["interested", "quoted", "shortlisted", "accepted"];

function statusToIndex(status: string | null | undefined): number {
  switch (status) {
    case "interested":
      return 0;
    case "quoted":
      return 1;
    case "shortlisted":
      return 2;
    case "accepted":
      return 3;
    default:
      return -1; // declined / withdrawn / expired / null → no progress shown
  }
}

export function ResponseStateTimeline({ status, className }: Props) {
  const { t } = useTranslation("responses");
  const currentIndex = statusToIndex(status ?? null);

  return (
    <div className={cn("w-full", className)}>
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {t("timeline.title")}
      </p>
      <ol className="flex items-center gap-2">
        {STEPS.map((step, idx) => {
          const reached = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <li key={step} className="flex-1 flex items-center gap-2">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold border transition-colors",
                  reached
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border",
                  isCurrent && "ring-2 ring-primary/30"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {reached && idx < currentIndex ? (
                  <Check className="h-3 w-3" aria-hidden="true" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  reached ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {t(`timeline.${step === "accepted" ? "hired" : step}`)}
              </span>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px",
                    idx < currentIndex ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
