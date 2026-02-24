import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useConversations, type Conversation } from "./hooks";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Search } from "lucide-react";
import { formatMessageTime } from "@/lib/formatMessageTime";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  userId: string;
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ userId, selectedId, onSelect }: ConversationListProps) {
  const { t } = useTranslation('messages');
  const { data: conversations, isLoading, isError, error } = useConversations(userId);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return conversations;

    return conversations.filter((c) => {
      const hay = `${c.job_title ?? ""} ${c.last_message_preview ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [conversations, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-sm text-destructive">
        {t('thread.loadFailed', { error: (error as Error)?.message ?? t('thread.unknownError') })}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t('list.noConversations')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('list.noConversationsHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Search Header */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('list.searchPlaceholder')}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      {filteredConversations.length === 0 && searchQuery ? (
        <div className="py-8 px-4 text-center">
          <p className="text-sm text-muted-foreground">{t('list.noMatches')}</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              currentUserId={userId}
              isSelected={conv.id === selectedId}
              onClick={() => onSelect(conv)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationItem({
  conversation,
  currentUserId,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation('messages');
  const isClient = conversation.client_id === currentUserId;
  const roleLabel = isClient ? t('list.youAreClient') : t('list.youAreResponding');
  const hasUnread = conversation.unread_count > 0 && !isSelected;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 hover:bg-accent/50 transition-colors",
        isSelected && "bg-accent",
        hasUnread && "bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn(
              "font-medium text-sm text-foreground truncate",
              hasUnread && "font-semibold"
            )}>
              {conversation.job_title ?? "Job"}
            </p>
            {hasUnread && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
              </Badge>
            )}
          </div>
          {conversation.job_category && (
            <Badge variant="secondary" className="text-xs mt-1">
              {conversation.job_category}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatMessageTime(conversation.last_message_at)}
        </span>
      </div>

      {conversation.last_message_preview && (
        <p className={cn(
          "text-sm mt-1 line-clamp-2",
          hasUnread ? "text-foreground" : "text-muted-foreground"
        )}>
          {conversation.last_message_preview}
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        {roleLabel}
      </p>
    </button>
  );
}
