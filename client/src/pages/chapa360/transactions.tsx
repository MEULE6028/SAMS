import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useState } from "react";

export default function TransactionsPage() {
  const [filter, setFilter] = useState<string>("all");
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/chapa360/transactions", filter],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-2">
            Complete transaction history
          </p>
        </div>
        <Button variant="outline" className="gap-2" data-testid="button-export">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-ueab-blue">All Transactions</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40" data-testid="select-filter">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="credit">Credits</SelectItem>
                  <SelectItem value="debit">Debits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-ueab-blue/5">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn: any, idx: number) => (
                    <tr
                      key={txn.id}
                      className={`border-b hover-elevate ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}
                      data-testid={`row-transaction-${txn.id}`}
                    >
                      <td className="px-6 py-4 text-sm text-foreground">
                        {format(new Date(txn.createdAt), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {txn.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {txn.category}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={txn.type === 'credit' ? 'bg-chart-4/20 text-chart-4' : 'bg-muted/50 text-foreground'}
                        >
                          {txn.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            txn.status === 'completed'
                              ? 'bg-chart-4/20 text-chart-4'
                              : txn.status === 'pending'
                              ? 'bg-chart-5/20 text-chart-5'
                              : 'bg-destructive/20 text-destructive'
                          }
                        >
                          {txn.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-chart-4' : 'text-destructive'}`}>
                          {txn.type === 'credit' ? '+' : '-'}KES {parseFloat(txn.amount).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
