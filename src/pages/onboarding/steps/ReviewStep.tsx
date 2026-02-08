/**
 * ReviewStep - Final review and Go Live step
 * Builder-friendly: Clear checklist, encouraging language
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, CheckCircle2, Rocket, Loader2, 
  User, MapPin, Briefcase, AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useServiceTaxonomy } from '../hooks/useServiceTaxonomy';
import { useProfessionalServices } from '../hooks/useProfessionalServices';

interface ReviewStepProps {
  onBack: () => void;
}

export function ReviewStep({ onBack }: ReviewStepProps) {
  const navigate = useNavigate();
  const { user, professionalProfile, refresh } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [] } = useServiceTaxonomy();
  const { selectedMicroIds } = useProfessionalServices();

  // Validation checks
  const hasBasicInfo = !!(
    professionalProfile?.displayName?.trim() || 
    professionalProfile?.businessName?.trim()
  );
  const hasPhone = !!professionalProfile?.phone?.trim();
  const hasServiceArea = (professionalProfile?.serviceZones?.length || 0) > 0;
  const hasServices = selectedMicroIds.size > 0;

  const canGoLive = hasBasicInfo && hasPhone && hasServiceArea && hasServices;

  // Get selected service names grouped by category
  const selectedServicesByCategory = categories.map(category => {
    const selectedMicros = category.subcategories
      .flatMap(sub => sub.micros)
      .filter(m => selectedMicroIds.has(m.id));
    
    return {
      categoryName: category.name,
      categoryEmoji: category.icon_emoji,
      services: selectedMicros,
    };
  }).filter(c => c.services.length > 0);

  const handleGoLive = async () => {
    if (!canGoLive || !user?.id) {
      toast.error('Please complete all steps first');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('professional_profiles')
        .update({
          profile_status: 'live',
          onboarding_phase: 'complete',
          is_publicly_listed: true, // Make professional visible in directory
          submitted_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refresh();
      toast.success("🎉 You're live! Time to start receiving work.");
      navigate('/dashboard/pro');
    } catch (error) {
      console.error('Error going live:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-grounded">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex h-16 w-16 items-center justify-center rounded-xl shadow-md',
              canGoLive ? 'bg-gradient-steel' : 'bg-muted'
            )}>
              <Rocket className={cn(
                'h-8 w-8',
                canGoLive ? 'text-white' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {canGoLive ? "You're ready to go live!" : 'Almost there...'}
              </CardTitle>
              <CardDescription className="text-base">
                {canGoLive 
                  ? 'Check everything looks good, then hit the button.'
                  : 'Complete the items below to go live.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Requirements checklist */}
      <Card className="card-grounded">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Your profile checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChecklistItem
            icon={User}
            label="About you"
            description="Name and contact details"
            isComplete={hasBasicInfo && hasPhone}
          />
          <ChecklistItem
            icon={MapPin}
            label="Where you work"
            description="Areas of Ibiza"
            isComplete={hasServiceArea}
          />
          <ChecklistItem
            icon={Briefcase}
            label="Jobs selected"
            description={`${selectedMicroIds.size} job type${selectedMicroIds.size !== 1 ? 's' : ''} picked`}
            isComplete={hasServices}
          />
        </CardContent>
      </Card>

      {/* Selected services preview */}
      {hasServices && (
        <Card className="card-grounded">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">We'll only send you jobs for:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {selectedServicesByCategory.map(category => (
                <div key={category.categoryName}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{category.categoryEmoji || '📦'}</span>
                    <span className="font-semibold text-base">{category.categoryName}</span>
                    <Badge variant="secondary" className="text-sm">
                      {category.services.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-8">
                    {category.services.map(service => (
                      <span 
                        key={service.id} 
                        className="text-sm text-foreground bg-muted/60 px-3 py-1.5 rounded-lg"
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-6 pt-4 border-t border-border">
              You can change this anytime from your dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Go Back
        </Button>

        <Button
          type="button"
          onClick={handleGoLive}
          disabled={!canGoLive || isSubmitting}
          size="lg"
          className={cn(
            'gap-3 px-10',
            canGoLive && 'bg-gradient-steel'
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Rocket className="h-5 w-5" />
              Go Live
            </>
          )}
        </Button>
      </div>

      {!canGoLive && (
        <p className="text-center text-base text-muted-foreground">
          Complete all checklist items to go live
        </p>
      )}
    </div>
  );
}

// Checklist item component - Larger, clearer
function ChecklistItem({ 
  icon: Icon, 
  label, 
  description, 
  isComplete 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  isComplete: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-xl border-2 transition-colors',
      isComplete 
        ? 'bg-primary/10 border-primary/40' 
        : 'bg-muted/30 border-border'
    )}>
      <div className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full shrink-0',
        isComplete ? 'bg-primary/20' : 'bg-muted'
      )}>
        {isComplete ? (
          <CheckCircle2 className="h-6 w-6 text-primary" />
        ) : (
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <p className={cn(
          'font-semibold text-base',
          isComplete ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {label}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {isComplete && (
        <Icon className="h-5 w-5 text-primary shrink-0" />
      )}
    </div>
  );
}
