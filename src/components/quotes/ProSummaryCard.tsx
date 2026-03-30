/**
 * ProSummaryCard — Compact professional info card for quote comparison and invites.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Star } from 'lucide-react';

interface ProSummaryCardProps {
  professionalId: string;
  compact?: boolean;
}

export function ProSummaryCard({ professionalId, compact = false }: ProSummaryCardProps) {
  const { data: profile } = useQuery({
    queryKey: ['pro_summary', professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('display_name, avatar_thumb_url, verification_status, trust_score')
        .eq('user_id', professionalId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: reviewStats } = useQuery({
    queryKey: ['pro_review_stats', professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_reviews')
        .select('rating')
        .eq('reviewee_user_id', professionalId)
        .eq('reviewee_role', 'professional');
      if (error) throw error;
      if (!data || data.length === 0) return { avgRating: null, count: 0 };
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      return { avgRating: Math.round(avg * 10) / 10, count: data.length };
    },
    enabled: !!professionalId,
    staleTime: 5 * 60 * 1000,
  });

  const name = profile?.display_name || 'Professional';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isVerified = profile?.verification_status === 'verified';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={profile?.avatar_thumb_url ?? undefined} alt={name} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate">{name}</span>
        {isVerified && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile?.avatar_thumb_url ?? undefined} alt={name} />
        <AvatarFallback className="text-sm">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate">{name}</span>
          {isVerified && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 shrink-0">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
        {reviewStats && reviewStats.count > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span>{reviewStats.avgRating}</span>
            <span>({reviewStats.count})</span>
          </div>
        )}
      </div>
    </div>
  );
}
