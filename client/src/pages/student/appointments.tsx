import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, Church, Users, History, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Activity, ArrowLeft } from "lucide-react";
import { authenticatedFetch } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

interface Appointment {
  id: number;
  studentId: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  appointmentType: string;
  attendanceStatus: "present" | "absent" | "excused" | null;
  mandatory: boolean;
}

export default function StudentAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Pagination states
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [upcomingItemsPerPage, setUpcomingItemsPerPage] = useState(10);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);

  const studentId = user?.universityId || user?.email?.split("@")[0] || "";

  useEffect(() => {
    loadAppointments();
  }, [studentId]);

  async function loadAppointments() {
    if (!studentId) return;

    try {
      setLoading(true);
      console.log('[APPOINTMENTS] Fetching appointments for student:', studentId);
      const data = await authenticatedFetch(`/api/appointments/student/${studentId}/with-attendance`);
      console.log('[APPOINTMENTS] Received appointments data:', {
        total: data.length,
        upcoming: data.filter((apt: Appointment) => new Date(apt.date) >= new Date()).length,
        withAttendance: data.filter((apt: Appointment) => apt.attendanceStatus !== null).length,
        data: data
      });
      setAppointments(data);
      setError(null);
    } catch (err: any) {
      console.error("[APPOINTMENTS] Failed to load appointments:", err);
      setError("Failed to load appointments. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  // Filter appointments
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

  console.log('[APPOINTMENTS FILTER] Current date:', now);
  console.log('[APPOINTMENTS FILTER] Total appointments:', appointments.length);

  // Upcoming appointments: future dates OR past dates without attendance marked
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0); // Reset to start of day
    const isFuture = aptDate >= now;
    const hasNoAttendance = !apt.attendanceStatus;

    console.log('[UPCOMING FILTER]', {
      title: apt.title,
      date: apt.date,
      aptDate: aptDate.toISOString(),
      now: now.toISOString(),
      isFuture,
      attendanceStatus: apt.attendanceStatus,
      hasNoAttendance,
      included: isFuture || hasNoAttendance
    });

    return isFuture || hasNoAttendance;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Attendance history: past appointments with attendance marked
  const attendanceHistory = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    const isPast = aptDate < now;
    const hasAttendance = apt.attendanceStatus !== null;

    console.log('[HISTORY FILTER]', {
      title: apt.title,
      date: apt.date,
      isPast,
      attendanceStatus: apt.attendanceStatus,
      hasAttendance,
      included: hasAttendance
    });

    return hasAttendance;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log('[APPOINTMENTS FILTER] Results:', {
    upcoming: upcomingAppointments.length,
    history: attendanceHistory.length
  });

  // Calculate stats
  const totalAppointments = appointments.length;
  const attendedCount = appointments.filter(apt => apt.attendanceStatus === 'present').length;
  const missedCount = appointments.filter(apt => apt.attendanceStatus === 'absent').length;
  const excusedCount = appointments.filter(apt => apt.attendanceStatus === 'excused').length;
  const attendanceRate = totalAppointments > 0 ? Math.round((attendedCount / totalAppointments) * 100) : 0;

  // Pagination logic
  const totalUpcomingPages = Math.ceil(upcomingAppointments.length / upcomingItemsPerPage);
  const totalHistoryPages = Math.ceil(attendanceHistory.length / historyItemsPerPage);

  const paginatedUpcoming = upcomingAppointments.slice(
    (upcomingPage - 1) * upcomingItemsPerPage,
    upcomingPage * upcomingItemsPerPage
  );

  const paginatedHistory = attendanceHistory.slice(
    (historyPage - 1) * historyItemsPerPage,
    historyPage * historyItemsPerPage
  );

  // Get appointments for selected date
  const appointmentsOnSelectedDate = appointments.filter(apt => {
    if (!selectedDate) return false;
    const aptDate = new Date(apt.date);
    return aptDate.toDateString() === selectedDate.toDateString();
  });

  // Get dates that have appointments for calendar highlighting with color coding
  const upcomingDates = upcomingAppointments.map(apt => new Date(apt.date));
  const attendedDates = appointments.filter(apt => apt.attendanceStatus === 'present').map(apt => new Date(apt.date));
  const missedDates = appointments.filter(apt => apt.attendanceStatus === 'absent').map(apt => new Date(apt.date));

  // Helper to check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getStatusBadge = (status: string | null) => {
    if (status === "present") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Present</Badge>;
    } else if (status === "absent") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
    } else if (status === "excused") {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200"><AlertCircle className="h-3 w-3 mr-1" />Excused</Badge>;
    }
    return <Badge variant="outline">Not Marked</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'church':
        return <Church className="h-4 w-4" />;
      case 'assembly':
        return <Users className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/attendance">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground">View your upcoming appointments and attendance history</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {upcomingAppointments.length} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attended</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Marked present
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{missedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {excusedCount > 0 ? `${excusedCount} excused` : 'Marked absent'}
            </p>
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

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Attendance History
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Appointments Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming appointments</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Items per page selector - BEFORE the list */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
                  <Select
                    value={upcomingItemsPerPage.toString()}
                    onValueChange={(value) => {
                      setUpcomingItemsPerPage(Number(value));
                      setUpcomingPage(1); // Reset to first page
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
                  <span className="text-sm text-muted-foreground">
                    per page
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {((upcomingPage - 1) * upcomingItemsPerPage) + 1} to {Math.min(upcomingPage * upcomingItemsPerPage, upcomingAppointments.length)} of {upcomingAppointments.length} appointments
                </div>
              </div>

              <div className="grid gap-4">
                {paginatedUpcoming.map((apt) => {
                  const aptDate = new Date(apt.date);
                  const isTodayApt = isToday(aptDate);

                  return (
                    <Card key={apt.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              {getTypeIcon(apt.appointmentType)}
                              {apt.title}
                              {isTodayApt && (
                                <Badge className="bg-blue-600 hover:bg-blue-700">Today</Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{apt.description}</CardDescription>
                          </div>
                          {apt.mandatory && (
                            <Badge variant="destructive">Mandatory</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{aptDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{aptDate.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{apt.venue}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination Navigation */}
              {totalUpcomingPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpcomingPage(p => Math.max(1, p - 1))}
                    disabled={upcomingPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium px-4">
                    Page {upcomingPage} of {totalUpcomingPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpcomingPage(p => Math.min(totalUpcomingPages, p + 1))}
                    disabled={upcomingPage === totalUpcomingPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Calendar View Tab */}
        <TabsContent value="calendar">
          <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
            {/* Calendar Card */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>
                  Click on a date to view appointments.
                  <span className="block mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-100 border-2 border-green-500"></span>
                      <span>Upcoming appointments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500"></span>
                      <span>Attended</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-red-100 border-2 border-red-500"></span>
                      <span>Missed</span>
                    </div>
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border shadow-sm"
                  modifiers={{
                    upcoming: upcomingDates,
                    attended: attendedDates,
                    missed: missedDates,
                  }}
                  modifiersStyles={{
                    upcoming: {
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      color: 'rgb(22, 163, 74)',
                      borderRadius: '4px',
                      border: '2px solid rgb(34, 197, 94)',
                    },
                    attended: {
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'rgb(37, 99, 235)',
                      borderRadius: '4px',
                      border: '2px solid rgb(59, 130, 246)',
                    },
                    missed: {
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: 'rgb(220, 38, 38)',
                      borderRadius: '4px',
                      border: '2px solid rgb(239, 68, 68)',
                    },
                  }}
                  modifiersClassNames={{
                    upcoming: 'relative',
                    attended: 'relative',
                    missed: 'relative',
                  }}
                />
              </CardContent>
            </Card>

            {/* Appointments Details Card */}
            <Card className="h-fit min-h-[500px]">
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle className="text-2xl">
                    {selectedDate && isToday(selectedDate) ? (
                      <span className="flex items-center gap-2">
                        Today
                        <Badge className="bg-blue-600 hover:bg-blue-700">
                          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Badge>
                      </span>
                    ) : selectedDate ? (
                      selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    ) : (
                      'Select a date'
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {appointmentsOnSelectedDate.length === 0
                      ? 'No appointments scheduled'
                      : `${appointmentsOnSelectedDate.length} appointment${appointmentsOnSelectedDate.length > 1 ? 's' : ''} on this day`
                    }
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointmentsOnSelectedDate.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No appointments</p>
                    <p className="text-sm">Select another date to view appointments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointmentsOnSelectedDate.map((apt) => {
                      const aptDate = new Date(apt.date);
                      const borderColor = apt.attendanceStatus === 'present'
                        ? 'border-l-blue-500'
                        : apt.attendanceStatus === 'absent'
                          ? 'border-l-red-500'
                          : aptDate >= new Date()
                            ? 'border-l-green-500'
                            : 'border-l-gray-300';

                      return (
                        <Card key={apt.id} className={`border-l-4 ${borderColor} hover:shadow-md transition-shadow`}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <div className={`p-2 rounded-lg ${apt.attendanceStatus === 'present'
                                  ? 'bg-blue-50 text-blue-600'
                                  : apt.attendanceStatus === 'absent'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-green-50 text-green-600'
                                  }`}>
                                  {getTypeIcon(apt.appointmentType)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-lg">{apt.title}</h4>
                                  <p className="text-sm text-muted-foreground">{apt.description}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(apt.attendanceStatus)}
                                {apt.mandatory && (
                                  <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">
                                  {aptDate.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                                <MapPin className="h-4 w-4" />
                                <span className="font-medium">{apt.venue}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance History Tab */}
        <TabsContent value="history" className="space-y-4">
          {attendanceHistory.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No attendance history yet</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Items per page selector - BEFORE the list */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
                  <Select
                    value={historyItemsPerPage.toString()}
                    onValueChange={(value) => {
                      setHistoryItemsPerPage(Number(value));
                      setHistoryPage(1); // Reset to first page
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
                  <span className="text-sm text-muted-foreground">
                    per page
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {((historyPage - 1) * historyItemsPerPage) + 1} to {Math.min(historyPage * historyItemsPerPage, attendanceHistory.length)} of {attendanceHistory.length} records
                </div>
              </div>

              <div className="grid gap-4">
                {paginatedHistory.map((apt) => (
                  <Card key={apt.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            {getTypeIcon(apt.appointmentType)}
                            {apt.title}
                          </CardTitle>
                          <CardDescription>{apt.description}</CardDescription>
                        </div>
                        {getStatusBadge(apt.attendanceStatus)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(apt.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(apt.date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{apt.venue}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination Navigation */}
              {totalHistoryPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium px-4">
                    Page {historyPage} of {totalHistoryPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                    disabled={historyPage === totalHistoryPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
