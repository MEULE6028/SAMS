import { useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle, AlertCircle, MoreVertical, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Timecard {
    id: number;
    date: string;
    hoursWorked: number;
    status: string;
    earnings: number | null;
    studentName: string;
    studentId: string;
    department: string;
}

export default function SupervisorTimecards() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Fetch timecards with filters (using default queryFn with auth headers)
    const { data: timecards = [] } = useQuery<Timecard[]>({
        queryKey: [`/api/supervisor/timecards?${(() => {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);
            return params.toString();
        })()}`],
    });

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchQuery]);

    // Verify timecard mutation
    const verifyMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiRequest('PATCH', `/api/supervisor/timecards/${id}/verify`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/supervisor/timecards'] });
            queryClient.invalidateQueries({ queryKey: ['/api/supervisor/dashboard/stats'] });
            toast({
                title: "Success",
                description: "Timecard verified successfully",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to verify timecard",
                variant: "destructive",
            });
        }
    });

    // Reject timecard mutation
    const rejectMutation = useMutation({
        mutationFn: async ({ id, comments }: { id: number; comments: string }) => {
            return apiRequest('PATCH', `/api/supervisor/timecards/${id}/reject`, { comments });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/supervisor/timecards'] });
            queryClient.invalidateQueries({ queryKey: ['/api/supervisor/dashboard/stats'] });
            toast({
                title: "Success",
                description: "Timecard rejected successfully",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to reject timecard",
                variant: "destructive",
            });
        }
    });

    const handleVerify = (id: number) => {
        verifyMutation.mutate(id);
    };

    const handleReject = (id: number) => {
        const comments = prompt("Enter rejection reason:");
        if (comments) {
            rejectMutation.mutate({ id, comments });
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { label: "Pending", className: "bg-yellow-500" },
            verified: { label: "Verified", className: "bg-green-500" },
            rejected: { label: "Rejected", className: "bg-red-500" },
            paid: { label: "Paid", className: "bg-blue-500" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
            label: status,
            className: "bg-gray-500"
        };

        return <Badge className={config.className}>{config.label}</Badge>;
    };

    const getStatusCounts = () => {
        return {
            all: timecards.length,
            pending: timecards.filter(tc => tc.status === 'pending').length,
            verified: timecards.filter(tc => tc.status === 'verified').length,
            rejected: timecards.filter(tc => tc.status === 'rejected').length,
            paid: timecards.filter(tc => tc.status === 'paid').length,
        };
    };

    const statusCounts = getStatusCounts();

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Timecards Management</h1>
                <p className="text-muted-foreground">
                    Review and manage timecards from students in your department
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card className={statusFilter === 'all' ? 'border-primary' : ''}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">All Timecards</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.all}</div>
                    </CardContent>
                </Card>

                <Card className={statusFilter === 'pending' ? 'border-primary' : ''}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.pending}</div>
                    </CardContent>
                </Card>

                <Card className={statusFilter === 'verified' ? 'border-primary' : ''}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-green-600">Verified</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.verified}</div>
                    </CardContent>
                </Card>

                <Card className={statusFilter === 'rejected' ? 'border-primary' : ''}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.rejected}</div>
                    </CardContent>
                </Card>

                <Card className={statusFilter === 'paid' ? 'border-primary' : ''}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-blue-600">Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.paid}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Timecards Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                            <CardTitle>Timecards</CardTitle>
                            <CardDescription>All timecards submitted by students in your department</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by student name or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 w-full sm:w-[250px]"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {timecards.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No timecards found
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Student ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Hours</TableHead>
                                        <TableHead>Earnings</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {timecards
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((timecard) => (
                                            <TableRow key={timecard.id}>
                                                <TableCell className="font-medium">{timecard.studentName}</TableCell>
                                                <TableCell>{timecard.studentId}</TableCell>
                                                <TableCell>{new Date(timecard.date).toLocaleDateString()}</TableCell>
                                                <TableCell>{timecard.hoursWorked}h</TableCell>
                                                <TableCell>KES {(timecard.earnings || 0).toLocaleString()}</TableCell>
                                                <TableCell>{getStatusBadge(timecard.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    {timecard.status === 'pending' && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => handleVerify(timecard.id)}
                                                                    className="text-green-600"
                                                                >
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Verify
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleReject(timecard.id)}
                                                                    className="text-red-600"
                                                                >
                                                                    <AlertCircle className="mr-2 h-4 w-4" />
                                                                    Reject
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {timecards.length > itemsPerPage && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                                        {Math.min(currentPage * itemsPerPage, timecards.length)} of{' '}
                                        {timecards.length} results
                                    </p>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: Math.ceil(timecards.length / itemsPerPage) }, (_, i) => i + 1)
                                                .filter(page => {
                                                    // Show first page, last page, current page, and pages around current
                                                    const totalPages = Math.ceil(timecards.length / itemsPerPage);
                                                    return page === 1 ||
                                                        page === totalPages ||
                                                        (page >= currentPage - 1 && page <= currentPage + 1);
                                                })
                                                .map((page, idx, array) => {
                                                    // Add ellipsis if there's a gap
                                                    const prevPage = array[idx - 1];
                                                    const showEllipsis = prevPage && page - prevPage > 1;

                                                    return (
                                                        <React.Fragment key={page}>
                                                            {showEllipsis && (
                                                                <PaginationItem>
                                                                    <span className="px-4">...</span>
                                                                </PaginationItem>
                                                            )}
                                                            <PaginationItem>
                                                                <PaginationLink
                                                                    onClick={() => setCurrentPage(page)}
                                                                    isActive={currentPage === page}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {page}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(timecards.length / itemsPerPage), p + 1))}
                                                    className={
                                                        currentPage === Math.ceil(timecards.length / itemsPerPage)
                                                            ? 'pointer-events-none opacity-50'
                                                            : 'cursor-pointer'
                                                    }
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
        </div>
    );
}
