import { useQuery } from "@tanstack/react-query";
import { CreditCard, Briefcase, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["/api/chapa360/account"],
    enabled: !!user,
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["/api/swsms/applications"],
    enabled: !!user,
  });

  const { data: elections, isLoading: electionsLoading } = useQuery({
    queryKey: ["/api/sgms/elections"],
    enabled: !!user,
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
    enabled: !!user,
  });

  const stats = [
    {
      title: "Account Balance",
      value: account ? `KES ${parseFloat(account.balance).toLocaleString()}` : "---",
      icon: CreditCard,
      trend: analytics?.balanceTrend || 0,
      loading: accountLoading,
      color: "text-ueab-blue",
    },
    {
      title: "Work Applications",
      value: applications?.length || 0,
      icon: Briefcase,
      trend: analytics?.applicationsTrend || 0,
      loading: appsLoading,
      color: "text-ueab-blue",
    },
    {
      title: "Active Elections",
      value: elections?.filter((e: any) => e.status === "active").length || 0,
      icon: Users,
      trend: 0,
      loading: electionsLoading,
      color: "text-ueab-gold",
    },
    {
      title: "Total Earnings",
      value: analytics?.totalEarnings ? `KES ${analytics.totalEarnings.toLocaleString()}` : "KES 0",
      icon: TrendingUp,
      trend: analytics?.earningsTrend || 0,
      loading: false,
      color: "text-chart-4",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">
          Welcome back, {user?.fullName?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your student account
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  {stat.trend !== 0 && (
                    <div className={`flex items-center gap-1 text-xs mt-2 ${stat.trend > 0 ? 'text-chart-4' : 'text-destructive'}`}>
                      {stat.trend > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      <span>{Math.abs(stat.trend)}% from last month</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
                      {txn.type === 'credit' ? '+' : '-'}KES {parseFloat(txn.amount).toLocaleString()}
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
                href="/sgms/elections"
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
