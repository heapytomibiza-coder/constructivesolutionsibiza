import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSession } from '@/contexts/SessionContext';
import { CheckCircle2, ArrowRight, ArrowLeft, User, MapPin, Briefcase, Rocket } from 'lucide-react';
import { PLATFORM } from '@/domain/scope';
import { trackEvent } from '@/lib/trackEvent';
import { BasicInfoStep, ServiceAreaStep, ServiceUnlockStep, ReviewStep } from './steps';
import { cn } from '@/lib/utils';

type WizardStep = 'tracker' | 'basic_info' | 'service_area' | 'services' | 'review';

interface StepConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepConfig[] = [
  { id: 'basic_info', label: 'About You', description: 'Your name and contact details', icon: User },
  { id: 'service_area', label: 'Where You Work', description: 'Which areas of Ibiza', icon: MapPin },
  { id: 'services', label: 'The Work You Do', description: 'Jobs you want to receive', icon: Briefcase },
  { id: 'review', label: 'All Done!', description: 'Check and go live', icon: Rocket },
];

/**
 * PROFESSIONAL ONBOARDING WIZARD
 * 
 * Builder-friendly multi-step onboarding.
 * Warm, conversational language. Large touch targets.
 */
const ProfessionalOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const editMode = params.get('edit') === '1';
  const stepParam = params.get('step') as WizardStep | null;

  const { professionalProfile, isLoading } = useSession();
  const [currentStep, setCurrentStep] = useState<WizardStep>('tracker');

  // Determine completed steps based on onboarding phase
  const phase = professionalProfile?.onboardingPhase || 'not_started';
  
  type StepStatus = "complete" | "current" | "pending";
  const stepOrder = ["basic_info", "service_area", "services", "review"] as const;
  type StepId = (typeof stepOrder)[number];

  /**
   * Returns status for a step based on onboarding phase.
   *
   * Rules:
   * - not_started => basic_info is current
   * - otherwise current step is derived from phase
   * - steps before current are complete, after are pending
   */
  const getStepStatus = (stepId: StepId): StepStatus => {
    // Defensive: normalize phase just in case it comes back null/undefined
    const p = (phase ?? "not_started") as string;

    /**
     * Map a stored onboarding phase to "what step should be current now"
     * This is a "phase -> current step" mapping (not "phase -> completed step").
     */
    const phaseToCurrentStep: Record<string, StepId | "done"> = {
      // start state
      not_started: "basic_info",

      // MVP phases (matching step completion)
      basic_info: "service_area",
      service_area: "services",
      services: "review",
      review: "done",
      complete: "done",

      // Backwards-compatible aliases (if older names exist in DB)
      verification: "services",
      service_setup: "review",
    };

    const currentStepId = phaseToCurrentStep[p] ?? "basic_info";

    if (currentStepId === "done") return "complete";

    const stepIndex = stepOrder.indexOf(stepId);
    const currentIndex = stepOrder.indexOf(currentStepId);

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const completedSteps = STEPS.filter(s => getStepStatus(s.id as StepId) === 'complete').length;
  const progress = phase === 'complete' || phase === 'service_setup' 
    ? 100 
    : ((completedSteps + 1) / STEPS.length) * 100;

  const handleStepClick = (stepId: string) => {
    if (editMode) {
      setCurrentStep(stepId as WizardStep);
      trackEvent('pro_onboarding_step_entered', 'professional', { step: stepId, edit_mode: true });
      return;
    }
    const status = getStepStatus(stepId as StepId);
    if (status === 'complete' || status === 'current') {
      setCurrentStep(stepId as WizardStep);
      trackEvent('pro_onboarding_step_entered', 'professional', { step: stepId });
    }
  };

  // Only redirect completed users when NOT in edit mode
  useEffect(() => {
    if (phase === 'complete' && !editMode) {
      navigate('/dashboard/pro');
    }
  }, [phase, editMode, navigate]);

  // Deep-link to a step (edit mode or first visit)
  useEffect(() => {
    if (!stepParam) return;
    const allowed: WizardStep[] = ['basic_info', 'service_area', 'services', 'review', 'tracker'];
    if (allowed.includes(stepParam)) {
      setCurrentStep(stepParam);
    }
  }, [stepParam]);

  const handleBasicInfoComplete = () => {
    trackEvent('pro_onboarding_started', 'professional', { step: 'basic_info' });
    trackEvent('pro_onboarding_step_entered', 'professional', { step: 'service_area' });
    setCurrentStep('service_area');
  };

  const handleServiceAreaComplete = () => {
    trackEvent('pro_onboarding_step_completed', 'professional', { step: 'service_area' });
    trackEvent('pro_onboarding_step_entered', 'professional', { step: 'services' });
    setCurrentStep('services');
  };

  const handleServicesComplete = () => {
    trackEvent('pro_onboarding_step_completed', 'professional', { step: 'services' });
    trackEvent('pro_onboarding_step_entered', 'professional', { step: 'review' });
    setCurrentStep('review');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation - Friendlier */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container flex h-18 items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-steel shadow-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-base">
                {PLATFORM.mark}
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-semibold text-foreground">
                {PLATFORM.shortName}
              </span>
            </div>
          </Link>
          {editMode && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/pro')}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
          )}
          {currentStep !== 'tracker' && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep('tracker')}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Overview
            </Button>
          )}
        </div>
      </nav>

      <div className="container py-10 sm:py-14">
        <div className="mx-auto max-w-xl">
          {/* Header - Warm, friendly */}
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {editMode
                ? 'Edit your professional profile'
                : currentStep === 'tracker' ? "Let's get you started" : 
                  currentStep === 'basic_info' ? 'Step 1: About You' :
                  currentStep === 'service_area' ? 'Step 2: Where You Work' :
                  currentStep === 'services' ? 'Step 3: The Work You Do' :
                  'Step 4: All Done!'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {editMode
                ? 'Jump to any step and update your details.'
                : currentStep === 'tracker' 
                  ? "Just a few quick steps and you'll be ready to receive work."
                  : 'Complete this step to continue.'}
            </p>
          </div>

          {/* Progress Card - Encouraging */}
          <Card className="mb-8 card-grounded animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  You're doing great!
                </CardTitle>
                <span className="text-base font-semibold text-primary">
                  {completedSteps} of {STEPS.length} done
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-3" />
              {/* Step indicators */}
              <div className="flex justify-between mt-3">
                {STEPS.map((step, index) => {
                const status = getStepStatus(step.id as StepId);
                  return (
                    <div 
                      key={step.id}
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                        status === 'complete' && 'bg-primary text-primary-foreground',
                        status === 'current' && 'bg-primary/20 text-primary border-2 border-primary',
                        status === 'pending' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {status === 'complete' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Content based on current step */}
          {currentStep === 'tracker' ? (
            <div className="space-y-4">
              {STEPS.map((step, index) => {
                const status = getStepStatus(step.id as StepId);
                const isComplete = status === 'complete';
                const isCurrent = status === 'current';
                const canClick = editMode ? true : isComplete || isCurrent;
                const Icon = step.icon;

                return (
                  <Card 
                    key={step.id}
                    className={cn(
                      'card-grounded transition-all duration-300',
                      'animate-fade-in',
                      isCurrent && 'border-primary/60 ring-2 ring-primary/20 shadow-lg',
                      canClick && 'cursor-pointer hover:border-primary/50',
                      !canClick && 'opacity-50'
                    )}
                    style={{ animationDelay: `${index * 80}ms` }}
                    onClick={() => canClick && handleStepClick(step.id)}
                  >
                    <CardContent className="flex items-center justify-between py-5 px-5">
                      <div className="flex items-center gap-4">
                        {/* Step number/icon - Larger */}
                        <div className={cn(
                          'flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold',
                          isComplete && 'bg-primary/15 text-primary',
                          isCurrent && 'bg-gradient-steel text-white shadow-md',
                          !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                        )}>
                          {isComplete ? (
                            <CheckCircle2 className="h-7 w-7" />
                          ) : isCurrent ? (
                            <Icon className="h-7 w-7" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            {step.label}
                          </p>
                          <p className="text-base text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {canClick && (
                        <Button 
                          variant={isCurrent ? 'default' : 'outline'} 
                          size="default"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStepClick(step.id);
                          }}
                        >
                          {editMode ? 'Edit' : isComplete ? 'Edit' : 'Start'}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Reassurance message */}
              <p className="text-center text-base text-muted-foreground pt-4">
                Trusted by builders across Ibiza
              </p>
            </div>
          ) : currentStep === 'basic_info' ? (
            <BasicInfoStep onComplete={handleBasicInfoComplete} />
          ) : currentStep === 'service_area' ? (
            <ServiceAreaStep 
              onComplete={handleServiceAreaComplete} 
              onBack={() => setCurrentStep('basic_info')}
            />
          ) : currentStep === 'services' ? (
            <ServiceUnlockStep
              onComplete={handleServicesComplete}
              onBack={() => setCurrentStep('service_area')}
              editMode={editMode}
            />
          ) : currentStep === 'review' ? (
            <ReviewStep
              onBack={() => setCurrentStep('services')}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalOnboarding;
