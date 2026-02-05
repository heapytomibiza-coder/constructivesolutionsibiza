/**
 * Canonical Job Wizard
 * V2 clean architecture - 7-step flow with string enum steps
 * 
 * Flow: Category → Subcategory → Micro → Questions → Logistics → Extras → Review
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  STEP_TITLES,
  STEP_ORDER,
  getStepIndex,
  getNextStep,
  getPrevStep,
  isValidStep,
} from './types';
import { useWizardUrlStep } from './hooks/useWizardUrlStep';
import { useWizardDraft } from './hooks/useWizardDraft';
import { buildJobInsert, validateWizardState } from './lib/buildJobPayload';
import { validateAllPacks, type ValidationErrorMap } from './lib/stepValidation';

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

interface CanonicalJobWizardProps {
  className?: string;
}

export function CanonicalJobWizard({ className }: CanonicalJobWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useSession();
  
  // Core wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.Category);
  const [wizardState, setWizardState] = useState<WizardState>(EMPTY_WIZARD_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Question pack validation state
  const [questionPacks, setQuestionPacks] = useState<{ micro_slug: string; questions: unknown[] }[]>([]);
  const [questionErrors, setQuestionErrors] = useState<Record<string, ValidationErrorMap>>({});
  
  // URL sync
  useWizardUrlStep(currentStep, setCurrentStep);
  
  // Draft management
  const { isDirty, checkForDraft, getPendingDraft, clearDraft, resetSession } = useWizardDraft(wizardState);
  
  // Draft recovery modal state
  const [showDraftModal, setShowDraftModal] = useState(false);
  
  // Check for draft on mount
  useEffect(() => {
    const result = checkForDraft();
    if (result.status === 'found') {
      setShowDraftModal(true);
    }
  }, []);
  
  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

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

  // Deep-link handler for search results - skips directly to Questions
  const handleSearchSelect = useCallback((result: SearchResult) => {
    flushSync(() => {
      setWizardState(prev => ({
        ...prev,
        mainCategory: result.categoryName,
        mainCategoryId: result.categoryId,
        subcategory: result.subcategoryName,
        subcategoryId: result.subcategoryId,
        microNames: [result.microName],
        microIds: [result.microId],
        microSlugs: [result.microSlug],
        answers: {},
      }));
    });
    setCurrentStep(WizardStep.Questions);
  }, []);

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
    const draft = getPendingDraft();
    if (draft) {
      setWizardState(draft);
      // Jump to the furthest completed step
      if (draft.logistics.location) {
        setCurrentStep(WizardStep.Review);
      } else if (draft.microIds.length > 0) {
        setCurrentStep(WizardStep.Logistics);
      } else if (draft.subcategoryId) {
        setCurrentStep(WizardStep.Micro);
      } else if (draft.mainCategoryId) {
        setCurrentStep(WizardStep.Subcategory);
      }
    }
    setShowDraftModal(false);
  }, [getPendingDraft]);

  const handleStartFresh = useCallback(() => {
    clearDraft();
    setWizardState(EMPTY_WIZARD_STATE);
    setCurrentStep(WizardStep.Category);
    setShowDraftModal(false);
  }, [clearDraft]);

  // === SUBMISSION ===
  
  const handleSubmit = useCallback(async () => {
    // Auth check
    if (!isAuthenticated || !user) {
      // Save current state and redirect to auth
      sessionStorage.setItem('wizardState', JSON.stringify(wizardState));
      navigate('/auth?returnUrl=/post');
      return;
    }

    // Validate
    const validation = validateWizardState(wizardState);
    if (!validation.valid) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildJobInsert(user.id, wizardState);
      
      const { data, error } = await supabase
        .from('jobs')
        .insert([payload])
        .select('id')
        .single();

      if (error) {
        // Check for duplicate
        if (error.code === '23505') {
          toast.info('This job was already submitted');
          navigate('/dashboard');
          return;
        }
        throw error;
      }

      // Success - clear draft, invalidate cache, and navigate
      clearDraft();
      resetSession();
      queryClient.invalidateQueries({ queryKey: ['jobs_board'] });
      toast.success('Job posted successfully!');
      navigate(`/jobs?highlight=${data.id}`);
      
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, user, wizardState, navigate, clearDraft, resetSession]);

  // === RENDER ===
  
  const stepIndex = getStepIndex(currentStep);
  const totalSteps = STEP_ORDER.length;
  const progress = (stepIndex / (totalSteps - 1)) * 100;

  return (
    <div className={className}>
      {/* Draft Recovery Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-border/70">
            <CardContent className="pt-6">
              <h3 className="font-display text-lg font-semibold mb-2">
                Resume your draft?
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                We found an unfinished job posting. Would you like to continue where you left off?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleStartFresh} className="flex-1">
                  Start Fresh
                </Button>
                <Button onClick={handleResumeDraft} className="flex-1">
                  Resume Draft
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
              Step {stepIndex + 1} of {totalSteps}
            </span>
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            {STEP_TITLES[currentStep]}
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
          Building your job specification helps professionals quote accurately
        </p>
      </div>

      {/* Step Content */}
      <Card className="border-border/70">
        <CardContent className="pt-6">
          {currentStep === WizardStep.Category && (
            <div className="space-y-6">
              <h3 className="font-display text-lg font-semibold">
                What type of service do you need?
              </h3>
              
              {/* Universal Search Bar */}
              <ServiceSearchBar onSelect={handleSearchSelect} />
              
              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  or browse categories
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
                What kind of {wizardState.mainCategory.toLowerCase()} work?
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
                Select the specific tasks you need
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose all that apply — this helps match you with the right professionals
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
              isAuthenticated={isAuthenticated}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === WizardStep.Category}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep === WizardStep.Review ? (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isAuthenticated ? (
              <>
                Post Job
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Sign In to Post
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
              className="gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export default CanonicalJobWizard;
