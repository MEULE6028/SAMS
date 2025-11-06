import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, getDashboardRoute } from "@/lib/auth";
import {
  Users,
  Briefcase,
  Vote,
  Clock,
  Home,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Activity,
  Calendar,
  ArrowUpRight,
  Eye,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import { format } from "date-fns";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-admin users to their appropriate dashboards
  useEffect(() => {
    if (user) {
      const allowedRoles = ['admin', 'treasurer', 'vc'];
      if (!allowedRoles.includes(user.role)) {
        const correctRoute = getDashboardRoute(user);
        setLocation(correctRoute);
      }
    }
  }, [user, setLocation]);

  // Fetch all necessary data
  const { data: accounts, isLoading: accountsLoading } = useQuery<any>({
    queryKey: ["/api/admin/chapa360/accounts"],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<any>({
    queryKey: ["/api/admin/swsms/applications"],
  });

  const { data: timecards, isLoading: timecardsLoading } = useQuery<any>({
    queryKey: ["/api/admin/swsms/timecards"],
  });

  const { data: elections, isLoading: electionsLoading } = useQuery<any>({
    queryKey: ["/api/admin/sgms/elections"],
  });

  const { data: withdrawalRequests, isLoading: withdrawalsLoading } = useQuery<any>({
    queryKey: ["/api/student/wallet/withdrawals"],
  });

  const { data: analyticsOverview } = useQuery<any>({
    queryKey: ["/api/analytics/overview"],
  });

  const { data: financialData } = useQuery<any>({
    queryKey: ["/api/analytics/financial"],
  });

  const { data: workStudyAnalytics } = useQuery<any>({
    queryKey: ["/api/analytics/work-study"],
  });

  // Calculate overview statistics
  const totalStudents = accounts?.length || 0;
  const totalBalance = accounts?.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || 0), 0) || 0;

  const pendingApplications = applications?.filter((app: any) => app.status === "pending" || app.status === "under_review" || app.status === "appealed").length || 0;
  const approvedApplications = applications?.filter((app: any) => app.status === "approved").length || 0;
  const rejectedApplications = applications?.filter((app: any) => app.status === "rejected" || app.status === "auto_rejected").length || 0;

  const pendingTimecards = timecards?.filter((tc: any) => tc.status === "pending").length || 0;
  const verifiedTimecards = timecards?.filter((tc: any) => tc.status === "verified").length || 0;
  const totalEarnings = timecards?.filter((tc: any) => tc.status === "verified")
    .reduce((sum: number, tc: any) => sum + parseFloat(tc.earnings || 0), 0) || 0;

  const activeElections = elections?.filter((e: any) => e.status === "active").length || 0;
  const totalElections = elections?.length || 0;
  const totalCandidates = elections?.reduce((sum: number, e: any) => sum + (e.candidateCount || 0), 0) || 0;
  const totalVotes = elections?.reduce((sum: number, e: any) => sum + (e.totalVotes || 0), 0) || 0;

  const pendingWithdrawals = withdrawalRequests?.withdrawals?.filter((w: any) => w.status === "pending").length || 0;
  const withdrawalAmount = withdrawalRequests?.withdrawals?.filter((w: any) => w.status === "pending")
    .reduce((sum: number, w: any) => sum + parseFloat(w.amount || 0), 0) || 0;

  // Overview Statistics Cards
  const overviewStats = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Active student accounts",
    },
    {
      title: "Total Balance",
      value: `KSh ${totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Across all accounts",
    },
    {
      title: "Pending Approvals",
      value: pendingApplications + pendingTimecards + pendingWithdrawals,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Requires your attention",
    },
    {
      title: "Active Elections",
      value: activeElections,
      subtitle: `${totalElections} total`,
      icon: Vote,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Currently open for voting",
    },
  ];

  // Chart configurations
  const workStudyChart = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        label: "Applications",
        data: [pendingApplications, approvedApplications, rejectedApplications],
        backgroundColor: ["#f59e0b", "#10b981", "#ef4444"],
        borderColor: ["#d97706", "#059669", "#dc2626"],
        borderWidth: 1,
      },
    ],
  };

  const earningsChart = {
    labels: workStudyAnalytics?.map((d: any) => d.week) || ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Hours Worked",
        data: workStudyAnalytics?.map((d: any) => d.hours) || [12, 15, 18, 20],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
      },
    ],
  };

  const financialChart = {
    labels: financialData?.map((d: any) => d.month) || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Wallet Balance",
        data: financialData?.map((d: any) => d.balance) || [15000, 18000, 16000, 20000, 22000, 24000],
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderColor: "rgba(16, 185, 129, 1)",
        tension: 0.4,
      },
    ],
  };

  const electionParticipationChart = {
    labels: elections?.map((e: any) => e.title.substring(0, 20)) || ["Election 1", "Election 2", "Election 3"],
    datasets: [
      {
        label: "Total Votes",
        data: elections?.map((e: any) => e.totalVotes || 0) || [120, 150, 90],
        backgroundColor: "rgba(147, 51, 234, 0.6)",
      },
      {
        label: "Candidates",
        data: elections?.map((e: any) => e.candidateCount || 0) || [5, 7, 4],
        backgroundColor: "rgba(251, 191, 36, 0.6)",
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive oversight of all student affairs
        </p>
      </div>

      {/* Overview Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat, index) => (
          <Card key={index} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Actions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Timecards */}
        <Card className="border-orange-200 hover-elevate">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <Clock className="h-5 w-5" />
                Timecard Approvals
              </CardTitle>
              <Badge variant="destructive">{pendingTimecards}</Badge>
            </div>
            <CardDescription>Requires verification</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {verifiedTimecards} already verified this period
            </p>
            <Link href="/admin/swsms/timecards">
              <Button className="w-full" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Review Timecards
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Withdrawal Requests */}
        <Card className="border-green-200 hover-elevate">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-600">
                <DollarSign className="h-5 w-5" />
                Withdrawal Requests
              </CardTitle>
              <Badge variant="destructive">{pendingWithdrawals}</Badge>
            </div>
            <CardDescription>Pending approval</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Total: KSh {withdrawalAmount.toLocaleString()}
            </p>
            <Link href="/admin/accounts">
              <Button className="w-full" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Review Withdrawals
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Work Study Applications */}
        <Card className="border-blue-200 hover-elevate">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Briefcase className="h-5 w-5" />
                Work Applications
              </CardTitle>
              <Badge variant="destructive">{pendingApplications}</Badge>
            </div>
            <CardDescription>Awaiting vetting</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {approvedApplications} approved, {rejectedApplications} rejected
            </p>
            <Link href="/admin/swsms/vetting">
              <Button className="w-full" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Vet Applications
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Work Study Applications Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Work Study Applications Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <Doughnut
                  data={workStudyChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Work Study Hours Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={earningsChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Wallet Balance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line
                data={financialChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function (value) {
                          return "KSh " + value.toLocaleString();
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Election Participation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5 text-purple-600" />
              Election Participation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {electionsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <Bar
                  data={electionParticipationChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/accounts">
            <Card className="cursor-pointer hover-elevate transition-all">
              <CardContent className="flex items-center gap-4 pt-6">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold">Student Accounts</p>
                  <p className="text-xs text-muted-foreground">{totalStudents} accounts</p>
                </div>
                <ArrowUpRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/swsms/vetting">
            <Card className="cursor-pointer hover-elevate transition-all">
              <CardContent className="flex items-center gap-4 pt-6">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold">Vetting Dashboard</p>
                  <p className="text-xs text-muted-foreground">{pendingApplications} pending</p>
                </div>
                <ArrowUpRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/swsms/timecards">
            <Card className="cursor-pointer hover-elevate transition-all">
              <CardContent className="flex items-center gap-4 pt-6">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="font-semibold">All Timecards</p>
                  <p className="text-xs text-muted-foreground">{pendingTimecards} to verify</p>
                </div>
                <ArrowUpRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/sgms/elections">
            <Card className="cursor-pointer hover-elevate transition-all">
              <CardContent className="flex items-center gap-4 pt-6">
                <Vote className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-semibold">Manage Elections</p>
                  <p className="text-xs text-muted-foreground">{activeElections} active</p>
                </div>
                <ArrowUpRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            System Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Work Study Participants</p>
              <p className="text-2xl font-bold text-foreground">{approvedApplications}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Earnings Paid</p>
              <p className="text-2xl font-bold text-green-600">
                KSh {totalEarnings.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Election Candidates</p>
              <p className="text-2xl font-bold text-purple-600">{totalCandidates}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Votes Cast</p>
              <p className="text-2xl font-bold text-purple-600">{totalVotes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
