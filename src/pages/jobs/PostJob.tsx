import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from '@/contexts/SessionContext';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

/**
 * POST JOB WIZARD
 * 
 * Accessible to public - auth checkpoint at publish.
 * Steps are internal UI state, not separate routes.
 */

const STEPS = [
  { id: 'category', title: 'Category', description: 'What type of service do you need?' },
  { id: 'details', title: 'Details', description: 'Tell us more about your requirements' },
  { id: 'budget', title: 'Budget', description: 'Set your budget range' },
  { id: 'review', title: 'Review', description: 'Review and publish your job' },
];

const CATEGORIES = [
  'Private Chef',
  'Villa Manager',
  'Event Planning',
  'Yacht Services',
  'Photography',
  'Transportation',
  'Security',
  'Other',
];

const PostJob = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = () => {
    if (!isAuthenticated) {
      // Save draft to localStorage and redirect to auth
      localStorage.setItem('job_draft', JSON.stringify(formData));
      navigate('/auth?returnUrl=/post');
      return;
    }

    // TODO: Publish to database
    navigate('/post/success');
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
          
          <Button variant="ghost" asChild>
            <Link to="/">Cancel</Link>
          </Button>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div 
                  key={step.id}
                  className="flex items-center"
                >
                  <div 
                    className={`
                      h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${index < currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : index === currentStep
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div 
                      className={`
                        h-0.5 w-16 mx-2
                        ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {STEPS[currentStep].title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {STEPS[currentStep].description}
            </p>
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="pt-6">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <Label>Select a category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Private Chef for Villa Party"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your requirements in detail..."
                      rows={6}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budgetMin">Minimum Budget (€)</Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        placeholder="500"
                        value={formData.budgetMin}
                        onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budgetMax">Maximum Budget (€)</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        placeholder="2000"
                        value={formData.budgetMax}
                        onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Category</span>
                      <p className="font-medium">{formData.category || '—'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Title</span>
                      <p className="font-medium">{formData.title || '—'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Description</span>
                      <p className="font-medium">{formData.description || '—'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Budget</span>
                      <p className="font-medium">
                        {formData.budgetMin && formData.budgetMax 
                          ? `€${formData.budgetMin} - €${formData.budgetMax}`
                          : '—'
                        }
                      </p>
                    </div>
                  </div>
                  {!isAuthenticated && (
                    <p className="text-sm text-muted-foreground text-center">
                      You'll need to sign in to publish this job
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handlePublish} className="gap-2">
                {isAuthenticated ? 'Publish Job' : 'Sign In to Publish'}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
