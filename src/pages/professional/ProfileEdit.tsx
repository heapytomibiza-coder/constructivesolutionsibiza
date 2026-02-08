import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, User, Building2, Phone, FileText, Eye, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { GradientIconHeader, QuietSaveIndicator } from "@/shared/components/professional";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  tagline: z.string().optional(),
  isPubliclyListed: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Character limits for fields with encouraging copy
const CHAR_LIMITS = {
  tagline: 80,
  bio: 500,
};

export default function ProfileEdit() {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const { user, refresh } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      businessName: "",
      phone: "",
      bio: "",
      tagline: "",
      isPubliclyListed: false,
    },
  });

  // Watch fields for character counters
  const taglineValue = useWatch({ control: form.control, name: "tagline" }) || "";
  const bioValue = useWatch({ control: form.control, name: "bio" }) || "";

  // Fetch full profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      try {
        // Fetch professional profile
        const { data: proProfile, error: proError } = await supabase
          .from("professional_profiles")
          .select("display_name, business_name, bio, tagline, is_publicly_listed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (proError && proError.code !== "PGRST116") {
          console.error("Error fetching pro profile:", proError);
        }

        // Fetch user profile for phone
        const { data: userProfile, error: userError } = await supabase
          .from("profiles")
          .select("phone")
          .eq("user_id", user.id)
          .maybeSingle();

        if (userError && userError.code !== "PGRST116") {
          console.error("Error fetching user profile:", userError);
        }

        // Populate form
        form.reset({
          displayName: proProfile?.display_name || "",
          businessName: proProfile?.business_name || "",
          phone: userProfile?.phone || "",
          bio: proProfile?.bio || "",
          tagline: proProfile?.tagline || "",
          isPubliclyListed: proProfile?.is_publicly_listed ?? false,
        });
      } catch (err) {
        console.error("Error loading profile:", err);
        toast.error(t("pro.profile.loadError", "Failed to load profile"));
      } finally {
        setIsFetching(false);
      }
    }

    fetchProfile();
  }, [user, form, t]);

  // Autosave with debounce
  const autoSave = useCallback(async (values: ProfileFormValues) => {
    if (!user || isSaving) return;
    
    setIsSaving(true);
    try {
      // Upsert professional_profiles
      const { error: proError } = await supabase
        .from("professional_profiles")
        .upsert({
          user_id: user.id,
          display_name: values.displayName,
          business_name: values.businessName || null,
          bio: values.bio || null,
          tagline: values.tagline || null,
          is_publicly_listed: values.isPubliclyListed,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (proError) throw proError;

      // Upsert profiles table for phone
      const { error: userError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          phone: values.phone || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (userError) throw userError;

      setLastSaved(new Date());
      await refresh();
    } catch (err) {
      console.error("Autosave error:", err);
    } finally {
      setIsSaving(false);
    }
  }, [user, isSaving, refresh]);

  async function onSubmit(values: ProfileFormValues) {
    if (!user) {
      toast.error("Not authenticated");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Upsert professional_profiles (handles first-time saves)
      const { error: proError } = await supabase
        .from("professional_profiles")
        .upsert({
          user_id: user.id,
          display_name: values.displayName,
          business_name: values.businessName || null,
          bio: values.bio || null,
          tagline: values.tagline || null,
          is_publicly_listed: values.isPubliclyListed,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (proError) {
        console.error("Pro profile update error:", proError);
        throw proError;
      }

      // Upsert profiles table for phone
      const { error: userError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          phone: values.phone || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (userError) {
        console.error("User profile update error:", userError);
        throw userError;
      }

      // Refresh session to update context
      await refresh();
      
      toast.success(t("pro.profile.saved", "Profile updated! Looking great."));
      navigate("/dashboard/pro");
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error(t("pro.profile.saveError", "Failed to save profile"));
    } finally {
      setIsLoading(false);
    }
  }

  // Helper for character counter styling
  const getCharCountStyle = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio > 1) return "text-destructive font-medium";
    if (ratio > 0.9) return "text-amber-600";
    if (ratio > 0.7) return "text-muted-foreground";
    return "text-muted-foreground/70";
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero bg-texture-concrete">
      {/* Header - matches onboarding */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/pro">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="font-display text-xl font-semibold">
              {t("pro.profile.title", "Your Profile")}
            </h1>
          </div>
          <QuietSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
        </div>
      </nav>

      <div className="container max-w-2xl py-8 space-y-6">
        {/* Encouraging intro */}
        <div className="text-center space-y-2 py-4">
          <p className="text-lg text-muted-foreground">
            Keep your profile fresh — clients love seeing who they're working with.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info Card */}
            <Card className="card-grounded">
              <CardHeader className="pb-4">
                <GradientIconHeader
                  icon={User}
                  title="About You"
                  description="This is how clients will see you"
                />
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Your name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Smith" 
                          className="h-14 text-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-sm">
                        How you'd like clients to address you
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-medium">
                          Tagline
                        </FormLabel>
                        <span className={cn("text-sm", getCharCountStyle(taglineValue.length, CHAR_LIMITS.tagline))}>
                          {taglineValue.length}/{CHAR_LIMITS.tagline}
                        </span>
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="Professional plumber with 10+ years experience" 
                          className="h-14 text-lg"
                          maxLength={CHAR_LIMITS.tagline + 20}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-sm">
                        A punchy one-liner that shows your strength
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Business Card */}
            <Card className="card-grounded">
              <CardHeader className="pb-4">
                <GradientIconHeader
                  icon={Building2}
                  title="Business Details"
                  description="Optional — if you operate under a company name"
                />
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Business name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Smith Plumbing Services" 
                          className="h-14 text-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-sm">
                        Leave blank to use your personal name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="card-grounded">
              <CardHeader className="pb-4">
                <GradientIconHeader
                  icon={Phone}
                  title="Contact"
                  description="How clients can reach you"
                />
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Phone / WhatsApp
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="+34 600 000 000" 
                          className="h-14 text-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-sm">
                        Clients may message you via WhatsApp
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Bio Card */}
            <Card className="card-grounded">
              <CardHeader className="pb-4">
                <GradientIconHeader
                  icon={FileText}
                  title="Tell Your Story"
                  description="Help clients understand what makes you great"
                />
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-medium">
                          Your bio
                        </FormLabel>
                        <span className={cn("text-sm", getCharCountStyle(bioValue.length, CHAR_LIMITS.bio))}>
                          {bioValue.length}/{CHAR_LIMITS.bio}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="I've been working in construction for over 10 years. I take pride in quality work and clear communication..."
                          className="min-h-[140px] resize-none text-base leading-relaxed"
                          maxLength={CHAR_LIMITS.bio + 50}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-sm">
                        Share your experience, specialties, and what you enjoy about your work
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Visibility Card */}
            <Card className="card-grounded">
              <CardHeader className="pb-4">
                <GradientIconHeader
                  icon={Eye}
                  title="Visibility"
                  description="Control how you appear in search results"
                />
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="isPubliclyListed"
                  render={({ field }) => (
                    <FormItem className={cn(
                      "flex items-center justify-between rounded-xl border-2 p-5 transition-colors",
                      field.value ? "border-primary bg-primary/5" : "border-border"
                    )}>
                      <div className="space-y-1">
                        <FormLabel className="text-base font-medium cursor-pointer">
                          Show in directory
                        </FormLabel>
                        <FormDescription className="text-sm">
                          Let new clients find you in our professionals listing
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="scale-125"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                className="flex-1"
                onClick={() => navigate("/dashboard/pro")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="lg"
                className="flex-1 gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                Update Profile
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
