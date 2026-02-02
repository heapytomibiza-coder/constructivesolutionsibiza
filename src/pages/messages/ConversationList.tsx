import { useState, useMemo } from "react";
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
        Failed to load conversations: {(error as Error)?.message ?? "Unknown error"}
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
          No conversations yet
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Start by messaging a professional on a job
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
            placeholder="Search conversations..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      {filteredConversations.length === 0 && searchQuery ? (
        <div className="py-8 px-4 text-center">
          <p className="text-sm text-muted-foreground">No matching conversations</p>
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
  // Determine if current user is client or pro
  const isClient = conversation.client_id === currentUserId;
  const roleLabel = isClient ? "You're the client" : "You're responding";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 hover:bg-accent/50 transition-colors",
        isSelected && "bg-accent"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-foreground truncate">
            {conversation.job_title ?? "Job"}
          </p>
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
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {conversation.last_message_preview}
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        {roleLabel}
      </p>
    </button>
  );
}
