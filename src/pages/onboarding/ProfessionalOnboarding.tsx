import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSession } from '@/contexts/SessionContext';
import { CheckCircle2, Circle, ArrowRight, Shield } from 'lucide-react';
import { PLATFORM } from '@/domain/scope';

/**
 * PROFESSIONAL ONBOARDING
 * 
 * Entry point for professional onboarding flow.
 * Requires role:professional access.
 * Construction-grade professional styling.
 */
const ProfessionalOnboarding = () => {
  const { professionalProfile } = useSession();
  const phase = professionalProfile?.onboardingPhase || 'not_started';

  const steps = [
    { id: 'not_started', label: 'Basic Information', href: '/onboarding/professional' },
    { id: 'basic_info', label: 'Identity Verification', href: '/professional/verification' },
    { id: 'verification', label: 'Set Up Services', href: '/professional/service-setup' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === phase);
  const progress = phase === 'complete' ? 100 : ((currentStepIndex + 1) / steps.length) * 100;

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
        </div>
      </nav>

      <div className="container py-12">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Complete Your Profile
            </h1>
            <p className="text-muted-foreground mb-4">
              Finish setting up your professional profile to start receiving job requests.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Join Ibiza's trusted trades network</span>
            </div>
          </div>

          <Card className="mb-6 card-grounded">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">Progress</CardTitle>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-3" />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const isComplete = index < currentStepIndex || phase === 'complete';
              const isCurrent = step.id === phase;

              return (
                <Card 
                  key={step.id}
                  className={`card-grounded ${isCurrent ? 'border-primary ring-1 ring-primary/20' : ''}`}
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      {isComplete ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : (
                        <Circle className={`h-6 w-6 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                      )}
                      <div>
                        <p className="font-medium">{step.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {isComplete ? 'Completed' : isCurrent ? 'In progress' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    {(isCurrent || !isComplete) && (
                      <Button variant={isCurrent ? 'default' : 'outline'} size="sm" asChild>
                        <Link to={step.href}>
                          {isCurrent ? 'Continue' : 'Start'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalOnboarding;
