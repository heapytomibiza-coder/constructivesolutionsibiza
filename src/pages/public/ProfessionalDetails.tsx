import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  BadgeCheck,
  MessageSquare,
  Shield,
  Briefcase,
  MapPin,
  Clock,
  Zap,
  Euro,
  Star,
} from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { supabase } from '@/integrations/supabase/client';
import { buildWizardLink } from '@/features/wizard/lib/wizardLink';
import { isRolloutActive } from '@/domain/rollout';
import { getZoneByIdSafe } from '@/shared/components/professional/zones';

/**
 * PROFESSIONAL DETAILS PAGE
 *
 * Public page — queries professional_profiles + specialisations.
 * No authentication required for viewing.
 */

interface ProfessionalProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  business_name: string | null;
  tagline: string | null;
  services_count: number | null;
  verification_status: string | null;
  service_zones: string[] | null;
  availability_status: string | null;
  typical_lead_time: string | null;
  accepts_emergency: boolean | null;
  pricing_model: string | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  day_rate: number | null;
  minimum_call_out: number | null;
}

interface Specialisation {
  micro_id: string;
  micro_name: string;
  preference: string;
}

// ─── Helpers ───────────────────────────────────────────────

const LEAD_TIME_LABELS: Record<string, string> = {
  same_day: 'Same day',
  next_day: 'Next day',
  same_week: 'This week',
  next_week: 'Next week',
  flexible: 'Flexible',
};

const AVAILABILITY_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' }> = {
  available: { label: 'Available', variant: 'success' },
  busy: { label: 'Busy', variant: 'warning' },
  unavailable: { label: 'Unavailable', variant: 'secondary' },
};

function formatPricing(pro: ProfessionalProfile): string {
  if (pro.pricing_model === 'quote_required' || (!pro.hourly_rate_min && !pro.day_rate)) {
    return 'Quote on request';
  }
  if (pro.hourly_rate_min && pro.hourly_rate_max && pro.hourly_rate_min !== pro.hourly_rate_max) {
    return `€${pro.hourly_rate_min}–€${pro.hourly_rate_max}/hr`;
  }
  if (pro.hourly_rate_min) {
    return `From €${pro.hourly_rate_min}/hr`;
  }
  if (pro.day_rate) {
    return `€${pro.day_rate}/day`;
  }
  return 'Quote on request';
}

// ─── Component ─────────────────────────────────────────────

