import { useConversations, type Conversation } from "./hooks";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  userId: string;
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ userId, selectedId, onSelect }: ConversationListProps) {
  const { data: conversations, isLoading, isError, error } = useConversations(userId);

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
    <div className="divide-y divide-border">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          currentUserId={userId}
          isSelected={conv.id === selectedId}
          onClick={() => onSelect(conv)}
        />
      ))}
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
        {conversation.last_message_at && (
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
          </span>
        )}
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
