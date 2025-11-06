import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Ban,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function AdminAccountsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Fetch all accounts
  const { data: accounts, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/chapa360/accounts"],
  });

  // Calculate statistics
  const totalAccounts = accounts?.length || 0;
  const totalBalance = accounts?.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || 0), 0) || 0;
  const averageBalance = totalAccounts > 0 ? totalBalance / totalAccounts : 0;
  const activeAccounts = accounts?.filter((acc: any) => parseFloat(acc.balance || 0) > 0).length || 0;

  // Filter accounts based on search and filters
  const filteredAccounts = accounts?.filter((account: any) => {
    const matchesSearch =
      searchQuery === "" ||
      account.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || account.user?.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && parseFloat(account.balance || 0) > 0) ||
      (statusFilter === "zero" && parseFloat(account.balance || 0) === 0);

    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  // Export to CSV
  const handleExport = () => {
    const csvContent = [
      ["Account Number", "Name", "Email", "Role", "Balance", "Created At"],
      ...filteredAccounts.map((acc: any) => [
        acc.accountNumber,
        acc.user?.fullName || "N/A",
        acc.user?.email || "N/A",
        acc.user?.role || "N/A",
        acc.balance,
        format(new Date(acc.createdAt), "MMM dd, yyyy"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exported Successfully",
      description: `${filteredAccounts.length} accounts exported to CSV`,
    });
  };

  const viewAccountDetails = (account: any) => {
    setSelectedAccount(account);
    setViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Account Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all student and staff accounts
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalAccounts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              KSh {totalBalance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              KSh {averageBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{activeAccounts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or account number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="treasurer">Treasurer</SelectItem>
                <SelectItem value="vc">VC</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active (Balance &gt; 0)</SelectItem>
                <SelectItem value="zero">Zero Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Accounts ({filteredAccounts.length})</CardTitle>
          <CardDescription>
            {filteredAccounts.length !== totalAccounts &&
              `Showing ${filteredAccounts.length} of ${totalAccounts} accounts`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAccounts.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account: any) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono text-xs">
                        {account.accountNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {account.user?.fullName || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {account.user?.email || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            account.user?.role === "admin" ||
                              account.user?.role === "supervisor" ||
                              account.user?.role === "treasurer" ||
                              account.user?.role === "vc"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {account.user?.role || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${parseFloat(account.balance || 0) > 0
                              ? "text-green-600"
                              : "text-muted-foreground"
                            }`}
                        >
                          KSh {parseFloat(account.balance || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(account.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewAccountDetails(account)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No accounts found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about this account
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                    <p className="text-lg font-mono">{selectedAccount.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Balance</p>
                    <p className="text-lg font-semibold text-green-600">
                      KSh {parseFloat(selectedAccount.balance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                    <p className="text-lg">{selectedAccount.user?.fullName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg">{selectedAccount.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    <Badge
                      variant={
                        selectedAccount.user?.role === "admin" ||
                          selectedAccount.user?.role === "supervisor"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedAccount.user?.role || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                    <p className="text-lg">
                      {format(new Date(selectedAccount.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Account Status</h3>
                  <div className="flex gap-3">
                    <Badge
                      variant={parseFloat(selectedAccount.balance || 0) > 0 ? "default" : "secondary"}
                    >
                      {parseFloat(selectedAccount.balance || 0) > 0 ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active Balance
                        </>
                      ) : (
                        <>
                          <Ban className="h-3 w-3 mr-1" />
                          Zero Balance
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                    Close
                  </Button>
                  <Button className="bg-ueab-blue hover:bg-ueab-blue-light">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact User
                  </Button>
                </div>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground text-sm" colSpan={5}>
                          <div className="flex flex-col items-center justify-center py-8">
                            <CreditCard className="h-12 w-12 text-muted-foreground mb-2" />
                            <p>Transaction history will appear here</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Connect to transaction API to view history
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </TabsContent>

              {/* Withdrawals Tab */}
              <TabsContent value="withdrawals" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground text-sm" colSpan={5}>
                          <div className="flex flex-col items-center justify-center py-8">
                            <DollarSign className="h-12 w-12 text-muted-foreground mb-2" />
                            <p>Withdrawal requests will appear here</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              No pending withdrawal requests
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
