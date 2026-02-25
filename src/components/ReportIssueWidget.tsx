/**
 * REPORT ISSUE WIDGET
 *
 * Floating button (bottom-right) that opens a panel for testers
 * to describe bugs. Auto-attaches monitor context.
 */

import { useState } from 'react';
import { Bug, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getMonitorContext } from '@/lib/lighthouse-monitor';

export function ReportIssueWidget() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ctx = open ? getMonitorContext() : null;

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please describe what went wrong');
      return;
    }

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        toast.error('You must be logged in to submit a report');
        setSubmitting(false);
        return;
      }

      const context = getMonitorContext();
      const { error } = await (supabase as any).from('tester_reports').insert({
        user_id: userId,
        description: description.trim(),
        url: window.location.href,
        route: window.location.pathname,
        browser: navigator.userAgent.slice(0, 200),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        context: {
          recentErrors: context.recentErrors,
          recentRequests: context.recentRequests,
          recentConsole: context.recentConsole,
        },
        status: 'open',
      });

      if (error) throw error;

      toast.success('Report submitted — thank you!');
      setDescription('');
      setOpen(false);
    } catch (err) {
      console.error('[ReportIssue] Submit failed:', err);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Report an issue"
        >
          <Bug className="h-5 w-5" />
        </button>
      )}

      {/* Slide-up panel */}
      {open && (
        <div className="fixed bottom-0 right-0 z-50 w-full max-w-sm rounded-tl-xl border border-border bg-background p-4 shadow-2xl sm:bottom-6 sm:right-6 sm:rounded-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Report an Issue</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Textarea
            placeholder="What went wrong?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-3 min-h-[80px] text-sm"
            maxLength={2000}
          />

          {/* Context summary */}
          {ctx && (
            <div className="mb-3 rounded-md bg-muted p-2 text-xs text-muted-foreground">
              <p className="font-medium">Auto-attached context:</p>
              <p>Page: {ctx.page.slice(0, 60)}</p>
              <p>Browser: {ctx.browser.slice(0, 40)}…</p>
              <p>Errors: {ctx.recentErrors.length} · Requests: {ctx.recentRequests.length} · Console: {ctx.recentConsole.length}</p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
            size="sm"
            className="w-full"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
