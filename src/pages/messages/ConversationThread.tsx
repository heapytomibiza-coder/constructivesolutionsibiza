import * as React from "react";
import { useRef, useEffect, useState } from "react";
import { useMessages, useSendMessage, type Message } from "./hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ConversationThreadProps {
  conversationId: string;
  currentUserId: string;
  clientId?: string;
  jobTitle?: string;
  onBack?: () => void;
  onNewMessage?: () => void;
}

export function ConversationThread({
  conversationId,
  currentUserId,
  clientId,
  jobTitle,
  onBack,
  onNewMessage,
}: ConversationThreadProps) {
  const { data: messages, isLoading, isError, error } = useMessages(conversationId);
  const { send, isSending } = useSendMessage(conversationId, currentUserId);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);

  // Auto-scroll to bottom and mark read when new incoming messages arrive
  useEffect(() => {
    const currentCount = messages?.length ?? 0;
    const lastMessage = messages?.[messages.length - 1];
    
    // Only mark read if:
    // 1. New messages arrived (count increased)
    // 2. We had messages before (not initial load)
    // 3. The last message is from the other user (not our own send)
    if (
      currentCount > prevMessageCountRef.current &&
      prevMessageCountRef.current > 0 &&
      lastMessage &&
      lastMessage.sender_id !== currentUserId
    ) {
      onNewMessage?.();
    }
    
    prevMessageCountRef.current = currentCount;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentUserId, onNewMessage]);

  const handleSend = () => {
    if (draft.trim() && !isSending) {
      send(draft);
      setDraft("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return; // Shift+Enter = newline, always
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-foreground truncate">
            {jobTitle ?? "Conversation"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {messages?.length ?? 0} messages
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive text-sm">
            Failed to load messages: {(error as Error)?.message ?? "Unknown error"}
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none min-h-[44px] max-h-32"
            rows={1}
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || isSending}
            size="icon"
            className="shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Enter or ⌘/Ctrl+Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div
      className={cn(
        "flex",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={cn(
            "text-xs mt-1",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
