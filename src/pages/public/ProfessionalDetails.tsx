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
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { supabase } from '@/integrations/supabase/client';
import { buildWizardLink } from '@/features/wizard/lib/wizardLink';
import { isRolloutActive } from '@/domain/rollout';
import { getZoneByIdSafe } from '@/shared/components/professional/zones';

/* ─── Types ────────────────────────────────────────────────── */

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

interface ServiceListing {
  id: string;
  display_title: string | null;
  short_description: string | null;
  hero_image_url: string | null;
  pricing_summary: string | null;
  location_base: string | null;
  category_name: string | null;
}

/* ─── Helpers ──────────────────────────────────────────────── */

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

/* ─── Sub-components ───────────────────────────────────────── */

function ServiceCard({ listing }: { listing: ServiceListing }) {
  return (
    <Link to={`/services/listing/${listing.id}`} className="group block">
      <Card className="card-grounded overflow-hidden transition-shadow hover:shadow-md">
        {/* 4:3 image */}
        <div className="relative aspect-[4/3] bg-muted">
          {listing.hero_image_url ? (
            <img
              src={listing.hero_image_url}
              alt={listing.display_title || 'Service'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-1.5">
          <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {listing.display_title || 'Service'}
          </h3>
          {listing.short_description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{listing.short_description}</p>
          )}
          <div className="flex items-center justify-between pt-1">
            {listing.pricing_summary ? (
              <span className="text-xs font-medium text-foreground">{listing.pricing_summary}</span>
            ) : (
              <span className="text-xs text-muted-foreground">Quote on request</span>
            )}
            <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              View <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickFactRow({ icon: Icon, label, value, iconClassName }: { icon: typeof Clock; label: string; value: string; iconClassName?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className={`h-4 w-4 shrink-0 ${iconClassName || 'text-muted-foreground'}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium ml-auto text-right">{value}</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card className="card-grounded">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Skeleton className="h-24 w-24 rounded-sm" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="card-grounded">
          <CardContent className="pt-6">
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
  );
}

function NotFoundState() {
  return (
    <Card className="border-dashed card-grounded">
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground mb-4">Tasker not found or no longer available.</p>
        <Button variant="outline" asChild>
          <Link to="/professionals">Browse Taskers</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ───────────────────────────────────────── */

const ProfessionalDetails = () => {
  const { id } = useParams();

  /* ── Professional profile query ── */
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

  /* ── Specialisations query ── */
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

  /* ── Live service listings query ── */
  const { data: listings } = useQuery({
    queryKey: ['professional_listings', professional?.user_id],
    enabled: !!professional?.user_id && isRolloutActive('service-layer'),
    queryFn: async (): Promise<ServiceListing[]> => {
      const { data, error } = await supabase
        .from('service_listings_browse')
        .select('id, display_title, short_description, hero_image_url, pricing_summary, location_base, category_name')
        .eq('provider_id', professional!.user_id)
        .limit(6);

      if (error) throw error;
      return (data || []) as ServiceListing[];
    },
  });

  /* ── Derived values ── */
  const zoneLabels = (professional?.service_zones || [])
    .map((zoneId) => getZoneByIdSafe(zoneId))
    .filter(Boolean)
    .map((z) => z!.label);

  const availability = AVAILABILITY_CONFIG[professional?.availability_status || 'available'] ?? AVAILABILITY_CONFIG.available;
  const firstName = professional?.display_name?.split(' ')[0] || 'them';
  const hasListings = listings && listings.length > 0;

  return (
    <PublicLayout>
      {/* ── Hero Section ── */}
      <div className="border-b border-border bg-gradient-concrete bg-texture-concrete py-8">
        <div className="container">
          <Button variant="ghost" className="mb-4 gap-2" asChild>
            <Link to="/professionals">
              <ArrowLeft className="h-4 w-4" />
              Back to Taskers
            </Link>
          </Button>

          {!isLoading && professional && (
            <div className="flex items-start gap-5">
              <Avatar className="h-24 w-24 border-2 border-background shadow-md">
                <AvatarImage src={professional.avatar_url || undefined} alt={professional.display_name || 'Tasker'} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary rounded-sm">
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
                  <p className="text-sm font-medium text-muted-foreground">{professional.business_name}</p>
                )}
                {professional.tagline && (
                  <p className="text-sm text-foreground/80 mt-1">{professional.tagline}</p>
                )}

                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {professional.verification_status === 'verified' && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span>Verified Tasker profile</span>
                    </div>
                  )}
                  {professional.accepts_emergency && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Zap className="h-3.5 w-3.5 text-warning" />
                      <span>Emergency callouts</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container py-8">
        {isLoading ? (
          <ProfileSkeleton />
        ) : error || !professional ? (
          <NotFoundState />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ═══ LEFT COLUMN ═══ */}
            <div className="lg:col-span-2 space-y-5">

              {/* 1. Live Services */}
              {hasListings && isRolloutActive('service-layer') && (
                <Card className="card-grounded">
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {listings!.map((l) => (
                        <ServiceCard key={l.id} listing={l} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 2. About */}
              <Card className="card-grounded">
                <CardHeader>
                  <CardTitle className="font-display text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  {professional.bio ? (
                    <p className="text-foreground leading-relaxed whitespace-pre-line">{professional.bio}</p>
                  ) : (
                    <p className="text-muted-foreground">This Tasker hasn't added a bio yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* 3. Specialisations */}
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

              {/* 4. Service Area */}
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

              {/* 5. Reviews */}
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
                    <p className="text-sm text-muted-foreground">
                      Client reviews will appear here as the trust system rolls out.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ═══ RIGHT COLUMN — Sticky Sidebar ═══ */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

              {/* Start a Job CTA */}
              <Card className="card-grounded">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full gap-2" asChild>
                    <Link to={buildWizardLink({ mode: 'direct', professionalId: professional.user_id })}>
                      <Briefcase className="h-4 w-4" />
                      Start a Job with {firstName}
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
                  <QuickFactRow
                    icon={Clock}
                    label="Lead time:"
                    value={LEAD_TIME_LABELS[professional.typical_lead_time || ''] || 'Flexible'}
                  />

                  {professional.accepts_emergency && (
                    <QuickFactRow
                      icon={Zap}
                      label="Emergency:"
                      value="Yes ⚡"
                      iconClassName="text-warning"
                    />
                  )}

                  <QuickFactRow
                    icon={Euro}
                    label="Pricing:"
                    value={formatPricing(professional)}
                  />

                  <QuickFactRow
                    icon={Briefcase}
                    label="Services:"
                    value={`${professional.services_count || 0} offered`}
                  />

                  {professional.minimum_call_out && professional.minimum_call_out > 0 && (
                    <QuickFactRow
                      icon={Euro}
                      label="Min call-out:"
                      value={`€${professional.minimum_call_out}`}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Quick Message — hidden on mobile */}
              <Card className="card-grounded hidden lg:block">
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

      {/* ── Mobile Sticky Bottom CTA ── */}
      {!isLoading && professional && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm p-3 lg:hidden">
          <Button className="w-full gap-2" asChild>
            <Link to={buildWizardLink({ mode: 'direct', professionalId: professional.user_id })}>
              <Briefcase className="h-4 w-4" />
              Start a Job with {firstName}
            </Link>
          </Button>
        </div>
      )}
    </PublicLayout>
  );
};

export default ProfessionalDetails;
