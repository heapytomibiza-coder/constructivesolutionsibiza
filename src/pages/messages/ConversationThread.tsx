import * as React from "react";
import { useRef, useEffect, useState, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { useMessages, useSendMessage, type Message } from "./hooks";
import { RequestSupportButton, SystemMessage } from "./components";
import { QuoteNudgeBanner } from "./components/QuoteNudgeBanner";
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
  jobStatus?: string;
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
  jobStatus,
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
  // Track last known message id to only scroll on genuinely new messages
  const lastMessageIdRef = useRef<string | null>(null);
  const initialScrollDoneRef = useRef(false);

  const dateFnsLocale = i18n.language?.startsWith('es') ? es : undefined;

  // Stable scroll helper — uses the scroll container, not scrollIntoView (which causes page-level jumps)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    });
  }, []);

  // Only scroll when a truly new message arrives (not on refetch / cache rewrite)
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    const isNewMessage = lastMsg.id !== lastMessageIdRef.current;

    if (!initialScrollDoneRef.current) {
      // First paint — jump instantly, no animation
      scrollToBottom('instant');
      initialScrollDoneRef.current = true;
    } else if (isNewMessage) {
      // New message from either party — smooth scroll
      scrollToBottom('smooth');
      // Notify parent for read-marking only if from other party
      if (lastMsg.sender_id !== currentUserId) {
        onNewMessage?.();
      }
    }

    lastMessageIdRef.current = lastMsg.id;
  }, [messages, currentUserId, onNewMessage, scrollToBottom]);

  // Reset scroll tracking when conversation changes
  useEffect(() => {
    initialScrollDoneRef.current = false;
    lastMessageIdRef.current = null;
  }, [conversationId]);

  const handleSend = useCallback(() => {
    if (draft.trim() && !isSending) {
      send(draft);
      setDraft("");
      // Re-focus input after send for quick follow-up
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [draft, isSending, send]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    e.preventDefault();
    handleSend();
  }, [handleSend]);

  // Keep compose bar visible when mobile keyboard opens
  // Use the scroll container approach instead of scrollIntoView to avoid page jumps
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let prevHeight = vv.height;
    let rafId: number | null = null;

    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const delta = prevHeight - vv.height;
        prevHeight = vv.height;
        // Keyboard opened (height decreased significantly)
        if (delta > 80) {
          scrollToBottom('instant');
        }
      });
    };

    vv.addEventListener('resize', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [scrollToBottom]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header — fixed height, never scrolls */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card shrink-0 z-10">
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

      {/* Messages area — this is the ONLY scrollable region */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-2"
        style={{ overflowAnchor: 'none' }}
      >
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
            <div ref={messagesEndRef} className="h-px" />
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

      {/* Quote nudge for professionals */}
      {jobId && (
        <QuoteNudgeBanner
          jobId={jobId}
          jobStatus={jobStatus}
          messageCount={messages?.length ?? 0}
        />
      )}

      {/* Compose — pinned to bottom, never moves */}
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
