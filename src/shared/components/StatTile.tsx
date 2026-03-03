import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  isNew?: boolean;
  iconClassName?: string;
  className?: string;
  onClick?: () => void;
}

export function StatTile({
  icon,
  label,
  value,
  isNew,
  iconClassName,
  className,
  onClick,
}: StatTileProps) {
  return (
    <Card
      className={cn(
        onClick && "cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center gap-2 sm:flex-row sm:text-left sm:gap-3">
        <div
          className={cn(
            "h-10 w-10 shrink-0 rounded-sm flex items-center justify-center",
            iconClassName ?? "bg-primary/10"
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 w-full">
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{label}</p>
          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <p className="text-lg sm:text-xl font-bold truncate">{value}</p>
            {isNew && (
              <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                New
              </Badge>
            )}
          </div>
        </div>
        {onClick && (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </CardContent>
    </Card>
  );
}
