import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Clock, Send, UserCheck } from "lucide-react";
import { StatTile } from "@/shared/components/StatTile";

interface FunnelMetrics {
  no_quote_yet: number;
  quote_after_messaging: number;
  avg_hours_to_quote: number | null;
  quote_no_hire: number;
  total_active_conversations: number;
}

function useQuoteFunnelMetrics() {
  return useQuery({
    queryKey: ["admin", "quote-funnel-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_quote_funnel_metrics");
      if (error) throw error;
      return data as FunnelMetrics;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function QuoteFunnelCard() {
  const { data, isLoading } = useQuoteFunnelMetrics();

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Quote Journey</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Quote Journey</h2>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <StatTile
          icon={<MessageSquare className="h-5 w-5 text-primary" />}
          label="Active Conversations"
          value={data?.total_active_conversations ?? 0}
        />
        <StatTile
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          iconClassName="bg-amber-500/10"
          label="No Quote Yet"
          value={data?.no_quote_yet ?? 0}
        />
        <StatTile
          icon={<Send className="h-5 w-5 text-accent" />}
          iconClassName="bg-accent/10"
          label="Quote After Messaging"
          value={data?.quote_after_messaging ?? 0}
        />
        <StatTile
          icon={<Clock className="h-5 w-5 text-primary" />}
          label="Avg Hours to Quote"
          value={data?.avg_hours_to_quote ?? "—"}
        />
        <StatTile
          icon={<UserCheck className="h-5 w-5 text-amber-500" />}
          iconClassName="bg-amber-500/10"
          label="Quote, No Hire"
          value={data?.quote_no_hire ?? 0}
        />
      </div>
    </section>
  );
}
