/**
 * ComingSoonPage — Reusable fallback for rollout-gated routes.
 * Replaces silent redirects with a clear holding page.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  message: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

export default function ComingSoonPage({
  title,
  message,
  primaryActionLabel = 'Go Home',
  primaryActionHref = '/',
  secondaryActionLabel,
  secondaryActionHref,
}: ComingSoonPageProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full border-border/50 bg-muted/20">
        <CardContent className="py-10 px-6 text-center space-y-4">
          <Clock className="h-10 w-10 text-primary/60 mx-auto" />
          <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button asChild>
              <Link to={primaryActionHref}>{primaryActionLabel}</Link>
            </Button>
            {secondaryActionLabel && secondaryActionHref && (
              <Button asChild variant="outline">
                <Link to={secondaryActionHref}>{secondaryActionLabel}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
