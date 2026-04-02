/**
 * BudgetIncreaseCard — Allows client to increase the budget on an open or in_progress job.
 * Shows current budget and a form to set a new (higher) amount.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetIncreaseCardProps {
  jobId: string;
  jobStatus: string;
  isClient: boolean;
  budgetType: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetValue: number | null;
}

export function BudgetIncreaseCard({
  jobId,
  jobStatus,
  isClient,
  budgetType,
  budgetMin,
  budgetMax,
  budgetValue,
}: BudgetIncreaseCardProps) {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newMin, setNewMin] = useState('');
  const [newMax, setNewMax] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show for client on open or in_progress jobs
  if (!isClient || !['open', 'in_progress', 'assigned'].includes(jobStatus)) return null;

  const isRange = budgetType === 'range';
  const isFixed = budgetType === 'fixed';

  const currentDisplay = isRange
    ? `€${budgetMin?.toLocaleString() ?? '0'} – €${budgetMax?.toLocaleString() ?? '0'}`
    : isFixed
    ? `€${budgetValue?.toLocaleString() ?? '0'}`
    : 'Not set';

  const handleOpen = () => {
    if (isRange) {
      setNewMin(budgetMin?.toString() || '');
      setNewMax(budgetMax?.toString() || '');
    } else {
      setNewValue(budgetValue?.toString() || '');
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (isRange) {
        const min = parseFloat(newMin);
        const max = parseFloat(newMax);
        if (isNaN(min) || isNaN(max) || max < min) {
          toast.error(t('budgetIncrease.invalidRange', 'Max must be greater than min'));
          return;
        }
        if (min < (budgetMin || 0) || max < (budgetMax || 0)) {
          toast.error(t('budgetIncrease.canOnlyIncrease', 'You can only increase the budget'));
          return;
        }
        updates.budget_min = min;
        updates.budget_max = max;
      } else {
        const val = parseFloat(newValue);
        if (isNaN(val) || val <= 0) {
          toast.error(t('budgetIncrease.invalidAmount', 'Enter a valid amount'));
          return;
        }
        if (val < (budgetValue || 0)) {
          toast.error(t('budgetIncrease.canOnlyIncrease', 'You can only increase the budget'));
          return;
        }
        updates.budget_value = val;
      }

      const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t('budgetIncrease.success', 'Budget updated'));
      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
      setOpen(false);
    } catch {
      toast.error(t('budgetIncrease.failed', 'Failed to update budget'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleOpen}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {t('budgetIncrease.addFunds', 'Increase Budget')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('budgetIncrease.title', 'Increase Budget')}
          </DialogTitle>
          <DialogDescription>
            {t('budgetIncrease.description', 'Add additional funds if the scope of work has changed. You can only increase the budget, not decrease it.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm">
            <span className="text-muted-foreground">{t('budgetIncrease.current', 'Current budget:')}</span>{' '}
            <span className="font-medium">{currentDisplay}</span>
          </div>

          {isRange ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('budgetIncrease.min', 'Min (€)')}</label>
                <Input
                  type="number"
                  value={newMin}
                  onChange={(e) => setNewMin(e.target.value)}
                  min={budgetMin || 0}
                  step="100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('budgetIncrease.max', 'Max (€)')}</label>
                <Input
                  type="number"
                  value={newMax}
                  onChange={(e) => setNewMax(e.target.value)}
                  min={budgetMax || 0}
                  step="100"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('budgetIncrease.amount', 'New amount (€)')}</label>
              <Input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                min={budgetValue || 0}
                step="100"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            {t('budgetIncrease.confirm', 'Update Budget')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
