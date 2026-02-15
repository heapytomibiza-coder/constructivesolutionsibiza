import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Repeat, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRepeatWork } from "../hooks/useRepeatWork";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function RepeatWorkPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useRepeatWork();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Repeat className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Repeat Work & Trusted Trades</h1>
            <p className="text-sm text-muted-foreground">
              Clients who return and pros who get rehired — your trust & reliability moat. Last 90 days.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold">{data?.summary.total_repeat_clients ?? 0}</div>
              <div className="text-xs text-muted-foreground">Repeat Clients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-5 w-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold">{data?.summary.total_rehired_pros ?? 0}</div>
              <div className="text-xs text-muted-foreground">Rehired Pros</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {data?.summary.repeat_rate != null ? `${Math.round(data.summary.repeat_rate * 100)}%` : "—"}
              </div>
              <div className="text-xs text-muted-foreground">Repeat Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {data?.summary.rehire_rate != null ? `${Math.round(data.summary.rehire_rate * 100)}%` : "—"}
              </div>
              <div className="text-xs text-muted-foreground">Rehire Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {data?.repeat_clients?.reduce((s, c) => s + c.total_jobs, 0) ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Repeat Client Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {data?.rehired_pros?.reduce((s, p) => s + p.completed, 0) ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Rehired Completions</div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[350px] rounded-lg" />
            <Skeleton className="h-[350px] rounded-lg" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Repeat Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Repeat Clients</CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.repeat_clients?.length ? (
                  <p className="text-center text-muted-foreground py-8">No repeat clients yet</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead className="text-center">Jobs</TableHead>
                          <TableHead className="text-center">Completed</TableHead>
                          <TableHead>Latest</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.repeat_clients.map((c) => (
                          <TableRow key={c.client_id}>
                            <TableCell className="font-medium">{c.display_name || "Anonymous"}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{c.total_jobs}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{c.completed_jobs}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(c.latest_job_at), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rehired Pros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rehired Professionals</CardTitle>
              </CardHeader>
              <CardContent>
                {!data?.rehired_pros?.length ? (
                  <p className="text-center text-muted-foreground py-8">No rehired pros yet</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Professional</TableHead>
                          <TableHead className="text-center">Hired</TableHead>
                          <TableHead className="text-center">Clients</TableHead>
                          <TableHead className="text-center">Done</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.rehired_pros.map((p) => (
                          <TableRow key={p.pro_id}>
                            <TableCell>
                              <div className="font-medium">{p.display_name || "Unnamed"}</div>
                              {p.business_name && (
                                <div className="text-xs text-muted-foreground">{p.business_name}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{p.total_hired}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{p.unique_clients}</TableCell>
                            <TableCell className="text-center">{p.completed}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Insight:</strong> Repeat clients are your strongest signal of product-market fit.
              Rehired pros become your "trusted trades" — consider badging them to build your platform moat.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
