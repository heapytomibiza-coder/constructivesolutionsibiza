import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { useTranslation } from 'react-i18next';

type WizardStep = 'tracker' | 'basic_info' | 'service_area' | 'services' | 'review';

interface StepConfig {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepConfig[] = [
  { id: 'basic_info', labelKey: 'wizard.stepLabels.basic_info', icon: User },
  { id: 'service_area', labelKey: 'wizard.stepLabels.service_area', icon: MapPin },
  { id: 'services', labelKey: 'wizard.stepLabels.services', icon: Briefcase },
  { id: 'review', labelKey: 'wizard.stepLabels.review', icon: Rocket },
];

/**
 * PROFESSIONAL ONBOARDING WIZARD
 * 
 * Simple linear 4-step flow for first-time onboarding.
 * Edit mode shows a tracker overview for jumping between steps.
 */
const ProfessionalOnboarding = () => {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const editMode = params.get('edit') === '1';
  const stepParam = params.get('step') as WizardStep | null;

  const { user, professionalProfile, isLoading } = useSession();
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

  // Safe default — defer phase-based step until loading completes
  const [currentStep, setCurrentStep] = useState<WizardStep>(editMode ? 'tracker' : 'basic_info');

  // Track explicit user navigation so phase sync doesn't override it
  const userNavigatedRef = useRef(false);
  const lastPhaseRef = useRef<string | null>(null);

  // Current step index (0-based) for progress display
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / STEPS.length) * 100 : 25;

  // Fresh DB checks for accurate stepper ticks (not index-based)
  const [stepCompletion, setStepCompletion] = useState([false, false, false, false]);

