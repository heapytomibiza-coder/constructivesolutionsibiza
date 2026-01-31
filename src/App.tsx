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
import JobBoard from "./pages/public/JobBoard";
import JobDetails from "./pages/public/JobDetails";
import Professionals from "./pages/public/Professionals";
import ProfessionalDetails from "./pages/public/ProfessionalDetails";

// Auth Pages
import Auth from "./pages/auth/Auth";
import AuthCallback from "./pages/auth/AuthCallback";

// Job Wizard
import PostJob from "./pages/jobs/PostJob";
import PostSuccess from "./pages/jobs/PostSuccess";

// Dashboards
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import ProDashboard from "./pages/dashboard/ProDashboard";

// Onboarding
import ProfessionalOnboarding from "./pages/onboarding/ProfessionalOnboarding";

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
            <Route path="/job-board" element={<JobBoard />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/professionals" element={<Professionals />} />
            <Route path="/professionals/:id" element={<ProfessionalDetails />} />
            
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
              <Route path="/post/success" element={<PostSuccess />} />

              {/* Professional Onboarding */}
              <Route path="/onboarding/professional" element={<ProfessionalOnboarding />} />

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
