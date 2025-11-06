import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { authenticatedFetch } from "@/lib/utils";
import { Calendar, CheckCircle2, XCircle, AlertCircle, TrendingUp, Church, Home as HomeIcon, ArrowRight, Activity, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AttendanceOverviewPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // Appointments data
    const [appointments, setAppointments] = useState<any[]>([]);
    const [appointmentsStats, setAppointmentsStats] = useState({
        total: 0,
        attended: 0,
        missed: 0,
        excused: 0,
        pending: 0,
        percentage: 0,
    });

    // Residence attendance data
    const [residenceAttendance, setResidenceAttendance] = useState<any[]>([]);
    const [residenceStats, setResidenceStats] = useState({
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        percentage: 0,
    });

    const studentId = user?.universityId || user?.email?.split("@")[0] || "";

    useEffect(() => {
        loadAllAttendanceData();
    }, [studentId]);

    async function loadAllAttendanceData() {
        try {
            setLoading(true);

            // Load appointments with attendance
            const appointmentsData = await authenticatedFetch(`/api/appointments/student/${studentId}/with-attendance`);
            setAppointments(appointmentsData);

            // Calculate appointments stats
            const totalAppointments = appointmentsData.length;
            const attended = appointmentsData.filter((apt: any) => apt.attendanceStatus === 'present').length;
            const missed = appointmentsData.filter((apt: any) => apt.attendanceStatus === 'absent').length;
            const excused = appointmentsData.filter((apt: any) => apt.attendanceStatus === 'excused').length;
            const pending = appointmentsData.filter((apt: any) => !apt.attendanceStatus).length;

            setAppointmentsStats({
                total: totalAppointments,
                attended,
                missed,
                excused,
                pending,
                percentage: totalAppointments > 0 ? Math.round((attended / totalAppointments) * 100) : 0,
            });

            // Load residence attendance
            const hostelData = await authenticatedFetch('/api/student/hostel/dashboard');
            const residenceData = hostelData.attendanceHistory || [];
            setResidenceAttendance(residenceData);

            // Calculate residence stats
            const totalResidence = residenceData.length;
            const present = residenceData.filter((r: any) => r.status === 'present').length;
            const absent = residenceData.filter((r: any) => r.status === 'absent').length;
            const late = residenceData.filter((r: any) => r.status === 'late').length;
            const excusedRes = residenceData.filter((r: any) => r.status === 'excused').length;

            setResidenceStats({
                total: totalResidence,
                present,
                absent,
                late,
                excused: excusedRes,
                percentage: totalResidence > 0 ? Math.round((present / totalResidence) * 100) : 0,
            });

        } catch (error: any) {
            console.error("Error loading attendance:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load attendance data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    // Calculate overall stats
    const totalAttendance = appointmentsStats.total + residenceStats.total;
    const totalAttended = appointmentsStats.attended + residenceStats.present;
    const overallPercentage = totalAttendance > 0 ? Math.round((totalAttended / totalAttendance) * 100) : 0;

    // Get recent records from both sources
    const recentAppointments = appointments
        .filter((apt: any) => apt.attendanceStatus)
        .slice(0, 5)
        .map((apt: any) => ({
            type: 'appointment',
            title: apt.title,
            date: apt.date,
            status: apt.attendanceStatus,
            venue: apt.venue,
            notes: undefined,
        }));

    const recentResidence = residenceAttendance
        .slice(0, 5)
        .map((r: any) => ({
            type: 'residence',
            title: 'Roll Call',
            date: r.date,
            status: r.status,
            venue: r.hostelName,
            notes: r.notes,
        }));

    const recentRecords = [...recentAppointments, ...recentResidence]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Attendance Records</h1>
                    <p className="text-muted-foreground">Track your attendance across appointments and residence roll calls</p>
                </div>
            </div>

            {/* Overall Stats Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Overall Attendance Performance
                    </CardTitle>
                    <CardDescription>Combined attendance across all categories</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{overallPercentage}%</div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {totalAttended} attended out of {totalAttendance} total
                            </p>
                        </div>
                        <Badge
                            variant={overallPercentage >= 80 ? "default" : overallPercentage >= 60 ? "secondary" : "destructive"}
                            className="text-lg px-4 py-2"
                        >
                            {overallPercentage >= 80 ? "Excellent" : overallPercentage >= 60 ? "Good" : "Needs Improvement"}
                        </Badge>
                    </div>
                    <Progress value={overallPercentage} className="h-3" />
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointmentsStats.percentage}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {appointmentsStats.attended} attended
                        </p>
                        <Progress value={appointmentsStats.percentage} className="mt-2" />
                        <div className="flex gap-1 mt-2 text-xs">
                            <Badge variant="outline" className="text-green-600">{appointmentsStats.attended} Present</Badge>
                            <Badge variant="outline" className="text-red-600">{appointmentsStats.missed} Missed</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Residence</CardTitle>
                        <HomeIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{residenceStats.percentage}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {residenceStats.present} roll calls
                        </p>
                        <Progress value={residenceStats.percentage} className="mt-2" />
                        <div className="flex gap-1 mt-2 text-xs">
                            <Badge variant="outline" className="text-green-600">{residenceStats.present} Present</Badge>
                            <Badge variant="outline" className="text-red-600">{residenceStats.absent} Absent</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAttendance}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All attendance entries
                        </p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                            <div>Appointments: {appointmentsStats.total}</div>
                            <div>Residence: {residenceStats.total}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointmentsStats.pending}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Upcoming appointments
                        </p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                            <div>Excused: {appointmentsStats.excused + residenceStats.excused}</div>
                            <div>Late: {residenceStats.late}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Appointments Attendance
                        </CardTitle>
                        <CardDescription>
                            View detailed attendance for church services, assemblies, and events
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-medium">Total Appointments</p>
                                    <p className="text-sm text-muted-foreground">{appointmentsStats.total} scheduled</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-blue-600">{appointmentsStats.percentage}%</p>
                                    <p className="text-xs text-muted-foreground">Attendance rate</p>
                                </div>
                            </div>
                            <Link href="/appointments">
                                <Button className="w-full" variant="outline">
                                    View Details
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HomeIcon className="h-5 w-5 text-green-600" />
                            Residence Attendance
                        </CardTitle>
                        <CardDescription>
                            View roll call records and residence attendance history
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-medium">Total Roll Calls</p>
                                    <p className="text-sm text-muted-foreground">{residenceStats.total} records</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">{residenceStats.percentage}%</p>
                                    <p className="text-xs text-muted-foreground">Attendance rate</p>
                                </div>
                            </div>
                            <Link href="/residence-records">
                                <Button className="w-full" variant="outline">
                                    View Details
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Attendance Records */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Attendance Records
                    </CardTitle>
                    <CardDescription>Your most recent attendance entries across all categories</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentRecords.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No recent attendance records</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentRecords.map((record, index) => {
                                const recordDate = new Date(record.date);
                                const isToday = recordDate.toDateString() === new Date().toDateString();

                                return (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${record.status === 'present' ? 'bg-green-100' :
                                                    record.status === 'absent' ? 'bg-red-100' :
                                                        record.status === 'late' ? 'bg-yellow-100' :
                                                            'bg-blue-100'
                                                }`}>
                                                {record.type === 'appointment' ? (
                                                    <Calendar className={`h-5 w-5 ${record.status === 'present' ? 'text-green-600' :
                                                            record.status === 'absent' ? 'text-red-600' :
                                                                'text-blue-600'
                                                        }`} />
                                                ) : (
                                                    <HomeIcon className={`h-5 w-5 ${record.status === 'present' ? 'text-green-600' :
                                                            record.status === 'absent' ? 'text-red-600' :
                                                                record.status === 'late' ? 'text-yellow-600' :
                                                                    'text-blue-600'
                                                        }`} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{record.title}</p>
                                                    {isToday && <Badge variant="outline" className="text-xs">Today</Badge>}
                                                    <Badge variant="outline" className="text-xs">
                                                        {record.type === 'appointment' ? 'Appointment' : 'Roll Call'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                    <span>{recordDate.toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}</span>
                                                    <span>•</span>
                                                    <span>{record.venue}</span>
                                                </div>
                                                {record.notes && (
                                                    <p className="text-xs text-muted-foreground italic mt-1">
                                                        {record.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={
                                            record.status === 'present' ? 'default' :
                                                record.status === 'absent' ? 'destructive' :
                                                    record.status === 'late' ? 'secondary' :
                                                        'outline'
                                        }>
                                            {record.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
