import { useQuery } from "@tanstack/react-query";
import { CreditCard, Briefcase, Users, TrendingUp, ArrowUpRight, ArrowDownRight, GraduationCap, BookOpen, Home, Vote, Wallet, Clock, Calendar, FileText, Award, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useExternalStudent } from "@/hooks/use-external-api";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch student data from external API
  const { data: studentData, isLoading: studentLoading, error: studentError } = useExternalStudent();

  const { data: account, isLoading: accountLoading } = useQuery<any>({
    queryKey: ["/api/chapa360/account"],
    enabled: !!user,
  });

  const { data: workStudyData, isLoading: workStudyLoading } = useQuery<any>({
    queryKey: ["/api/swsms/applications"],
    enabled: !!user,
  });

  const { data: electionsData, isLoading: electionsLoading } = useQuery<any>({
    queryKey: ["/api/elections/active"],
    enabled: !!user,
  });

  const { data: timecardsData, isLoading: timecardsLoading } = useQuery<any>({
    queryKey: ["/api/swsms/timecards"],
    enabled: !!user,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery<any>({
    queryKey: ["/api/student/wallet"],
    enabled: !!user,
  });

  // Calculate stats from real data
  const workApplications = workStudyData?.applications || [];
  const elections = electionsData?.elections || [];
  const timecards = timecardsData?.timeCards || [];
  const wallet = walletData || { balance: "0.00" };

  const stats = [
    {
      title: "Wallet Balance",
      value: wallet ? `KSh ${parseFloat(wallet.balance).toLocaleString()}` : "KSh 0",
      icon: Wallet,
      loading: walletLoading,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      link: "/wallet",
    },
    {
      title: "Work Study",
      value: workApplications.length,
      subtitle: workApplications.filter((a: any) => a.status === "approved").length + " approved",
      icon: Briefcase,
      loading: workStudyLoading,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/work-study",
    },
    {
      title: "Active Elections",
      value: elections.filter((e: any) => e.status === "active").length,
      subtitle: elections.length + " total",
      icon: Vote,
      loading: electionsLoading,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/elections",
    },
    {
      title: "Timecards",
      value: timecards.length,
      subtitle: timecards.filter((t: any) => t.status === "pending").length + " pending",
      icon: Clock,
      loading: timecardsLoading,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/swsms/timecards",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">
          Welcome back, {user?.fullName?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's your student dashboard overview
        </p>
      </div>

      {/* Stats Grid */}
      {/* Wallet Card - Full Width Row */}
      <div className="grid gap-4">
        <div>
          <Card className="hover:shadow-xl transition-all h-full border-0 bg-gradient-to-br from-blue-700 via-blue-600 to-amber-500 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-blue-50">
                    Chapa360 Wallet
                  </CardTitle>
                  <p className="text-xs text-blue-100/80 mt-1">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                {user?.studentId || 'UEAB'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {walletLoading ? (
                <Skeleton className="h-16 w-48 bg-white/20" />
              ) : (
                <div>
                  <p className="text-sm text-blue-50 font-medium mb-1">Available Balance</p>
                  <div className="text-6xl font-bold text-white drop-shadow-lg tracking-tight">
                    KSh {walletData?.balance?.toLocaleString() || '0'}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg"
                  asChild
                >
                  <Link href="/wallet">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Withdraw
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 hover:text-white font-semibold"
                  asChild
                >
                  <Link href="/wallet">
                    <FileText className="mr-2 h-4 w-4" />
                    Transactions
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Other Stats Cards - Second Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Other Stats - Regular size */}
          {stats.slice(1).map((stat) => (
            <Link key={stat.title} href={stat.link}>
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {stat.loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground">
                        {stat.value}
                      </div>
                      {stat.subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.subtitle}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Links Section - Placeholder for your links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access frequently used services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder for quick links - will be populated when you share them */}
            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link href="/elections">
                <Vote className="mr-3 h-5 w-5 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold">Elections</p>
                  <p className="text-xs text-muted-foreground">Vote for leaders</p>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link href="/work-study">
                <Briefcase className="mr-3 h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <p className="font-semibold">Work Study</p>
                  <p className="text-xs text-muted-foreground">Apply for jobs</p>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4" asChild>
              <Link href="/hostel">
                <Home className="mr-3 h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold">Hostel</p>
                  <p className="text-xs text-muted-foreground">Accommodation</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Work Study Participant Dashboard */}
      {studentData?.workStudy && (
        <Card className="border-ueab-blue hover-elevate">
          <CardHeader className="bg-ueab-blue/5">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-ueab-blue" />
                Work Study Program
              </CardTitle>
              <Badge className="bg-chart-4 text-white">
                Active Participant
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Current Position */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-ueab-blue">Current Position</h3>
                <div className="space-y-2 text-sm">
                  {workApplications && workApplications.filter((app: any) => app.status === "approved").length > 0 ? (
                    <>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Position:</span>
                        <span className="font-semibold">
                          {workApplications?.filter((app: any) => app.status === "approved")[0]?.position || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Department:</span>
                        <span className="font-medium">
                          {workApplications?.filter((app: any) => app.status === "approved")[0]?.department || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Hours/Week:</span>
                        <span className="font-medium">
                          {workApplications?.filter((app: any) => app.status === "approved")[0]?.hoursPerWeek || 0} hours
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No active position</p>
                  )}
                </div>
              </div>

              {/* Hours Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-ueab-gold">Hours This Period</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Hours:</span>
                    <span className="text-2xl font-bold text-foreground">
                      {timecards?.filter((tc: any) => tc.status === 'verified').reduce((sum: number, tc: any) =>
                        sum + parseFloat(tc.hoursWorked || 0), 0).toFixed(1) || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">This Week:</span>
                    <span className="font-medium">
                      {(() => {
                        const now = new Date();
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
                        startOfWeek.setHours(0, 0, 0, 0);
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);
                        endOfWeek.setHours(23, 59, 59, 999);

                        return timecards?.filter((tc: any) => {
                          const tcDate = new Date(tc.date);
                          return tc.status === 'verified' && tcDate >= startOfWeek && tcDate <= endOfWeek;
                        }).reduce((sum: number, tc: any) => sum + parseFloat(tc.hoursWorked || 0), 0).toFixed(1) || "0";
                      })()}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">This Month:</span>
                    <span className="font-medium">
                      {timecards?.filter((tc: any) => {
                        const tcDate = new Date(tc.date);
                        const now = new Date();
                        return tc.status === 'verified' &&
                          tcDate.getMonth() === now.getMonth() &&
                          tcDate.getFullYear() === now.getFullYear();
                      }).reduce((sum: number, tc: any) => sum + parseFloat(tc.hoursWorked || 0), 0).toFixed(1) || "0"}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-chart-4">Earnings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Earned:</span>
                    <span className="text-2xl font-bold text-chart-4">
                      KSh {timecards?.filter((tc: any) => tc.status === 'verified' && tc.earnings)
                        .reduce((sum: number, tc: any) => sum + parseFloat(tc.earnings || 0), 0).toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">This Month:</span>
                    <span className="font-medium text-chart-4">
                      KSh {timecards?.filter((tc: any) => {
                        const tcDate = new Date(tc.date);
                        const now = new Date();
                        return tc.status === 'verified' && tc.earnings &&
                          tcDate.getMonth() === now.getMonth() &&
                          tcDate.getFullYear() === now.getFullYear();
                      }).reduce((sum: number, tc: any) => sum + parseFloat(tc.earnings || 0), 0).toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Pending:</span>
                    <span className="font-medium text-chart-5">
                      KSh {timecards?.filter((tc: any) => tc.status === 'pending')
                        .reduce((sum: number, tc: any) => {
                          // Calculate potential earnings for pending timecards
                          const hours = parseFloat(tc.hoursWorked || 0);
                          const rate = parseFloat(tc.hourlyRate || 0);
                          return sum + (hours * rate);
                        }, 0).toLocaleString() || "0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions for Work Study Students */}
            <div className="grid gap-3 md:grid-cols-2 mt-6 pt-6 border-t">
              <a
                href="/swsms/timecards"
                className="flex items-center gap-3 p-4 rounded-md border hover-elevate active-elevate-2 transition-all"
              >
                <TrendingUp className="h-5 w-5 text-ueab-blue" />
                <div>
                  <p className="text-sm font-medium text-foreground">Log Hours</p>
                  <p className="text-xs text-muted-foreground">Submit your work timecard</p>
                </div>
              </a>
              <a
                href="/swsms/payments"
                className="flex items-center gap-3 p-4 rounded-md border hover-elevate active-elevate-2 transition-all"
              >
                <CreditCard className="h-5 w-5 text-chart-4" />
                <div>
                  <p className="text-sm font-medium text-foreground">Payment History</p>
                  <p className="text-xs text-muted-foreground">View your work study payments</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-ueab-blue">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {accountLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : account?.recentTransactions?.length > 0 ? (
              <div className="space-y-3">
                {account.recentTransactions.slice(0, 5).map((txn: any) => (
                  <div key={txn.id} className="flex items-center justify-between p-3 rounded-md border hover-elevate" data-testid={`transaction-${txn.id}`}>
                    <div>
                      <p className="text-sm font-medium text-foreground">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">{txn.category}</p>
                    </div>
                    <span className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-chart-4' : 'text-destructive'}`}>
                      {txn.type === 'credit' ? '+' : '-'}KSh {parseFloat(txn.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-ueab-gold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <a
                href="/swsms/applications"
                className="flex items-center gap-3 p-4 rounded-md border hover-elevate active-elevate-2 transition-all"
                data-testid="link-quick-apply-work"
              >
                <Briefcase className="h-5 w-5 text-ueab-blue" />
                <div>
                  <p className="text-sm font-medium text-foreground">Apply for Work Study</p>
                  <p className="text-xs text-muted-foreground">Submit a new application</p>
                </div>
              </a>
              <a
                href="/elections"
                className="flex items-center gap-3 p-4 rounded-md border hover-elevate active-elevate-2 transition-all"
                data-testid="link-quick-elections"
              >
                <Users className="h-5 w-5 text-ueab-gold" />
                <div>
                  <p className="text-sm font-medium text-foreground">View Elections</p>
                  <p className="text-xs text-muted-foreground">Participate in student governance</p>
                </div>
              </a>
              <a
                href="/chapa360/account"
                className="flex items-center gap-3 p-4 rounded-md border hover-elevate active-elevate-2 transition-all"
                data-testid="link-quick-account"
              >
                <CreditCard className="h-5 w-5 text-ueab-blue" />
                <div>
                  <p className="text-sm font-medium text-foreground">My Account</p>
                  <p className="text-xs text-muted-foreground">View balance and transactions</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
