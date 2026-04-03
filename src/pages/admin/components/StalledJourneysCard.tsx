import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareWarning, Clock, ExternalLink } from 'lucide-react';
import { useStalledQuoteJourneys } from '../hooks/useStalledQuoteJourneys';
import { Link } from 'react-router-dom';

function formatAge(hours: number): string {
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function StalledJourneysCard() {
  const { data: journeys, isLoading } = useStalledQuoteJourneys();

  const noQuote = journeys?.filter(j => j.stall_type === 'no_quote') ?? [];
  const noHire = journeys?.filter(j => j.stall_type === 'no_hire') ?? [];
  const total = (noQuote.length + noHire.length);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4 text-amber-500" />
          Stalled Journeys
          {!isLoading && total > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">{total}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
          </div>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">No stalled journeys right now.</p>
        ) : (
          <>
            {noQuote.length > 0 && (
              <section>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Talking but no quote ({noQuote.length})
                </h4>
                <ul className="space-y-1.5">
                  {noQuote.slice(0, 10).map(j => (
                    <JourneyRow key={j.conversation_id} journey={j} />
                  ))}
                  {noQuote.length > 10 && (
                    <li className="text-xs text-muted-foreground pl-1">+{noQuote.length - 10} more</li>
                  )}
                </ul>
              </section>
            )}
            {noHire.length > 0 && (
              <section>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Quoted but not hired ({noHire.length})
                </h4>
                <ul className="space-y-1.5">
                  {noHire.slice(0, 10).map(j => (
                    <JourneyRow key={j.conversation_id} journey={j} />
                  ))}
                  {noHire.length > 10 && (
                    <li className="text-xs text-muted-foreground pl-1">+{noHire.length - 10} more</li>
                  )}
                </ul>
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function JourneyRow({ journey }: { journey: ReturnType<typeof useStalledQuoteJourneys>['data'] extends (infer T)[] | undefined ? T : never }) {
  return (
    <li className="flex items-center gap-2 text-sm group">
      <Link
        to={`/messages?conversation=${journey.conversation_id}`}
        className="flex-1 min-w-0 flex items-center gap-1.5 hover:underline"
      >
        <span className="truncate font-medium">{journey.job_title}</span>
        <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
      </Link>
      <span className="text-xs text-muted-foreground truncate max-w-[100px]">
        {journey.pro_display_name || 'Pro'}
      </span>
      <span className="text-xs text-muted-foreground flex items-center gap-0.5 shrink-0">
        <Clock className="h-3 w-3" />
        {formatAge(journey.hours_since_activity)}
      </span>
    </li>
  );
}
