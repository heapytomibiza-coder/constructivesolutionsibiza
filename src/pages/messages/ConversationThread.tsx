import * as React from "react";
import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMessages, useSendMessage, type Message } from "./hooks";
import { RequestSupportButton, SystemMessage } from "./components";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ArrowLeft, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConversationThreadProps {
  conversationId: string;
  currentUserId: string;
  clientId?: string;
  jobId?: string | null;
  jobTitle?: string;
  otherPartyName?: string;
  onBack?: () => void;
  onNewMessage?: () => void;
}

export function ConversationThread({
  conversationId,
  currentUserId,
  clientId,
  jobId,
  jobTitle,
  otherPartyName,
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef<number>(0);

  const dateFnsLocale = i18n.language?.startsWith('es') ? es : undefined;

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  }, []);

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
    scrollToBottom(currentCount <= 1 ? 'instant' : 'smooth');
  }, [messages, currentUserId, onNewMessage, scrollToBottom]);

  const handleSend = () => {
    if (draft.trim() && !isSending) {
      send(draft);
      setDraft("");
      // Re-focus input after send for quick follow-up
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    e.preventDefault();
    handleSend();
  };

  // Keep compose bar visible when mobile keyboard opens
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let prevHeight = vv.height;
    const onResize = () => {
      const delta = prevHeight - vv.height;
      prevHeight = vv.height;
      // Keyboard opened (height decreased significantly)
      if (delta > 100) {
        scrollToBottom('smooth');
      }
    };

    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, [scrollToBottom]);

  return (
    // Use h-full to inherit from parent — parent (Messages.tsx) controls the viewport height
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
            {otherPartyName ?? t('thread.conversation')}
          </h2>
          {jobTitle && (
            <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>
          )}
        </div>
        <RequestSupportButton
          conversationId={conversationId}
          jobId={jobId}
          userRole={userRole}
        />
      </div>

      {/* Messages area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-2">
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
            <div ref={messagesEndRef} className="h-1" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('thread.noMessages')}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {t('thread.replyPrompt')}
            </p>
          </div>
        )}
      </div>

      {/* Compose — pinned to bottom */}
      <div className="px-3 py-2 border-t border-border bg-card shrink-0 pb-[max(env(safe-area-inset-bottom),8px)]">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('thread.placeholder')}
            className="flex-1 h-10 px-4 rounded-full border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            disabled={isSending}
            autoComplete="off"
            autoCorrect="on"
            enterKeyHint="send"
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || isSending}
            size="icon"
            className="shrink-0 h-10 w-10 rounded-full"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
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
        <div className={cn(
          "flex items-center gap-1 mt-0.5 justify-end",
          isOwn ? "text-primary-foreground" : "text-muted-foreground"
        )}>
          <span className="text-[10px] opacity-70">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale })}
          </span>
          {isOwn && (
            <CheckCheck className="h-3 w-3 opacity-70" />
          )}
        </div>
      </div>
    </div>
  );
}
