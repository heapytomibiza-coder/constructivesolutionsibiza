import { useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "@/contexts/SessionContext";
import { ConversationList } from "./ConversationList";
import { ConversationThread } from "./ConversationThread";
import { useConversations, useConversationById, useMarkConversationRead, type Conversation } from "./hooks";
import { PLATFORM } from "@/domain/scope";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { LaneHeader } from "@/shared/components/layout/LaneHeader";

/**
 * MESSAGES PAGE
 *
 * Mobile:  Two separate screens — list OR thread (WhatsApp-style).
 * Desktop: Side-by-side split view.
 */

const Messages = () => {
  const { id: conversationId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('messages');
  const { user, isLoading: sessionLoading, activeRole } = useSession();
  const isMobile = useIsMobile();
  const { markRead } = useMarkConversationRead();

  const dashboardPath = activeRole === "professional" ? "/dashboard/pro" : "/dashboard/client";

  const { data: conversations } = useConversations(user?.id);

  const selectedConversation = useMemo(() => {
    if (!conversationId || !conversations) return null;
    return conversations.find((c) => c.id === conversationId) ?? null;
  }, [conversationId, conversations]);

  useEffect(() => {
    if (selectedConversation && user) {
      markRead(selectedConversation.id, user.id, selectedConversation.client_id);
    }
  }, [selectedConversation?.id, user?.id, markRead]);

  const handleNewMessage = () => {
    if (selectedConversation && user) {
      markRead(selectedConversation.id, user.id, selectedConversation.client_id);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    navigate(`/messages/${conv.id}`);
  };

  const handleBack = () => {
    navigate("/messages");
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('signInRequired')}</p>
      </div>
    );
  }

  // Guard: conversation ID provided but not found after data loads
  const conversationsLoaded = !!conversations;
  const conversationNotFound = conversationId && conversationsLoaded && !selectedConversation;

  if (conversationNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{t('conversationNotFound', 'Conversation not found')}</p>
          <button
            onClick={() => navigate('/messages')}
            className="text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-2 flex items-center gap-1 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToMessages', 'Back to messages')}
          </button>
        </div>
      </div>
    );
  }

  // Mobile: full-screen thread
  if (isMobile && conversationId) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col overflow-hidden z-50">
        <ConversationThread
          conversationId={conversationId}
          currentUserId={user.id}
          clientId={selectedConversation?.client_id}
          proId={selectedConversation?.pro_id}
          jobId={selectedConversation?.job_id}
          jobTitle={selectedConversation?.job_title}
          jobStatus={selectedConversation?.job_status}
          otherPartyName={selectedConversation?.other_party_name}
          onBack={handleBack}
          onNewMessage={handleNewMessage}
        />
      </div>
    );
  }

  // Mobile: conversation list
  if (isMobile) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
        <LaneHeader />
        <nav className="border-b border-border bg-card shrink-0">
          <div className="px-4 flex h-14 items-center gap-3">
            <Link to={dashboardPath} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {t('title')}
            </h1>
          </div>
        </nav>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            userId={user.id}
            selectedId={conversationId}
            onSelect={handleSelectConversation}
          />
        </div>
      </div>
    );
  }

  // Desktop: split view
  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <LaneHeader />
      <nav className="border-b border-border bg-card/90 backdrop-blur-md shrink-0">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-sm bg-gradient-steel flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display font-bold text-xs">CS</span>
            </div>
            <span className="font-display text-lg font-semibold text-foreground">
              {PLATFORM.shortName}
            </span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="container py-3 border-b border-border bg-gradient-concrete shrink-0">
          <div className="flex items-center gap-2">
            <Link
              to={dashboardPath}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('dashboard')}
            </Link>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mt-2 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            {t('title')}
          </h1>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <aside className="w-80 border-r border-border overflow-y-auto bg-card">
            <ConversationList
              userId={user.id}
              selectedId={conversationId}
              onSelect={handleSelectConversation}
            />
          </aside>

          <main className="flex-1 flex flex-col bg-background">
            {conversationId ? (
              <ConversationThread
                conversationId={conversationId}
                currentUserId={user.id}
                clientId={selectedConversation?.client_id}
                proId={selectedConversation?.pro_id}
                jobId={selectedConversation?.job_id}
                jobTitle={selectedConversation?.job_title}
                jobStatus={selectedConversation?.job_status}
                otherPartyName={selectedConversation?.other_party_name}
                onNewMessage={handleNewMessage}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="mx-auto h-14 w-14 rounded-sm bg-muted flex items-center justify-center mb-4">
                    <MessageSquare className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p>{t('selectConversation')}</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Messages;
