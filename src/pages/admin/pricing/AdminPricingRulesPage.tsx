import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { fetchPricingRules } from '../queries/pricingRules.query';
import { togglePricingRuleActive, createPricingRule } from '../actions/pricingRules.action';

function formatEur(n: number): string {
  return `€${Math.round(n)}`;
}

export default function AdminPricingRulesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['admin-pricing-rules'],
    queryFn: fetchPricingRules,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      togglePricingRuleActive(id, is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pricing-rules'] });
      qc.invalidateQueries({ queryKey: ['pricing-rules'] });
    },
    onError: () => toast.error('Failed to update rule.'),
  });

  const [newRule, setNewRule] = useState({
    category: '',
    subcategory: '',
    micro_slug: '',
    micro_name: '',
    base_labour_unit: 'item',
    base_labour_min: 0,
    base_labour_max: 0,
    base_material_min: 0,
    base_material_max: 0,
  });

  const createRuleMutation = useMutation({
    mutationFn: () => createPricingRule(newRule),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pricing-rules'] });
      setDialogOpen(false);
      toast.success('Rule created.');
      setNewRule({
        category: '', subcategory: '', micro_slug: '', micro_name: '',
        base_labour_unit: 'item', base_labour_min: 0, base_labour_max: 0,
        base_material_min: 0, base_material_max: 0,
      });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create rule.'),
  });

  const activeCount = rules?.filter(r => r.is_active).length ?? 0;
  const totalCount = rules?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Pricing Rules</h2>
            <p className="text-sm text-muted-foreground">
              {activeCount} active / {totalCount} total rules
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Pricing Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {(['category', 'subcategory', 'micro_slug', 'micro_name'] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <Label className="text-sm">{field.replace(/_/g, ' ')}</Label>
                  <Input
                    value={newRule[field]}
                    onChange={(e) => setNewRule((p) => ({ ...p, [field]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">Labour Min (€)</Label>
                  <Input type="number" value={newRule.base_labour_min} onChange={(e) => setNewRule((p) => ({ ...p, base_labour_min: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Labour Max (€)</Label>
                  <Input type="number" value={newRule.base_labour_max} onChange={(e) => setNewRule((p) => ({ ...p, base_labour_max: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Material Min (€)</Label>
                  <Input type="number" value={newRule.base_material_min} onChange={(e) => setNewRule((p) => ({ ...p, base_material_min: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Material Max (€)</Label>
                  <Input type="number" value={newRule.base_material_max} onChange={(e) => setNewRule((p) => ({ ...p, base_material_max: Number(e.target.value) }))} />
                </div>
              </div>
              <Button onClick={() => createRuleMutation.mutate()} disabled={createRuleMutation.isPending} className="w-full">
                {createRuleMutation.isPending ? 'Creating…' : 'Create Rule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {rules && rules.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Service</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Labour</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Material</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <span className="font-medium text-foreground">{rule.micro_name}</span>
                    <span className="block text-xs text-muted-foreground">{rule.micro_slug}</span>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">
                    {rule.category} → {rule.subcategory}
                  </td>
                  <td className="p-3 text-right text-foreground">
                    {formatEur(rule.base_labour_min)} – {formatEur(rule.base_labour_max)}
                  </td>
                  <td className="p-3 text-right text-foreground">
                    {formatEur(rule.base_material_min)} – {formatEur(rule.base_material_max)}
                  </td>
                  <td className="p-3 text-center">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: rule.id, is_active: checked })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rules && rules.length === 0 && (
        <div className="rounded-xl border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground">No pricing rules yet. Add your first one above.</p>
        </div>
      )}
    </div>
  );
}
