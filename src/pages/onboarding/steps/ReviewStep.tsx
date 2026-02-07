/**
 * ReviewStep - Final review and Go Live step
 * Shows selected services and validates readiness
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
      toast.error('Please complete all required steps first');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('professional_profiles')
        .update({
          profile_status: 'live',
          onboarding_phase: 'complete',
          submitted_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refresh();
      toast.success("🎉 You're live! Start receiving job requests.");
      navigate('/dashboard/pro');
    } catch (error) {
      console.error('Error going live:', error);
      toast.error('Failed to go live. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-grounded">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg shadow-md',
              canGoLive ? 'bg-gradient-steel' : 'bg-muted'
            )}>
              <Rocket className={cn(
                'h-6 w-6',
                canGoLive ? 'text-white' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <CardTitle className="font-display text-2xl">
                {canGoLive ? 'Ready to go live!' : 'Almost there...'}
              </CardTitle>
              <CardDescription>
                {canGoLive 
                  ? 'Review your profile and start receiving job requests.'
                  : 'Complete the items below to go live.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Requirements checklist */}
      <Card className="card-grounded">
        <CardHeader>
          <CardTitle className="text-lg">Profile checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ChecklistItem
            icon={User}
            label="Basic information"
            description="Name and contact details"
            isComplete={hasBasicInfo && hasPhone}
          />
          <ChecklistItem
            icon={MapPin}
            label="Service area"
            description="Where you work in Ibiza"
            isComplete={hasServiceArea}
          />
          <ChecklistItem
            icon={Briefcase}
            label="Jobs selected"
            description={`${selectedMicroIds.size} job type${selectedMicroIds.size !== 1 ? 's' : ''} unlocked`}
            isComplete={hasServices}
          />
        </CardContent>
      </Card>

      {/* Selected services preview - reassurance, not admin */}
      {hasServices && (
        <Card className="card-grounded">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">We'll only send you jobs for:</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedServicesByCategory.map(category => (
                <div key={category.categoryName} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{category.categoryEmoji || '📦'}</span>
                      <span className="font-medium text-sm">{category.categoryName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.services.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-6">
                    {category.services.map(service => (
                      <span 
                        key={service.id} 
                        className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded"
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
              You can edit this anytime from your dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleGoLive}
          disabled={!canGoLive || isSubmitting}
          size="lg"
          className={cn(
            'gap-2 px-8',
            canGoLive && 'bg-gradient-steel hover:scale-105 transition-transform'
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Go Live
            </>
          )}
        </Button>
      </div>

      {!canGoLive && (
        <p className="text-center text-sm text-muted-foreground">
          Complete all checklist items to go live
        </p>
      )}
    </div>
  );
}

// Checklist item component
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
      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
      isComplete 
        ? 'bg-success/5 border-success/30' 
        : 'bg-muted/30 border-border'
    )}>
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full',
        isComplete ? 'bg-success/20' : 'bg-muted'
      )}>
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <p className={cn(
          'font-medium text-sm',
          isComplete ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {isComplete && (
        <Icon className="h-4 w-4 text-success" />
      )}
    </div>
  );
}
