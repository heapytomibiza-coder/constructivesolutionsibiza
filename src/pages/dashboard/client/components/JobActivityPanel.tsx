/**
 * JobActivityPanel — shows clients real-time activity on their job:
 * invites sent, conversations started, quotes received.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, MessageSquare, DollarSign, Loader2 } from "lucide-react";

interface JobActivityPanelProps {
  jobId: string;
  jobStatus: string;
}

function useJobActivityCounts(jobId: string) {
  return useQuery({
    queryKey: ["job_activity_counts", jobId],
    queryFn: async () => {
      const [invitesRes, convsRes, quotesRes] = await Promise.all([
        supabase.from("job_invites").select("id", { count: "exact", head: true }).eq("job_id", jobId),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("job_id", jobId),
        supabase.from("quotes").select("id", { count: "exact", head: true }).eq("job_id", jobId),
      ]);

      return {
        invites: invitesRes.count ?? 0,
        conversations: convsRes.count ?? 0,
        quotes: quotesRes.count ?? 0,
      };
    },
    staleTime: 30_000,
  });
}

export function JobActivityPanel({ jobId, jobStatus }: JobActivityPanelProps) {
  const { t } = useTranslation('dashboard');
  const { data, isLoading } = useJobActivityCounts(jobId);

  // Only show for active jobs
  if (!["open", "ready"].includes(jobStatus)) return null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const { invites = 0, conversations = 0, quotes = 0 } = data ?? {};

  const statusMessage = (() => {
    if (quotes > 0) return null; // CTA handles this
    if (conversations > 0) return t('activity.responsesNoQuotes', "You're getting responses — quotes should follow shortly");
    if (invites > 0) return t('activity.matching', "We're matching you with professionals...");
    return t('activity.waiting', "Your job is live — professionals will be in touch soon");
  })();

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">
          {t('activity.title', 'Job Activity')}
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{invites}</p>
              <p className="text-xs text-muted-foreground">{t('activity.invited', 'Invited')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{conversations}</p>
              <p className="text-xs text-muted-foreground">{t('activity.conversations', 'Conversations')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
              <DollarSign className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{quotes}</p>
              <p className="text-xs text-muted-foreground">{t('activity.quotes', 'Quotes')}</p>
            </div>
          </div>
        </div>

        {quotes > 0 ? (
          <Button size="sm" className="w-full gap-1.5" asChild>
            <Link to={`/dashboard/jobs/${jobId}/compare`}>
              {t('activity.compareQuotes', `You have ${quotes} quote${quotes > 1 ? 's' : ''} ready`)}
            </Link>
          </Button>
        ) : statusMessage ? (
          <p className="text-sm text-muted-foreground">{statusMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
