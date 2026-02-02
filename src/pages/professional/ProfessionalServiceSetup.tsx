import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import { useProfessionalServices } from '@/hooks/useProfessionalServices';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CategorySelector from '@/components/wizard/db-powered/CategorySelector';
import SubcategorySelector from '@/components/wizard/db-powered/SubcategorySelector';
import MicroStep from '@/components/wizard/db-powered/MicroStep';
import { ArrowLeft, Check, Plus, X, Loader2 } from 'lucide-react';

type SetupStep = 'browse' | 'category' | 'subcategory' | 'micro';

/**
 * PROFESSIONAL SERVICE SETUP
 * 
 * Multi-category service selection for professionals.
 * Allows selecting micros across different categories.
 */
const ProfessionalServiceSetup = () => {
  const navigate = useNavigate();
  const { user, refresh } = useSession();
  const { 
    servicesWithDetails, 
    servicesCount, 
    isLoading,
    addMultipleServices,
    removeService,
    isAdding,
    isRemoving 
  } = useProfessionalServices();

  // Wizard state for adding services
  const [step, setStep] = useState<SetupStep>('browse');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState<string>('');
  const [pendingMicroIds, setPendingMicroIds] = useState<string[]>([]);
  const [pendingMicroNames, setPendingMicroNames] = useState<string[]>([]);

  // Get existing micro IDs for duplicate prevention
  const existingMicroIds = servicesWithDetails.map(s => s.micro_id);

  const handleCategorySelect = (name: string, id: string) => {
    setSelectedCategoryId(id);
    setSelectedCategoryName(name);
    setSelectedSubcategoryId('');
    setSelectedSubcategoryName('');
    setPendingMicroIds([]);
    setPendingMicroNames([]);
    setStep('subcategory');
  };

  const handleSubcategorySelect = (name: string, id: string) => {
    setSelectedSubcategoryId(id);
    setSelectedSubcategoryName(name);
    setPendingMicroIds([]);
    setPendingMicroNames([]);
    setStep('micro');
  };

  const handleMicroSelect = (names: string[], ids: string[], slugs: string[]) => {
    // Filter out already-added services
    const newIds = ids.filter(id => !existingMicroIds.includes(id));
    const newNames = names.filter((_, i) => !existingMicroIds.includes(ids[i]));
    setPendingMicroIds(newIds);
    setPendingMicroNames(newNames);
  };

  const handleAddServices = async () => {
    if (pendingMicroIds.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    try {
      await addMultipleServices(pendingMicroIds);
      toast.success(`Added ${pendingMicroIds.length} service(s)`);
      
      // Reset wizard
      setStep('browse');
      setSelectedCategoryId('');
      setSelectedCategoryName('');
      setSelectedSubcategoryId('');
      setSelectedSubcategoryName('');
      setPendingMicroIds([]);
      setPendingMicroNames([]);
    } catch (error) {
      console.error('Error adding services:', error);
      toast.error('Failed to add services');
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      await removeService(serviceId);
      toast.success('Service removed');
    } catch (error) {
      console.error('Error removing service:', error);
      toast.error('Failed to remove service');
    }
  };

  const handleComplete = async () => {
    if (servicesCount === 0) {
      toast.error('Please add at least one service before completing');
      return;
    }

    try {
      // Update professional profile onboarding phase
      const { error } = await supabase
        .from('professional_profiles')
        .update({ onboarding_phase: 'complete' })
        .eq('user_id', user?.id);

      if (error) throw error;

      await refresh();
      toast.success('Service setup complete!');
      navigate('/dashboard/pro');
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to complete setup');
    }
  };

  const handleBack = () => {
    if (step === 'micro') {
      setStep('subcategory');
      setPendingMicroIds([]);
      setPendingMicroNames([]);
    } else if (step === 'subcategory') {
      setStep('category');
      setSelectedSubcategoryId('');
      setSelectedSubcategoryName('');
    } else if (step === 'category') {
      setStep('browse');
      setSelectedCategoryId('');
      setSelectedCategoryName('');
    }
  };

  const handleStartAdding = () => {
    setStep('category');
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-ocean flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">CS</span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              CS Ibiza
            </span>
          </Link>
          <Button variant="ghost" onClick={() => navigate('/onboarding/professional')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Onboarding
          </Button>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Set Up Your Services
            </h1>
            <p className="text-muted-foreground">
              Select the services you offer. You can add services from multiple categories.
            </p>
          </div>

          {/* Current Services */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">Your Services</CardTitle>
                  <CardDescription>
                    {servicesCount === 0 
                      ? 'No services added yet' 
                      : `${servicesCount} service${servicesCount !== 1 ? 's' : ''} configured`}
                  </CardDescription>
                </div>
                {step === 'browse' && (
                  <Button onClick={handleStartAdding} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Services
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : servicesWithDetails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Add your first service to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {servicesWithDetails.map((service) => (
                    <div 
                      key={service.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{service.micro_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.category_name} → {service.subcategory_name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveService(service.id)}
                        disabled={isRemoving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Services Wizard */}
          {step !== 'browse' && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="font-display">
                      {step === 'category' && 'Select Category'}
                      {step === 'subcategory' && selectedCategoryName}
                      {step === 'micro' && selectedSubcategoryName}
                    </CardTitle>
                    <CardDescription>
                      {step === 'category' && 'Choose a category to browse services'}
                      {step === 'subcategory' && 'Select a subcategory'}
                      {step === 'micro' && 'Select services you offer (multiple allowed)'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {step === 'category' && (
                  <CategorySelector
                    selectedCategory={selectedCategoryName}
                    onSelect={handleCategorySelect}
                  />
                )}

                {step === 'subcategory' && (
                  <SubcategorySelector
                    categoryId={selectedCategoryId}
                    selectedSubcategoryId={selectedSubcategoryId}
                    onSelect={handleSubcategorySelect}
                  />
                )}

                {step === 'micro' && (
                  <>
                    <MicroStep
                      subcategoryId={selectedSubcategoryId}
                      selectedMicroIds={pendingMicroIds}
                      onSelect={handleMicroSelect}
                      multiSelect={true}
                    />
                    
                    {pendingMicroIds.length > 0 && (
                      <div className="mt-6 flex justify-end">
                        <Button 
                          onClick={handleAddServices}
                          disabled={isAdding}
                          className="gap-2"
                        >
                          {isAdding ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Add {pendingMicroIds.length} Service{pendingMicroIds.length !== 1 ? 's' : ''}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Complete Button */}
          {step === 'browse' && servicesCount > 0 && (
            <div className="flex justify-end">
              <Button size="lg" onClick={handleComplete} className="gap-2">
                <Check className="h-4 w-4" />
                Complete Setup
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalServiceSetup;
