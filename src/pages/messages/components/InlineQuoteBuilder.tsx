/**
 * InlineQuoteBuilder — Slide-up panel wrapper around ProposalBuilder.
 * Renders inside the conversation thread so pros can build quotes in-context.
 */

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProposalBuilder } from "@/pages/jobs/components/ProposalBuilder";

interface InlineQuoteBuilderProps {
  jobId: string;
  conversationId: string;
  senderId: string;
  onClose: () => void;
}

export function InlineQuoteBuilder({
  jobId,
  conversationId,
  senderId,
  onClose,
}: InlineQuoteBuilderProps) {
  const { t } = useTranslation("messages");
  const queryClient = useQueryClient();

  const handleSuccess = useCallback(async () => {
    // Insert a system message so the quote appears as a conversation event
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: t("thread.quoteSent", "sent a formal quote"),
      message_type: "system",
    });

    // Refresh messages + quotes
    queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    queryClient.invalidateQueries({ queryKey: ["quotes"] });

    onClose();
  }, [conversationId, senderId, queryClient, onClose, t]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background/95 backdrop-blur-sm animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground">
          {t("thread.buildQuote", "Build Quote")}
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable ProposalBuilder area */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <ProposalBuilder jobId={jobId} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
