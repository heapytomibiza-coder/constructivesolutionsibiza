import * as React from "react";
import { Link } from "react-router-dom";
import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMessages, useSendMessage, type Message } from "./hooks";
import { RequestSupportButton, SystemMessage } from "./components";
import { JobLifecycleBar } from "./components/JobLifecycleBar";
import { JobTimeline } from "./components/JobTimeline";
import { InlineQuoteBuilder } from "./components/InlineQuoteBuilder";
import { QuoteCard } from "@/pages/jobs/components/QuoteCard";
import { useQuotesForJob } from "@/pages/jobs/queries/quotes.query";
import { useSession } from "@/contexts/SessionContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ArrowLeft, CheckCheck, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConversationThreadProps {
  conversationId: string;
  currentUserId: string;
  clientId?: string;
  proId?: string;
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
  proId,
  jobId,
  jobTitle,
  jobStatus,
  otherPartyName,
  onBack,
  onNewMessage,
}: ConversationThreadProps) {
  const { t, i18n } = useTranslation('messages');
  const { activeRole } = useSession();
  const userRole = clientId === undefined
    ? 'client'
    : currentUserId === clientId ? 'client' : 'professional';
  const { data: messages, isLoading, isError, error } = useMessages(conversationId);
  const { send, isSending } = useSendMessage(conversationId, currentUserId);
  const [draft, setDraft] = useState("");
  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const initialScrollDoneRef = useRef(false);

  const dateFnsLocale = i18n.language?.startsWith('es') ? es : undefined;

  // All quotes for this job (for inline rendering — works for both client and pro)
  const { data: allQuotes } = useQuotesForJob(jobId ?? null, !!jobId);

  const queryClient = useQueryClient();

  // Derive hasQuote: scoped to THIS conversation's professional only
  const hasQuote = !!allQuotes?.some(
    q => (q.status === 'submitted' || q.status === 'revised') && q.professional_id === proId
  );

  const canQuote = userRole === 'professional' && jobStatus === 'open' && !hasQuote && !!jobId;


  const handleQuoteAccepted = useCallback(async (quoteId: string) => {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: t('lifecycle.quoteAcceptedSystem', 'The quote has been accepted.'),
      message_type: 'system',
      metadata: { event: 'quote_accepted', quote_id: quoteId },
    });
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['job_timeline', jobId] });
  }, [conversationId, currentUserId, jobId, t, queryClient]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    });
  }, []);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    const isNewMessage = lastMsg.id !== lastMessageIdRef.current;
    if (!initialScrollDoneRef.current) {
      scrollToBottom('instant');
      initialScrollDoneRef.current = true;
    } else if (isNewMessage) {
      scrollToBottom('smooth');
      if (lastMsg.sender_id !== currentUserId) {
        onNewMessage?.();
      }
    }
    lastMessageIdRef.current = lastMsg.id;
  }, [messages, currentUserId, onNewMessage, scrollToBottom]);

  useEffect(() => {
    initialScrollDoneRef.current = false;
    lastMessageIdRef.current = null;
  }, [conversationId]);

  const handleSend = useCallback(() => {
    if (draft.trim() && !isSending) {
      send(draft);
      setDraft("");
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
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card shrink-0 z-10">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm text-foreground truncate">
            {userRole === 'client' && proId ? (
              <Link to={`/professionals/${proId}`} className="hover:underline">
                {otherPartyName ?? t('thread.conversation')}
              </Link>
            ) : (
              otherPartyName ?? t('thread.conversation')
            )}
          </h2>
          {jobTitle && (
            <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>
          )}
        </div>
        {jobId && <JobTimeline jobId={jobId} conversationId={conversationId} />}
        <RequestSupportButton
          conversationId={conversationId}
          jobId={jobId}
          userRole={userRole}
        />
      </div>

      {/* Messages area */}
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
                <React.Fragment key={msg.id}>
                  <SystemMessage message={msg} />
                  {/* Render QuoteCard inline — use metadata.quote_id for stable matching */}
                  {(() => {
                    const meta = msg.metadata as Record<string, unknown> | null;
                    if (meta?.event !== 'quote_submitted' || !meta?.quote_id) return null;
                    const quote = allQuotes?.find(q => q.id === meta.quote_id);
                    if (!quote) return null;
                    return (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] sm:max-w-[75%]">
                          <QuoteCard quote={quote} role={userRole === 'professional' ? 'pro' : 'client'} onAccepted={handleQuoteAccepted} />
                        </div>
                      </div>
                    );
                  })()}
                </React.Fragment>
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

      {/* Lifecycle bar */}
      {jobId && (
        <JobLifecycleBar
          jobId={jobId}
          jobStatus={jobStatus}
          userRole={userRole === 'professional' ? 'professional' : 'client'}
          messageCount={messages?.length ?? 0}
          hasQuote={hasQuote}
          onStartQuote={() => setIsQuoteBuilderOpen(true)}
          hidden={isQuoteBuilderOpen}
        />
      )}

      {/* Compose bar */}
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
          {/* Build Quote button — secondary, only when eligible */}
          {canQuote && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-10 w-10 rounded-full"
              onClick={() => setIsQuoteBuilderOpen(true)}
              title={t('thread.buildQuote')}
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          )}
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

      {/* Inline quote builder overlay */}
      {isQuoteBuilderOpen && jobId && (
        <InlineQuoteBuilder
          jobId={jobId}
          conversationId={conversationId}
          senderId={currentUserId}
          onClose={() => setIsQuoteBuilderOpen(false)}
        />
      )}
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