const ProfessionalDetails = () => {
  const { id } = useParams();

  const { data: professional, isLoading, error } = useQuery({
    queryKey: ['professional_details', id],
    enabled: !!id,
    queryFn: async (): Promise<ProfessionalProfile | null> => {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select(
          'id, user_id, display_name, avatar_url, bio, business_name, tagline, services_count, verification_status, service_zones, availability_status, typical_lead_time, accepts_emergency, pricing_model, hourly_rate_min, hourly_rate_max, day_rate, minimum_call_out'
        )
        .eq('id', id!)
        .eq('is_publicly_listed', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as ProfessionalProfile;
    },
  });

  // Fetch specialisations (micro-category names via preferences)
  const { data: specialisations } = useQuery({
    queryKey: ['professional_specialisations', professional?.user_id],
    enabled: !!professional?.user_id,
    queryFn: async (): Promise<Specialisation[]> => {
      const { data, error } = await supabase
        .from('professional_micro_preferences')
        .select('micro_id, preference, service_micro_categories!inner(name)')
        .eq('user_id', professional!.user_id)
        .in('preference', ['preferred', 'available']);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        micro_id: row.micro_id,
        micro_name: row.service_micro_categories?.name ?? 'Service',
        preference: row.preference,
      }));
    },
  });

  // Resolve zone labels
  const zoneLabels = (professional?.service_zones || [])
    .map((zoneId) => getZoneByIdSafe(zoneId))
    .filter(Boolean)
    .map((z) => z!.label);

  const availability = AVAILABILITY_CONFIG[professional?.availability_status || 'available'] ?? AVAILABILITY_CONFIG.available;

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-concrete bg-texture-concrete py-8">
        <div className="container">
          <Button variant="ghost" className="mb-4 gap-2" asChild>
            <Link to="/professionals">
              <ArrowLeft className="h-4 w-4" />
              Back to Taskers
            </Link>
          </Button>

          {/* Hero card */}
          {!isLoading && professional && (
            <div className="flex items-start gap-5">
              <Avatar className="h-20 w-20 border-2 border-background shadow-md">
                <AvatarImage src={professional.avatar_url || undefined} alt={professional.display_name || 'Tasker'} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary rounded-sm">
                  {(professional.display_name || 'T').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    {professional.display_name || 'Tasker'}
                  </h1>
                  {professional.verification_status === 'verified' && (
                    <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  )}
                  <Badge variant={availability.variant} className="text-xs">
                    {availability.label}
                  </Badge>
                </div>
                {professional.business_name && (
                  <p className="text-sm text-muted-foreground">{professional.business_name}</p>
                )}
                {professional.tagline && (
                  <p className="text-sm text-foreground/80 mt-1">{professional.tagline}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>Verified Tasker profile</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          /* Loading skeleton */
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card className="card-grounded">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-20 w-20 rounded-sm" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="card-grounded">
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : error || !professional ? (
          /* Not found */
          <Card className="border-dashed card-grounded">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Tasker not found or no longer available.</p>
              <Button variant="outline" asChild>
                <Link to="/professionals">Browse Taskers</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Main content */
          <div className="grid gap-6 lg:grid-cols-3">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-5">
              {/* About */}
              <Card className="card-grounded">
                <CardHeader>
                  <CardTitle className="font-display text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  {professional.bio ? (
                    <p className="text-foreground leading-relaxed">{professional.bio}</p>
                  ) : (
                    <p className="text-muted-foreground">This Tasker hasn't added a bio yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Specialisations */}
              {specialisations && specialisations.length > 0 && (
                <Card className="card-grounded">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Specialisations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {specialisations.map((s) => (
                        <Badge
                          key={s.micro_id}
                          variant={s.preference === 'preferred' ? 'default' : 'outline'}
                        >
                          {s.micro_name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Service Area */}
              {zoneLabels.length > 0 && (
                <Card className="card-grounded">
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Service Area
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {zoneLabels.map((label) => (
                        <Badge key={label} variant="outline">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews — gated to trust-engine */}
              {isRolloutActive('trust-engine') ? (
                <Card className="card-grounded">
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">No reviews yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="card-grounded border-dashed">
                  <CardContent className="py-6 text-center">
                    <Star className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Reviews coming soon</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* Start a Job CTA */}
              <Card className="card-grounded">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full gap-2" asChild>
                    <Link to={buildWizardLink({ mode: 'direct', professionalId: professional.user_id })}>
                      <Briefcase className="h-4 w-4" />
                      Start a Job with {professional.display_name?.split(' ')[0] || 'them'}
                    </Link>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Create a job request and send it directly to this Tasker
                  </p>
                </CardContent>
              </Card>

              {/* Quick Facts */}
              <Card className="card-grounded">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Quick Facts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Lead time */}
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Lead time:</span>
                    <span className="font-medium ml-auto">
                      {LEAD_TIME_LABELS[professional.typical_lead_time || ''] || 'Flexible'}
                    </span>
                  </div>

                  {/* Emergency */}
                  {professional.accepts_emergency && (
                    <div className="flex items-center gap-3 text-sm">
                      <Zap className="h-4 w-4 text-warning shrink-0" />
                      <span className="text-muted-foreground">Emergency:</span>
                      <span className="font-medium ml-auto">Yes ⚡</span>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="flex items-center gap-3 text-sm">
                    <Euro className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Pricing:</span>
                    <span className="font-medium ml-auto">{formatPricing(professional)}</span>
                  </div>

                  {/* Services count */}
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Services:</span>
                    <span className="font-medium ml-auto">{professional.services_count || 0} offered</span>
                  </div>

                  {/* Min call-out */}
                  {professional.minimum_call_out && professional.minimum_call_out > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <Euro className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Min call-out:</span>
                      <span className="font-medium ml-auto">€{professional.minimum_call_out}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Message */}
              <Card className="card-grounded">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Quick Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full gap-2" disabled>
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Sign in required to send messages
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default ProfessionalDetails;
