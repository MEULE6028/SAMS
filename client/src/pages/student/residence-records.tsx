import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { authenticatedFetch } from "@/lib/utils";
import { Calendar, CheckCircle2, XCircle, AlertCircle, Home, ChevronLeft, ChevronRight, Activity, ArrowLeft, Info } from "lucide-react";
import { Link } from "wouter";

export default function ResidenceRecordsPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [todayAttendance, setTodayAttendance] = useState<any>(null);

    // Pagination states
    const [attendancePage, setAttendancePage] = useState(1);
    const [attendanceItemsPerPage, setAttendanceItemsPerPage] = useState(10);

    const studentId = user?.universityId || user?.email?.split("@")[0] || "";

    useEffect(() => {
        loadAttendanceData();
    }, [studentId]);

    async function loadAttendanceData() {
        try {
            setLoading(true);
            const data = await authenticatedFetch(`/api/student/hostel/dashboard`);

            setAttendanceHistory(data.attendanceHistory || []);
            setTodayAttendance(data.todayAttendance);
        } catch (error: any) {
            console.error("[RESIDENCE RECORDS] Error loading data:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load attendance data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    // Calculate stats
    const totalRecords = attendanceHistory.length;
    const presentCount = attendanceHistory.filter(r => r.status === 'present').length;
    const absentCount = attendanceHistory.filter(r => r.status === 'absent').length;
    const lateCount = attendanceHistory.filter(r => r.status === 'late').length;
    const excusedCount = attendanceHistory.filter(r => r.status === 'excused').length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    // Pagination
    const totalPages = Math.ceil(attendanceHistory.length / attendanceItemsPerPage);
    const paginatedRecords = attendanceHistory.slice(
        (attendancePage - 1) * attendanceItemsPerPage,
        attendancePage * attendanceItemsPerPage
    );

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-4 md:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Back Button and Header */}
            <div className="flex items-center gap-4">
                <Link href="/attendance">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">Residence Attendance Records</h1>
                    <p className="text-muted-foreground">Your roll call attendance history (last 30 days)</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRecords}</div>
                        <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Present</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">On time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Absent</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Not marked</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Late/Excused</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{lateCount + excusedCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">{lateCount} late, {excusedCount} excused</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                        <Activity className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
                        <Progress value={attendanceRate} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Today's Attendance */}
            {todayAttendance && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Today's Roll Call
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={
                                    todayAttendance.status === 'present' ? 'default' :
                                        todayAttendance.status === 'absent' ? 'destructive' :
                                            todayAttendance.status === 'late' ? 'secondary' :
                                                'outline'
                                } className="mt-1">
                                    {todayAttendance.status.toUpperCase()}
                                </Badge>
                            </div>
                            {todayAttendance.checkInTime && (
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Marked at</p>
                                    <p className="font-medium">
                                        {new Date(todayAttendance.checkInTime).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                        {todayAttendance.notes && (
                            <p className="text-sm text-muted-foreground mt-3 italic">
                                Note: {todayAttendance.notes}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Attendance History */}
            {attendanceHistory.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Attendance History
                        </CardTitle>
                        <CardDescription>Your roll call records from the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Items per page selector */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/50 p-4 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
                                <Select
                                    value={attendanceItemsPerPage.toString()}
                                    onValueChange={(value) => {
                                        setAttendanceItemsPerPage(Number(value));
                                        setAttendancePage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5</SelectItem>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-muted-foreground">per page</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Showing {((attendancePage - 1) * attendanceItemsPerPage) + 1} to {Math.min(attendancePage * attendanceItemsPerPage, attendanceHistory.length)} of {attendanceHistory.length} records
                            </div>
                        </div>

                        {/* Records List */}
                        <div className="space-y-2">
                            {paginatedRecords.map((record, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-3 w-3 rounded-full ${record.status === 'present' ? 'bg-green-500' :
                                                record.status === 'late' ? 'bg-yellow-500' :
                                                    record.status === 'excused' ? 'bg-blue-500' :
                                                        'bg-red-500'
                                            }`} />
                                        <div>
                                            <p className="font-medium">
                                                {new Date(record.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            {record.checkInTime && (
                                                <p className="text-xs text-muted-foreground">
                                                    Marked at {new Date(record.checkInTime).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            )}
                                            {record.notes && (
                                                <p className="text-xs text-muted-foreground italic mt-1">
                                                    Note: {record.notes}
                                                </p>
                                            )}
                                            {record.markedBy && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Marked by: {record.markedBy}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge variant={
                                            record.status === 'present' ? 'default' :
                                                record.status === 'late' ? 'secondary' :
                                                    record.status === 'excused' ? 'outline' :
                                                        'destructive'
                                        }>
                                            {record.status.toUpperCase()}
                                        </Badge>
                                        {record.isWithinWindow !== undefined && (
                                            <span className="text-xs text-muted-foreground">
                                                {record.isWithinWindow ? '✓ On time' : '⚠ Late'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Navigation */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAttendancePage(p => Math.max(1, p - 1))}
                                    disabled={attendancePage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <div className="text-sm font-medium px-4">
                                    Page {attendancePage} of {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAttendancePage(p => Math.min(totalPages, p + 1))}
                                    disabled={attendancePage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Attendance Records</AlertTitle>
                    <AlertDescription>
                        You don't have any attendance records yet. Officers will mark your attendance during daily roll call (9:30 PM - 10:00 PM).
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
