import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Check, User, Phone, FileText, Eye, Store, Wrench, Star, ChevronRight, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useProfessionalServices } from "@/pages/onboarding/hooks/useProfessionalServices";
import { useMicroPreferences } from "@/pages/onboarding/hooks/useMicroPreferences";
// Phase 1 shared components
import { GradientIconHeader, QuietSaveIndicator } from "@/shared/components/professional";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  tagline: z.string().optional(),
  isPubliclyListed: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Character limits with gentle guidance
const CHAR_LIMITS = {
  tagline: 80,
  bio: 500,
} as const;

export default function ProfileEdit() {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const { user, refresh } = useSession();
  const { selectedMicroIds, isLoading: loadingServices } = useProfessionalServices();
  const { preferences } = useMicroPreferences();

  // Track which step of the edit flow we're on
  const [editStep, setEditStep] = useState<'profile' | 'services' | 'priorities'>('profile');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Quiet autosave state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
    mode: "onChange",
  });

  const taglineValue = useWatch({ control: form.control, name: "tagline" }) || "";
  const bioValue = useWatch({ control: form.control, name: "bio" }) || "";

  // Fetch full profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      try {
        const { data: proProfile, error: proError } = await supabase
          .from("professional_profiles")
          .select("display_name, business_name, bio, tagline, is_publicly_listed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (proError && proError.code !== "PGRST116") {
          console.error("Error fetching pro profile:", proError);
        }

        const { data: userProfile, error: userError } = await supabase
          .from("profiles")
          .select("phone")
          .eq("user_id", user.id)
          .maybeSingle();

        if (userError && userError.code !== "PGRST116") {
          console.error("Error fetching user profile:", userError);
        }

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

  // Helper for character counter styling
  const getCharCountClass = (current: number, max: number) => {
    const ratio = max === 0 ? 0 : current / max;
    if (ratio > 1) return "text-destructive font-medium";
    if (ratio > 0.9) return "text-amber-600";
    return "text-muted-foreground";
  };

  // Quiet autosave (debounced)
  const autoSave = useCallback(
    async (values: ProfileFormValues) => {
      if (!user) return;
      if (isSaving) return;

      // Avoid autosave if required field invalid
      if (!values.displayName || values.displayName.trim().length < 2) return;

      setIsSaving(true);
      try {
        const { error: proError } = await supabase
          .from("professional_profiles")
          .upsert(
            {
              user_id: user.id,
              display_name: values.displayName,
              business_name: values.businessName || null,
              bio: values.bio || null,
              tagline: values.tagline || null,
              is_publicly_listed: values.isPubliclyListed,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (proError) throw proError;

        const { error: userError } = await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              phone: values.phone || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (userError) throw userError;

        setLastSaved(new Date());
        await refresh();
      } catch (err) {
        console.error("Autosave error:", err);
        // Keep quiet: we don't toast for background saves.
      } finally {
        setIsSaving(false);
      }
    },
    [user, isSaving, refresh]
  );

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    // Don't autosave while loading initial values
    if (isFetching) return;

    const subscription = form.watch((values) => {
      if (!user) return;

      // Only autosave after user actually changes something
      if (!form.formState.isDirty) return;

      if (debounceRef.current) window.clearTimeout(debounceRef.current);

      debounceRef.current = window.setTimeout(() => {
        autoSave(values as ProfileFormValues);
      }, 700);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [form, autoSave, user, isFetching]);

  async function onSubmit(values: ProfileFormValues) {
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      const { error: proError } = await supabase
        .from("professional_profiles")
        .upsert(
          {
            user_id: user.id,
            display_name: values.displayName,
            business_name: values.businessName || null,
            bio: values.bio || null,
            tagline: values.tagline || null,
            is_publicly_listed: values.isPubliclyListed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (proError) throw proError;

      const { error: userError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            phone: values.phone || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (userError) throw userError;

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

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero bg-texture-concrete">
      {/* Header */}
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
            Keep it fresh — clients love seeing who they're working with.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <Card className="card-grounded">
              <CardHeader className="pb-4">
                <GradientIconHeader
                  icon={<User className="h-5 w-5" />}
                  title={t("pro.profile.basicInfo", "Basic Information")}
                  description={t(
                    "pro.profile.basicInfoDesc",
                    "This is what clients will see first — keep it clear and confident."
                  )}
                />
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        {t("pro.profile.displayName", "Your name")} *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" className="h-14 text-lg" {...field} />
                      </FormControl>
                      <FormDescription className="text-sm">
                        How you'd like clients to address you.
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
                          {t("pro.profile.tagline", "Tagline")}
                        </FormLabel>
                        <span className={cn("text-sm", getCharCountClass(taglineValue.length, CHAR_LIMITS.tagline))}>
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
                        A punchy one-liner that helps clients trust you quickly.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Business */}
            <Card className="card-grounded">
              <CardHeader className="pb-4">
                <GradientIconHeader
                  icon={<Store className="h-5 w-5" />}
                  title={t("pro.profile.business", "Business")}
                  description="Optional — use this if you work under a company name."
                />
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        {t("pro.profile.businessName", "Business name")}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Smith Plumbing Services" className="h-14 text-lg" {...field} />
                      </FormControl>
                      <FormDescription className="text-sm">
                        Leave blank to use your personal name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="card-grounded">
              <CardHeader className="pb-4">
                <GradientIconHeader
                  icon={<Phone className="h-5 w-5" />}
                  title={t("pro.profile.contact", "Contact")}
                  description="Make it easy for clients to reach you."
                />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Change Email */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <label className="text-base font-medium">Email</label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current: <span className="font-medium text-foreground">{user?.email ?? '—'}</span>
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="new@email.com"
                      className="h-12 text-base flex-1"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!newEmail || isUpdatingEmail}
                      className="h-12 px-5"
                      onClick={async () => {
                        if (!newEmail.includes('@')) {
                          toast.error('Please enter a valid email');
                          return;
                        }
                        setIsUpdatingEmail(true);
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session) throw new Error('Not authenticated');

                          const res = await fetch(
                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-email`,
                            {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`,
                              },
                              body: JSON.stringify({ newEmail }),
                            }
                          );
                          const result = await res.json();
                          if (!res.ok) throw new Error(result.error || 'Failed to update email');

                          toast.success('Email updated successfully');
                          setNewEmail('');
                          await refresh();
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : 'Failed to update email';
                          toast.error(msg);
                        } finally {
                          setIsUpdatingEmail(false);
                        }
                      }}
                    >
                      {isUpdatingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your correct email address if you need to change it.
                  </p>
                </div>

                <div className="border-t border-border" />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        {t("pro.profile.phone", "Phone / WhatsApp")}
                      </FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+34 600 000 000" className="h-14 text-lg" {...field} />
                      </FormControl>
                      <FormDescription className="text-sm">
                        Clients may message you via WhatsApp.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* About */}
            <Card className="card-grounded">
              <CardHeader className="pb-4">
                <GradientIconHeader
                  icon={<FileText className="h-5 w-5" />}
                  title={t("pro.profile.about", "About you")}
                  description="A great bio helps you win the job before you even reply."
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
                          {t("pro.profile.bio", "Your bio")}
                        </FormLabel>
                        <span className={cn("text-sm", getCharCountClass(bioValue.length, CHAR_LIMITS.bio))}>
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
                        Tip: mention your specialties, reliability, and what makes your finish clean.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Visibility */}
            <Card className="card-grounded">
              <CardHeader className="pb-4">
                <GradientIconHeader
                  icon={<Eye className="h-5 w-5" />}
                  title={t("pro.profile.visibility", "Visibility")}
                  description="Control how you appear in search results."
                />
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="isPubliclyListed"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border-2 p-5 transition-colors">
                      <div className="space-y-1">
                        <FormLabel className="text-base font-medium cursor-pointer">
                          {t("pro.profile.publicListing", "Show in directory")}
                        </FormLabel>
                        <FormDescription className="text-sm">
                          Let new clients find you in our professionals listing.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-125" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <QuietSaveIndicator isSaving={isSaving} lastSaved={lastSaved} className="sm:hidden" />

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1 rounded-xl"
                onClick={() => navigate("/dashboard/pro")}
              >
                {t("common.cancel", "Cancel")}
              </Button>

              <Button type="submit" size="lg" className="flex-1 gap-2 rounded-xl" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                Update Profile
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
