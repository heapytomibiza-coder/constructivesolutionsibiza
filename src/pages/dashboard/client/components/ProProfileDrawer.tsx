/**
 * ProProfileDrawer - Slide-over drawer showing professional profile
 * Used in Match & Send screen for viewing before inviting
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Star,
  MapPin,
  ShieldCheck,
  Send,
  UserCheck,
  Briefcase,
  Clock,
} from 'lucide-react';

interface ProProfileDrawerProps {
  proUserId: string | null;
  open: boolean;
  onClose: () => void;
  onInvite?: () => void;
  isInvited: boolean;
}

export default function ProProfileDrawer({
  proUserId,
  open,
  onClose,
  onInvite,
  isInvited,
}: ProProfileDrawerProps) {
  const { t } = useTranslation('dashboard');
  // Fetch professional profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['pro_profile_detail', proUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', proUserId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!proUserId && open,
  });

  // Fetch their services
  const { data: services = [] } = useQuery({
    queryKey: ['pro_services_detail', proUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_services')
        .select(`
          id,
          service_micro_categories:micro_id (name, slug)
        `)
        .eq('user_id', proUserId!)
        .eq('status', 'offered');
      if (error) throw error;
      return data || [];
    },
    enabled: !!proUserId && open,
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['pro_reviews', proUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_reviews')
        .select('rating, comment, reviewer_role, created_at')
        .eq('reviewee_user_id', proUserId!)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!proUserId && open,
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display">{t('proProfile.title')}</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || ''}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <Briefcase className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {profile.display_name || t('proProfile.professional')}
                </h3>
                {profile.tagline && (
                  <p className="text-sm text-muted-foreground">{profile.tagline}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {profile.verification_status === 'verified' && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <ShieldCheck className="h-3 w-3" />
                      {t('proProfile.verified')}
                    </Badge>
                  )}
                  {avgRating && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      {avgRating.toFixed(1)} ({reviews.length})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <section>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">About</h4>
                <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
              </section>
            )}

            {/* Services */}
            {services.length > 0 && (
              <section>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Services ({services.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s) => {
                    const micro = s.service_micro_categories as { name: string; slug: string } | null;
                    return micro ? (
                      <Badge key={s.id} variant="secondary" className="text-xs">
                        {micro.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </section>
            )}

            {/* Service Area */}
            {(profile.service_zones?.length || profile.service_area_type) && (
              <section>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Areas Covered</h4>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">
                    {profile.service_zones?.length
                      ? profile.service_zones.join(', ')
                      : profile.service_area_type === 'island_wide'
                        ? 'Island-wide'
                        : 'Ibiza'}
                  </p>
                </div>
              </section>
            )}

            {/* Availability */}
            {profile.typical_lead_time && (
              <section className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Typical lead time: {profile.typical_lead_time.replace('_', ' ')}</span>
              </section>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <section>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Reviews ({reviews.length})
                </h4>
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            className={`h-3.5 w-3.5 ${si < r.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      {r.comment && (
                        <p className="text-sm text-foreground">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Invite CTA */}
            <div className="pt-4 border-t border-border">
              {isInvited ? (
                <Button className="w-full gap-2" variant="secondary" disabled>
                  <UserCheck className="h-4 w-4" />
                  Already Invited
                </Button>
              ) : onInvite ? (
                <Button className="w-full gap-2" onClick={onInvite}>
                  <Send className="h-4 w-4" />
                  Invite with this job
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Profile not found.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}