  useEffect(() => {
    if (!user?.id || isLoading) return;
    let cancelled = false;
    (async () => {
      const [ppRes, profRes, svcRes] = await Promise.all([
        supabase.from('professional_profiles')
          .select('service_zones, display_name, business_name')
          .eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles')
          .select('phone')
          .eq('user_id', user.id).maybeSingle(),
        supabase.from('professional_services')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'offered'),
      ]);
      if (cancelled) return;
      const pp = ppRes.data;
      const hasName = !!(pp?.display_name?.trim() || pp?.business_name?.trim());
      const hasPhone = !!profRes.data?.phone?.trim();
      const hasZones = (pp?.service_zones?.length ?? 0) > 0;
      const hasServices = (svcRes.count ?? 0) > 0;
      setStepCompletion([hasName && hasPhone, hasZones, hasServices, false]);
    })();
    return () => { cancelled = true; };
  }, [user?.id, isLoading, currentStep]);

  // Set correct step once profile has loaded, but do not override explicit manual navigation
  useEffect(() => {
    if (isLoading || editMode) return;
    if (userNavigatedRef.current) return;
    setCurrentStep(phaseToStep[phase] ?? 'basic_info');
  }, [isLoading, editMode, phase]);

  // Only redirect completed users when NOT in edit mode
  useEffect(() => {
    if (phase === 'complete' && !editMode) {
      navigate('/dashboard/pro');
    }
  }, [phase, editMode, navigate]);

  // Deep-link to a step — gate tracker behind edit mode
  useEffect(() => {
    if (!stepParam) return;
    const allowed: WizardStep[] = editMode
      ? ['tracker', 'basic_info', 'service_area', 'services', 'review']
      : ['basic_info', 'service_area', 'services', 'review'];
    if (allowed.includes(stepParam)) {
      userNavigatedRef.current = true;
      setCurrentStep(stepParam);
    }
  }, [stepParam, editMode]);

  // Safety fallback — tracker can never exist outside edit mode
  useEffect(() => {
    if (!editMode && currentStep === 'tracker') {
      setCurrentStep('basic_info');
    }
  }, [editMode, currentStep]);

  // Phase auto-advance, but never override explicit user navigation
  useEffect(() => {
    if (editMode) return;
    if (userNavigatedRef.current) return;
    const stepOrder: WizardStep[] = ['basic_info', 'service_area', 'services', 'review'];
    const nextStep = phaseToStep[phase] ?? 'basic_info';
    const currentIdx = stepOrder.indexOf(currentStep);
    const nextIdx = stepOrder.indexOf(nextStep);
    if (nextIdx > currentIdx) {
      setCurrentStep(nextStep);
    }
  }, [phase, editMode, currentStep]);

  // Reset manual navigation lock only when phase actually changes server-side
  useEffect(() => {
    if (!phase) return;
    if (lastPhaseRef.current !== null && lastPhaseRef.current !== phase) {
      userNavigatedRef.current = false;
    }
    lastPhaseRef.current = phase;
  }, [phase]);

  // Step completion handlers - always advance to next step
  const handleBasicInfoComplete = () => {
    trackEvent('pro_onboarding_started', 'professional', { step: 'basic_info' });
    userNavigatedRef.current = false;
    if (editMode) { setCurrentStep('tracker'); return; }
    setCurrentStep('service_area');
  };

  const handleServiceAreaComplete = () => {
    trackEvent('pro_onboarding_step_completed', 'professional', { step: 'service_area' });
    userNavigatedRef.current = false;
    if (editMode) { setCurrentStep('tracker'); return; }
    setCurrentStep('services');
  };

  const handleServicesComplete = () => {
    trackEvent('pro_onboarding_step_completed', 'professional', { step: 'services' });
    userNavigatedRef.current = false;
    if (editMode) { setCurrentStep('tracker'); return; }
    setCurrentStep('review');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-lg">{t('wizard.loading')}</div>
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
              {t('wizard.backToDashboard')}
            </Button>
          )}
          {editMode && currentStep !== 'tracker' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                userNavigatedRef.current = true;
                setCurrentStep('tracker');
              }}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t('wizard.backToOverview')}
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
                ? t('wizard.editProfile')
                : t(`wizard.stepHeaders.${currentStep}`, { defaultValue: '' })}
            </h1>
            <p className="text-lg text-muted-foreground">
              {editMode
                ? t('wizard.jumpToStep')
                : t('wizard.stepOf', { current: currentStepIndex + 1, total: STEPS.length })}
            </p>
          </div>

          {/* Step progress indicator - shown during linear flow (not tracker) */}
          {currentStep !== 'tracker' && (
            <div className="mb-8 animate-fade-in">
              <div className="flex justify-between mb-3">
                {STEPS.map((step, index) => {
                  const isComplete = stepCompletion[index];
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
                        {t(step.labelKey)}
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
                userNavigatedRef.current = true;
                setCurrentStep(stepId as WizardStep);
                trackEvent('pro_onboarding_step_entered', 'professional', { step: stepId, edit_mode: editMode });
              }}
            />
          ) : currentStep === 'basic_info' ? (
            <BasicInfoStep onComplete={handleBasicInfoComplete} />
          ) : currentStep === 'service_area' ? (
            <ServiceAreaStep
              onComplete={handleServiceAreaComplete}
              onBack={() => {
                userNavigatedRef.current = true;
                editMode ? setCurrentStep('tracker') : setCurrentStep('basic_info');
              }}
            />
          ) : currentStep === 'services' ? (
            <ServiceUnlockStep
              onComplete={handleServicesComplete}
              onBack={() => {
                userNavigatedRef.current = true;
                editMode ? setCurrentStep('tracker') : setCurrentStep('service_area');
              }}
              editMode={editMode}
            />
          ) : currentStep === 'review' ? (
            <ReviewStep
              onBack={() => {
                userNavigatedRef.current = true;
                editMode ? setCurrentStep('tracker') : setCurrentStep('services');
              }}
              onNavigate={(step) => {
                userNavigatedRef.current = true;
                setCurrentStep(step as WizardStep);
              }}
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
  const { t } = useTranslation('onboarding');
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
            <span className="text-lg font-semibold">{t('wizard.tracker.yourProgress')}</span>
            <span className="text-base font-semibold text-primary">
              {t('wizard.tracker.done', { completed: completedCount, total: steps.length })}
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
                  {t(step.labelKey)}
                </p>
              </div>
              {canClick && (
                <Button 
                  variant={isCurrent ? 'default' : 'outline'} 
                  size="default"
                  className="shrink-0"
                  onClick={(e) => { e.stopPropagation(); onStepClick(step.id); }}
                >
                  {isComplete ? t('wizard.tracker.edit') : t('wizard.tracker.start')}
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
