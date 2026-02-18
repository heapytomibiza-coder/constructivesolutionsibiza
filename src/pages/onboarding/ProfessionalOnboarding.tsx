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
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepConfig[] = [
  { id: 'basic_info', label: 'About You', icon: User },
  { id: 'service_area', label: 'Where You Work', icon: MapPin },
  { id: 'services', label: 'The Work You Do', icon: Briefcase },
  { id: 'review', label: 'Go Live', icon: Rocket },
];

/**
 * PROFESSIONAL ONBOARDING WIZARD
 * 
 * Simple linear 4-step flow for first-time onboarding.
 * Edit mode shows a tracker overview for jumping between steps.
 */
const ProfessionalOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const editMode = params.get('edit') === '1';
  const stepParam = params.get('step') as WizardStep | null;

  const { professionalProfile, isLoading } = useSession();
  const phase = professionalProfile?.onboardingPhase || 'not_started';

  // Determine the starting step based on phase
  const phaseToStep: Record<string, WizardStep> = {
    not_started: 'basic_info',
    basic_info: 'service_area',
    service_area: 'services',
    services: 'review',
    service_setup: 'review',
    verification: 'services',
    review: 'review',
    complete: 'review',
  };

  const initialStep: WizardStep = editMode ? 'tracker' : (phaseToStep[phase] ?? 'basic_info');
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep);

  // Current step index (0-based) for progress display
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / STEPS.length) * 100 : 25;

  // Only redirect completed users when NOT in edit mode
  useEffect(() => {
    if (phase === 'complete' && !editMode) {
      navigate('/dashboard/pro');
    }
  }, [phase, editMode, navigate]);

  // Deep-link to a step
  useEffect(() => {
    if (!stepParam) return;
    const allowed: WizardStep[] = ['basic_info', 'service_area', 'services', 'review', 'tracker'];
    if (allowed.includes(stepParam)) {
      setCurrentStep(stepParam);
    }
  }, [stepParam]);

  // Update step when phase changes (e.g. after save + refresh)
  useEffect(() => {
    if (editMode) return;
    const nextStep = phaseToStep[phase] ?? 'basic_info';
    // Only auto-advance if we're behind
    const stepOrder: WizardStep[] = ['basic_info', 'service_area', 'services', 'review'];
    const currentIdx = stepOrder.indexOf(currentStep);
    const nextIdx = stepOrder.indexOf(nextStep);
    if (nextIdx > currentIdx) {
      setCurrentStep(nextStep);
    }
  }, [phase, editMode]);

  // Step completion handlers - always advance to next step
  const handleBasicInfoComplete = () => {
    trackEvent('pro_onboarding_started', 'professional', { step: 'basic_info' });
    if (editMode) { setCurrentStep('tracker'); return; }
    setCurrentStep('service_area');
  };

  const handleServiceAreaComplete = () => {
    trackEvent('pro_onboarding_step_completed', 'professional', { step: 'service_area' });
    if (editMode) { setCurrentStep('tracker'); return; }
    setCurrentStep('services');
  };

  const handleServicesComplete = () => {
    trackEvent('pro_onboarding_step_completed', 'professional', { step: 'services' });
    if (editMode) { setCurrentStep('tracker'); return; }
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
      {/* Navigation */}
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
          {editMode && currentStep !== 'tracker' && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep('tracker')}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Overview
            </Button>
          )}
        </div>
      </nav>

      <div className="container py-10 sm:py-14">
        <div className="mx-auto max-w-xl">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {editMode
                ? 'Edit your professional profile'
                : currentStep === 'tracker' ? "Let's get you started" :
                  currentStep === 'basic_info' ? 'Step 1: About You' :
                  currentStep === 'service_area' ? 'Step 2: Where You Work' :
                  currentStep === 'services' ? 'Step 3: The Work You Do' :
                  'Step 4: Go Live!'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {editMode
                ? 'Jump to any step and update your details.'
                : currentStep === 'tracker' 
                  ? "Just a few quick steps and you'll be ready to receive work."
                  : `Step ${currentStepIndex + 1} of ${STEPS.length}`}
            </p>
          </div>

          {/* Step progress indicator - shown during linear flow (not tracker) */}
          {currentStep !== 'tracker' && (
            <div className="mb-8 animate-fade-in">
              <div className="flex justify-between mb-3">
                {STEPS.map((step, index) => {
                  const isComplete = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-1.5">
                      <div className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-colors',
                        isComplete && 'bg-primary text-primary-foreground',
                        isCurrent && 'bg-primary/20 text-primary border-2 border-primary',
                        !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                      )}>
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className={cn(
                        'text-xs font-medium hidden sm:block',
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Content based on current step */}
          {currentStep === 'tracker' ? (
            <TrackerView
              steps={STEPS}
              phase={phase}
              editMode={editMode}
              onStepClick={(stepId) => {
                setCurrentStep(stepId as WizardStep);
                trackEvent('pro_onboarding_step_entered', 'professional', { step: stepId, edit_mode: editMode });
              }}
            />
          ) : currentStep === 'basic_info' ? (
            <BasicInfoStep onComplete={handleBasicInfoComplete} />
          ) : currentStep === 'service_area' ? (
            <ServiceAreaStep 
              onComplete={handleServiceAreaComplete} 
              onBack={() => editMode ? setCurrentStep('tracker') : setCurrentStep('basic_info')}
            />
          ) : currentStep === 'services' ? (
            <ServiceUnlockStep
              onComplete={handleServicesComplete}
              onBack={() => editMode ? setCurrentStep('tracker') : setCurrentStep('service_area')}
              editMode={editMode}
            />
          ) : currentStep === 'review' ? (
            <ReviewStep
              onBack={() => editMode ? setCurrentStep('tracker') : setCurrentStep('services')}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalOnboarding;

/* ──────── Tracker View (edit mode only) ──────── */

interface TrackerViewProps {
  steps: StepConfig[];
  phase: string;
  editMode: boolean;
  onStepClick: (stepId: string) => void;
}

function TrackerView({ steps, phase, editMode, onStepClick }: TrackerViewProps) {
  const stepOrder = ['basic_info', 'service_area', 'services', 'review'] as const;
  
  const phaseToCurrentStep: Record<string, string | 'done'> = {
    not_started: 'basic_info',
    basic_info: 'service_area',
    service_area: 'services',
    services: 'review',
    service_setup: 'review',
    review: 'done',
    complete: 'done',
    verification: 'services',
  };

  const currentStepId = phaseToCurrentStep[phase] ?? 'basic_info';

  const getStatus = (stepId: string): 'complete' | 'current' | 'pending' => {
    if (currentStepId === 'done') return 'complete';
    const stepIdx = stepOrder.indexOf(stepId as typeof stepOrder[number]);
    const curIdx = stepOrder.indexOf(currentStepId as typeof stepOrder[number]);
    if (stepIdx < curIdx) return 'complete';
    if (stepIdx === curIdx) return 'current';
    return 'pending';
  };

  const completedCount = steps.filter(s => getStatus(s.id) === 'complete').length;

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <Card className="card-grounded mb-6">
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-semibold">Your progress</span>
            <span className="text-base font-semibold text-primary">
              {completedCount} of {steps.length} done
            </span>
          </div>
          <Progress value={(completedCount / steps.length) * 100} className="h-3" />
        </CardContent>
      </Card>

      {steps.map((step, index) => {
        const status = getStatus(step.id);
        const isComplete = status === 'complete';
        const isCurrent = status === 'current';
        const canClick = editMode || isComplete || isCurrent;
        const Icon = step.icon;

        return (
          <Card 
            key={step.id}
            className={cn(
              'card-grounded transition-all duration-300 animate-fade-in',
              isCurrent && 'border-primary/60 ring-2 ring-primary/20 shadow-lg',
              canClick && 'cursor-pointer hover:border-primary/50',
              !canClick && 'opacity-50'
            )}
            style={{ animationDelay: `${index * 80}ms` }}
            onClick={() => canClick && onStepClick(step.id)}
          >
            <CardContent className="flex items-center justify-between py-5 px-5">
              <div className="flex items-center gap-4">
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
                <p className="text-lg font-semibold text-foreground">
                  {step.label}
                </p>
              </div>
              {canClick && (
                <Button 
                  variant={isCurrent ? 'default' : 'outline'} 
                  size="default"
                  className="shrink-0"
                  onClick={(e) => { e.stopPropagation(); onStepClick(step.id); }}
                >
                  {isComplete ? 'Edit' : 'Start'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
