/**
 * CS IBIZA - V2 APP SHELL
 * 
 * PLATFORM SCOPE: Construction & property services ONLY
 * 15 routes total. No admin, payments, disputes, or AI dashboards.
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "@/contexts/SessionContext";
import { RouteGuard, PublicOnlyGuard } from "@/guard";

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

// Job Wizard
import PostJob from "./pages/jobs/PostJob";

// Dashboards
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import ProDashboard from "./pages/dashboard/ProDashboard";

// Messages
import Messages from "./pages/messages/Messages";

// Professional Onboarding & Management
import ProfessionalOnboarding from "./pages/onboarding/ProfessionalOnboarding";
import ProfessionalServices from "./pages/professional/ProfessionalServices";
import ProfessionalPortfolio from "./pages/professional/ProfessionalPortfolio";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
          <Routes>
            {/* ============================================
                PUBLIC ROUTES - No auth required
                ============================================ */}
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:categorySlug" element={<ServiceCategory />} />
            <Route path="/professionals" element={<Professionals />} />
            <Route path="/professionals/:id" element={<ProfessionalDetails />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Post Job Wizard - Public, auth checkpoint at publish */}
            <Route path="/post" element={<PostJob />} />

            {/* ============================================
                AUTH ROUTES - Public only (redirect if authed)
                ============================================ */}
            <Route element={<PublicOnlyGuard />}>
              <Route path="/auth" element={<Auth />} />
            </Route>
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* ============================================
                PROTECTED ROUTES - Wrapped in RouteGuard
                ============================================ */}
            <Route element={<RouteGuard />}>
              {/* Client Routes */}
              <Route path="/dashboard/client" element={<ClientDashboard />} />
              
              {/* Messages (shared) */}
              <Route path="/messages" element={<Messages />} />

              {/* Professional Onboarding */}
              <Route path="/onboarding/professional" element={<ProfessionalOnboarding />} />
              <Route path="/professional/services" element={<ProfessionalServices />} />
              <Route path="/professional/portfolio" element={<ProfessionalPortfolio />} />

              {/* Professional Dashboard */}
              <Route path="/dashboard/pro" element={<ProDashboard />} />
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

export default App;
