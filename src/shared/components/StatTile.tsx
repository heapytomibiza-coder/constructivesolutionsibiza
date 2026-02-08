import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  isNew?: boolean;
  iconClassName?: string;
  className?: string;
}

export function StatTile({
  icon,
  label,
  value,
  isNew,
  iconClassName,
  className,
}: StatTileProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-sm flex items-center justify-center",
            iconClassName ?? "bg-primary/10"
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold">{value}</p>
            {isNew && (
              <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                New
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
