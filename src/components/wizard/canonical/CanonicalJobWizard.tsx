/**
 * Canonical Job Wizard
 * V3 architecture - Single-point mode resolution eliminates state races
 * 
 * Flow: Category → Subcategory → Micro → Questions → Logistics → Extras → Review
 * 
 * Mode Resolution (priority order):
 * 1. Search selection → direct to Questions (bypass draft)
 * 2. Deep-link params → apply and navigate (bypass draft)
 * 3. Resume flag → restore draft directly
 * 4. Draft exists → prompt user
 * 5. Fresh start
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, Loader2, FileText } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Canonical modules
import { 
  WizardState, 
  WizardStep, 
  EMPTY_WIZARD_STATE, 
  STEP_ORDER,
  getStepIndex,
  getNextStep,
  getPrevStep,
} from './types';
import { useWizardUrlStep } from './hooks/useWizardUrlStep';
import { buildJobInsert, validateWizardState } from './lib/buildJobPayload';
import { validateAllPacks, type ValidationErrorMap } from './lib/stepValidation';
import {
  resolveWizardMode,
  applySearchResult,
  markDraftChecked,
  clearDraftChecked,
  deriveStepFromState,
  type ModeResolution,
} from './lib/resolveWizardMode';

// DB-powered selectors
import CategorySelector from '@/components/wizard/db-powered/CategorySelector';
import SubcategorySelector from '@/components/wizard/db-powered/SubcategorySelector';
import MicroStep from '@/components/wizard/db-powered/MicroStep';
import { ServiceSearchBar, type SearchResult } from '@/components/wizard/db-powered/ServiceSearchBar';

// Step components
import { LogisticsStep } from './steps/LogisticsStep';
import { ExtrasStep } from './steps/ExtrasStep';
import { ReviewStep } from './steps/ReviewStep';
import { QuestionsStep } from './steps/QuestionsStep';

// Constants
const STORAGE_KEY = 'wizardState';

// Step title key mapping
const STEP_TITLE_KEYS: Record<WizardStep, string> = {
  [WizardStep.Category]: 'steps.category',
  [WizardStep.Subcategory]: 'steps.subcategory',
  [WizardStep.Micro]: 'steps.micro',
  [WizardStep.Questions]: 'steps.questions',
  [WizardStep.Logistics]: 'steps.logistics',
  [WizardStep.Extras]: 'steps.extras',
  [WizardStep.Review]: 'steps.review',
};

interface CanonicalJobWizardProps {
  className?: string;
}

export function CanonicalJobWizard({ className }: CanonicalJobWizardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation('wizard');
  const { user, isAuthenticated } = useSession();
  
  // === INITIALIZATION STATE ===
  const [isInitialized, setIsInitialized] = useState(false);
  const [modeResolution, setModeResolution] = useState<ModeResolution | null>(null);
  
  // Core wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.Category);
  const [wizardState, setWizardState] = useState<WizardState>(EMPTY_WIZARD_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Question pack validation state
  const [questionPacks, setQuestionPacks] = useState<{ micro_slug: string; questions: unknown[] }[]>([]);
  const [questionErrors, setQuestionErrors] = useState<Record<string, ValidationErrorMap>>({});
  
  // Draft modal
  const [showDraftModal, setShowDraftModal] = useState(false);
  
  // Deep-link processing ref
  const deepLinkProcessedRef = useRef(false);
  
  // URL sync (only after initialization)
  useWizardUrlStep(currentStep, setCurrentStep);
  
  // === SINGLE-POINT MODE RESOLUTION ===
  useEffect(() => {
    if (isInitialized) return;
    
    const resolution = resolveWizardMode({ urlSearch: location.search });
    setModeResolution(resolution);
    
    if (resolution.mode === 'prompt') {
      // Show draft modal, don't initialize yet
      setShowDraftModal(true);
      return;
    }
    
    // Apply resolved state and step
    setWizardState(resolution.initialState);
    setCurrentStep(resolution.initialStep);
    
    // Mark draft as checked so we don't prompt again
    markDraftChecked();
    
    // Handle deep-link lookups if needed
    if (resolution.mode === 'deep-link' && resolution.pendingLookups) {
      // Will be processed in separate effect
    } else {
      setIsInitialized(true);
    }
  }, [location.search, isInitialized]);
  
  // === DEEP-LINK LOOKUP (async, after mode resolution) ===
  useEffect(() => {
    if (deepLinkProcessedRef.current) return;
    if (!modeResolution || modeResolution.mode !== 'deep-link') return;
    if (!modeResolution.pendingLookups) return;
    
    const { categoryId, subcategoryId, microSlug, targetProfessionalId } = modeResolution.pendingLookups;
    
    const processDeepLink = async () => {
      deepLinkProcessedRef.current = true;
      let newState = { ...EMPTY_WIZARD_STATE };
      let targetStep = modeResolution.initialStep;
      
      // Handle target professional (direct mode)
      if (targetProfessionalId) {
        try {
          const { data: pro } = await supabase
            .from('professional_profiles')
            .select('display_name')
            .eq('user_id', targetProfessionalId)
            .single();
          
          newState = {
            ...newState,
            dispatchMode: 'direct',
            targetProfessionalId,
            targetProfessionalName: pro?.display_name || 'Professional',
          };
        } catch (e) {
          console.warn('Failed to fetch professional name:', e);
          newState = {
            ...newState,
            dispatchMode: 'direct',
            targetProfessionalId,
            targetProfessionalName: 'Professional',
          };
        }
      }
      
      // NEW: Micro hydration - lookup micro slug and hydrate parents
      // This enables deep-linking with just /post?micro=sink-leak
      if (microSlug && !categoryId && !subcategoryId) {
        try {
          const { data: micro, error } = await supabase
            .from('service_micro_categories')
            .select(`
              id, name, slug,
              service_subcategories!inner(
                id, name,
                service_categories!inner(id, name)
              )
            `)
            .eq('slug', microSlug)
            .eq('is_active', true)
            .single();

          if (!error && micro) {
            // Type assertion for nested join
            const sub = micro.service_subcategories as unknown as { id: string; name: string; service_categories: { id: string; name: string } };
            const cat = sub.service_categories;
            
            newState = {
              ...newState,
              mainCategory: cat.name,
              mainCategoryId: cat.id,
              subcategory: sub.name,
              subcategoryId: sub.id,
              microNames: [micro.name],
              microIds: [micro.id],
              microSlugs: [micro.slug],
            };
            targetStep = WizardStep.Questions;
            console.log('[Wizard] Hydrated micro:', microSlug, '→ Questions step');
          } else {
            console.warn('[Wizard] Micro lookup failed for:', microSlug, error);
            // Fall back to Category step (resolver already set a safe initial)
            targetStep = WizardStep.Category;
          }
        } catch (e) {
          console.warn('[Wizard] Micro hydration error:', e);
          targetStep = WizardStep.Category;
        }
      }
      // Micro with partial hierarchy - use it
      else if (microSlug && categoryId && subcategoryId) {
        // Full hierarchy provided, lookup and hydrate
        try {
          const { data: micro, error } = await supabase
            .from('service_micro_categories')
            .select('id, name, slug, subcategory_id')
            .eq('slug', microSlug)
            .eq('is_active', true)
            .single();
          
          if (!error && micro && micro.subcategory_id === subcategoryId) {
            // Also fetch category and subcategory names
            const { data: sub } = await supabase
              .from('service_subcategories')
              .select('id, name, category_id, service_categories!inner(id, name)')
              .eq('id', subcategoryId)
              .single();
            
            if (sub && sub.category_id === categoryId) {
              const cat = sub.service_categories as unknown as { id: string; name: string };
              newState = {
                ...newState,
                mainCategory: cat.name,
                mainCategoryId: cat.id,
                subcategory: sub.name,
                subcategoryId: sub.id,
                microNames: [micro.name],
                microIds: [micro.id],
                microSlugs: [micro.slug],
              };
              targetStep = WizardStep.Questions;
            }
          }
        } catch (e) {
          console.warn('[Wizard] Full hierarchy lookup failed:', e);
        }
      }
      // Category/subcategory only (no micro)
      else if (categoryId) {
        try {
          const { data: cat, error: catErr } = await supabase
            .from('service_categories')
            .select('id, name')
            .eq('id', categoryId)
            .eq('is_active', true)
            .single();
          
          if (!catErr && cat) {
            newState = {
              ...newState,
              mainCategory: cat.name,
              mainCategoryId: cat.id,
            };
            targetStep = WizardStep.Subcategory;
            
            // Fetch subcategory if provided
            if (subcategoryId) {
              const { data: sub, error: subErr } = await supabase
                .from('service_subcategories')
                .select('id, name, category_id')
                .eq('id', subcategoryId)
                .eq('is_active', true)
                .single();
              
              if (!subErr && sub && sub.category_id === cat.id) {
                newState = {
                  ...newState,
                  subcategory: sub.name,
                  subcategoryId: sub.id,
                };
                targetStep = WizardStep.Micro;
              }
            }
          }
        } catch (e) {
          console.warn('[Wizard] Category lookup failed:', e);
        }
      }
      
      flushSync(() => {
        setWizardState(newState);
        setCurrentStep(targetStep);
      });
      setIsInitialized(true);
    };
    
    processDeepLink();
  }, [modeResolution]);
  
  // === DRAFT SAVE (debounced) ===
  useEffect(() => {
    if (!isInitialized) return;
    
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(wizardState));
      } catch (e) {
        console.warn('Failed to save wizard draft:', e);
      }
    }, 600);
    
    return () => clearTimeout(timer);
  }, [wizardState, isInitialized]);
  
  // === BEFOREUNLOAD WARNING ===
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInitialized && wizardState.mainCategoryId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isInitialized, wizardState.mainCategoryId]);

  // === STEP HANDLERS ===
  
  const handleCategorySelect = useCallback((categoryName: string, categoryId: string) => {
    flushSync(() => {
      setWizardState(prev => ({
        ...prev,
        mainCategory: categoryName,
        mainCategoryId: categoryId,
        // Reset downstream selections
        subcategory: '',
        subcategoryId: '',
        microNames: [],
        microIds: [],
        microSlugs: [],
        answers: {},
      }));
    });
    setCurrentStep(WizardStep.Subcategory);
  }, []);

  const handleSubcategorySelect = useCallback((subcategoryName: string, subcategoryId: string) => {
    flushSync(() => {
      setWizardState(prev => ({
        ...prev,
        subcategory: subcategoryName,
        subcategoryId: subcategoryId,
        // Reset downstream selections
        microNames: [],
        microIds: [],
        microSlugs: [],
        answers: {},
      }));
    });
    setCurrentStep(WizardStep.Micro);
  }, []);

  // === SEARCH HANDLER (critical fix: uses applySearchResult) ===
  const handleSearchSelect = useCallback((result: SearchResult) => {
    // Use the centralized apply function - no draft interference
    const applied = applySearchResult(wizardState, {
      categoryId: result.categoryId,
      categoryName: result.categoryName,
      subcategoryId: result.subcategoryId,
      subcategoryName: result.subcategoryName,
      microId: result.microId,
      microName: result.microName,
      microSlug: result.microSlug,
      extracted: result.extracted,
    });
    
    flushSync(() => {
      setWizardState(applied.state);
      setCurrentStep(applied.step);
    });
    
    // Mark draft checked so we don't prompt on future navigations
    markDraftChecked();
  }, [wizardState]);

  const handleMicroSelect = useCallback((microNames: string[], microIds: string[], microSlugs: string[]) => {
    setWizardState(prev => ({
      ...prev,
      microNames,
      microIds,
      microSlugs,
    }));
  }, []);

  const handleLogisticsChange = useCallback(
    (patch: Partial<WizardState['logistics']>) => {
      setWizardState(prev => ({
        ...prev,
        logistics: { ...prev.logistics, ...patch },
      }));
    },
    []
  );

  const handleExtrasChange = useCallback(
    (patch: Partial<WizardState['extras']>) => {
      setWizardState(prev => ({
        ...prev,
        extras: { ...prev.extras, ...patch },
      }));
    },
    []
  );

  const handleAnswersChange = useCallback(
    (answers: Record<string, unknown>) => {
      setWizardState(prev => ({
        ...prev,
        answers,
      }));
      // Clear question errors when user makes changes
      if (Object.keys(questionErrors).length > 0) {
        setQuestionErrors({});
      }
    },
    [questionErrors]
  );

  // Handler for dispatch mode changes
  const handleDispatchModeChange = useCallback(
    (mode: 'direct' | 'broadcast') => {
      setWizardState(prev => ({
        ...prev,
        dispatchMode: mode,
        // Clear target professional when switching to broadcast
        ...(mode === 'broadcast' ? { targetProfessionalId: undefined, targetProfessionalName: undefined } : {}),
      }));
    },
    []
  );

  // Handler for when question packs are loaded
  const handlePacksLoaded = useCallback((packs: { micro_slug: string; questions: unknown[] }[]) => {
    setQuestionPacks(packs);
  }, []);

  // === NAVIGATION ===
  
  const canAdvance = useCallback((): boolean => {
    switch (currentStep) {
      case WizardStep.Category:
        return !!wizardState.mainCategoryId;
      case WizardStep.Subcategory:
        return !!wizardState.subcategoryId;
      case WizardStep.Micro:
        return wizardState.microIds.length > 0;
      case WizardStep.Questions:
        return true; // Questions are optional - can always continue
      case WizardStep.Logistics:
        // Location required, and if "other" then customLocation must be filled
        if (!wizardState.logistics.location) return false;
        if (wizardState.logistics.location === 'other' && !wizardState.logistics.customLocation?.trim()) {
          return false;
        }
        return true;
      case WizardStep.Extras:
        return true; // Extras are optional
      case WizardStep.Review:
        return true;
      default:
        return false;
    }
  }, [currentStep, wizardState]);

  const handleNext = useCallback(() => {
    // Questions step validation
    if (currentStep === WizardStep.Questions && questionPacks.length > 0) {
      const microAnswers = (wizardState.answers.microAnswers as Record<string, Record<string, unknown>>) || {};
      const validation = validateAllPacks(questionPacks as { micro_slug: string; questions: { id: string; type: string; required?: boolean; min?: number; max?: number; show_if?: { questionId: string; value: string | string[] }; dependsOn?: { questionId: string; value: string | string[] } }[] }[], microAnswers);
      
      if (!validation.valid) {
        setQuestionErrors(validation.errors);
        if (validation.firstErrorId) {
          document.getElementById(validation.firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      setQuestionErrors({});
    }
    
    if (currentStep !== WizardStep.Review && canAdvance()) {
      const nextStep = getNextStep(currentStep);
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  }, [currentStep, canAdvance, questionPacks, wizardState.answers]);

  const handleBack = useCallback(() => {
    const prevStep = getPrevStep(currentStep);
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  }, [currentStep]);

  const handleJumpToStep = useCallback((step: WizardStep) => {
    // Only allow jumping to completed steps or current
    const currentIndex = getStepIndex(currentStep);
    const targetIndex = getStepIndex(step);
    if (targetIndex <= currentIndex) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  // === DRAFT RECOVERY ===
  
  const handleResumeDraft = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const draft = JSON.parse(stored) as WizardState;
        setWizardState(draft);
        setCurrentStep(deriveStepFromState(draft));
      }
    } catch (e) {
      console.warn('Failed to restore draft:', e);
    }
    markDraftChecked();
    setShowDraftModal(false);
    setIsInitialized(true);
  }, []);

  const handleStartFresh = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setWizardState(EMPTY_WIZARD_STATE);
    setCurrentStep(WizardStep.Category);
    markDraftChecked();
    setShowDraftModal(false);
    setIsInitialized(true);
  }, []);
  
  // === CLEAR SESSION (for post-submit) ===
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    clearDraftChecked();
  }, []);

  // === SUBMISSION ===
  
  const handleSubmit = useCallback(async () => {
    // Auth check
    if (!isAuthenticated || !user) {
      // Save current state and set redirect to resume wizard after auth
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(wizardState));
      sessionStorage.setItem('authRedirect', '/post?resume=true');
      navigate('/auth');
      return;
    }

    // Validate
    const validation = validateWizardState(wizardState);
    if (!validation.valid) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }

    // Direct mode validation
    if (wizardState.dispatchMode === 'direct' && !wizardState.targetProfessionalId) {
      toast.error(t('errors.selectPro'));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildJobInsert(user.id, wizardState);
      
      // Set visibility based on dispatch mode
      if (wizardState.dispatchMode === 'direct') {
        payload.is_publicly_listed = false;
        payload.assigned_professional_id = wizardState.targetProfessionalId;
      }
      
      const { data, error } = await supabase
        .from('jobs')
        .insert([payload])
        .select('id')
        .single();

      if (error) {
        // Check for duplicate
        if (error.code === '23505') {
          toast.info(t('toasts.duplicate'));
          navigate('/dashboard');
          return;
        }
        throw error;
      }

      // For direct mode: also create conversation
      if (wizardState.dispatchMode === 'direct' && wizardState.targetProfessionalId) {
        const { data: convoId, error: convoError } = await supabase.rpc(
          'create_direct_conversation',
          {
            p_job_id: data.id,
            p_client_id: user.id,
            p_pro_id: wizardState.targetProfessionalId,
          }
        );

        if (convoError) {
          console.error('Failed to create conversation:', convoError);
          // Job still created, just navigate to dashboard
          clearSession();
          toast.warning(t('toasts.convoFailed'));
          navigate('/dashboard');
          return;
        }

        // Success - navigate to conversation
        clearSession();
        toast.success(t('toasts.directSuccess'));
        navigate(`/messages/${convoId}`);
        return;
      }

      // Broadcast mode: standard flow
      clearSession();
      queryClient.invalidateQueries({ queryKey: ['jobs_board'] });
      toast.success(t('toasts.broadcastSuccess'));
      navigate(`/jobs?highlight=${data.id}`);
      
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(t('toasts.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, user, wizardState, navigate, clearSession, queryClient, t]);

  // === RENDER ===
  
  const stepIndex = getStepIndex(currentStep);
  const totalSteps = STEP_ORDER.length;
  
  // Show loading while initializing (except for draft modal)
  if (!isInitialized && !showDraftModal) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Draft Recovery Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-border/70">
            <CardContent className="pt-6">
              <h3 className="font-display text-lg font-semibold mb-2">
                {t('draft.title')}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {t('draft.description')}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleStartFresh} className="flex-1">
                  {t('draft.startFresh')}
                </Button>
                <Button onClick={handleResumeDraft} className="flex-1">
                  {t('draft.resume')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Bar - Construction style */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {t('progress.stepOf', { current: stepIndex + 1, total: totalSteps })}
            </span>
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            {t(STEP_TITLE_KEYS[currentStep])}
          </span>
        </div>
        
        {/* Segmented progress bar - taller on mobile */}
        <div className="flex gap-1">
          {STEP_ORDER.map((step, idx) => (
            <div 
              key={step}
              className={`h-2.5 md:h-2 flex-1 rounded-sm transition-colors ${
                idx <= stepIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        
        {/* Helper text */}
        <p className="text-xs text-muted-foreground mt-2 hidden sm:block">
          {t('progress.helper')}
        </p>
      </div>

      {/* Step Content */}
      <Card className="border-border/70">
        <CardContent className="pt-6">
          {currentStep === WizardStep.Category && (
            <div className="space-y-6">
              <h3 className="font-display text-lg font-semibold">
                {t('category.headline')}
              </h3>
              
              {/* Universal Search Bar */}
              <ServiceSearchBar onSelect={handleSearchSelect} />
              
              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('category.orBrowse')}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              {/* Category Grid */}
              <CategorySelector
                selectedCategory={wizardState.mainCategory}
                onSelect={handleCategorySelect}
              />
            </div>
          )}

          {currentStep === WizardStep.Subcategory && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold">
                {t('subcategory.headline', { category: wizardState.mainCategory.toLowerCase() })}
              </h3>
              <SubcategorySelector
                categoryId={wizardState.mainCategoryId}
                categoryName={wizardState.mainCategory}
                selectedSubcategoryId={wizardState.subcategoryId}
                onSelect={handleSubcategorySelect}
              />
            </div>
          )}

          {currentStep === WizardStep.Micro && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold">
                {t('micro.headline')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('micro.hint')}
              </p>
              <MicroStep
                subcategoryId={wizardState.subcategoryId}
                selectedMicroIds={wizardState.microIds}
                onSelect={handleMicroSelect}
              />
            </div>
          )}

          {currentStep === WizardStep.Questions && (
            <QuestionsStep
              microSlugs={wizardState.microSlugs}
              answers={wizardState.answers}
              onChange={handleAnswersChange}
              onPacksLoaded={handlePacksLoaded}
              onComplete={handleNext}
              errors={questionErrors}
            />
          )}

          {currentStep === WizardStep.Logistics && (
            <LogisticsStep
              logistics={wizardState.logistics}
              onChange={handleLogisticsChange}
            />
          )}

          {currentStep === WizardStep.Extras && (
            <ExtrasStep
              extras={wizardState.extras}
              onChange={handleExtrasChange}
            />
          )}

          {currentStep === WizardStep.Review && (
            <ReviewStep
              wizardState={wizardState}
              onEdit={handleJumpToStep}
              onDispatchModeChange={handleDispatchModeChange}
              isAuthenticated={isAuthenticated}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons - Sticky on mobile */}
      <div className="
        mt-6 md:static md:bg-transparent md:border-0 md:p-0 md:pb-0 md:backdrop-blur-none
        fixed bottom-0 left-0 right-0 z-40
        bg-background/95 backdrop-blur-sm border-t border-border
        p-4 pb-safe-4
        flex items-center justify-between
      ">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === WizardStep.Category}
          className="gap-2 min-h-[48px] md:min-h-0"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('buttons.back')}
        </Button>

        {currentStep === WizardStep.Review ? (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="gap-2 min-h-[48px] md:min-h-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('ui.submitting')}
              </>
            ) : isAuthenticated ? (
              <>
                {t('buttons.submit')}
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                {t('buttons.signInToSubmit')}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          // Show Continue button for Micro step and later
          currentStep !== WizardStep.Category && currentStep !== WizardStep.Subcategory && (
            <Button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="gap-2 min-h-[48px] md:min-h-0"
            >
              {t('buttons.continue')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export default CanonicalJobWizard;
