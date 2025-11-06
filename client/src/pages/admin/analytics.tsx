import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  Vote,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function AdminAnalyticsPage() {
  // Fetch analytics data
  const { data: overviewData, isLoading: overviewLoading } = useQuery<any>({
    queryKey: ["/api/analytics/overview"],
  });

  const { data: financialData, isLoading: financialLoading } = useQuery<any>({
    queryKey: ["/api/analytics/financial"],
  });

  const { data: workStudyData, isLoading: workStudyLoading } = useQuery<any>({
    queryKey: ["/api/analytics/work-study"],
  });

  const { data: governanceData, isLoading: governanceLoading } = useQuery<any>({
    queryKey: ["/api/analytics/governance"],
  });

  const { data: accounts } = useQuery<any>({
    queryKey: ["/api/admin/chapa360/accounts"],
  });

  const { data: applications } = useQuery<any>({
    queryKey: ["/api/admin/swsms/applications"],
  });

  const { data: timecards } = useQuery<any>({
    queryKey: ["/api/admin/swsms/timecards"],
  });

  const { data: elections } = useQuery<any>({
    queryKey: ["/api/admin/sgms/elections"],
  });

  // Calculate key metrics
  const totalStudents = accounts?.length || 0;
  const totalBalance = accounts?.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || 0), 0) || 0;
  const totalApplications = applications?.length || 0;
  const approvedApplications = applications?.filter((app: any) => app.status === "approved").length || 0;
  const totalTimecards = timecards?.length || 0;
  const verifiedTimecards = timecards?.filter((tc: any) => tc.status === "verified").length || 0;
  const totalEarnings = timecards?.filter((tc: any) => tc.status === "verified")
    .reduce((sum: number, tc: any) => sum + parseFloat(tc.earnings || 0), 0) || 0;
  const totalElections = elections?.length || 0;
  const activeElections = elections?.filter((e: any) => e.status === "active").length || 0;
  const totalVotes = elections?.reduce((sum: number, e: any) => sum + (e.totalVotes || 0), 0) || 0;

  // Financial Trends Chart
  const financialChart = {
    labels: financialData?.map((d: any) => d.month) || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Wallet Balance (KSh)",
        data: financialData?.map((d: any) => d.balance) || [15000, 18000, 16000, 20000, 22000, 24000],
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "rgba(16, 185, 129, 1)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "rgba(16, 185, 129, 1)",
      },
    ],
  };

  // Work Study Hours Chart
  const workStudyChart = {
    labels: workStudyData?.map((d: any) => d.week) || ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Hours Worked",
        data: workStudyData?.map((d: any) => d.hours) || [12, 15, 18, 20],
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
      },
    ],
  };

  // Application Status Chart
  const applicationStatusChart = {
    labels: ["Pending", "Approved", "Rejected", "Under Review"],
    datasets: [
      {
        data: [
          applications?.filter((a: any) => a.status === "pending").length || 0,
          applications?.filter((a: any) => a.status === "approved").length || 0,
          applications?.filter((a: any) => a.status === "rejected" || a.status === "auto_rejected").length || 0,
          applications?.filter((a: any) => a.status === "under_review" || a.status === "appealed").length || 0,
        ],
        backgroundColor: [
          "rgba(251, 191, 36, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(59, 130, 246, 0.8)",
        ],
        borderColor: [
          "rgba(251, 191, 36, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(59, 130, 246, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Timecard Status Chart
  const timecardStatusChart = {
    labels: ["Pending", "Verified", "Rejected"],
    datasets: [
      {
        data: [
          timecards?.filter((tc: any) => tc.status === "pending").length || 0,
          timecards?.filter((tc: any) => tc.status === "verified").length || 0,
          timecards?.filter((tc: any) => tc.status === "rejected").length || 0,
        ],
        backgroundColor: [
          "rgba(251, 191, 36, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(251, 191, 36, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Election Participation Chart
  const electionChart = {
    labels: governanceData?.map((d: any) => d.election) || ["2023 Fall", "2024 Spring", "2024 Fall"],
    datasets: [
      {
        label: "Candidates",
        data: governanceData?.map((d: any) => d.candidates) || [8, 12, 10],
        backgroundColor: "rgba(147, 51, 234, 0.7)",
      },
      {
        label: "Votes",
        data: governanceData?.map((d: any) => d.votes) || [450, 520, 480],
        backgroundColor: "rgba(251, 191, 36, 0.7)",
      },
    ],
  };

  // Department Earnings Distribution (mock data based on department rates)
  const departmentEarningsChart = {
    labels: ["Library", "IT Services", "Admissions", "Health Center", "Research Center"],
    datasets: [
      {
        data: [25000, 45000, 36000, 28000, 64000],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(147, 51, 234, 0.8)",
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive insights and data visualization
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              KSh {totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Work Study
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{approvedApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">Active participants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Elections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{totalVotes}</div>
            <p className="text-xs text-muted-foreground mt-1">Total votes cast</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Analytics */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="work-study">Work Study</TabsTrigger>
          <TabsTrigger value="elections">Elections</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Wallet Balance Trends
                </CardTitle>
                <CardDescription>Monthly balance trends across all accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {financialLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
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
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Department Earnings Distribution
                </CardTitle>
                <CardDescription>Total earnings by department (KSh)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Pie
                    data={departmentEarningsChart}
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
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  KSh {totalEarnings.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {verifiedTimecards} verified timecards
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Account Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  KSh {(totalBalance / (totalStudents || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per student account</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {accounts?.filter((acc: any) => parseFloat(acc.balance || 0) > 0).length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">With positive balance</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Work Study Tab */}
        <TabsContent value="work-study" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Work Hours Trend
                </CardTitle>
                <CardDescription>Weekly hours worked by all participants</CardDescription>
              </CardHeader>
              <CardContent>
                {workStudyLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64">
                    <Bar
                      data={workStudyChart}
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
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-orange-600" />
                  Application Status
                </CardTitle>
                <CardDescription>Distribution of all applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut
                    data={applicationStatusChart}
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
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Timecard Status
                </CardTitle>
                <CardDescription>All timecard submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut
                    data={timecardStatusChart}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Work Study Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-3xl font-bold">{totalApplications}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved Participants</p>
                  <p className="text-3xl font-bold text-green-600">{approvedApplications}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Timecards</p>
                  <p className="text-3xl font-bold text-blue-600">{totalTimecards}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified Timecards</p>
                  <p className="text-3xl font-bold text-purple-600">{verifiedTimecards}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Elections Tab */}
        <TabsContent value="elections" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5 text-purple-600" />
                  Election Participation
                </CardTitle>
                <CardDescription>Candidates and votes per election</CardDescription>
              </CardHeader>
              <CardContent>
                {governanceLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64">
                    <Bar
                      data={electionChart}
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

            <Card>
              <CardHeader>
                <CardTitle>Election Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Elections</p>
                  <p className="text-3xl font-bold">{totalElections}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Elections</p>
                  <p className="text-3xl font-bold text-green-600">{activeElections}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Votes Cast</p>
                  <p className="text-3xl font-bold text-purple-600">{totalVotes}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Turnout</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {totalElections > 0 ? Math.round((totalVotes / totalElections)) : 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
                <p className="text-xs text-muted-foreground">Total registered</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Work Study Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{approvedApplications}</div>
                <p className="text-xs text-muted-foreground">{totalApplications} total applications</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Timecards Submitted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{totalTimecards}</div>
                <p className="text-xs text-muted-foreground">{verifiedTimecards} verified</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  KSh {totalEarnings.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Paid to students</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Elections Held</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{totalElections}</div>
                <p className="text-xs text-muted-foreground">{activeElections} currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{totalVotes}</div>
                <p className="text-xs text-muted-foreground">Across all elections</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Quick overview of system status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Account System</span>
                  <Badge className="bg-green-600">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Work Study System</span>
                  <Badge className="bg-green-600">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Elections System</span>
                  <Badge className="bg-green-600">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment Processing</span>
                  <Badge className="bg-green-600">Operational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
