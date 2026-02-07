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
  const { user, refresh } = useSession();
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
          onboarding_phase: 'basic_info',
        })
        .eq('user_id', user.id);

      if (proProfileError) throw proProfileError;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['professional-basic-info'] });
      await refresh();
      toast.success('Basic info saved!');
      onComplete();
    },
    onError: (error) => {
      console.error('Error saving basic info:', error);
      toast.error('Failed to save. Please try again.');
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="card-grounded animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-3">
          {/* Gradient icon container - matches IntentSelector pattern */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-steel shadow-md">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="font-display">Tell us about yourself</CardTitle>
            <CardDescription>
              This information will be visible to clients when they view your profile.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name - Required */}
          <div 
            className="space-y-2 animate-slide-up opacity-0 [animation-fill-mode:forwards]"
            style={{ animationDelay: '50ms' }}
          >
            <Label htmlFor="display_name">
              Your Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="display_name"
              placeholder="e.g. Juan García"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              required
              className="rounded-sm"
            />
          </div>

          {/* Phone */}
          <div 
            className="space-y-2 animate-slide-up opacity-0 [animation-fill-mode:forwards]"
            style={{ animationDelay: '100ms' }}
          >
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+34 600 000 000"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="rounded-sm"
            />
            <p className="text-xs text-muted-foreground">
              Used for WhatsApp notifications about new jobs
            </p>
          </div>

          {/* Business Name - Optional */}
          <div 
            className="space-y-2 animate-slide-up opacity-0 [animation-fill-mode:forwards]"
            style={{ animationDelay: '150ms' }}
          >
            <Label htmlFor="business_name">
              Business Name <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="business_name"
              placeholder="e.g. García Electricidad S.L."
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
              className="rounded-sm"
            />
          </div>

          {/* Tagline */}
          <div 
            className="space-y-2 animate-slide-up opacity-0 [animation-fill-mode:forwards]"
            style={{ animationDelay: '200ms' }}
          >
            <Label htmlFor="tagline" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Tagline
            </Label>
            <Input
              id="tagline"
              placeholder="e.g. Reliable electrician with 15+ years experience"
              value={formData.tagline}
              onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              maxLength={100}
              className="rounded-sm"
            />
            <p className={cn(
              'text-xs transition-colors',
              taglineNearLimit ? 'text-accent' : 'text-muted-foreground'
            )}>
              A short headline that appears with your name • {formData.tagline.length}/100
            </p>
          </div>

          {/* Bio */}
          <div 
            className="space-y-2 animate-slide-up opacity-0 [animation-fill-mode:forwards]"
            style={{ animationDelay: '250ms' }}
          >
            <Label htmlFor="bio">About You</Label>
            <Textarea
              id="bio"
              placeholder="Tell clients about your experience, qualifications, and what makes you great at what you do..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              maxLength={500}
              className="rounded-sm resize-none"
            />
            <p className={cn(
              'text-xs transition-colors',
              bioNearLimit ? 'text-accent' : 'text-muted-foreground'
            )}>
              {formData.bio.length}/500 characters
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full hover:scale-[1.02] transition-transform animate-slide-up opacity-0 [animation-fill-mode:forwards]"
            style={{ animationDelay: '300ms' }}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Save & Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
