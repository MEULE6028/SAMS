import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, BedDouble, TrendingUp, Building2 } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";

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

interface Analytics {
  hostelStats: Array<{ hostelName: string; students: number }>;
  monthlyAllocations: Array<{ month: string; allocations: number }>;
  occupancyBreakdown: Array<{ status: string; count: number }>;
}

const COLORS = ['#22c55e', '#facc15', '#ef4444'];

export default function DeanDashboard() {
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dean/dashboard/stats"],
    queryFn: () => apiRequest("GET", "/api/dean/dashboard/stats"),
  });

  // Fetch analytics
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/dean/analytics"],
    queryFn: () => apiRequest("GET", "/api/dean/analytics"),
  });

  const isLadiesDean = user?.role === 'deanLadies';
  const title = isLadiesDean ? 'Ladies Residence Dashboard' : 'Men Residence Dashboard';
  const subtitle = `On-Campus Housing Management • ${stats?.gender || ''} Students`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
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
            <p className="text-xs text-muted-foreground">Living on campus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hostels</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHostels || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalRooms || 0} total rooms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBeds ? stats.totalBeds - stats.occupiedBeds : 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentBookings || 0} bookings this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Students by Hostel */}
        <Card>
          <CardHeader>
            <CardTitle>Students by Hostel</CardTitle>
            <CardDescription>Distribution across hostels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.hostelStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hostelName"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#0ea5e9" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Room Occupancy Status */}
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
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Allocations Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Allocations</CardTitle>
          <CardDescription>Room allocation trends over time</CardDescription>
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
                stroke="#0ea5e9"
                strokeWidth={2}
                name="Allocations"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
