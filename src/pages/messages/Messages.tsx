import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { ConversationList } from "./ConversationList";
import { ConversationThread } from "./ConversationThread";
import { useConversations, useMarkConversationRead, type Conversation } from "./hooks";
import { PLATFORM } from "@/domain/scope";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";


/**
 * MESSAGES PAGE - Inbox + Thread View
 * 
 * Desktop: Split view with list on left, thread on right
 * Mobile: List view by default, full-screen thread when selected
 */

const Messages = () => {
  const { id: conversationId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, isLoading: sessionLoading, activeRole } = useSession();
  const isMobile = useIsMobile();
  const { markRead } = useMarkConversationRead();
  
  // Role-aware dashboard path
  const dashboardPath = activeRole === 'professional' ? '/dashboard/pro' : '/dashboard/client';

  // Fetch conversations to derive selectedConversation
  const { data: conversations } = useConversations(user?.id);

  // Derive selectedConversation from conversations list + URL
  const selectedConversation = useMemo(() => {
    if (!conversationId || !conversations) return null;
    return conversations.find((c) => c.id === conversationId) ?? null;
  }, [conversationId, conversations]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation && user) {
      markRead(selectedConversation.id, user.id, selectedConversation.client_id);
    }
  }, [selectedConversation?.id, user?.id, markRead]);

  // Handler to mark read when new messages arrive while thread is open
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

  // Auth loading state
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Should be protected by RouteGuard, but just in case
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view messages.</p>
      </div>
    );
  }

  const showThread = conversationId && (selectedConversation || !isMobile);
  const showList = !isMobile || !conversationId;

  // On mobile with active thread, go full-screen chat (hide nav + header)
  const mobileThread = isMobile && !!conversationId;

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Navigation — hidden on mobile when viewing a thread */}
      {!mobileThread && (
        <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
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
      )}

      <div className="flex-1 flex flex-col min-h-0">
        {/* Page Header */}
        <div className={cn("container py-3 border-b border-border bg-gradient-concrete", mobileThread && "hidden")}>
          <div className="flex items-center gap-2">
            <Link
              to={dashboardPath}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mt-2 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Messages
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Desktop: Two columns / Mobile: Conditional */}
          {!isMobile ? (
            <>
              {/* Sidebar - Conversation List */}
              <aside className="w-80 border-r border-border overflow-y-auto bg-card">
                <ConversationList
                  userId={user.id}
                  selectedId={conversationId}
                  onSelect={handleSelectConversation}
                />
              </aside>

              {/* Main - Thread */}
              <main className="flex-1 flex flex-col bg-background">
                {conversationId ? (
                  <ConversationThread
                    conversationId={conversationId}
                    currentUserId={user.id}
                    clientId={selectedConversation?.client_id}
                    jobId={selectedConversation?.job_id}
                    jobTitle={selectedConversation?.job_title}
                    onNewMessage={handleNewMessage}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="mx-auto h-14 w-14 rounded-sm bg-muted flex items-center justify-center mb-4">
                        <MessageSquare className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p>Select a conversation to view messages</p>
                    </div>
                  </div>
                )}
              </main>
            </>
          ) : (
            /* Mobile: Show list OR thread */
            showList && !showThread ? (
              <div className="flex-1 overflow-y-auto bg-card">
                <ConversationList
                  userId={user.id}
                  selectedId={conversationId}
                  onSelect={handleSelectConversation}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <ConversationThread
                  conversationId={conversationId!}
                  currentUserId={user.id}
                  clientId={selectedConversation?.client_id}
                  jobId={selectedConversation?.job_id}
                  jobTitle={selectedConversation?.job_title}
                  onBack={handleBack}
                  onNewMessage={handleNewMessage}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
