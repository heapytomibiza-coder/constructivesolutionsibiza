import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, User, Phone, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nextPhase } from '@/pages/onboarding/lib/phaseProgression';

interface BasicInfoStepProps {
  onComplete: () => void;
}

interface BasicInfoData {
  display_name: string;
  phone: string;
  bio: string;
  business_name: string;
  tagline: string;
}

export function BasicInfoStep({ onComplete }: BasicInfoStepProps) {
  const { user, refresh, professionalProfile } = useSession();
  const currentPhase = professionalProfile?.onboardingPhase ?? 'not_started';
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<BasicInfoData>({
    display_name: '',
    phone: '',
    bio: '',
    business_name: '',
    tagline: '',
  });

  // Load existing data
  const { data: existingData, isLoading } = useQuery({
    queryKey: ['professional-basic-info', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Get from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, phone')
        .eq('user_id', user!.id)
        .single();

      // Get from professional_profiles table  
      const { data: proProfile } = await supabase
        .from('professional_profiles')
        .select('display_name, bio, business_name, tagline')
        .eq('user_id', user!.id)
        .single();

      return {
        display_name: proProfile?.display_name || profile?.display_name || '',
        phone: profile?.phone || '',
        bio: proProfile?.bio || '',
        business_name: (proProfile as { business_name?: string })?.business_name || '',
        tagline: (proProfile as { tagline?: string })?.tagline || '',
      };
    },
  });

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  const saveMutation = useMutation({
    mutationFn: async (data: BasicInfoData) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name,
          phone: data.phone,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update professional_profiles table
      const { error: proProfileError } = await supabase
        .from('professional_profiles')
        .update({
          display_name: data.display_name,
          bio: data.bio,
          business_name: data.business_name,
          tagline: data.tagline,
          onboarding_phase: nextPhase(currentPhase, 'basic_info'),
        })
        .eq('user_id', user.id);

      if (proProfileError) throw proProfileError;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['professional-basic-info'] });
      await refresh();
      toast.success('Saved!');
      onComplete();
    },
    onError: (error) => {
      console.error('Error saving basic info:', error);
      toast.error('Something went wrong. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.display_name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    saveMutation.mutate(formData);
  };

  // Character count helpers
  const bioNearLimit = formData.bio.length > 400;
  const taglineNearLimit = formData.tagline.length > 80;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <Card className="card-grounded animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          {/* Icon container */}
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-steel shadow-md">
            <User className="h-7 w-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Tell us about yourself</CardTitle>
            <CardDescription className="text-base">
              This is what clients will see when they view your profile.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Name - Required */}
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="display_name" className="text-base font-medium">
              Your Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="display_name"
              placeholder="e.g. Juan García"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+34 600 000 000"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">
              We'll send you WhatsApp notifications about new jobs
            </p>
          </div>

          {/* Business Name - Optional */}
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="business_name" className="text-base font-medium">
              Business Name <span className="text-muted-foreground text-sm">(optional)</span>
            </Label>
            <Input
              id="business_name"
              placeholder="e.g. García Electricidad S.L."
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            />
          </div>

          {/* Tagline */}
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="tagline" className="text-base font-medium flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Tagline
            </Label>
            <Input
              id="tagline"
              placeholder="e.g. Reliable electrician with 15+ years experience"
              value={formData.tagline}
              onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              maxLength={100}
            />
            <p className={cn(
              'text-sm transition-colors',
              taglineNearLimit ? 'text-accent' : 'text-muted-foreground'
            )}>
              A short headline that appears with your name • {formData.tagline.length}/100
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="bio" className="text-base font-medium">About You</Label>
            <Textarea
              id="bio"
              placeholder="Tell clients about your experience, qualifications, and what makes you great at what you do..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              maxLength={500}
              className="resize-none text-lg"
            />
            <p className={cn(
              'text-sm transition-colors',
              bioNearLimit ? 'text-accent' : 'text-muted-foreground'
            )}>
              {formData.bio.length}/500 characters
            </p>
          </div>

          <Button 
            type="submit" 
            size="lg"
            className="w-full animate-fade-in"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-5 w-5 mr-2" />
            )}
            Next Step
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
