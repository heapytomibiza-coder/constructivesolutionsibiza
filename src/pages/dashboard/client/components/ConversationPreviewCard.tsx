/**
 * ConversationPreviewCard — Compact card showing latest conversation message.
 * Links to full conversation at /messages/:conversationId.
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationPreviewCardProps {
  jobId: string;
  viewerRole: 'client' | 'professional';
}

export function ConversationPreviewCard({ jobId, viewerRole }: ConversationPreviewCardProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useSession();

  const { data: conversation } = useQuery({
    queryKey: ['conversation_preview', jobId, viewerRole],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select('id, last_message_at, last_message_preview, last_read_at_client, last_read_at_pro')
        .eq('job_id', jobId)
        .order('last_message_at', { ascending: false })
        .limit(1);

      if (viewerRole === 'professional' && user?.id) {
        query = query.eq('pro_id', user.id);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId && !!user,
  });

  if (!conversation || !conversation.last_message_preview) return null;

  const lastReadField = viewerRole === 'client'
    ? conversation.last_read_at_client
    : conversation.last_read_at_pro;
  const hasUnread = conversation.last_message_at && lastReadField
    ? new Date(conversation.last_message_at) > new Date(lastReadField)
    : !!conversation.last_message_at && !lastReadField;

  return (
    <Link
      to={`/messages/${conversation.id}`}
      className="block rounded-[20px] border border-border/70 bg-card p-4 sm:p-[18px] shadow-sm hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              {t('conversationPreview.title', 'Conversation')}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {hasUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
              {conversation.last_message_at && (
                <span className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground mt-1 truncate">
            {conversation.last_message_preview}
          </p>
        </div>
      </div>
    </Link>
  );
}
