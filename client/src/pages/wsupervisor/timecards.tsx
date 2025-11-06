import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle2, XCircle, Filter, MoreVertical } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface Timecard {
  id: string;
  date: string;
  hoursWorked: string;
  hourlyRate: string;
  earnings: string | null;
  status: string;
  workDescription: string;
  createdAt: string;
  application: {
    fullName: string;
    department: string;
    position: string;
  };
  user: {
    fullName: string;
    email: string;
  };
}

const ITEMS_PER_PAGE = 10;

export default function WSupervisorTimecards() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTimecards, setSelectedTimecards] = useState<Set<string>>(new Set());
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'verify' | 'reject' | null;
    timecardId: string | null;
  }>({ open: false, action: null, timecardId: null });
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery<{ timecards: Timecard[] }>({
    queryKey: ["/api/wsupervisor/timecards", statusFilter, departmentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (departmentFilter && departmentFilter !== "all") params.append("department", departmentFilter);

      return await apiRequest("GET", `/api/wsupervisor/timecards?${params.toString()}`);
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return await apiRequest("PATCH", `/api/wsupervisor/timecards/${id}/verify`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wsupervisor/timecards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wsupervisor/dashboard/stats"] });
      toast({
        title: "Timecard Verified",
        description: "Timecard has been successfully verified",
      });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest("PATCH", `/api/wsupervisor/timecards/${id}/reject`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wsupervisor/timecards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wsupervisor/dashboard/stats"] });
      toast({
        title: "Timecard Rejected",
        description: "Timecard has been rejected",
      });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const bulkVerifyMutation = useMutation({
    mutationFn: async (timecardIds: string[]) => {
      return await apiRequest("POST", "/api/wsupervisor/timecards/bulk-verify", { timecardIds });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wsupervisor/timecards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wsupervisor/dashboard/stats"] });
      toast({
        title: "Success",
        description: data.message,
      });
      setSelectedTimecards(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const timecards = data?.timecards || [];
  const departments = Array.from(new Set(timecards.map(t => t.application?.department).filter(Boolean))).sort() as string[];

  // Pagination logic
  const totalPages = Math.ceil(timecards.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTimecards = timecards.slice(startIndex, endIndex);

  const toggleTimecard = (id: string) => {
    const newSelected = new Set(selectedTimecards);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTimecards(newSelected);
  };

  const toggleAll = () => {
    if (selectedTimecards.size === paginatedTimecards.length) {
      setSelectedTimecards(new Set());
    } else {
      setSelectedTimecards(new Set(paginatedTimecards.map(t => t.id)));
    }
  };

  const handleAction = (action: 'verify' | 'reject', timecardId: string) => {
    setActionDialog({ open: true, action, timecardId });
    setNotes("");
  };

  const confirmAction = () => {
    if (actionDialog.action === 'verify' && actionDialog.timecardId) {
      verifyMutation.mutate({ id: actionDialog.timecardId, notes });
    } else if (actionDialog.action === 'reject' && actionDialog.timecardId) {
      if (!notes.trim()) {
        toast({
          title: "Notes Required",
          description: "Please provide a reason for rejection",
          variant: "destructive",
        });
        return;
      }
      rejectMutation.mutate({ id: actionDialog.timecardId, notes });
    }
  };

  const closeDialog = () => {
    setActionDialog({ open: false, action: null, timecardId: null });
    setNotes("");
  };

  const handleBulkVerify = () => {
    if (selectedTimecards.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select timecards to verify",
        variant: "destructive",
      });
      return;
    }
    bulkVerifyMutation.mutate(Array.from(selectedTimecards));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; className?: string }> = {
      'pending': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      'verified': { variant: 'default', className: 'bg-green-600' },
      'rejected': { variant: 'destructive' }
    };

    const config = variants[status] || { variant: 'secondary' };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timecards Management</h1>
          <p className="text-muted-foreground">
            Review and verify student work hours
          </p>
        </div>
        {selectedTimecards.size > 0 && statusFilter === 'pending' && (
          <Button onClick={handleBulkVerify} disabled={bulkVerifyMutation.isPending}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Verify Selected ({selectedTimecards.size})
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
                setSelectedTimecards(new Set());
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={departmentFilter} onValueChange={(value) => {
                setDepartmentFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timecards Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timecards ({timecards.length})
            </CardTitle>
            {timecards.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, timecards.length)} of {timecards.length}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {timecards.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No timecards found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {statusFilter === 'pending' && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedTimecards.size === paginatedTimecards.length && paginatedTimecards.length > 0}
                            onCheckedChange={toggleAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>Student</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTimecards.map((timecard) => (
                      <TableRow key={timecard.id}>
                        {statusFilter === 'pending' && (
                          <TableCell>
                            <Checkbox
                              checked={selectedTimecards.has(timecard.id)}
                              onCheckedChange={() => toggleTimecard(timecard.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          <div>
                            <p>{timecard.application?.fullName || timecard.user?.fullName}</p>
                            <p className="text-xs text-muted-foreground">{timecard.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{timecard.application?.department}</TableCell>
                        <TableCell>{timecard.application?.position}</TableCell>
                        <TableCell>{format(new Date(timecard.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{parseFloat(timecard.hoursWorked).toFixed(1)}h</TableCell>
                        <TableCell>KSh {parseFloat(timecard.hourlyRate).toFixed(2)}</TableCell>
                        <TableCell>
                          {timecard.earnings
                            ? `KSh ${parseFloat(timecard.earnings).toLocaleString()}`
                            : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(timecard.status)}</TableCell>
                        <TableCell>
                          {timecard.status === 'pending' ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleAction('verify', timecard.id)}
                                  className="cursor-pointer"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                  Verify
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleAction('reject', timecard.id)}
                                  className="cursor-pointer text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'verify' ? 'Verify Timecard' : 'Reject Timecard'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'verify'
                ? 'Confirm verification of this timecard. Earnings will be calculated automatically.'
                : 'Please provide a reason for rejection.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Notes {actionDialog.action === 'reject' && <span className="text-red-600">*</span>}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  actionDialog.action === 'verify'
                    ? 'Optional notes...'
                    : 'Reason for rejection...'
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={verifyMutation.isPending || rejectMutation.isPending}
              variant={actionDialog.action === 'verify' ? 'default' : 'destructive'}
            >
              {actionDialog.action === 'verify' ? 'Verify' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
