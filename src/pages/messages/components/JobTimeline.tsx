/**
 * JobTimeline — collapsible vertical timeline showing job milestones.
 * Queries job_status_history and maps statuses to human-readable labels.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, ChevronUp, Circle, CheckCircle2, Clock, FileText, Hammer, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface JobTimelineProps {
  jobId: string;
}

interface StatusEntry {
  id: string;
  to_status: string;
  created_at: string;
}

const STATUS_ICON_MAP: Record<string, typeof Circle> = {
  draft: Circle,
  open: FileText,
  in_progress: Hammer,
  completed: CheckCircle2,
  reviewed: Star,
  cancelled: Circle,
};

export function JobTimeline({ jobId }: JobTimelineProps) {
  const { t, i18n } = useTranslation("messages");
  const [open, setOpen] = useState(false);
  const isEs = i18n.language?.startsWith("es");
  const dateLocale = isEs ? es : undefined;

  const { data: entries } = useQuery({
    queryKey: ["job_status_history", jobId],
    queryFn: async (): Promise<StatusEntry[]> => {
      const { data, error } = await supabase
        .from("job_status_history")
        .select("id, to_status, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!jobId,
  });

  if (!entries || entries.length === 0) return null;

  const latestStatus = entries[entries.length - 1].to_status;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground px-2">
          <Clock className="h-3 w-3" />
          {t(`timeline.status.${latestStatus}`, latestStatus)}
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 py-2 space-y-0">
          {entries.map((entry, i) => {
            const Icon = STATUS_ICON_MAP[entry.to_status] ?? Circle;
            const isLast = i === entries.length - 1;
            return (
              <div key={entry.id} className="flex gap-2.5 relative">
                {/* Vertical line */}
                {!isLast && (
                  <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border" />
                )}
                <div className="shrink-0 mt-0.5">
                  <Icon className={cn("h-[18px] w-[18px]", isLast ? "text-primary" : "text-muted-foreground/60")} />
                </div>
                <div className="pb-3 min-w-0">
                  <p className={cn("text-xs font-medium", isLast ? "text-foreground" : "text-muted-foreground")}>
                    {t(`timeline.status.${entry.to_status}`, entry.to_status)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: dateLocale })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
