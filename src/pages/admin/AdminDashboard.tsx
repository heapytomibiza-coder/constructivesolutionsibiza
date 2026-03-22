import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, MessageSquare, BarChart3, Shield, Headset, Map, Activity, LineChart, Store, Scale, Brain } from "lucide-react";
import { UsersSection, JobsSection, ContentSection, ListingsSection, SupportInbox } from "./sections";
import { DisputeQueue } from "./sections/disputes";
import { LinkMapSection } from "./sections/LinkMapSection";
import { HealthSection } from "./sections/HealthSection";
import { OperatorCockpit } from "./sections/OperatorCockpit";
import InsightsSection from "./sections/InsightsSection";
import { PlatformAssistant } from "./sections/PlatformAssistant";

/**
 * ADMIN DASHBOARD
 * 
 * Phase 1: Tab navigation + platform stats overview
 * Future phases will add Users, Jobs, Content, Analytics sections
 */
export default function AdminDashboard() {

  return (
    <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Platform management and oversight
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-10 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2">
                <LineChart className="h-4 w-4" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Health</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="listings" className="gap-2">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Listings</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="disputes" className="gap-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Disputes</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="gap-2">
                <Headset className="h-4 w-4" />
                <span className="hidden sm:inline">Support</span>
              </TabsTrigger>
              <TabsTrigger value="linkmap" className="gap-2">
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Link Map</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <OperatorCockpit />
            </TabsContent>
            <TabsContent value="insights" className="space-y-6">
              <InsightsSection />
            </TabsContent>
            <TabsContent value="health">
              <HealthSection />
            </TabsContent>
            <TabsContent value="users">
              <UsersSection />
            </TabsContent>
            <TabsContent value="jobs">
              <JobsSection />
            </TabsContent>
            <TabsContent value="listings">
              <ListingsSection />
            </TabsContent>
            <TabsContent value="content">
              <ContentSection />
            </TabsContent>
            <TabsContent value="disputes">
              <DisputeQueue />
            </TabsContent>
            <TabsContent value="support">
              <SupportInbox />
            </TabsContent>
            <TabsContent value="linkmap">
              <LinkMapSection />
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
