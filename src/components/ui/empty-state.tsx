import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="h-16 w-16 rounded-sm bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <p className="text-muted-foreground mb-4 max-w-sm">{message}</p>
      {action}
    </div>
  );
}
