import { useQuery } from "@tanstack/react-query";
import { CreditCard, TrendingUp, TrendingDown, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Chapa360AccountPage() {
  const { data: account, isLoading } = useQuery({
    queryKey: ["/api/chapa360/account"],
  });

  const { data: transactions, isLoading: txnLoading } = useQuery({
    queryKey: ["/api/chapa360/transactions"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">My Account</h1>
        <p className="text-muted-foreground mt-2">
          Chapa360 Finance Management
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-ueab-blue" />
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground">Current Balance</span>
                </div>
                <div className="text-5xl font-bold text-ueab-blue" data-testid="text-balance">
                  KES {parseFloat(account?.balance || "0").toLocaleString()}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="text-sm font-mono font-semibold text-foreground" data-testid="text-account-number">
                      {account?.accountNumber || "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account Status</p>
                    <Badge className="mt-1 bg-chart-4/20 text-chart-4" data-testid="badge-status">
                      Active
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Credits</p>
              <p className="text-2xl font-bold text-chart-4">
                KES {account?.totalCredits?.toLocaleString() || "0"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Debits</p>
              <p className="text-2xl font-bold text-destructive">
                KES {account?.totalDebits?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Transactions</p>
              <p className="text-xl font-semibold text-foreground">
                {account?.transactionCount || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-ueab-blue">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {txnLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((txn: any) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 rounded-md border hover-elevate"
                  data-testid={`transaction-${txn.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-md ${txn.type === 'credit' ? 'bg-chart-4/10' : 'bg-destructive/10'}`}>
                      {txn.type === 'credit' ? (
                        <TrendingUp className="h-5 w-5 text-chart-4" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{txn.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {txn.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(txn.createdAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${txn.type === 'credit' ? 'text-chart-4' : 'text-destructive'}`}>
                      {txn.type === 'credit' ? '+' : '-'}KES {parseFloat(txn.amount).toLocaleString()}
                    </p>
                    <Badge
                      className={`text-xs mt-1 ${
                        txn.status === 'completed'
                          ? 'bg-chart-4/20 text-chart-4'
                          : txn.status === 'pending'
                          ? 'bg-chart-5/20 text-chart-5'
                          : 'bg-destructive/20 text-destructive'
                      }`}
                    >
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
