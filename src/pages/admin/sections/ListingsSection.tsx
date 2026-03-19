import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, CheckCircle2, XCircle, Loader2, Image as ImageIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ListingPreviewDrawer from "./ListingPreviewDrawer";

type StatusFilter = "all" | "draft" | "live" | "paused";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

export default function ListingsSection() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-listings", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("service_listings")
        .select(`
          id, display_title, short_description, status, hero_image_url,
          created_at, updated_at, published_at, provider_id, view_count,
          micro_id,
          service_pricing_items ( id )
        `)
        .order("updated_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase
        .from("service_listings")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("admin_actions_log").insert({
          admin_user_id: user.id,
          action_type: `listing_${newStatus}`,
          target_type: "service_listing",
          target_id: id,
          metadata: { new_status: newStatus },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Listing status updated");
    },
    onError: (err: Error) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });

  const counts = {
    all: listings?.length ?? 0,
    draft: listings?.filter((l) => l.status === "draft").length ?? 0,
    live: listings?.filter((l) => l.status === "live").length ?? 0,
    paused: listings?.filter((l) => l.status === "paused").length ?? 0,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Service Listings Review</CardTitle>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({counts.all})</SelectItem>
              <SelectItem value="draft">Draft ({counts.draft})</SelectItem>
              <SelectItem value="live">Live ({counts.live})</SelectItem>
              <SelectItem value="paused">Paused ({counts.paused})</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !listings?.length ? (
            <p className="text-center text-muted-foreground py-12">No listings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]" />
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        {listing.hero_image_url ? (
                          <img
                            src={listing.hero_image_url}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <p className="font-medium truncate">
                            {listing.display_title || "Untitled"}
                          </p>
                          {listing.short_description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {listing.short_description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[listing.status] ?? ""}>
                          {listing.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {listing.service_pricing_items?.length ?? 0} items
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {listing.view_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(listing.updated_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => setPreviewId(listing.id)}
                          >
                            <Search className="h-3 w-3" />
                            Review
                          </Button>
                          {listing.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: listing.id, newStatus: "live" })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Approve
                            </Button>
                          )}
                          {listing.status === "live" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: listing.id, newStatus: "paused" })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="h-3 w-3" />
                              Take Down
                            </Button>
                          )}
                          {listing.status === "paused" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: listing.id, newStatus: "live" })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
