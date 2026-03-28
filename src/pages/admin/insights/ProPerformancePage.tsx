import { useMemo } from "react";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Star, Clock, CheckCircle, MessageSquare, Users } from "lucide-react";

interface ProPerformanceRow {
  user_id: string;
  display_name: string | null;
  business_name: string | null;
  verification_status: string;
  services_count: number;
  total_conversations: number;
  total_completed: number;
  avg_rating: number | null;
}

export default function ProPerformancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pro_performance"],
    queryFn: async (): Promise<ProPerformanceRow[]> => {
      // Get all pro profiles with their stats
      const { data: pros, error } = await supabase
        .from("professional_profiles")
        .select("user_id, display_name, business_name, verification_status, services_count")
        .order("services_count", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get conversation counts, completed jobs, and ratings in parallel
      const [convosResult, completedResult, ratingsResult] = await Promise.all([
        supabase.from("conversations").select("pro_id"),
        supabase.from("jobs").select("assigned_professional_id").eq("status", "completed").not("assigned_professional_id", "is", null),
        supabase.from("professional_micro_stats").select("user_id, avg_rating, rating_count"),
      ]);

      const convoMap = new Map<string, number>();
      convosResult.data?.forEach((c) => {
        convoMap.set(c.pro_id, (convoMap.get(c.pro_id) ?? 0) + 1);
      });

      const completedMap = new Map<string, number>();
      completedResult.data?.forEach((j) => {
        if (j.assigned_professional_id) {
          completedMap.set(j.assigned_professional_id, (completedMap.get(j.assigned_professional_id) ?? 0) + 1);
        }
      });

      // Compute weighted provider-level avg from per-micro stats
      const ratingMap = new Map<string, { totalSum: number; totalCount: number }>();
      ratingsResult.data?.forEach((r) => {
        if (r.avg_rating != null && r.rating_count > 0) {
          const existing = ratingMap.get(r.user_id) ?? { totalSum: 0, totalCount: 0 };
          existing.totalSum += r.avg_rating * r.rating_count;
          existing.totalCount += r.rating_count;
          ratingMap.set(r.user_id, existing);
        }
      });

      return (pros ?? []).map((p) => {
        const r = ratingMap.get(p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          business_name: p.business_name,
          verification_status: p.verification_status,
          services_count: p.services_count,
          total_conversations: convoMap.get(p.user_id) ?? 0,
          total_completed: completedMap.get(p.user_id) ?? 0,
          avg_rating: r && r.totalCount > 0 ? r.totalSum / r.totalCount : null,
        };
      });
    },
    staleTime: 60_000,
  });

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const scoreA = a.total_completed * 3 + a.total_conversations + a.services_count * 0.5;
      const scoreB = b.total_completed * 3 + b.total_conversations + b.services_count * 0.5;
      return scoreB - scoreA;
    });
  }, [data]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Pro Performance Dashboard" description="Leaderboard tracking engagement, completions, and responsiveness." />

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold">{data?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">Total Pros</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold">{data?.filter((p) => p.verification_status === "verified").length ?? 0}</div>
            <div className="text-xs text-muted-foreground">Verified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold">{data?.reduce((s, p) => s + p.total_conversations, 0) ?? 0}</div>
            <div className="text-xs text-muted-foreground">Total Conversations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold">{data?.reduce((s, p) => s + p.total_completed, 0) ?? 0}</div>
            <div className="text-xs text-muted-foreground">Jobs Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pro Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Professional</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Services</TableHead>
                    <TableHead className="text-center">Convos</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No professionals yet
                      </TableCell>
                    </TableRow>
                  ) : sorted.map((pro, i) => {
                    const score = Math.round(pro.total_completed * 3 + pro.total_conversations + pro.services_count * 0.5);
                    return (
                      <TableRow key={pro.user_id}>
                        <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{pro.display_name || "Unnamed"}</div>
                          {pro.business_name && (
                            <div className="text-xs text-muted-foreground">{pro.business_name}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pro.verification_status === "verified" ? "default" : "outline"}>
                            {pro.verification_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{pro.services_count}</TableCell>
                        <TableCell className="text-center">{pro.total_conversations}</TableCell>
                        <TableCell className="text-center">{pro.total_completed}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{score}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
