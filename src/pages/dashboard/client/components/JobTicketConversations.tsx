/**
 * JobTicketConversations — Linked conversations section for Job Ticket Detail.
 * Role-aware: uses correct unread field for client vs professional.
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProSummaryCard } from '@/components/quotes/ProSummaryCard';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobTicketConversationsProps {
  jobId: string;
  viewerRole?: 'client' | 'professional';
}

export function JobTicketConversations({ jobId, viewerRole = 'client' }: JobTicketConversationsProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useSession();

  const { data: conversations = [] } = useQuery({
    queryKey: ['job_conversations', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, pro_id, client_id, last_message_at, last_message_preview, last_read_at_client, last_read_at_pro')
        .eq('job_id', jobId)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!jobId && !!user,
  });

  if (conversations.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          {t('jobTicket.conversations', 'Conversations')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {conversations.map(conv => {
          const lastReadField = viewerRole === 'client' ? conv.last_read_at_client : conv.last_read_at_pro;
          const hasUnread = conv.last_message_at && lastReadField
            ? new Date(conv.last_message_at) > new Date(lastReadField)
            : !!conv.last_message_at && !lastReadField;

          return (
            <Link
              key={conv.id}
              to={`/messages/${conv.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                {viewerRole === 'client' ? (
                  <ProSummaryCard professionalId={conv.pro_id} compact />
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {t('jobTicket.clientConversation', 'Client conversation')}
                  </p>
                )}
                {conv.last_message_preview && (
                  <p className="text-xs text-muted-foreground mt-1 truncate pl-8">
                    {conv.last_message_preview}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasUnread && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
                {conv.last_message_at && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
