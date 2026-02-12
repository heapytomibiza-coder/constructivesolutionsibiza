import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, MessageSquare, BarChart3, Shield, Headset, Map, Activity } from "lucide-react";
import { useAdminStats } from "./hooks/useAdminStats";
import { StatTile } from "@/shared/components/StatTile";
import { UsersSection, JobsSection, ContentSection, SupportInbox } from "./sections";
import { LinkMapSection } from "./sections/LinkMapSection";
import { HealthSection } from "./sections/HealthSection";

/**
 * ADMIN DASHBOARD
 * 
 * Phase 1: Tab navigation + platform stats overview
 * Future phases will add Users, Jobs, Content, Analytics sections
 */
export default function AdminDashboard() {
  const { t } = useTranslation("common");
  const { data: stats, isLoading } = useAdminStats();

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
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Platform Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <StatTile
                  icon={<Users className="h-5 w-5 text-primary" />}
                  label="Total Users"
                  value={stats?.total_users ?? 0}
                />
                <StatTile
                  icon={<Users className="h-5 w-5 text-primary" />}
                  label="Active Professionals"
                  value={`${stats?.active_professionals ?? 0} / ${stats?.total_professionals ?? 0}`}
                />
                <StatTile
                  icon={<Briefcase className="h-5 w-5 text-primary" />}
                  label="Open Jobs"
                  value={`${stats?.open_jobs ?? 0} / ${stats?.total_jobs ?? 0}`}
                />
                <StatTile
                  icon={<MessageSquare className="h-5 w-5 text-primary" />}
                  label="Conversations"
                  value={stats?.total_conversations ?? 0}
                />
                <StatTile
                  icon={<Headset className="h-5 w-5 text-primary" />}
                  label="Open Tickets"
                  value={stats?.open_support_tickets ?? 0}
                />
              </>
            )}
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Jobs In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : stats?.active_jobs ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : stats?.completed_jobs ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Forum Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-12" /> : stats?.total_posts ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UsersSection />
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <JobsSection />
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <ContentSection />
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <SupportInbox />
          </TabsContent>

          {/* Link Map Tab */}
          <TabsContent value="linkmap">
            <LinkMapSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
