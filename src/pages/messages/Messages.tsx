import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { ConversationList } from "./ConversationList";
import { ConversationThread } from "./ConversationThread";
import { useConversations, useMarkConversationRead, type Conversation } from "./hooks";
import { PLATFORM } from "@/domain/scope";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * MESSAGES PAGE - Inbox + Thread View
 * 
 * Desktop: Split view with list on left, thread on right
 * Mobile: List view by default, full-screen thread when selected
 */

const Messages = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user, isLoading: sessionLoading } = useSession();
  const isMobile = useIsMobile();
  const { markRead } = useMarkConversationRead();

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-ocean flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">CS</span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              {PLATFORM.shortName}
            </span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col">
        {/* Page Header */}
        <div className="container py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/client"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mt-2 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Messages
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
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
              <main className="flex-1 flex flex-col">
                {conversationId ? (
                  <ConversationThread
                    conversationId={conversationId}
                    currentUserId={user.id}
                    clientId={selectedConversation?.client_id}
                    jobTitle={selectedConversation?.job_title}
                    onNewMessage={handleNewMessage}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
              <div className="flex-1 flex flex-col">
                <ConversationThread
                  conversationId={conversationId!}
                  currentUserId={user.id}
                  clientId={selectedConversation?.client_id}
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
