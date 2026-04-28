/**
 * USER JOURNEY DEBUG PAGE
 * Admin-only diagnostic view of recent user sessions and their event timelines.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, RefreshCw, CheckCircle2, XCircle, ArrowLeft, Activity, Users, UserX, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface SummaryData {
  window_minutes: number;
  total_sessions: number;
  error_sessions: number;
  anonymous_sessions: number;
  authenticated_sessions: number;
  top_error_events: Array<{ event_type: string; count: number }>;
  top_drop_routes: Array<{ route: string; count: number }>;
}

interface SessionRow {
  session_id: string;
  user_id: string | null;
  started_at: string;
  last_active_at: string;
  ended_at: string | null;
  entry_route: string | null;
  exit_route: string | null;
  user_agent: string | null;
  viewport: string | null;
  status: string;
  event_count: number;
  error_count: number;
}

interface EventRow {
  id: string;
  session_id: string;
  user_id: string | null;
  event_type: string;
  route: string | null;
  action: string | null;
  payload: Record<string, unknown>;
  success: boolean;
  error_message: string | null;
  error_code: string | null;
  created_at: string;
}

export default function JourneyDebugPage() {
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ['journey_sessions', onlyErrors],
    queryFn: async (): Promise<SessionRow[]> => {
      const { data, error } = await supabase.rpc(
        'admin_get_recent_journey_sessions' as never,
        { p_limit: 25, p_only_errors: onlyErrors } as never,
      );
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
    refetchInterval: 15000,
  });

  const eventsQuery = useQuery({
    queryKey: ['journey_events', selectedSession],
    queryFn: async (): Promise<EventRow[]> => {
      if (!selectedSession) return [];
      const { data, error } = await supabase.rpc(
        'admin_get_journey_session_detail' as never,
        { p_session_id: selectedSession } as never,
      );
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
    enabled: !!selectedSession,
  });

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Journey Debug</h1>
          <p className="text-sm text-muted-foreground">Last 25 user sessions — diagnostic only</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={onlyErrors ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOnlyErrors((v) => !v)}
          >
            {onlyErrors ? 'Showing errors only' : 'Show all'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => sessionsQuery.refetch()}>
            <RefreshCw className={`h-4 w-4 ${sessionsQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
        {/* Sessions list */}
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="p-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
            Sessions
          </div>
          {sessionsQuery.isLoading ? (
            <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : sessionsQuery.isError ? (
            <div className="p-4 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Failed to load sessions
            </div>
          ) : sessionsQuery.data?.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No sessions yet</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-border">
              {sessionsQuery.data?.map((s) => {
                const isSelected = selectedSession === s.session_id;
                return (
                  <button
                    key={s.session_id}
                    onClick={() => setSelectedSession(s.session_id)}
                    className={`w-full text-left p-3 hover:bg-muted/40 transition-colors ${isSelected ? 'bg-muted' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <code className="text-xs font-mono text-foreground">{s.session_id.slice(0, 12)}…</code>
                      <Badge
                        variant={s.error_count > 0 ? 'destructive' : s.status === 'active' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {s.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.user_id ? `user ${s.user_id.slice(0, 8)}…` : 'anon'} • {s.event_count} events
                      {s.error_count > 0 && <span className="text-destructive"> • {s.error_count} err</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true })}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {s.entry_route || '/'} → {s.exit_route || s.entry_route || '/'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="p-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
            Timeline {selectedSession ? `— ${selectedSession.slice(0, 16)}…` : ''}
          </div>
          {!selectedSession ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Select a session to view its timeline</div>
          ) : eventsQuery.isLoading ? (
            <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : eventsQuery.isError ? (
            <div className="p-4 text-sm text-destructive">Failed to load events</div>
          ) : eventsQuery.data?.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No events for this session</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto p-3 space-y-2">
              {eventsQuery.data?.map((e) => (
                <div
                  key={e.id}
                  className={`p-3 rounded border text-sm ${
                    !e.success
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {e.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <Badge variant="outline" className="text-[10px] font-mono">{e.event_type}</Badge>
                    {e.action && <span className="text-xs text-muted-foreground">{e.action}</span>}
                    <span className="ml-auto text-[11px] text-muted-foreground font-mono">
                      {new Date(e.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {e.route && (
                    <div className="text-xs text-muted-foreground font-mono mb-1">{e.route}</div>
                  )}
                  {e.error_message && (
                    <div className="text-xs text-destructive mb-1">
                      {e.error_code ? `[${e.error_code}] ` : ''}{e.error_message}
                    </div>
                  )}
                  {e.payload && Object.keys(e.payload).length > 0 && (
                    <details className="text-[11px] text-muted-foreground">
                      <summary className="cursor-pointer">payload</summary>
                      <pre className="mt-1 p-2 bg-muted rounded overflow-auto">
                        {JSON.stringify(e.payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
