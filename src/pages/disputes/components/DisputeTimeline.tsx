/**
 * Visual vertical timeline merging status history, inputs, and AI events.
 */
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Brain, FileText, MessageSquare, Upload, AlertTriangle,
  Clock, CheckCircle2, XCircle, Handshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'status_change' | 'input' | 'evidence' | 'ai_event' | 'admin_note';
  title: string;
  description?: string;
  source?: string;
  metadata?: Record<string, any>;
}

interface DisputeTimelineProps {
  history: any[];
  inputs: any[];
  evidence: any[];
  aiEvents?: any[];
}

const EVENT_CONFIG: Record<string, { icon: typeof ArrowRight; dotColor: string }> = {
  status_change: { icon: ArrowRight, dotColor: 'bg-primary' },
  input: { icon: MessageSquare, dotColor: 'bg-blue-500' },
  evidence: { icon: Upload, dotColor: 'bg-purple-500' },
  ai_event: { icon: Brain, dotColor: 'bg-amber-500' },
  admin_note: { icon: FileText, dotColor: 'bg-muted-foreground' },
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  resolved: CheckCircle2,
  escalated: AlertTriangle,
  closed: XCircle,
  resolution_offered: Handshake,
  awaiting_counterparty: Clock,
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildTimeline({ history, inputs, evidence, aiEvents }: DisputeTimelineProps): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Status changes
  for (const h of history) {
    events.push({
      id: `sh-${h.id}`,
      timestamp: h.created_at,
      type: 'status_change',
      title: h.from_status
        ? `${statusLabel(h.from_status)} → ${statusLabel(h.to_status)}`
        : statusLabel(h.to_status),
      source: h.change_source,
    });
  }

  // Inputs
  for (const i of inputs) {
    const isAdmin = i.input_type === 'admin_note';
    events.push({
      id: `in-${i.id}`,
      timestamp: i.created_at,
      type: isAdmin ? 'admin_note' : 'input',
      title: isAdmin ? 'Admin note added' : `${i.input_type.replace(/_/g, ' ')} submitted`,
      description: i.raw_text ? (i.raw_text.length > 120 ? i.raw_text.slice(0, 120) + '…' : i.raw_text) : undefined,
    });
  }

  // Evidence
  for (const e of evidence) {
    events.push({
      id: `ev-${e.id}`,
      timestamp: e.created_at,
      type: 'evidence',
      title: `Evidence uploaded: ${e.evidence_category || e.file_type}`,
      description: e.description || undefined,
    });
  }

  // AI events
  for (const ae of (aiEvents ?? [])) {
    events.push({
      id: `ai-${ae.id}`,
      timestamp: ae.created_at,
      type: 'ai_event',
      title: ae.event_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    });
  }

  // Sort chronologically
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return events;
}

export function DisputeTimeline(props: DisputeTimelineProps) {
  const events = buildTimeline(props);

  if (!events.length) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        No timeline events yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold flex items-center gap-1.5">
        <Clock className="h-4 w-4" /> Timeline
      </h2>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-4">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.status_change;
            const Icon = event.type === 'status_change'
              ? (STATUS_ICONS[event.title.split(' → ').pop()?.toLowerCase().replace(/ /g, '_') ?? ''] ?? config.icon)
              : config.icon;

            return (
              <div key={event.id} className="relative flex items-start gap-3">
                {/* Dot */}
                <div
                  className={cn(
                    'absolute -left-6 mt-1 h-[18px] w-[18px] rounded-full border-2 border-background flex items-center justify-center',
                    config.dotColor
                  )}
                >
                  <Icon className="h-2.5 w-2.5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{event.title}</span>
                    {event.source && event.source !== 'app' && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {event.source}
                      </Badge>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
