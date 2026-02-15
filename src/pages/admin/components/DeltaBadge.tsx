import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DeltaBadgeProps {
  current: number;
  previous: number;
  suffix?: string;
}

export function DeltaBadge({ current, previous, suffix = "vs prior" }: DeltaBadgeProps) {
  if (previous === 0 && current === 0) {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Minus className="h-3 w-3" /> No data
      </Badge>
    );
  }

  const pctChange = previous === 0
    ? 100
    : Math.round(((current - previous) / previous) * 100);

  const isUp = pctChange > 0;
  const isDown = pctChange < 0;

  return (
    <Badge
      variant="outline"
      className={`text-xs gap-1 ${
        isUp ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
        isDown ? "text-red-600 border-red-200 bg-red-50" :
        ""
      }`}
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> :
       isDown ? <TrendingDown className="h-3 w-3" /> :
       <Minus className="h-3 w-3" />}
      {isUp ? "+" : ""}{pctChange}% {suffix}
    </Badge>
  );
}
