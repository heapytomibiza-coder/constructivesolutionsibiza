import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout';
import { ClipboardList, Users, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';

/**
 * HOW IT WORKS PAGE
 * 
 * Explains the platform flow for clients and professionals.
 */

const HowItWorks = () => {
  return (
    <PublicLayout>
      <div className="container py-12">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            How It Works
          </h1>
          <p className="text-lg text-muted-foreground">
            Connecting clients with trusted construction professionals in Ibiza
          </p>
        </div>

        {/* For Clients */}
        <section className="mb-20">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-8 text-center">
            For Clients
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            <StepCard
              step={1}
              icon={<ClipboardList className="h-6 w-6" />}
              title="Post Your Project"
              description="Describe your construction or renovation needs using our guided wizard."
            />
            <StepCard
              step={2}
              icon={<Users className="h-6 w-6" />}
              title="Get Matched"
              description="We notify verified professionals who match your project requirements."
            />
            <StepCard
              step={3}
              icon={<MessageSquare className="h-6 w-6" />}
              title="Receive Quotes"
              description="Compare quotes, review profiles, and message professionals directly."
            />
            <StepCard
              step={4}
              icon={<CheckCircle className="h-6 w-6" />}
              title="Hire & Complete"
              description="Choose your professional and complete your project with confidence."
            />
          </div>
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link to="/post">
                Post a Job
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* For Professionals */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-8 text-center">
            For Professionals
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            <StepCard
              step={1}
              icon={<ClipboardList className="h-6 w-6" />}
              title="Create Your Profile"
              description="Sign up and complete your professional profile with your services and portfolio."
            />
            <StepCard
              step={2}
              icon={<CheckCircle className="h-6 w-6" />}
              title="Get Verified"
              description="Complete our verification process to build trust with potential clients."
            />
            <StepCard
              step={3}
              icon={<MessageSquare className="h-6 w-6" />}
              title="Receive Job Alerts"
              description="Get notified when jobs matching your skills are posted in your area."
            />
            <StepCard
              step={4}
              icon={<Users className="h-6 w-6" />}
              title="Win Work"
              description="Send quotes, communicate with clients, and grow your business."
            />
          </div>
          <div className="text-center mt-8">
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth?mode=pro">
                Join as Professional
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="relative">
      <CardHeader>
        <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          {step}
        </div>
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default HowItWorks;
