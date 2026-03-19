import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);

    // Report to error_events table for remote diagnosis
    this.reportError(error, info);
  }

  private async reportError(error: Error, info: ErrorInfo) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('error_events').insert({
        user_id: user?.id ?? null,
        error_type: 'react_crash',
        message: error.message?.slice(0, 500) || 'Unknown error',
        stack: (error.stack?.slice(0, 2000) || '') + '\n\n--- Component Stack ---\n' + (info.componentStack?.slice(0, 1000) || ''),
        route: window.location.pathname,
        url: window.location.href,
        browser: navigator.userAgent?.slice(0, 200),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      });
    } catch (reportErr) {
      console.warn('[ErrorBoundary] Failed to report error:', reportErr);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-display font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              An unexpected error occurred. Please try again.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left bg-muted p-3 rounded overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset}>Go to Home</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
