import { useQuery } from "@tanstack/react-query";
import { CreditCard, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminAccountsPage() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/admin/chapa360/accounts"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">All Student Accounts</h1>
        <p className="text-muted-foreground mt-2">
          Financial overview and account management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-ueab-blue">
              {accounts?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-4">
              KES {accounts?.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || 0), 0).toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {accounts?.filter((a: any) => parseFloat(a.balance) > 0).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : accounts && accounts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-ueab-blue">Account Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-ueab-blue/5">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Student</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">University ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Account Number</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Balance</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account: any, idx: number) => (
                    <tr
                      key={account.id}
                      className={`border-b hover-elevate ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}
                      data-testid={`row-account-${account.id}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {account.user?.fullName || "---"}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {account.user?.universityId || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-foreground">
                        {account.accountNumber}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-ueab-blue">
                        KES {parseFloat(account.balance).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-chart-4/20 text-chart-4">
                          Active
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No accounts found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
