import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface QuickActionTileProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  badge?: number;
}

export function QuickActionTile({ to, icon: Icon, label, hint, badge }: QuickActionTileProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-card',
        'hover:border-primary/30 hover:bg-muted/30 transition-colors',
        'active:scale-[0.98] active:bg-muted/50',
        'min-h-[56px]'
      )}
    >
      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-foreground leading-tight">{label}</div>
          {badge != null && badge > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              {badge}
            </Badge>
          )}
        </div>
        {hint && (
          <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{hint}</div>
        )}
      </div>
    </Link>
  );
}
