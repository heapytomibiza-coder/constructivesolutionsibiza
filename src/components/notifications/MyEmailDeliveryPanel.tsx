/**
 * MyEmailDeliveryPanel — Lightweight panel showing the user's most recent
 * email notifications and their delivery status (pending / sent / failed /
 * suppressed). Reads `email_send_log` directly; RLS limits rows to the
 * current user's email address. No business logic — observability only.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, AlertTriangle } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";

interface Row {
  id: string;
  message_id: string | null;
  template_name: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "sent") return "default";
  if (status === "pending") return "secondary";
  if (status === "suppressed") return "outline";
  return "destructive";
}

export function MyEmailDeliveryPanel() {
  const { user } = useSession();
  const enabled = !!user?.email;

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-email-delivery", user?.email],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_send_log")
        .select("id, message_id, template_name, status, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Dedupe by message_id, latest first.
      const seen = new Set<string>();
      const out: Row[] = [];
      for (const r of (data ?? []) as Row[]) {
        const key = r.message_id ?? r.id;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(r);
        if (out.length >= 10) break;
      }
      return out;
    },
  });

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Recent email notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Could not load delivery status.
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No email notifications yet. We'll list them here once they're sent.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{r.template_name ?? "notification"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                  {r.error_message && (
                    <div className="text-xs text-destructive truncate" title={r.error_message}>
                      {r.error_message}
                    </div>
                  )}
                </div>
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default MyEmailDeliveryPanel;
