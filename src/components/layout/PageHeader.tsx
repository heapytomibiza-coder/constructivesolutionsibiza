import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  trustBadge?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  trustBadge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("border-b border-border bg-gradient-concrete", className)}>
      <div className="container py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold tracking-display text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
            {trustBadge && (
              <div className="mt-2">
                {trustBadge}
              </div>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}
