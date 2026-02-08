import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BadgeCheck, MessageSquare, Shield, Briefcase } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { supabase } from '@/integrations/supabase/client';
import { buildWizardLink } from '@/lib/wizardLink';

/**
 * PROFESSIONAL DETAILS PAGE
 * 
 * Public page - queries public_professional_details view only.
 * No authentication required for viewing.
 * Includes "Start Job" CTA for direct messaging flow.
 */

interface ProfessionalDetails {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  services_count: number | null;
  verification_status: string | null;
}

const ProfessionalDetails = () => {
  const { id } = useParams();

  // Fetch professional details
  const { data: professional, isLoading, error } = useQuery({
    queryKey: ['professional_details', id],
    enabled: !!id,
    queryFn: async (): Promise<ProfessionalDetails | null> => {
      // Get the professional profile with user_id for the Start Job link
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('id, user_id, display_name, avatar_url, bio, services_count, verification_status')
        .eq('id', id)
        .eq('is_publicly_listed', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data as ProfessionalDetails;
    },
  });

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-concrete bg-texture-concrete py-8">
        <div className="container">
          <Button variant="ghost" className="mb-4 gap-2" asChild>
            <Link to="/professionals">
              <ArrowLeft className="h-4 w-4" />
              Back to Professionals
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Verified professional profile</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
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
            <div>
              <Card className="card-grounded">
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : error || !professional ? (
          <Card className="border-dashed card-grounded">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Professional not found or no longer available.
              </p>
              <Button variant="outline" asChild>
                <Link to="/professionals">Browse Professionals</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="card-grounded">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={professional.avatar_url || undefined} alt={professional.display_name || 'Professional'} />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary rounded-sm">
                        {(professional.display_name || 'P').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="font-display text-2xl">
                          {professional.display_name || 'Professional'}
                        </CardTitle>
                        {professional.verification_status === 'verified' && (
                          <BadgeCheck className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {professional.services_count || 0} services offered
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {professional.bio ? (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        About
                      </h3>
                      <p className="text-foreground">{professional.bio}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      This professional hasn't added a bio yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="card-grounded">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Start Job - Direct messaging flow using centralized link builder */}
                  <Button className="w-full gap-2" asChild>
                    <Link to={buildWizardLink({ mode: 'direct', professionalId: professional.user_id })}>
                      <Briefcase className="h-4 w-4" />
                      Start a Job with {professional.display_name?.split(' ')[0] || 'them'}
                    </Link>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Create a job request and send it directly to this professional
                  </p>
                </CardContent>
              </Card>

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
