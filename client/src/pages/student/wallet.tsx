import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Calendar, AlertCircle, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";

async function apiRequest(url: string, options?: RequestInit) {
    const token = localStorage.getItem("sams-auth")
        ? JSON.parse(localStorage.getItem("sams-auth") || "{}").state?.token
        : null;

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Request failed");
    }

    return response.json();
}

export default function WalletPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [walletData, setWalletData] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");

    useEffect(() => {
        loadWalletData();
    }, []);

    async function loadWalletData() {
        try {
            setLoading(true);
            const [wallet, txns, wdls] = await Promise.all([
                apiRequest("/api/student/wallet"),
                apiRequest("/api/student/wallet/transactions"),
                apiRequest("/api/student/wallet/withdrawals"),
            ]);

            setWalletData(wallet);
            setTransactions(txns.transactions || []);
            setWithdrawals(wdls.withdrawals || []);
        } catch (error: any) {
            console.error("Error loading wallet data:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleWithdraw(formData: any) {
        try {
            await apiRequest("/api/student/wallet/withdraw", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            toast({
                title: "Success",
                description: "Withdrawal request submitted successfully!",
            });

            setShowWithdrawDialog(false);
            loadWalletData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    const balance = parseFloat(walletData?.balance || "0");
    const filteredTransactions = transactions.filter(t =>
        filter === "all" ? true : t.type === filter
    );

    const totalCredits = transactions
        .filter(t => t.type === "credit")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalDebits = transactions
        .filter(t => t.type === "debit")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">My Wallet</h1>
                <p className="text-muted-foreground">Manage your financial transactions</p>
            </div>

            {/* Bank Card Style Balance Card */}
            <Card className="border-0 bg-gradient-to-br from-blue-700 via-blue-600 to-amber-500 overflow-hidden shadow-xl">
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
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm text-blue-50 font-medium mb-1">Available Balance</p>
                        <div className="text-6xl font-bold text-white drop-shadow-lg tracking-tight">
                            KSh {balance.toLocaleString()}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                        <div>
                            <p className="text-sm text-blue-100 font-medium">Total Credits</p>
                            <p className="text-2xl font-bold text-white mt-1">KSh {totalCredits.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-blue-100 font-medium">Total Debits</p>
                            <p className="text-2xl font-bold text-white mt-1">KSh {totalDebits.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            className="flex-1 bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg"
                            onClick={() => setShowWithdrawDialog(true)}
                        >
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Withdraw Funds
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 hover:text-white font-semibold"
                            onClick={() => document.getElementById('transactions-tab')?.click()}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            View Transactions
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transactions.length}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {withdrawals.filter(w => w.status === "pending").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {transactions.filter(t => {
                                const txDate = new Date(t.createdAt);
                                const now = new Date();
                                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
                            }).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Transactions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Transactions and Withdrawals */}
            <Card>
                <CardHeader>
                    <CardTitle>Financial Activity</CardTitle>
                    <CardDescription>View your transactions and withdrawal history</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="transactions">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="transactions">Transactions</TabsTrigger>
                            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                        </TabsList>

                        <TabsContent value="transactions" className="space-y-4 mt-4">
                            {/* Filter Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant={filter === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilter("all")}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={filter === "credit" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilter("credit")}
                                >
                                    Credits
                                </Button>
                                <Button
                                    variant={filter === "debit" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilter("debit")}
                                >
                                    Debits
                                </Button>
                            </div>

                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No transactions found</p>
                                </div>
                            ) : (
                                filteredTransactions.map((transaction) => (
                                    <TransactionItem key={transaction.id} transaction={transaction} />
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="withdrawals" className="space-y-4 mt-4">
                            {withdrawals.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <ArrowUpRight className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No withdrawal requests yet</p>
                                </div>
                            ) : (
                                withdrawals.map((withdrawal) => (
                                    <WithdrawalItem key={withdrawal.id} withdrawal={withdrawal} />
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Withdraw Dialog */}
            <WithdrawDialog
                open={showWithdrawDialog}
                onOpenChange={setShowWithdrawDialog}
                maxAmount={balance}
                onSubmit={handleWithdraw}
            />
        </div>
    );
}

function TransactionItem({ transaction }: { transaction: any }) {
    const isCredit = transaction.type === "credit";
    const txDate = new Date(transaction.createdAt);
    const isToday = txDate.toDateString() === new Date().toDateString();

    return (
        <div className={`flex items-center justify-between p-4 rounded-lg border ${isToday ? "border-blue-500 bg-blue-50" : ""}`}>
            <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                    {isCredit ? (
                        <ArrowDownRight className="h-6 w-6 text-green-600" />
                    ) : (
                        <ArrowUpRight className="h-6 w-6 text-red-600" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-medium">{transaction.description || transaction.type}</p>
                        {isToday && <Badge variant="outline" className="text-xs">Today</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{txDate.toLocaleDateString()}</span>
                        <span>• {txDate.toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className={`text-lg font-semibold ${isCredit ? "text-green-600" : "text-red-600"}`}>
                    {isCredit ? "+" : "-"}KSh {transaction.amount.toLocaleString()}
                </p>
                {transaction.source && (
                    <p className="text-xs text-muted-foreground">{transaction.source}</p>
                )}
            </div>
        </div>
    );
}

function WithdrawalItem({ withdrawal }: { withdrawal: any }) {
    const wDate = new Date(withdrawal.createdAt);

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
                <p className="font-medium">Withdrawal Request</p>
                <p className="text-sm text-muted-foreground">KSh {withdrawal.amount.toLocaleString()}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{wDate.toLocaleDateString()}</span>
                </div>
                {withdrawal.reason && (
                    <p className="text-xs text-muted-foreground mt-1">{withdrawal.reason}</p>
                )}
            </div>
            <Badge variant={
                withdrawal.status === "approved" ? "default" :
                    withdrawal.status === "rejected" ? "destructive" :
                        "secondary"
            }>
                {withdrawal.status}
            </Badge>
        </div>
    );
}

function WithdrawDialog({ open, onOpenChange, maxAmount, onSubmit }: any) {
    const [formData, setFormData] = useState({
        amount: "",
        reason: "",
        accountNumber: "",
        bankName: "",
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                        Submit a withdrawal request from your wallet
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Available Balance</p>
                        <p className="text-2xl font-bold">KSh {maxAmount.toLocaleString()}</p>
                    </div>

                    <div>
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            max={maxAmount}
                            placeholder="Enter amount"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="bankName">Bank Name *</Label>
                        <Input
                            id="bankName"
                            placeholder="e.g., Commercial Bank of Ethiopia"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="accountNumber">Account Number *</Label>
                        <Input
                            id="accountNumber"
                            placeholder="Enter bank account number"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="reason">Reason for Withdrawal *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Explain why you need to withdraw funds..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSubmit(formData)}>
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
