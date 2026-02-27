import * as React from "react";
import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMessages, useSendMessage, type Message } from "./hooks";
import { RequestSupportButton, SystemMessage } from "./components";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConversationThreadProps {
  conversationId: string;
  currentUserId: string;
  clientId?: string;
  jobId?: string | null;
  jobTitle?: string;
  onBack?: () => void;
  onNewMessage?: () => void;
}

export function ConversationThread({
  conversationId,
  currentUserId,
  clientId,
  jobId,
  jobTitle,
  onBack,
  onNewMessage,
}: ConversationThreadProps) {
  const { t, i18n } = useTranslation('messages');
  const userRole = clientId === undefined
    ? 'client'
    : currentUserId === clientId ? 'client' : 'professional';
  const { data: messages, isLoading, isError, error } = useMessages(conversationId);
  const { send, isSending } = useSendMessage(conversationId, currentUserId);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);

  const dateFnsLocale = i18n.language?.startsWith('es') ? es : undefined;

  useEffect(() => {
    const currentCount = messages?.length ?? 0;
    const lastMessage = messages?.[messages.length - 1];
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
    if (e.shiftKey) return;
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm text-foreground truncate">
            {jobTitle ?? t('thread.conversation')}
          </h2>
        </div>
        <RequestSupportButton
          conversationId={conversationId}
          jobId={jobId}
          userRole={userRole}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive text-sm">
            {t('thread.loadFailed', { error: (error as Error)?.message ?? t('thread.unknownError') })}
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.map((msg) => (
              msg.message_type === 'system' ? (
                <SystemMessage key={msg.id} message={msg} />
              ) : (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === currentUserId}
                  locale={dateFnsLocale}
                />
              )
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t('thread.noMessages')}
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="px-3 py-2 border-t border-border bg-card shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('thread.placeholder')}
            className="resize-none min-h-[40px] !min-h-[40px] max-h-28 text-sm py-2 rounded-xl"
            rows={1}
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || isSending}
            size="icon"
            className="shrink-0 h-9 w-9"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 hidden sm:block">
          {t('thread.sendHint')}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn, locale }: { message: Message; isOwn: boolean; locale?: Parameters<typeof formatDistanceToNow>[1]['locale'] }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] sm:max-w-[70%] rounded-2xl px-3 py-1.5",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        <p className="text-[14px] leading-snug whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={cn(
            "text-[10px] mt-0.5 opacity-70",
            isOwn ? "text-primary-foreground" : "text-muted-foreground"
          )}
        >
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale })}
        </p>
      </div>
    </div>
  );
}
