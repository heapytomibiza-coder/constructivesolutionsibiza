/**
 * Custom Request Form
 * Fallback for users who can't find their service in the structured taxonomy.
 * Collects: category, job title, description, specs.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { txCategory } from '@/i18n/taxonomyTranslations';
import { toast } from '@/hooks/use-toast';
import type { CustomRequest } from '../types';

interface CustomRequestFormProps {
  initial?: CustomRequest;
  preselectedCategoryId?: string;
  preselectedCategoryName?: string;
  onBack: () => void;
  onSubmit: (request: CustomRequest, categoryId: string, categoryName: string) => void;
}

export function CustomRequestForm({
  initial,
  preselectedCategoryId,
  preselectedCategoryName,
  onBack,
  onSubmit,
}: CustomRequestFormProps) {
  const { t } = useTranslation('wizard');
  const { t: tCommon } = useTranslation('common');

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['service_categories_active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('service_categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [categoryId, setCategoryId] = useState(preselectedCategoryId ?? '');
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [specs, setSpecs] = useState(initial?.specs ?? '');

  const selectedCategory = categories.find(c => c.id === categoryId);

  const canContinue = useMemo(() => {
    return (
      categoryId.trim().length > 0 &&
      jobTitle.trim().length >= 4 &&
      description.trim().length >= 20
    );
  }, [categoryId, jobTitle, description]);

  const handleSubmit = () => {
    if (!canContinue || !selectedCategory) return;
    onSubmit(
      {
        jobTitle: jobTitle.trim(),
        description: description.trim(),
        specs: specs.trim() || undefined,
      },
      selectedCategory.id,
      selectedCategory.name,
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold">
          {t('custom.headline')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('custom.subtitle')}
        </p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>{t('custom.categoryLabel')}</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder={t('custom.categoryPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {txCategory(c.name, tCommon) || c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Job Title */}
      <div className="space-y-2">
        <Label>{t('custom.titleLabel')}</Label>
        <Input
          value={jobTitle}
          onChange={e => setJobTitle(e.target.value)}
          placeholder={t('custom.titlePlaceholder')}
        />
        <p className="text-xs text-muted-foreground">
          {t('custom.titleHelp')}
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>{t('custom.descriptionLabel')}</Label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('custom.descriptionPlaceholder')}
          rows={5}
        />
        <p className="text-xs text-muted-foreground">
          {t('custom.descriptionHelp')}
        </p>
      </div>

      {/* Specs */}
      <div className="space-y-2">
        <Label>{t('custom.specsLabel')}</Label>
        <Textarea
          value={specs}
          onChange={e => setSpecs(e.target.value)}
          placeholder={t('custom.specsPlaceholder')}
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2 min-h-[48px] md:min-h-0">
          <ArrowLeft className="h-4 w-4" />
          {t('buttons.back')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canContinue}
          className="gap-2 min-h-[48px] md:min-h-0"
        >
          {t('buttons.continue')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
