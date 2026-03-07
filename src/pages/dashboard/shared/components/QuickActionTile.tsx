import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

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
        'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border/60 bg-card',
        'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
        'hover:border-primary/25 transition-all duration-200',
        'active:scale-[0.98]',
        'min-h-[56px]'
      )}
    >
      <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground leading-snug">{label}</span>
          {badge != null && badge > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              {badge}
            </Badge>
          )}
        </div>
        {hint && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{hint}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
    </Link>
  );
}
