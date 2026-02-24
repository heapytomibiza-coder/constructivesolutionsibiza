/**
 * JobPriorities - Dedicated page for professionals to set job priority rankings.
 * Accessible from Pro Dashboard Quick Actions.
 * Professional, clean UI with large touch targets — no emojis.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { txCategory, txMicro } from '@/i18n/taxonomyTranslations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, ThumbsUp, Minus, Loader2, Check } from 'lucide-react';
import { getCategoryIconByName } from '@/lib/categoryIcons';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { useServiceTaxonomy } from '@/pages/onboarding/hooks/useServiceTaxonomy';
import { useProfessionalServices } from '@/pages/onboarding/hooks/useProfessionalServices';
import { useMicroPreferences } from '@/pages/onboarding/hooks/useMicroPreferences';
import { PLATFORM } from '@/domain/scope';
import type { Preference } from '@/pages/onboarding/types/preferences';

/* ── Priority option config ── */
function usePriorityOptions() {
  const { t } = useTranslation('professional');
  return useMemo(() => [
    {
      value: 'love' as Preference,
      label: t('priorities.priority'),
      description: t('priorities.priorityDesc'),
      icon: Star,
      activeClass: 'bg-primary text-primary-foreground border-primary shadow-sm',
      inactiveClass: 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary',
    },
    {
      value: 'like' as Preference,
      label: t('priorities.standard'),
      description: t('priorities.standardDesc'),
      icon: ThumbsUp,
      activeClass: 'bg-secondary text-foreground border-border shadow-sm',
      inactiveClass: 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
    },
    {
      value: 'neutral' as Preference,
      label: t('priorities.lowPriority'),
      description: t('priorities.lowPriorityDesc'),
      icon: Minus,
      activeClass: 'bg-muted text-muted-foreground border-border',
      inactiveClass: 'border-border text-muted-foreground/60 hover:border-muted-foreground/40',
    },
  ], [t]);
}

export default function JobPriorities() {
  const navigate = useNavigate();
  const { t } = useTranslation('professional');
  const { user } = useSession();
  const PRIORITY_OPTIONS = usePriorityOptions();

  const { data: categories = [], isLoading: loadingTaxonomy } = useServiceTaxonomy();
  const { selectedMicroIds, isLoading: loadingServices } = useProfessionalServices();
  const { preferences, updatePreference, isUpdating } = useMicroPreferences();

  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
    };
  }, []);

  const flashSaved = useCallback(() => {
    setShowSaved(true);
    if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
    savedTimerRef.current = window.setTimeout(() => {
      setShowSaved(false);
      savedTimerRef.current = null;
    }, 1200);
  }, []);

  const handlePriorityChange = useCallback(
    (microId: string, pref: Preference) => {
      updatePreference(microId, pref);
      flashSaved();
    },
    [updatePreference, flashSaved],
  );

  /* ── Build grouped list of only selected micros ── */
  const groupedMicros = useMemo(() => {
    if (!categories.length || !selectedMicroIds.size) return [];

    return categories
      .map((cat) => {
        const micros = cat.subcategories.flatMap((sub) =>
          sub.micros.filter((m) => selectedMicroIds.has(m.id)),
        );
        if (!micros.length) return null;
        return { categoryId: cat.id, categoryName: cat.name, icon: cat.icon_emoji, micros };
      })
      .filter(Boolean) as {
      categoryId: string;
      categoryName: string;
      icon: string | null;
      micros: { id: string; name: string; slug: string }[];
    }[];
  }, [categories, selectedMicroIds]);

  const isLoading = loadingTaxonomy || loadingServices;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Nav */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-steel shadow-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-base">{PLATFORM.mark}</span>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/pro')}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('priorities.backToDashboard')}
          </Button>
        </div>
      </nav>

      <div className="container py-10 sm:py-14">
        <div className="mx-auto max-w-xl space-y-6">
          {/* Header */}
          <div className="text-center animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {t('priorities.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('priorities.subtitle')}
            </p>
          </div>

          {/* Legend card */}
          <Card className="card-grounded">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-4">
                  {PRIORITY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <div key={opt.value} className="flex items-center gap-2 text-sm">
                        <div
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-md border',
                            opt.activeClass,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium text-foreground">{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
                {showSaved && (
                  <Badge variant="secondary" className="bg-primary/15 text-primary animate-fade-in text-sm">
                    <Check className="h-4 w-4 mr-1" />
                    {t('priorities.saved')}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
            </div>
          ) : groupedMicros.length === 0 ? (
            /* Empty state */
            <Card className="card-grounded">
              <CardContent className="py-12 text-center">
                <p className="text-lg text-muted-foreground mb-4">
                  {t('priorities.noJobs')}
                </p>
                <Button asChild>
                  <Link to="/onboarding/professional?edit=1&step=services">{t('priorities.chooseJobs')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Grouped micro list */
            <div className="space-y-6">
              {groupedMicros.map((group) => (
                <Card key={group.categoryId} className="card-grounded animate-fade-in">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                      {(() => { const CatIcon = getCategoryIconByName(group.categoryName); return <CatIcon className="h-5 w-5 text-primary" />; })()}
                      {txCategory(group.categoryName, t)}
                      <Badge variant="secondary" className="ml-auto text-xs font-normal">
                        {group.micros.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.micros.map((micro) => {
                      const currentPref = preferences.get(micro.id) ?? 'neutral';
                      return (
                        <PriorityRow
                          key={micro.id}
                          name={micro.name}
                          currentPref={currentPref}
                          onChange={(pref) => handlePriorityChange(micro.id, pref)}
                          options={PRIORITY_OPTIONS}
                        />
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Bottom action */}
          {groupedMicros.length > 0 && (
            <div className="flex justify-center pt-2 pb-8">
              <Button variant="outline" onClick={() => navigate('/dashboard/pro')}>
                {t('priorities.done')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── PriorityRow - Single micro with segmented priority buttons ── */
function PriorityRow({
  name,
  currentPref,
  onChange,
  options,
}: {
  name: string;
  currentPref: Preference;
  onChange: (pref: Preference) => void;
  options: ReturnType<typeof usePriorityOptions>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 px-1">
      <span className="text-base font-medium text-foreground flex-1 min-w-0 truncate">{txMicro(slug, t, name)}</span>
      <div className="flex gap-1.5 shrink-0">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = currentPref === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              title={opt.description}
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium',
                'transition-all duration-150 min-h-[44px]',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                isActive ? opt.activeClass : opt.inactiveClass,
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
