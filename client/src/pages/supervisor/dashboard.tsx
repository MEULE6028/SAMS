import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
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
import { Clock, CheckCircle, AlertCircle, Users, MoreVertical, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface DashboardStats {
    totalStudents: number;
    pendingTimecards: number;
    verifiedTimecards: number;
    totalHoursThisMonth: number;
}

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

interface DepartmentInfo {
    department: string;
    supervisorName: string;
}

interface Analytics {
    weeklyHours: Array<{ week: string; hours: number; timecards: number }>;
    studentPerformance: Array<{ name: string; hours: number; timecards: number }>;
    statusBreakdown: { pending: number; verified: number; rejected: number; paid: number };
    monthlyTrends: Array<{ month: string; hours: number; earnings: number; timecards: number }>;
}

const COLORS = ['#facc15', '#22c55e', '#ef4444', '#3b82f6'];

export default function SupervisorDashboard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch dashboard stats
    const { data: stats } = useQuery<DashboardStats>({
        queryKey: ['/api/supervisor/dashboard/stats'],
    });

    // Fetch department info
    const { data: deptInfo } = useQuery<DepartmentInfo>({
        queryKey: ['/api/supervisor/department'],
    });

    // Fetch pending timecards (using default queryFn with auth headers)
    const { data: timecards = [] } = useQuery<Timecard[]>({
        queryKey: ['/api/supervisor/timecards?status=pending'],
    });

    // Fetch analytics data
    const { data: analytics } = useQuery<Analytics>({
        queryKey: ['/api/supervisor/analytics'],
    });

    // Verify timecard mutation
    const verifyMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiRequest('PATCH', `/api/supervisor/timecards/${id}/verify`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/supervisor/dashboard/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/supervisor/timecards'] });
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
            queryClient.invalidateQueries({ queryKey: ['/api/supervisor/dashboard/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/supervisor/timecards'] });
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

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Department Supervisor Dashboard</h1>
                {deptInfo && (
                    <p className="text-muted-foreground">
                        {deptInfo.department} • {deptInfo.supervisorName}
                    </p>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Students in your department
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Timecards</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pendingTimecards || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting your approval
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verified Timecards</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.verifiedTimecards || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Approved this period
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hours (Month)</CardTitle>
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalHoursThisMonth || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Hours worked this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Section */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="trends">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Trends
                    </TabsTrigger>
                    <TabsTrigger value="performance">
                        <Users className="mr-2 h-4 w-4" />
                        Performance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Weekly Hours Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Hours Trend</CardTitle>
                                <CardDescription>Hours worked over the last 8 weeks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analytics?.weeklyHours || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="week" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="hours" fill="#3b82f6" name="Total Hours" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Status Breakdown Pie Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Timecard Status Distribution</CardTitle>
                                <CardDescription>Breakdown by status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={[
                                                { name: 'Pending', value: analytics?.statusBreakdown.pending || 0 },
                                                { name: 'Verified', value: analytics?.statusBreakdown.verified || 0 },
                                                { name: 'Rejected', value: analytics?.statusBreakdown.rejected || 0 },
                                                { name: 'Paid', value: analytics?.statusBreakdown.paid || 0 },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {COLORS.map((color, index) => (
                                                <Cell key={`cell-${index}`} fill={color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                    {/* Monthly Trends */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Trends</CardTitle>
                            <CardDescription>Hours and earnings over the last 6 months</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={analytics?.monthlyTrends || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="hours"
                                        stroke="#3b82f6"
                                        name="Total Hours"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="earnings"
                                        stroke="#22c55e"
                                        name="Earnings (KES)"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Top Students Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Students by Hours</CardTitle>
                                <CardDescription>Most active students in your department</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart
                                        data={analytics?.studentPerformance || []}
                                        layout="vertical"
                                        margin={{ left: 100 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip />
                                        <Bar dataKey="hours" fill="#22c55e" name="Hours Worked" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Student Performance Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Student Performance Details</CardTitle>
                                <CardDescription>Detailed breakdown of student work</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead className="text-right">Hours</TableHead>
                                            <TableHead className="text-right">Timecards</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(analytics?.studentPerformance || []).slice(0, 10).map((student, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell className="text-right">{student.hours}h</TableCell>
                                                <TableCell className="text-right">{student.timecards}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Pending Timecards Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Timecards</CardTitle>
                    <CardDescription>
                        Review and approve submitted timecards from your department
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {timecards.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No pending timecards to review
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
