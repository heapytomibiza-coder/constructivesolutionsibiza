/**
 * Canonical Job Wizard
 * V3 architecture - Single-point mode resolution eliminates state races
 * 
 * Flow: Category → Subcategory → Micro → Questions → Logistics → Extras → Review
 * 
 * Mode Resolution (priority order):
 * 1. ?edit=<jobId>  --> fetch job, hydrate, edit mode
 * 2. Search selection → direct to Questions (bypass draft)
 * 3. Deep-link params → apply and navigate (bypass draft)
 * 4. Resume flag → restore draft directly
 * 5. Draft exists → prompt user
 * 6. Fresh start
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Loader2, FileText, HelpCircle } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { txCategory } from '@/i18n/taxonomyTranslations';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/trackEvent';

// Canonical modules
import { 
  WizardState, 
  WizardStep, 
  EMPTY_WIZARD_STATE, 
  STEP_ORDER,
  getStepIndex,
  getNextStep,
  getPrevStep,
  type CustomRequest,
} from './types';
import { useWizardUrlStep } from './hooks/useWizardUrlStep';
import { useProServiceScope } from './hooks/useProServiceScope';
import { buildJobInsert, validateWizardState } from './lib/buildJobPayload';
import { hydrateFromJob, canEditJob } from './lib/hydrateFromJob';
import { validateAllPacks, isStep5Complete, type ValidationErrorMap } from './lib/stepValidation';
import {
  resolveWizardMode,
  applySearchResult,
  markDraftChecked,
  clearDraftChecked,
  deriveStepFromState,
  type ModeResolution,
} from './lib/resolveWizardMode';

// DB-powered selectors
import CategorySelector from '@/features/wizard/db-powered/CategorySelector';
import SubcategorySelector from '@/features/wizard/db-powered/SubcategorySelector';
import MicroStep from '@/features/wizard/db-powered/MicroStep';
import { ServiceSearchBar, type SearchResult } from '@/features/wizard/db-powered/ServiceSearchBar';

// Step components
import { LogisticsStep } from './steps/LogisticsStep';
import { ExtrasStep } from './steps/ExtrasStep';
import { ReviewStep } from './steps/ReviewStep';
import { QuestionsStep } from './steps/QuestionsStep';
import { CustomRequestForm } from './steps/CustomRequestForm';
import { WizardBreadcrumbs } from './components/WizardBreadcrumbs';

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
  const { t: tCommon } = useTranslation('common');
  const { user, isAuthenticated } = useSession();
  
  // === INITIALIZATION STATE ===
  const [isInitialized, setIsInitialized] = useState(false);
  const [modeResolution, setModeResolution] = useState<ModeResolution | null>(null);
  
  // Core wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.Category);
  const [wizardState, setWizardState] = useState<WizardState>(EMPTY_WIZARD_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // === EDIT MODE STATE ===
  const [isEditMode, setIsEditMode] = useState(false);
  const [editJobId, setEditJobId] = useState<string | null>(null);
  
  // Question pack validation state
  const [questionPacks, setQuestionPacks] = useState<{ micro_slug: string; questions: unknown[] }[]>([]);
  const [questionErrors, setQuestionErrors] = useState<Record<string, ValidationErrorMap>>({});
  
  // Draft modal
  const [showDraftModal, setShowDraftModal] = useState(false);
  
  // Custom request form toggle
  const [showCustomForm, setShowCustomForm] = useState(false);
  
  // Logistics validation attempt tracking
  const [logisticsAttempted, setLogisticsAttempted] = useState(false);
  
  // Deep-link processing ref
  const deepLinkProcessedRef = useRef(false);
  
  // === DIRECT MODE SCOPING ===
  const proScope = useProServiceScope(wizardState.targetProfessionalId);
  const isDirectMode = wizardState.dispatchMode === 'direct' && !!wizardState.targetProfessionalId;
  
  // URL sync (only after initialization — prevents overwriting deep-link params)
  useWizardUrlStep(currentStep, setCurrentStep, isInitialized);
  
  // === EDIT MODE DETECTION (highest priority) ===
  useEffect(() => {
    if (isInitialized) return;
    
    const sp = new URLSearchParams(location.search);
    const editId = sp.get('edit');
    if (!editId) return; // Not edit mode, let normal resolution handle it
    
    let cancelled = false;
    
    const loadJob = async () => {
      const result = await hydrateFromJob(editId);
      if (cancelled) return;
      
      if (!result) {
        toast.error('Could not load job for editing');
        navigate('/dashboard/client');
        return;
      }
      
      setIsEditMode(true);
      setEditJobId(editId);
      setWizardState(result.state);
      setCurrentStep(deriveStepFromState(result.state));
      markDraftChecked();
      setIsInitialized(true);
      trackEvent('job_wizard_started', 'client', { mode: 'edit', job_id: editId });
    };
    
    loadJob();
    return () => { cancelled = true; };
  }, [location.search, isInitialized, navigate]);
  
  // === SINGLE-POINT MODE RESOLUTION (skipped if edit mode) ===
  useEffect(() => {
    if (isInitialized) return;
    
    // Skip if edit param present (handled above)
    const sp = new URLSearchParams(location.search);
    if (sp.get('edit')) return;
    
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
      trackEvent('job_wizard_started', 'client', { mode: resolution.mode });
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
          // Failed to fetch professional name - use fallback
          newState = {
            ...newState,
            dispatchMode: 'direct',
            targetProfessionalId,
            targetProfessionalName: 'Professional',
          };
        }
      }
      
      // === MICRO HYDRATION ===
      // Lookup micro slug and hydrate parents from FK relationships
      // This enables deep-linking with just /post?micro=sink-leak
      if (microSlug && !categoryId && !subcategoryId) {
        // Using maybeSingle() to avoid crashes on 0 or >1 rows
        const { data, error } = await supabase
          .from('service_micro_categories')
          .select(`
            id, name, slug,
            service_subcategories:subcategory_id (
              id, name,
              service_categories:category_id ( id, name )
            )
          `)
          .eq('slug', microSlug)
          .eq('is_active', true)
          .maybeSingle();

        // Safely extract nested relations (may be null or array depending on config)
        const sub = data?.service_subcategories;
        const cat = sub && 'service_categories' in sub ? sub.service_categories : null;

        if (!error && data && sub && cat && 'id' in sub && 'id' in cat) {
          newState = {
            ...newState,
            mainCategory: (cat as { id: string; name: string }).name,
            mainCategoryId: (cat as { id: string; name: string }).id,
            subcategory: (sub as { id: string; name: string }).name,
            subcategoryId: (sub as { id: string; name: string }).id,
            microNames: [data.name],
            microIds: [data.id],
            microSlugs: [data.slug],
          };
          targetStep = WizardStep.Questions;
          // Deep-link hydrated micro → Questions
        } else {
          // Deep-link micro lookup failed - stay at conservative step
          // Stay at resolver's conservative step (Micro or Category)
        }
      }
      // Micro WITH full hierarchy provided - validate and hydrate
      else if (microSlug && categoryId && subcategoryId) {
        const { data: micro, error } = await supabase
          .from('service_micro_categories')
          .select('id, name, slug, subcategory_id')
          .eq('slug', microSlug)
          .eq('is_active', true)
          .maybeSingle();
        
        if (!error && micro && micro.subcategory_id === subcategoryId) {
          // Validate subcategory belongs to category
          const { data: sub } = await supabase
            .from('service_subcategories')
            .select(`
              id, name, category_id,
              service_categories:category_id ( id, name )
            `)
            .eq('id', subcategoryId)
            .maybeSingle();
          
          const cat = sub?.service_categories;
          if (sub && cat && sub.category_id === categoryId && 'id' in cat) {
            newState = {
              ...newState,
              mainCategory: (cat as { id: string; name: string }).name,
              mainCategoryId: (cat as { id: string; name: string }).id,
              subcategory: sub.name,
              subcategoryId: sub.id,
              microNames: [micro.name],
              microIds: [micro.id],
              microSlugs: [micro.slug],
            };
            targetStep = WizardStep.Questions;
            // Deep-link full hierarchy validated → Questions
          }
        }
      }
      // Category/subcategory only (no micro)
      else if (categoryId) {
        const { data: cat, error: catErr } = await supabase
          .from('service_categories')
          .select('id, name')
          .eq('id', categoryId)
          .eq('is_active', true)
          .maybeSingle();
        
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
              .maybeSingle();
            
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
        // Strip base64 photos before saving to avoid exceeding storage quota
        const draftState = {
          ...wizardState,
          extras: {
            ...wizardState.extras,
            photos: wizardState.extras.photos.map(p =>
              p.startsWith('data:') ? '[photo]' : p
            ),
          },
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draftState));
      } catch (e) {
        // Quota exceeded — clear old drafts and retry once
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {}
      }
    }, 600);
    
    return () => clearTimeout(timer);
  }, [wizardState, isInitialized]);
  
  // === STEP VIEW TRACKING ===
  const hasSubmittedRef = useRef(false);
  const lastStepRef = useRef(currentStep);
  const lastCategoryRef = useRef(wizardState.mainCategory);
  const isInitializedRef = useRef(false);
  const hasMeaningfulStateRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    lastStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    lastCategoryRef.current = wizardState.mainCategory;
    hasMeaningfulStateRef.current = !!wizardState.mainCategoryId;
  }, [wizardState.mainCategory, wizardState.mainCategoryId]);

  useEffect(() => {
    isInitializedRef.current = isInitialized;
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    // Reset logistics validation when leaving the step
    if (currentStep !== WizardStep.Logistics) {
      setLogisticsAttempted(false);
    }
    trackEvent('job_wizard_step_viewed', 'client', {
      step: currentStep,
      step_index: getStepIndex(currentStep),
    }, { category: wizardState.mainCategory });
    if (currentStep === WizardStep.Review) {
      trackEvent('review_step_entered', 'client', {}, { category: wizardState.mainCategory });
    }
  }, [currentStep, isInitialized, wizardState.mainCategory]);

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

  // === ABANDONMENT TRACKING (reads from refs to avoid stale closures) ===
  useEffect(() => {
    return () => {
      if (!isInitializedRef.current) return;
      if (!hasMeaningfulStateRef.current) return;
      if (hasSubmittedRef.current) return;

      trackEvent('job_wizard_abandoned', 'client', {
        last_step: lastStepRef.current,
        step_index: getStepIndex(lastStepRef.current),
      }, { category: lastCategoryRef.current });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        answers: { microAnswers: {} },
        // Reset custom mode when picking structured
        wizardMode: 'structured',
        customRequest: undefined,
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
        answers: { microAnswers: {} },
        // Reset custom mode when picking structured
        wizardMode: 'structured',
        customRequest: undefined,
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
    (answers: WizardState['answers']) => {
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

  // === CUSTOM REQUEST HANDLER ===
  const handleCustomRequestSubmit = useCallback((request: CustomRequest, categoryId: string, categoryName: string) => {
    flushSync(() => {
      setWizardState(prev => ({
        ...prev,
        wizardMode: 'custom',
        customRequest: request,
        mainCategory: categoryName,
        mainCategoryId: categoryId,
        // Clear structured fields
        subcategory: '',
        subcategoryId: '',
        microNames: [],
        microIds: [],
        microSlugs: [],
        answers: { microAnswers: {} },
      }));
    });
    setShowCustomForm(false);
    setCurrentStep(WizardStep.Logistics);
    trackEvent('custom_request_submitted', 'client', { category: categoryName });
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
      case WizardStep.Logistics: {
        const step5 = isStep5Complete(wizardState.logistics);
        if (!step5.ok) return false;
        if (wizardState.logistics.location === 'other' && !wizardState.logistics.customLocation?.trim()) {
          return false;
        }
        return true;
      }
      case WizardStep.Extras:
        return true; // Extras are optional
      case WizardStep.Review:
        return true;
      default:
        return false;
    }
  }, [currentStep, wizardState]);

  const handleNext = useCallback(() => {
    // Questions step validation (only in structured mode)
    if (currentStep === WizardStep.Questions && wizardState.wizardMode !== 'custom' && questionPacks.length > 0) {
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
      trackEvent('job_wizard_step_completed', 'client', {
        step: currentStep,
        stepIndex: getStepIndex(currentStep),
        category: wizardState.mainCategory,
      });

      let nextStep = getNextStep(currentStep);

      // Custom mode: skip Subcategory, Micro, and Questions steps
      if (wizardState.wizardMode === 'custom') {
        while (nextStep && [WizardStep.Subcategory, WizardStep.Micro, WizardStep.Questions].includes(nextStep)) {
          nextStep = getNextStep(nextStep);
        }
      }

      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  }, [currentStep, canAdvance, questionPacks, wizardState.answers, wizardState.wizardMode, wizardState.mainCategory]);

  const handleBack = useCallback(() => {
    let prevStep = getPrevStep(currentStep);

    // Custom mode: skip Subcategory, Micro, and Questions steps when going back
    if (wizardState.wizardMode === 'custom') {
      while (prevStep && [WizardStep.Subcategory, WizardStep.Micro, WizardStep.Questions].includes(prevStep)) {
        prevStep = getPrevStep(prevStep);
      }
    }

    if (prevStep) {
      setCurrentStep(prevStep);
    }
  }, [currentStep, wizardState.wizardMode]);

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
        // Rehydrate dates from strings (JSON.parse returns strings for Date objects)
        if (draft.logistics) {
          const rehydrateDate = (v: unknown): Date | undefined => {
            if (!v) return undefined;
            if (v instanceof Date) return v;
            if (typeof v === 'string') {
              const d = new Date(v);
              return Number.isNaN(d.getTime()) ? undefined : d;
            }
            return undefined;
          };
          draft.logistics.startDate = rehydrateDate(draft.logistics.startDate);
          draft.logistics.completionDate = rehydrateDate(draft.logistics.completionDate);
          draft.logistics.consultationDate = rehydrateDate(draft.logistics.consultationDate);
        }
        setWizardState(draft);
        setCurrentStep(deriveStepFromState(draft));
      }
    } catch (e) {
      // Draft restore failed silently
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
    sessionStorage.removeItem('authRedirect');
    try { localStorage.removeItem('wizardState_authDraft'); localStorage.removeItem('authRedirect'); } catch {}
    clearDraftChecked();
  }, []);

  // === SUBMISSION (handles both new jobs and edits) ===
  
  const handleSubmit = useCallback(async () => {
    trackEvent('review_post_clicked', 'client', { category: wizardState.mainCategory });

    // Auth check — persist draft to BOTH storages so it survives
    // new-tab email-confirmation flows (sessionStorage is tab-scoped)
    if (!isAuthenticated || !user) {
      trackEvent('job_post_submit_auth_redirect', 'client', { category: wizardState.mainCategory });
      const draftForStorage = {
        ...wizardState,
        extras: {
          ...wizardState.extras,
          photos: wizardState.extras.photos.map(p =>
            p.startsWith('data:') ? '[photo]' : p
          ),
        },
      };
      const draftJson = JSON.stringify(draftForStorage);
      try { sessionStorage.setItem(STORAGE_KEY, draftJson); } catch {}
      try { localStorage.setItem('wizardState_authDraft', draftJson); } catch {}
      sessionStorage.setItem('authRedirect', '/post?resume=true');
      try { localStorage.setItem('authRedirect', '/post?resume=true'); } catch {}
      navigate('/auth?returnUrl=' + encodeURIComponent('/post?resume=true'));
      return;
    }

    // Validate
    const validation = validateWizardState(wizardState);
    if (!validation.valid) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }

    // Track submit attempt (after validation passes, before DB call)
    trackEvent('job_post_submit_attempt', 'client', {
      category: wizardState.mainCategory,
      mode: isEditMode ? 'edit' : 'new',
      wizardMode: wizardState.wizardMode,
    });

    setIsSubmitting(true);

    try {
      const payload = buildJobInsert(user.id, wizardState);

      if (isEditMode && editJobId) {
        // === EDIT MODE: UPDATE existing job (status-gated) ===
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user_id, status, is_publicly_listed, ...updatePayload } = payload;
        const { data: updatedRows, error: updateError } = await supabase
          .from('jobs')
          .update(updatePayload)
          .eq('id', editJobId)
          .in('status', ['draft', 'ready', 'open'])
          .select('id');

        if (updateError) throw updateError;

        if (!updatedRows || updatedRows.length === 0) {
          toast.error(t('toasts.editNotAllowed'));
          navigate('/dashboard/client');
          return;
        }

        // Atomically increment edit_version
        const { error: incError } = await supabase.rpc('increment_job_edit_version', {
          p_job_id: editJobId,
        });
        if (incError) console.warn('Failed to increment edit_version:', incError);

        // Track the edit event
        trackEvent('job_edited', 'client', { jobId: editJobId, category: wizardState.mainCategory });

        hasSubmittedRef.current = true;
        clearSession();
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['client_jobs'] });
        queryClient.invalidateQueries({ queryKey: ['client_stats'] });
        toast.success(t('toasts.updateSuccess'));
        navigate('/dashboard/client');
      } else {
        // === NEW JOB: Rate limit check (5 posts/day) ===
        const { data: allowed, error: rlErr } = await supabase.rpc('check_rate_limit', {
          p_user_id: user.id,
          p_action: 'job_post',
          p_max_count: 5,
          p_window_interval: '24 hours',
        });
        if (rlErr) console.warn('Rate limit check failed:', rlErr);
        if (allowed === false) {
          toast.error(t('toasts.rateLimited', "You've reached the daily limit for posting jobs. Please try again tomorrow."));
          return;
        }

        // === INSERT ===
        const { data, error } = await supabase
          .from('jobs')
          .insert([payload])
          .select('id')
          .single();

        if (error) {
          if (error.code === '23505') {
            toast.info(t('toasts.duplicate'));
            navigate('/dashboard/client');
            return;
          }
          throw error;
        }

        hasSubmittedRef.current = true;
        clearSession();
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['client_jobs'] });
        queryClient.invalidateQueries({ queryKey: ['client_stats'] });
        trackEvent('job_posted', 'client', { jobId: data.id, category: wizardState.mainCategory });

        // Fire-and-forget: translate user-generated content
        supabase.functions.invoke('translate-content', {
          body: {
            entity: 'jobs',
            id: data.id,
            fields: {
              title: payload.title,
              teaser: payload.teaser ?? '',
              description: payload.description ?? '',
            },
          },
        }).catch(() => { /* translation is best-effort */ });

        toast.success(t('toasts.postSuccess'));
        navigate('/jobs');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      trackEvent('job_post_submit_fail', 'client', {
        category: wizardState.mainCategory,
        reason: error?.message || 'unknown',
        code: error?.code || null,
        mode: isEditMode ? 'edit' : 'new',
      });
      toast.error(t('toasts.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, user, wizardState, navigate, clearSession, queryClient, t, isEditMode, editJobId]);

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

      {/* Breadcrumb tags */}
      <WizardBreadcrumbs
        wizardState={wizardState}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {/* Step Content */}
      <Card className="border-border/70">
        <CardContent className="pt-6">
          {/* Custom Request Form (overlays step content) */}
          {showCustomForm ? (
            <CustomRequestForm
              initial={wizardState.customRequest}
              preselectedCategoryId={wizardState.mainCategoryId || undefined}
              preselectedCategoryName={wizardState.mainCategory || undefined}
              onBack={() => setShowCustomForm(false)}
              onSubmit={handleCustomRequestSubmit}
            />
          ) : (
            <>
              {currentStep === WizardStep.Category && (
                <div className="space-y-6">
                  <h3 className="font-display text-lg font-semibold">
                    {t('category.headline')}
                  </h3>
                  
                  {/* Direct mode scoping banner */}
                  {isDirectMode && proScope.proName && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-foreground">
                      {t('scope.showingServicesFor', { name: proScope.proName })}
                    </div>
                  )}
                  {isDirectMode && proScope.isEmpty && !proScope.isLoading && (
                    <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-sm text-muted-foreground">
                      {t('scope.noServices')}
                    </div>
                  )}
                  
                  {/* Universal Search Bar - hide in scoped direct mode */}
                  {!isDirectMode && <ServiceSearchBar onSelect={handleSearchSelect} />}
                  
                  {/* Divider - hide in scoped direct mode */}
                  {!isDirectMode && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        {t('category.orBrowse')}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  
                  {/* Category Grid */}
                  <CategorySelector
                    selectedCategory={wizardState.mainCategory}
                    onSelect={handleCategorySelect}
                    allowedCategoryIds={isDirectMode ? proScope.categoryIds : undefined}
                  />

                  {/* Custom Request CTA */}
                  {!isDirectMode && (
                    <div className="pt-4 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowCustomForm(true)}
                        className="w-full flex items-center gap-3 p-4 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group"
                      >
                        <HelpCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {t('custom.cta')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('custom.ctaDescription')}
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentStep === WizardStep.Subcategory && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold">
                    {t('subcategory.headline', { category: txCategory(wizardState.mainCategory, tCommon) ?? wizardState.mainCategory })}
                  </h3>
                  <SubcategorySelector
                    categoryId={wizardState.mainCategoryId}
                    categoryName={wizardState.mainCategory}
                    selectedSubcategoryId={wizardState.subcategoryId}
                    onSelect={handleSubcategorySelect}
                    allowedSubcategoryIds={isDirectMode ? proScope.subcategoryIds : undefined}
                  />

                  {/* Custom Request CTA */}
                  {!isDirectMode && (
                    <div className="pt-4 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowCustomForm(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group"
                      >
                        <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                        <p className="text-sm text-muted-foreground group-hover:text-foreground">
                          {t('custom.cta')}
                        </p>
                      </button>
                    </div>
                  )}
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
                    allowedMicroIds={isDirectMode ? proScope.microIds : undefined}
                  />

                  {/* Custom Request CTA */}
                  {!isDirectMode && (
                    <div className="pt-4 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowCustomForm(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group"
                      >
                        <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                        <p className="text-sm text-muted-foreground group-hover:text-foreground">
                          {t('custom.cta')}
                        </p>
                      </button>
                    </div>
                  )}
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
              showValidation={logisticsAttempted}
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
              isAuthenticated={isAuthenticated}
            />
          )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons - Hidden when custom form is shown (it has its own buttons) */}
      {!showCustomForm && (
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
            className="gap-2 min-h-[48px] md:min-h-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('ui.submitting')}
              </>
            ) : isEditMode ? (
              <>
                {t('buttons.saveChanges')}
                <ArrowRight className="h-4 w-4" />
              </>
            ) : isAuthenticated ? (
              <>
                {t('buttons.getMatched')}
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                {t('buttons.signInGetMatched')}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          // Show Continue button for Micro step and later
          currentStep !== WizardStep.Category && currentStep !== WizardStep.Subcategory && (
            <Button
              onClick={() => {
                if (!canAdvance() && currentStep === WizardStep.Logistics) {
                  setLogisticsAttempted(true);
                  const step5 = isStep5Complete(wizardState.logistics);
                  const errors = [...step5.errors];
                  if (wizardState.logistics.location === 'other' && !wizardState.logistics.customLocation?.trim()) {
                    errors.push(t('logistics.specifyLocation', 'Please specify your location'));
                  }
                  if (errors.length > 0) {
                    toast.error(errors[0]);
                    requestAnimationFrame(() => {
                      const firstMissing = document.querySelector('[class*="ring-destructive"]');
                      firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    });
                  }
                  return;
                }
                handleNext();
              }}
              className="gap-2 min-h-[48px] md:min-h-0"
            >
              {t('buttons.continue')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
      )}
    </div>
  );
}

export default CanonicalJobWizard;
