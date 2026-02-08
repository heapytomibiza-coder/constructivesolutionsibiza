/**
 * Support Inbox - Admin view for support tickets
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Headset, ExternalLink, UserPlus, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSupportRequests } from "./hooks/useSupportRequests";
import { SupportStatusBadge, SupportPriorityBadge, IssueTypeBadge } from "./components";
import { assignSupportTicket } from "../../actions/assignSupportTicket.action";
import { updateSupportStatus } from "../../actions/updateSupportStatus.action";
import { adminKeys } from "../../queries/keys";
import type { SupportStatusFilter, SupportRequest } from "../../types";

export default function SupportInbox() {
  const [filter, setFilter] = useState<SupportStatusFilter>('active');
  const queryClient = useQueryClient();
  const { data: tickets, isLoading } = useSupportRequests(filter);

  const handleAssign = async (ticket: SupportRequest) => {
    const result = await assignSupportTicket(ticket.id);
    if (result.success) {
      toast.success(`Ticket ${ticket.ticket_number} assigned to you`);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    } else {
      toast.error(result.error || "Failed to assign ticket");
    }
  };

  const handleResolve = async (ticket: SupportRequest) => {
    const result = await updateSupportStatus(ticket.id, 'resolved');
    if (result.success) {
      toast.success(`Ticket ${ticket.ticket_number} marked as resolved`);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    } else {
      toast.error(result.error || "Failed to resolve ticket");
    }
  };

  const getAgeIndicator = (ageHours: number | null) => {
    if (!ageHours) return null;
    if (ageHours > 24) {
      return <span className="text-destructive font-medium">{Math.floor(ageHours)}h</span>;
    }
    if (ageHours > 12) {
      return <span className="text-secondary-foreground font-medium">{Math.floor(ageHours)}h</span>;
    }
    return <span className="text-muted-foreground">{Math.floor(ageHours)}h</span>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Headset className="h-5 w-5" />
            Support Inbox
          </CardTitle>
          {tickets && (
            <span className="text-sm text-muted-foreground">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as SupportStatusFilter)}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="triage">Triage</TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tickets Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Job</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !tickets?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No support tickets found
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <div className="font-mono text-sm font-medium">
                          {ticket.ticket_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.created_by_role}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <IssueTypeBadge issueType={ticket.issue_type} />
                      {ticket.summary && (
                        <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                          {ticket.summary}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <SupportStatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <SupportPriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell>
                      {getAgeIndicator(ticket.age_hours)}
                    </TableCell>
                    <TableCell>
                      {ticket.job_title ? (
                        <div className="max-w-[150px]">
                          <div className="text-sm truncate">{ticket.job_title}</div>
                          <div className="text-xs text-muted-foreground">{ticket.job_category}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {ticket.conversation_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="View Conversation"
                          >
                            <a
                              href={`/messages?c=${ticket.conversation_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {!ticket.assigned_to && ticket.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssign(ticket)}
                            title="Assign to me"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolve(ticket)}
                            title="Mark Resolved"
                          >
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
