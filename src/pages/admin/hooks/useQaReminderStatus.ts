import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QaReminderRun {
  id: string;
  function_name: string;
  week_key: string;
  destination: string;
  status: string;
  error_message: string | null;
  trigger_source: string;
  triggered_by: string | null;
  sent_at: string;
  created_at: string;
}

function getCurrentIsoWeekKey(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function useQaReminderStatus() {
  const queryClient = useQueryClient();
  const currentWeek = getCurrentIsoWeekKey();

  const query = useQuery({
    queryKey: ["qa_reminder_runs"],
    queryFn: async (): Promise<QaReminderRun[]> => {
      const { data, error } = await supabase
        .from("qa_reminder_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as unknown as QaReminderRun[];
    },
    staleTime: 60_000,
  });

  const latestRun = query.data?.[0] ?? null;
  const sentThisWeek = query.data?.some(
    (r) => r.week_key === currentWeek && r.status === "sent"
  ) ?? false;

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("trigger_qa_reminder");
      if (error) throw error;
      return data as unknown as { status: string; request_id?: number; message?: string };
    },
    onSuccess: (result) => {
      if (result.status === "error") {
        toast.error(result.message ?? "Trigger failed");
        return;
      }
      toast.success("QA reminder triggered — check Telegram shortly");
      // Delay refetch slightly to allow the async edge function to complete
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["qa_reminder_runs"] });
      }, 5000);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`QA trigger failed: ${message}`);
    },
  });

  return {
    history: query.data ?? [],
    latestRun,
    sentThisWeek,
    currentWeek,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    trigger: triggerMutation.mutate,
    isTriggerPending: triggerMutation.isPending,
  };
}
