/**
 * System message component - distinct visual treatment for automated messages
 */
import { Info } from "lucide-react";
import type { Message } from "../hooks/useMessages";

interface SystemMessageProps {
  message: Message;
}

export function SystemMessage({ message }: SystemMessageProps) {
  return (
    <div className="flex justify-center my-4">
      <div className="inline-flex items-center gap-2 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0" />
        <span>{message.body}</span>
      </div>
    </div>
  );
}
