/**
 * JobTimeline — collapsible vertical timeline showing job milestones.
 * Merges job_status_history, quote events (from messages), and reviews
 * into a single chronological timeline.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, ChevronUp, Circle, CheckCircle2, Clock, FileText, Hammer, Star, DollarSign, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface JobTimelineProps {
  jobId: string;
  conversationId?: string;
  /** When true, renders expanded without collapse wrapper */
  expanded?: boolean;
}

interface TimelineEntry {
  id: string;
  event: string;
  created_at: string;
}

const ICON_MAP: Record<string, typeof Circle> = {
  draft: Circle,
  open: FileText,
  quote_submitted: DollarSign,
  quote_accepted: Handshake,
  in_progress: Hammer,
  completed: CheckCircle2,
  reviewed: Star,
  cancelled: Circle,
};

async function fetchTimeline(jobId: string, conversationId?: string): Promise<TimelineEntry[]> {
  // Build scoped messages query
  let messagesQuery = supabase
    .from("messages")
    .select("id, created_at, metadata")
    .eq("message_type", "system")
    .in("metadata->>event", ["quote_submitted", "quote_accepted"])
    .order("created_at", { ascending: true });

  if (conversationId) {
    messagesQuery = messagesQuery.eq("conversation_id", conversationId);
  }

  // Fetch all three sources in parallel
  const [statusRes, quoteEventsRes, reviewsRes] = await Promise.all([
    supabase
      .from("job_status_history")
      .select("id, to_status, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true }),
    messagesQuery,
    supabase
      .from("job_reviews")
      .select("id, created_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true })
      .limit(2),
  ]);

  const entries: TimelineEntry[] = [];

  // Status history entries
  if (statusRes.data) {
    for (const s of statusRes.data) {
      entries.push({ id: s.id, event: s.to_status, created_at: s.created_at });
    }
  }

  // Quote events from messages (need to filter by conversation for this job)
  // The messages query above is broad — we filter client-side since quote events are rare
  if (quoteEventsRes.data) {
    for (const m of quoteEventsRes.data) {
      const meta = m.metadata as Record<string, unknown> | null;
      const event = meta?.event as string;
      if (event === "quote_submitted" || event === "quote_accepted") {
        // Avoid duplicates: don't add quote_accepted if in_progress status already covers it
        entries.push({ id: m.id, event, created_at: m.created_at });
      }
    }
  }

  // Reviews
  if (reviewsRes.data) {
    for (const r of reviewsRes.data) {
      entries.push({ id: r.id, event: "reviewed", created_at: r.created_at });
    }
  }

  // Sort chronologically and deduplicate
  entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Deduplicate: if quote_accepted and in_progress are within 5s, keep only in_progress
  return deduplicateEntries(entries);
}

function deduplicateEntries(entries: TimelineEntry[]): TimelineEntry[] {
  const result: TimelineEntry[] = [];
  for (const entry of entries) {
    // Skip quote_accepted if in_progress follows within 5 seconds
    if (entry.event === "quote_accepted") {
      const nextInProgress = entries.find(
        e => e.event === "in_progress" &&
          Math.abs(new Date(e.created_at).getTime() - new Date(entry.created_at).getTime()) < 5000
      );
      if (nextInProgress) continue;
    }
    result.push(entry);
  }
  return result;
}

export function JobTimeline({ jobId, conversationId }: JobTimelineProps) {
  const { t, i18n } = useTranslation("messages");
  const [open, setOpen] = useState(false);
  const isEs = i18n.language?.startsWith("es");
  const dateLocale = isEs ? es : undefined;

  const { data: entries } = useQuery({
    queryKey: ["job_timeline", jobId],
    queryFn: () => fetchTimeline(jobId, conversationId),
    enabled: !!jobId,
  });

  if (!entries || entries.length === 0) return null;

  const latestEvent = entries[entries.length - 1].event;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground px-2">
          <Clock className="h-3 w-3" />
          {t(`timeline.status.${latestEvent}`, latestEvent)}
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 py-2 space-y-0">
          {entries.map((entry, i) => {
            const Icon = ICON_MAP[entry.event] ?? Circle;
            const isLast = i === entries.length - 1;
            return (
              <div key={entry.id} className="flex gap-2.5 relative">
                {!isLast && (
                  <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border" />
                )}
                <div className="shrink-0 mt-0.5">
                  <Icon className={cn("h-[18px] w-[18px]", isLast ? "text-primary" : "text-muted-foreground/60")} />
                </div>
                <div className="pb-3 min-w-0">
                  <p className={cn("text-xs font-medium", isLast ? "text-foreground" : "text-muted-foreground")}>
                    {t(`timeline.status.${entry.event}`, entry.event)}
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
