/**
 * CS IBIZA - V2 APP SHELL
 * 
 * PLATFORM SCOPE: Construction & property services ONLY
 * Includes admin routes (protected by admin role).
 */

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider } from "@/contexts/SessionContext";
import { ScrollToTop } from "@/shared/components/layout/ScrollToTop";
import { RouteGuard, PublicOnlyGuard } from "@/guard";
import { preloadAlternateLanguage, preloadCoreNamespaces } from "@/i18n/preload";
import { Loader2 } from "lucide-react";

// Public Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Services from "./pages/public/Services";
import ServiceCategory from "./pages/public/ServiceCategory";
import Professionals from "./pages/public/Professionals";
import ProfessionalDetails from "./pages/public/ProfessionalDetails";
import HowItWorks from "./pages/public/HowItWorks";
import Contact from "./pages/public/Contact";

// Auth Pages
import Auth from "./pages/auth/Auth";
import AuthCallback from "./pages/auth/AuthCallback";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Job Wizard & Board
import PostJob from "./pages/jobs/PostJob";
import JobBoardPage from "./pages/jobs/JobBoardPage";
import JobDetailsPage from "./pages/jobs/JobDetailsPage";

// Dashboards
import ClientDashboard from "./pages/dashboard/client/ClientDashboard";
import ProDashboard from "./pages/dashboard/professional/ProDashboard";

// Messages
import Messages from "./pages/messages/Messages";

// Professional Onboarding & Management
import ProfessionalOnboarding from "./pages/onboarding/ProfessionalOnboarding";
import ProfessionalServiceSetup from "./pages/professional/ProfessionalServiceSetup";
import ProfileEdit from "./pages/professional/ProfileEdit";

// Settings
import { Settings } from "./pages/settings";

// Forum
import { ForumIndex, ForumCategory, ForumPost, ForumNewPost } from "./pages/forum";

// Admin
import { AdminDashboard } from "./pages/admin";

const queryClient = new QueryClient();

const App = () => {
  const [i18nReady, setI18nReady] = useState(false);

  // Block rendering until i18n namespaces are loaded
  useEffect(() => {
    preloadCoreNamespaces().then(() => setI18nReady(true));
    const id = window.setTimeout(preloadAlternateLanguage, 400);
    return () => window.clearTimeout(id);
  }, []);

  // Show minimal loader until translations are ready
  if (!i18nReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
           <ScrollToTop />
          <Routes>
            {/* ============================================
                PUBLIC ROUTES - No auth required
                ============================================ */}
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:categorySlug" element={<ServiceCategory />} />
            <Route path="/jobs" element={<JobBoardPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
            <Route path="/professionals" element={<Professionals />} />
            <Route path="/professionals/:id" element={<ProfessionalDetails />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Forum - Public read, auth for new posts */}
            <Route path="/forum" element={<ForumIndex />} />
            <Route path="/forum/:categorySlug" element={<ForumCategory />} />
            <Route path="/forum/post/:postId" element={<ForumPost />} />
            
            {/* Post Job Wizard - Public, auth checkpoint at publish */}
            <Route path="/post" element={<PostJob />} />

            {/* ============================================
                AUTH ROUTES - Public only (redirect if authed)
                ============================================ */}
            <Route element={<PublicOnlyGuard />}>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            </Route>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

            {/* ============================================
                PROTECTED ROUTES - Wrapped in RouteGuard
                ============================================ */}
            <Route element={<RouteGuard />}>
              {/* Client Routes */}
              <Route path="/dashboard/client" element={<ClientDashboard />} />
              
              {/* Messages (shared) */}
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:conversationId" element={<Messages />} />

              {/* Settings (shared) */}
              <Route path="/settings" element={<Settings />} />

              {/* Professional Onboarding */}
              <Route path="/onboarding/professional" element={<ProfessionalOnboarding />} />
              <Route path="/professional/services" element={<Navigate to="/dashboard/pro" replace />} />
              <Route path="/professional/service-setup" element={<ProfessionalServiceSetup />} />
              <Route path="/professional/profile" element={<ProfileEdit />} />
              <Route path="/professional/portfolio" element={<Navigate to="/dashboard/pro" replace />} />

              {/* Forum - New Post (requires auth) */}
              <Route path="/forum/:categorySlug/new" element={<ForumNewPost />} />

              {/* Professional Dashboard */}
              <Route path="/dashboard/pro" element={<ProDashboard />} />

              {/* Admin Dashboard */}
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* ============================================
                CATCH-ALL - 404
                ============================================ */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
