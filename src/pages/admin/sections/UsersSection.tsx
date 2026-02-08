import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Ban, CheckCircle, XCircle, Shield } from "lucide-react";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { suspendUser, unsuspendUser } from "../actions/suspendUser.action";
import { verifyProfessional } from "../actions/verifyProfessional.action";
import type { AdminUser, UserStatusFilter } from "../types";
import { toast } from "sonner";
import { format } from "date-fns";

/**
 * USERS SECTION
 * 
 * User list with search, filter, and management actions
 */
export default function UsersSection() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<UserStatusFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeout);
  };

  const { data: users, isLoading, error } = useAdminUsers(filter, debouncedSearch);

  const handleSuspend = async (user: AdminUser) => {
    const reason = window.prompt('Suspension reason (optional):');
    const result = await suspendUser({ userId: user.id, reason: reason || undefined });
    
    if (result.success) {
      toast.success('User suspended');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } else {
      toast.error(result.error || 'Failed to suspend user');
    }
  };

  const handleUnsuspend = async (user: AdminUser) => {
    const result = await unsuspendUser(user.id);
    
    if (result.success) {
      toast.success('User unsuspended');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } else {
      toast.error(result.error || 'Failed to unsuspend user');
    }
  };

  const handleVerify = async (user: AdminUser, status: 'verified' | 'rejected') => {
    const result = await verifyProfessional({ userId: user.id, status });
    
    if (result.success) {
      toast.success(`Professional ${status}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } else {
      toast.error(result.error || 'Failed to update verification');
    }
  };

  const getStatusBadge = (user: AdminUser) => {
    if (user.suspended_at) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (user.roles.includes('professional')) {
      if (user.pro_is_listed) {
        return <Badge variant="default">Active Pro</Badge>;
      }
      if (user.pro_verification_status === 'pending') {
        return <Badge variant="secondary">Pending Review</Badge>;
      }
      return <Badge variant="outline">Incomplete Pro</Badge>;
    }
    return <Badge variant="secondary">Client</Badge>;
  };

  const getVerificationBadge = (user: AdminUser) => {
    if (!user.roles.includes('professional')) return null;
    
    switch (user.pro_verification_status) {
      case 'verified':
        return <Badge variant="default" className="bg-primary">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unverified</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or ID..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as UserStatusFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active Clients</SelectItem>
              <SelectItem value="professionals">Professionals</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error loading users: {error.message}
          </div>
        ) : users?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Verification</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.display_name || 'Unnamed User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.phone || user.id.slice(0, 8) + '...'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getVerificationBadge(user)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.roles.includes('professional') && user.pro_verification_status !== 'verified' && (
                            <>
                              <DropdownMenuItem onClick={() => handleVerify(user, 'verified')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                                Approve Professional
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleVerify(user, 'rejected')}>
                                <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                Reject Professional
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {user.suspended_at ? (
                            <DropdownMenuItem onClick={() => handleUnsuspend(user)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Unsuspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleSuspend(user)}
                              className="text-destructive"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Count */}
        {users && (
          <div className="text-sm text-muted-foreground">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
