import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useConversations, type Conversation } from '@/pages/messages/hooks';
import { formatMessageTime } from '@/lib/formatMessageTime';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const { t } = useTranslation();
  const { data: conversations } = useConversations(userId);
  const [open, setOpen] = useState(false);

  const totalUnread = useMemo(
    () => (conversations ?? []).reduce((sum, c) => sum + (c.unread_count ?? 0), 0),
    [conversations]
  );

  const unreadConversations = useMemo(
    () => (conversations ?? []).filter((c) => c.unread_count > 0).slice(0, 5),
    [conversations]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
          <span className="sr-only">
            {t('nav.notifications', 'Notifications')}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {t('nav.notifications', 'Notifications')}
          </p>
        </div>

        {unreadConversations.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('nav.noNotifications', 'No new notifications')}
            </p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
            {unreadConversations.map((conv) => (
              <NotificationItem
                key={conv.id}
                conversation={conv}
                onClick={() => setOpen(false)}
              />
            ))}
          </div>
        )}

        <div className="border-t border-border px-4 py-2">
          <Link
            to="/messages"
            onClick={() => setOpen(false)}
            className="block text-center text-sm font-medium text-primary hover:underline"
          >
            {t('nav.viewAllMessages', 'View all messages')}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  conversation,
  onClick,
}: {
  conversation: Conversation;
  onClick: () => void;
}) {
  return (
    <Link
      to={`/messages/${conversation.id}`}
      onClick={onClick}
      className={cn(
        'block px-4 py-3 hover:bg-accent/50 transition-colors',
        'bg-primary/5'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground truncate flex-1">
          {conversation.job_title ?? 'Job'}
        </p>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatMessageTime(conversation.last_message_at)}
        </span>
      </div>
      {conversation.last_message_preview && (
        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
          {conversation.last_message_preview}
        </p>
      )}
    </Link>
  );
}
