import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSession } from '@/contexts/SessionContext';
import { CheckCircle2, ArrowRight, Shield, ArrowLeft, User, MapPin, Briefcase } from 'lucide-react';
import { PLATFORM } from '@/domain/scope';
import { BasicInfoStep, ServiceAreaStep } from './steps';
import { cn } from '@/lib/utils';

type WizardStep = 'tracker' | 'basic_info' | 'service_area' | 'job_types';

interface StepConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepConfig[] = [
  { id: 'basic_info', label: 'Basic Information', description: 'Name, contact, and bio', icon: User },
  { id: 'service_area', label: 'Service Area', description: 'Where you work in Ibiza', icon: MapPin },
  { id: 'job_types', label: 'Job Types', description: 'What services you offer', icon: Briefcase },
];

/**
 * PROFESSIONAL ONBOARDING WIZARD
 * 
 * Multi-step guided onboarding for new professionals.
 * Collects: Basic info → Service area → Job types
 */
const ProfessionalOnboarding = () => {
  const navigate = useNavigate();
  const { professionalProfile, isLoading } = useSession();
  const [currentStep, setCurrentStep] = useState<WizardStep>('tracker');

  // Determine completed steps based on onboarding phase
  const phase = professionalProfile?.onboardingPhase || 'not_started';
  
  const getStepStatus = (stepId: string) => {
    const phaseOrder = ['not_started', 'basic_info', 'verification', 'service_setup', 'complete'];
    const stepToPhase: Record<string, string> = {
      'basic_info': 'basic_info',
      'service_area': 'verification',
      'job_types': 'service_setup',
    };
    
    const currentPhaseIndex = phaseOrder.indexOf(phase);
    const stepPhaseIndex = phaseOrder.indexOf(stepToPhase[stepId]);
    
    return currentPhaseIndex > stepPhaseIndex ? 'complete' : 
           currentPhaseIndex === stepPhaseIndex ? 'current' : 'pending';
  };

  const completedSteps = STEPS.filter(s => getStepStatus(s.id) === 'complete').length;
  const progress = phase === 'complete' || phase === 'service_setup' 
    ? 100 
    : ((completedSteps + 1) / STEPS.length) * 100;

  const handleStepClick = (stepId: string) => {
    const status = getStepStatus(stepId);
    // Allow navigating to completed or current steps
    if (status === 'complete' || status === 'current') {
      setCurrentStep(stepId as WizardStep);
    }
  };

  // Redirect if already complete
  useEffect(() => {
    if (phase === 'complete') {
      navigate('/dashboard/pro');
    }
  }, [phase, navigate]);

  const handleBasicInfoComplete = () => {
    setCurrentStep('service_area');
  };

  const handleServiceAreaComplete = () => {
    // Navigate to the dedicated job types page
    navigate('/professional/service-setup');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero bg-texture-concrete flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero bg-texture-concrete">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-sm bg-gradient-steel shadow-md flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">
                {PLATFORM.mark}
              </span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              {PLATFORM.shortName}
            </span>
          </Link>
          {currentStep !== 'tracker' && (
            <Button variant="ghost" onClick={() => setCurrentStep('tracker')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          )}
        </div>
      </nav>

      <div className="container py-12">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {currentStep === 'tracker' ? 'Complete Your Profile' : 
               currentStep === 'basic_info' ? 'Step 1: About You' :
               currentStep === 'service_area' ? 'Step 2: Service Area' :
               'Step 3: Job Types'}
            </h1>
            <p className="text-muted-foreground mb-4">
              {currentStep === 'tracker' 
                ? 'Finish setting up your professional profile to start receiving job requests.'
                : 'Complete this step to continue with your profile setup.'}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Join Ibiza's trusted trades network</span>
            </div>
          </div>

          {/* Progress Card */}
          <Card className="mb-6 card-grounded animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">Progress</CardTitle>
                <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Progress value={progress} className="h-3" />
                {/* Gradient overlay for progress bar */}
                <div 
                  className="absolute inset-0 h-3 rounded-full bg-gradient-steel opacity-20"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content based on current step */}
          {currentStep === 'tracker' ? (
            <div className="space-y-4">
              {STEPS.map((step, index) => {
                const status = getStepStatus(step.id);
                const isComplete = status === 'complete';
                const isCurrent = status === 'current';
                const canClick = isComplete || isCurrent;
                const Icon = step.icon;

                return (
                  <Card 
                    key={step.id}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className={cn(
                      'card-grounded transition-all duration-200',
                      'animate-slide-up opacity-0 [animation-fill-mode:forwards]',
                      isCurrent && 'border-primary ring-1 ring-primary/20 shadow-glow',
                      canClick && 'cursor-pointer hover:border-primary/50 hover:scale-[1.01]',
                      !canClick && 'opacity-60'
                    )}
                    onClick={() => canClick && handleStepClick(step.id)}
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        {/* Step icon with gradient container for current/complete */}
                        {isComplete ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                            <CheckCircle2 className="h-6 w-6 text-success" />
                          </div>
                        ) : isCurrent ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-steel shadow-md">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{step.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {(isCurrent || isComplete) && (
                        <Button 
                          variant={isCurrent ? 'default' : 'outline'} 
                          size="sm"
                          className={cn(
                            'transition-transform',
                            isCurrent && 'hover:scale-105'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStepClick(step.id);
                          }}
                        >
                          {isComplete ? 'Edit' : 'Start'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : currentStep === 'basic_info' ? (
            <BasicInfoStep onComplete={handleBasicInfoComplete} />
          ) : currentStep === 'service_area' ? (
            <ServiceAreaStep 
              onComplete={handleServiceAreaComplete} 
              onBack={() => setCurrentStep('basic_info')}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalOnboarding;
