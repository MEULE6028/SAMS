import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Users,
  BedDouble,
  TrendingUp,
  Building2,
  Search,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "@/lib/auth";

interface DashboardStats {
  totalStudents: number;
  totalHostels: number;
  totalRooms: number;
  emptyRooms: number;
  occupancyRate: number;
  totalBeds: number;
  occupiedBeds: number;
  recentBookings: number;
  gender: string;
}

interface Room {
  hostelName: string;
  roomNumber: string;
  capacity: number;
  currentOccupancy: number;
  availableBeds: number;
  status: 'empty' | 'partial' | 'full';
  students: any[];
}

interface Student {
  studentId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  course: string;
  hostelName: string;
  roomNumber: string;
  bedNumber: string;
  allocatedAt: string;
}

interface Analytics {
  hostelStats: Array<{ hostelName: string; students: number }>;
  monthlyAllocations: Array<{ month: string; allocations: number }>;
  occupancyBreakdown: Array<{ status: string; count: number }>;
}

const COLORS = ['#22c55e', '#facc15', '#ef4444'];

interface DeanDashboardProps {
  defaultTab?: string;
}

export default function DeanDashboard({ defaultTab = "overview" }: DeanDashboardProps = {}) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHostel, setSelectedHostel] = useState("all");
  const [roomStatus, setRoomStatus] = useState("all");
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dean/dashboard/stats'],
  });

  // Fetch rooms
  const { data: roomsData } = useQuery<{ rooms: Room[]; hostels: string[] }>({
    queryKey: [`/api/dean/rooms?${(() => {
      const params = new URLSearchParams();
      if (selectedHostel !== 'all') params.append('hostel', selectedHostel);
      if (roomStatus !== 'all') params.append('status', roomStatus);
      return params.toString();
    })()}`],
  });

  // Fetch students
  const { data: studentsData } = useQuery<{ students: Student[] }>({
    queryKey: [`/api/dean/students?${(() => {
      const params = new URLSearchParams();
      if (selectedHostel !== 'all') params.append('hostel', selectedHostel);
      if (searchQuery) params.append('search', searchQuery);
      return params.toString();
    })()}`],
  });

  // Fetch analytics
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ['/api/dean/analytics'],
  });

  const getGenderTitle = () => {
    if (user?.role === 'deanLadies') return "Ladies";
    if (user?.role === 'deanMen') return "Men";
    return "";
  };

  const getStatusBadge = (status: string) => {
    const config = {
      full: { label: "Full", className: "bg-red-500" },
      partial: { label: "Partial", className: "bg-yellow-500" },
      empty: { label: "Empty", className: "bg-green-500" },
    };
    const statusConfig = config[status as keyof typeof config] || {
      label: status,
      className: "bg-gray-500"
    };
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{getGenderTitle()} Residence Dashboard</h1>
        <p className="text-muted-foreground">
          On-Campus Housing Management • {stats?.gender} Students
        </p>
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
              Living on campus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hostels</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHostels || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalRooms || 0} total rooms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.occupancyRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.occupiedBeds || 0} of {stats?.totalBeds || 0} beds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
            <BedDouble className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emptyRooms || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentBookings || 0} bookings this month
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
          <TabsTrigger value="rooms">
            <Home className="mr-2 h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="mr-2 h-4 w-4" />
            Students
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Hostel Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Students by Hostel</CardTitle>
                <CardDescription>Distribution across hostels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.hostelStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hostelName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="students" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Occupancy Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Room Occupancy Status</CardTitle>
                <CardDescription>Full, partial, and empty rooms</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics?.occupancyBreakdown || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(analytics?.occupancyBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Allocations Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Room Allocations</CardTitle>
              <CardDescription>Allocation trends over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.monthlyAllocations || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="allocations"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="New Allocations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Room Management</CardTitle>
              <CardDescription>View and manage room occupancy</CardDescription>
              <div className="flex gap-4 mt-4">
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Hostels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hostels</SelectItem>
                    {roomsData?.hostels.map((hostel) => (
                      <SelectItem key={hostel} value={hostel}>
                        {hostel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={roomStatus} onValueChange={setRoomStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="empty">Empty</SelectItem>
                    <SelectItem value="partial">Partially Occupied</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {roomsData?.rooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No rooms found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hostel</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Occupied</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomsData?.rooms.map((room, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{room.hostelName}</TableCell>
                        <TableCell>{room.roomNumber}</TableCell>
                        <TableCell>{room.capacity}</TableCell>
                        <TableCell>{room.currentOccupancy}</TableCell>
                        <TableCell>{room.availableBeds}</TableCell>
                        <TableCell>{getStatusBadge(room.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Directory</CardTitle>
              <CardDescription>All students living on campus</CardDescription>
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Hostels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hostels</SelectItem>
                    {roomsData?.hostels.map((hostel) => (
                      <SelectItem key={hostel} value={hostel}>
                        {hostel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {studentsData?.students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Hostel</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Bed</TableHead>
                      <TableHead>Course</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsData?.students.map((student, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{student.studentId}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.hostelName}</TableCell>
                        <TableCell>{student.roomNumber}</TableCell>
                        <TableCell>{student.bedNumber}</TableCell>
                        <TableCell>{student.course}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
