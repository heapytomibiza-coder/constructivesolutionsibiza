import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  tagline: z.string().optional(),
  isPubliclyListed: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileEdit() {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();
  const { user, professionalProfile, refresh } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

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
          .single();

        if (proError && proError.code !== "PGRST116") {
          console.error("Error fetching pro profile:", proError);
        }

        // Fetch user profile for phone
        const { data: userProfile, error: userError } = await supabase
          .from("profiles")
          .select("phone")
          .eq("user_id", user.id)
          .single();

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

  async function onSubmit(values: ProfileFormValues) {
    if (!user) {
      toast.error("Not authenticated");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update professional_profiles
      const { error: proError } = await supabase
        .from("professional_profiles")
        .update({
          display_name: values.displayName,
          business_name: values.businessName || null,
          bio: values.bio || null,
          tagline: values.tagline || null,
          is_publicly_listed: values.isPubliclyListed,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (proError) {
        console.error("Pro profile update error:", proError);
        throw proError;
      }

      // Update profiles table for phone
      const { error: userError } = await supabase
        .from("profiles")
        .update({
          phone: values.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (userError) {
        console.error("User profile update error:", userError);
        throw userError;
      }

      // Refresh session to update context
      await refresh();
      
      toast.success(t("pro.profile.saved", "Profile saved successfully"));
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/pro">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="font-display text-lg font-semibold">
              {t("pro.profile.title", "Edit Profile")}
            </h1>
          </div>
        </div>
      </nav>

      <div className="container max-w-2xl py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">
                  {t("pro.profile.basicInfo", "Basic Information")}
                </CardTitle>
                <CardDescription>
                  {t("pro.profile.basicInfoDesc", "This information appears on your public profile")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pro.profile.displayName", "Display Name")} *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pro.profile.businessName", "Business Name")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith Plumbing Services" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("pro.profile.businessNameDesc", "Optional. Leave blank to use your display name.")}
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
                      <FormLabel>{t("pro.profile.tagline", "Tagline")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Professional plumber with 10+ years experience" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("pro.profile.taglineDesc", "A short headline for your profile")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">
                  {t("pro.profile.contact", "Contact")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pro.profile.phone", "Phone / WhatsApp")}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+34 600 000 000" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("pro.profile.phoneDesc", "Clients may contact you via WhatsApp")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">
                  {t("pro.profile.about", "About You")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pro.profile.bio", "Bio")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell clients about your experience, specialties, and why they should choose you..."
                          className="min-h-[120px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Visibility */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">
                  {t("pro.profile.visibility", "Visibility")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="isPubliclyListed"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t("pro.profile.publicListing", "Public Listing")}
                        </FormLabel>
                        <FormDescription>
                          {t("pro.profile.publicListingDesc", "Show your profile in the professionals directory")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate("/dashboard/pro")}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button 
                type="submit" 
                className="flex-1 gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("common.save", "Save")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
