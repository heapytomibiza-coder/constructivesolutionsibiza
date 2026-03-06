/**
 * User Detail Drawer — Tabbed layout: Overview · Asker · Tasker · Actions
 */
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";
import { useAdminDrawer } from "../context/AdminDrawerContext";
import { useAdminUserDetails } from "../queries/adminUserDetails.query";
import { adminKeys } from "../queries/keys";
import { OverviewTab } from "./drawer/OverviewTab";
import { AskerTab } from "./drawer/AskerTab";
import { TaskerTab } from "./drawer/TaskerTab";
import { ActionsTab } from "./drawer/ActionsTab";

export function UserDetailDrawer() {
  const { state, open, closeDrawer } = useAdminDrawer();
  const userId = state?.type === "user" ? state.id : null;
  const { data: user, isLoading } = useAdminUserDetails(userId);
  const queryClient = useQueryClient();
  const isOpen = open && state?.type === "user";

  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: adminKeys.all });

  const hasPro = user?.pro != null;

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && closeDrawer()}>
      <SheetContent side="right" className="sm:max-w-xl w-full overflow-y-auto p-0">
        {isLoading || !user ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-2">
              <SheetTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5" />
                {user.display_name ?? "Unnamed User"}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-1.5 mt-1">
                {user.roles.map((r) => (
                  <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="capitalize text-[11px]">
                    {r}
                  </Badge>
                ))}
                {user.suspended_at && <Badge variant="destructive" className="text-[11px]">Suspended</Badge>}
              </SheetDescription>
            </SheetHeader>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="px-6 pb-6">
              <TabsList className="w-full grid grid-cols-4 mb-4">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="asker" className="text-xs">Asker</TabsTrigger>
                <TabsTrigger value="tasker" className="text-xs" disabled={!hasPro}>
                  Tasker
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <OverviewTab user={user} />
              </TabsContent>

              <TabsContent value="asker" className="mt-0">
                <AskerTab user={user} />
              </TabsContent>

              <TabsContent value="tasker" className="mt-0">
                {hasPro && <TaskerTab user={user} />}
              </TabsContent>

              <TabsContent value="actions" className="mt-0">
                <ActionsTab user={user} onActionComplete={invalidateAll} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
