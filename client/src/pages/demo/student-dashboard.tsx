import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Calendar,
    Home,
    Clock,
    Wallet,
    Download,
    FileText,
    LogOut,
    Briefcase,
    BedDouble,
    ChurchIcon,
    MapPin,
    DollarSign,
    ArrowDownToLine,
    MessageSquare,
    BookOpen,
    GraduationCap,
    Vote
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/utils";

async function apiRequest(url: string, options?: RequestInit) {
    const token = getAuthToken();

    if (!token) {
        throw new Error("No authentication token found. Please log in again.");
    }

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
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || "Request failed");
    }

    return response.json();
}

export default function StudentDashboard() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState<any>(null);
    const [walletData, setWalletData] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [workStatus, setWorkStatus] = useState<any>(null);
    const [signOutCount, setSignOutCount] = useState(0);

    // Dialog states
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);
    const [showResidenceDialog, setShowResidenceDialog] = useState(false);
    const [showWorkDialog, setShowWorkDialog] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            setLoading(true);
            const [student, wallet, appts, work, signOuts] = await Promise.all([
                apiRequest("/api/student/profile"),
                apiRequest("/api/student/wallet"),
                apiRequest("/api/student/appointments"),
                apiRequest("/api/student/work-status"),
                apiRequest("/api/student/sign-out-count"),
            ]);

            setStudentData(student);
            setWalletData(wallet);
            setAppointments(appts);
            setWorkStatus(work);
            setSignOutCount(signOuts.count);
        } catch (error: any) {
            console.error("Error loading dashboard:", error);
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
                description: "Withdrawal request submitted successfully",
            });

            setShowWithdrawDialog(false);
            loadDashboardData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    }

    async function handleSignOut(formData: any) {
        try {
            await apiRequest("/api/student/sign-out", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            toast({
                title: "Success",
                description: "Sign-out application submitted successfully",
            });

            setShowSignOutDialog(false);
            loadDashboardData();
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
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            </div>
        );
    }

    const balance = parseFloat(walletData?.balance || "0");

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {studentData?.name}!</h1>
                    <p className="text-muted-foreground">ID: {studentData?.universityId}</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    Year {studentData?.profile?.year || "N/A"}
                </Badge>
            </div>

            {/* Chapa360 Wallet Card - Featured */}
            <Card className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white border-0 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-white">
                        <span className="flex items-center gap-2">
                            <Wallet className="h-6 w-6" />
                            Chapa360 Wallet
                        </span>
                        <Badge className="bg-white/20 text-white border-white/30">
                            {walletData?.accountNumber}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm opacity-90">Available Balance</p>
                        <p className="text-4xl font-bold">
                            KES {balance.toLocaleString()}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            className="flex-1 bg-white text-purple-600 hover:bg-white/90"
                            onClick={() => setShowWithdrawDialog(true)}
                        >
                            <ArrowDownToLine className="mr-2 h-4 w-4" />
                            Withdraw
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 border-white/30 text-white hover:bg-white/10"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Transactions
                        </Button>
                    </div>

                    {walletData?.recentTransactions?.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-white/20">
                            <p className="text-sm opacity-90">Recent Activity</p>
                            {walletData.recentTransactions.slice(0, 2).map((txn: any) => (
                                <div key={txn.id} className="flex justify-between text-sm bg-white/10 p-2 rounded">
                                    <span>{txn.category}</span>
                                    <span className={txn.type === "credit" ? "text-green-300" : "text-red-300"}>
                                        {txn.type === "credit" ? "+" : "-"}KES {parseFloat(txn.amount).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Appointments Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Appointments
                        </CardTitle>
                        <CardDescription>Upcoming events & attendance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {appointments.length > 0 ? (
                            <>
                                {appointments.slice(0, 3).map((apt: any) => (
                                    <div key={apt.id} className="p-3 border rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{apt.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(apt.appointmentDate).toLocaleDateString()} at{" "}
                                                    {new Date(apt.appointmentDate).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                            <Badge variant={apt.status === "scheduled" ? "default" : "secondary"}>
                                                {apt.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="ghost" className="w-full">
                                    View All Appointments →
                                </Button>
                            </>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">No upcoming appointments</p>
                        )}
                    </CardContent>
                </Card>

                {/* Hostel & Residence Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-orange-600" />
                            Hostel & Residence
                        </CardTitle>
                        <CardDescription>Your accommodation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Hostel:</span>
                                <span className="font-medium">{studentData?.residence?.hostelName || "Not Allocated"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Room:</span>
                                <span className="font-medium">{studentData?.residence?.roomNumber || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Bed:</span>
                                <span className="font-medium">{studentData?.residence?.bedNumber || "N/A"}</span>
                            </div>
                        </div>

                        <div className="pt-3 space-y-2">
                            <Button variant="outline" className="w-full" size="sm">
                                <BedDouble className="mr-2 h-4 w-4" />
                                Apply for Hostel
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                size="sm"
                                onClick={() => setShowResidenceDialog(true)}
                            >
                                <MapPin className="mr-2 h-4 w-4" />
                                Change Residence
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Summary Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ChurchIcon className="h-5 w-5 text-purple-600" />
                            Attendance
                        </CardTitle>
                        <CardDescription>Your attendance records</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">89%</p>
                                <p className="text-xs text-muted-foreground">Church</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">95%</p>
                                <p className="text-xs text-muted-foreground">Residence</p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <p className="text-2xl font-bold text-purple-600">12</p>
                                <p className="text-xs text-muted-foreground">Events</p>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                <p className="text-2xl font-bold text-orange-600">3</p>
                                <p className="text-xs text-muted-foreground">Missed</p>
                            </div>
                        </div>

                        <Button variant="ghost" className="w-full">
                            View Detailed Records →
                        </Button>
                    </CardContent>
                </Card>

                {/* Work Study Program Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-indigo-600" />
                            Work Study Program
                        </CardTitle>
                        <CardDescription>
                            {workStatus?.enrolled ? "Your work hours" : "Apply now"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {workStatus?.enrolled ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Position:</span>
                                        <span className="font-medium">{workStatus.position}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Hours This Week:</span>
                                        <span className="font-medium">{workStatus.hoursThisWeek || 0}h</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Total Hours:</span>
                                        <span className="font-medium">{workStatus.totalHours || 0}h</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Status:</span>
                                        <Badge variant={workStatus.status === "approved" ? "default" : "secondary"}>
                                            {workStatus.status}
                                        </Badge>
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full" size="sm">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Log Hours
                                </Button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Join the work study program to earn while you learn
                                </p>
                                <Button
                                    className="w-full"
                                    onClick={() => setShowWorkDialog(true)}
                                >
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    Apply Now
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sign-Out Application Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LogOut className="h-5 w-5 text-red-600" />
                            Sign-Out Application
                        </CardTitle>
                        <CardDescription>Request school exemption</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm font-medium text-amber-800">
                                {signOutCount}/4 Applications Used
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                                Maximum 4 applications per semester
                            </p>
                        </div>

                        <Button
                            className="w-full"
                            variant={signOutCount >= 4 ? "outline" : "default"}
                            disabled={signOutCount >= 4}
                            onClick={() => setShowSignOutDialog(true)}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            {signOutCount >= 4 ? "Limit Reached" : "Apply for Sign-Out"}
                        </Button>

                        <Button variant="ghost" className="w-full">
                            View My Applications →
                        </Button>
                    </CardContent>
                </Card>

                {/* Elections Card */}
                <Card className="hover:shadow-lg transition-shadow border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Vote className="h-5 w-5 text-purple-600" />
                            Student Elections
                        </CardTitle>
                        <CardDescription>Vote for your student leaders</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-white rounded-lg border border-purple-200">
                            <p className="text-sm font-medium mb-2">Active Elections</p>
                            <p className="text-2xl font-bold text-purple-600">2025/2026</p>
                            <p className="text-xs text-muted-foreground mt-1">Student Government</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Available Positions:</span>
                                <span className="font-semibold">7</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Candidates:</span>
                                <span className="font-semibold">15</span>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => window.location.href = "/elections"}
                        >
                            <Vote className="mr-2 h-4 w-4" />
                            View & Vote
                        </Button>
                    </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-teal-600" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>Resources & downloads</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" size="sm">
                            <MessageSquare className="mr-2 h-4 w-4 text-blue-600" />
                            UEAB XOXO Chat
                        </Button>
                        <Button variant="outline" className="w-full justify-start" size="sm">
                            <BookOpen className="mr-2 h-4 w-4 text-green-600" />
                            Student Handbook
                        </Button>
                        <Button variant="outline" className="w-full justify-start" size="sm">
                            <GraduationCap className="mr-2 h-4 w-4 text-purple-600" />
                            Yearbook 2025
                        </Button>
                        <Button variant="outline" className="w-full justify-start" size="sm">
                            <FileText className="mr-2 h-4 w-4 text-orange-600" />
                            Academic Bulletin
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Withdrawal Dialog */}
            <WithdrawDialog
                open={showWithdrawDialog}
                onOpenChange={setShowWithdrawDialog}
                onSubmit={handleWithdraw}
                maxAmount={balance}
            />

            {/* Sign-Out Dialog */}
            <SignOutDialog
                open={showSignOutDialog}
                onOpenChange={setShowSignOutDialog}
                onSubmit={handleSignOut}
            />

            {/* Residence Change Dialog */}
            <ResidenceChangeDialog
                open={showResidenceDialog}
                onOpenChange={setShowResidenceDialog}
                onSubmit={async (data: any) => {
                    try {
                        await apiRequest("/api/student/residence/change", {
                            method: "POST",
                            body: JSON.stringify(data),
                        });
                        toast({ title: "Success", description: "Request submitted successfully" });
                        setShowResidenceDialog(false);
                    } catch (error: any) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                    }
                }}
            />

            {/* Work Study Application Dialog */}
            <WorkStudyDialog
                open={showWorkDialog}
                onOpenChange={setShowWorkDialog}
                onSubmit={async (data: any) => {
                    try {
                        await apiRequest("/api/swsms/applications", {
                            method: "POST",
                            body: JSON.stringify(data),
                        });
                        toast({ title: "Success", description: "Application submitted successfully" });
                        setShowWorkDialog(false);
                        loadDashboardData();
                    } catch (error: any) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                    }
                }}
            />
        </div>
    );
}

// Dialog Components
function WithdrawDialog({ open, onOpenChange, onSubmit, maxAmount }: any) {
    const [formData, setFormData] = useState({ amount: "", method: "mpesa", destination: "" });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                        Available balance: KES {maxAmount.toLocaleString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="amount">Amount (KES)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="method">Withdrawal Method</Label>
                        <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mpesa">M-Pesa</SelectItem>
                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                <SelectItem value="cash">Cash Pickup</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="destination">
                            {formData.method === "mpesa" ? "M-Pesa Number" : "Account Number"}
                        </Label>
                        <Input
                            id="destination"
                            placeholder={formData.method === "mpesa" ? "254..." : "Enter account number"}
                            value={formData.destination}
                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onSubmit(formData)}>Submit Request</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SignOutDialog({ open, onOpenChange, onSubmit }: any) {
    const [formData, setFormData] = useState({
        reason: "",
        startDate: "",
        endDate: "",
        destination: "",
        contact: "",
        emergencyContact: "",
        emergencyPhone: "",
        parentApproval: false,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Sign-Out Application</DialogTitle>
                    <DialogDescription>
                        Request exemption from school attendance (Maximum 4 per semester)
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="reason">Reason for Sign-Out *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Explain your reason for sign-out in detail..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startDate">Departure Date & Time *</Label>
                            <Input
                                id="startDate"
                                type="datetime-local"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="endDate">Return Date & Time *</Label>
                            <Input
                                id="endDate"
                                type="datetime-local"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="destination">Destination *</Label>
                        <Input
                            id="destination"
                            placeholder="Where will you be? (City, Address)"
                            value={formData.destination}
                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="contact">Your Contact During Absence *</Label>
                        <Input
                            id="contact"
                            placeholder="Phone number to reach you (254...)"
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                            <Input
                                id="emergencyContact"
                                placeholder="Parent/Guardian name"
                                value={formData.emergencyContact}
                                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="emergencyPhone">Emergency Phone *</Label>
                            <Input
                                id="emergencyPhone"
                                placeholder="254..."
                                value={formData.emergencyPhone}
                                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="parentApproval"
                            checked={formData.parentApproval}
                            onChange={(e) => setFormData({ ...formData, parentApproval: e.target.checked })}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="parentApproval" className="cursor-pointer">
                            I confirm that I have parent/guardian approval for this sign-out *
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onSubmit(formData)} disabled={!formData.parentApproval}>
                        Submit Application
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ResidenceChangeDialog({ open, onOpenChange, onSubmit }: any) {
    const [formData, setFormData] = useState({
        currentType: "",
        requestedType: "",
        reason: "",
        preferredHostel: "",
        specialNeeds: "",
        preferredRoommate: "",
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Change Residence Request</DialogTitle>
                    <DialogDescription>
                        Request to change your accommodation arrangement
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Current Residence Type *</Label>
                        <Select value={formData.currentType} onValueChange={(v) => setFormData({ ...formData, currentType: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select current type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="on-campus">On-Campus</SelectItem>
                                <SelectItem value="off-campus">Off-Campus</SelectItem>
                                <SelectItem value="hostel">University Hostel</SelectItem>
                                <SelectItem value="commuter">Day Scholar/Commuter</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Requested Residence Type *</Label>
                        <Select value={formData.requestedType} onValueChange={(v) => setFormData({ ...formData, requestedType: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select requested type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="on-campus">On-Campus</SelectItem>
                                <SelectItem value="off-campus">Off-Campus</SelectItem>
                                <SelectItem value="hostel">University Hostel</SelectItem>
                                <SelectItem value="commuter">Day Scholar/Commuter</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Preferred Hostel (if applicable)</Label>
                        <Select value={formData.preferredHostel} onValueChange={(v) => setFormData({ ...formData, preferredHostel: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select hostel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="jerusalem">Jerusalem Hostel</SelectItem>
                                <SelectItem value="bethlehem">Bethlehem Hostel</SelectItem>
                                <SelectItem value="galilee">Galilee Hostel</SelectItem>
                                <SelectItem value="nazareth">Nazareth Hostel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="reason">Reason for Change *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Explain in detail why you want to change your residence..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            rows={4}
                        />
                    </div>
                    <div>
                        <Label htmlFor="specialNeeds">Special Needs or Requirements</Label>
                        <Textarea
                            id="specialNeeds"
                            placeholder="Any medical, accessibility, or other special requirements (optional)"
                            value={formData.specialNeeds}
                            onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                            rows={2}
                        />
                    </div>
                    <div>
                        <Label htmlFor="preferredRoommate">Preferred Roommate (Optional)</Label>
                        <Input
                            id="preferredRoommate"
                            placeholder="Student name or ID if you have a preference"
                            value={formData.preferredRoommate}
                            onChange={(e) => setFormData({ ...formData, preferredRoommate: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onSubmit(formData)}>Submit Request</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function WorkStudyDialog({ open, onOpenChange, onSubmit }: any) {
    const [formData, setFormData] = useState({
        department: "",
        position: "",
        hoursPerWeek: "10",
        reason: "",
        availability: "",
        skills: "",
        previousExperience: "",
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Work Study Program Application</DialogTitle>
                    <DialogDescription>
                        Apply to join the work study program and earn while you learn
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="department">Preferred Department *</Label>
                            <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="library">Library</SelectItem>
                                    <SelectItem value="it">IT & Computer Lab</SelectItem>
                                    <SelectItem value="admin">Administration</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="cafeteria">Cafeteria</SelectItem>
                                    <SelectItem value="security">Security</SelectItem>
                                    <SelectItem value="chapel">Chapel/Spiritual Life</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="position">Position of Interest *</Label>
                            <Input
                                id="position"
                                placeholder="e.g., Library Assistant"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="hoursPerWeek">Hours Per Week *</Label>
                        <Select value={formData.hoursPerWeek} onValueChange={(v) => setFormData({ ...formData, hoursPerWeek: v })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5 hours/week</SelectItem>
                                <SelectItem value="10">10 hours/week</SelectItem>
                                <SelectItem value="15">15 hours/week</SelectItem>
                                <SelectItem value="20">20 hours/week</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="availability">Your Availability *</Label>
                        <Textarea
                            id="availability"
                            placeholder="e.g., Monday-Friday 2-5pm, Weekends 9am-12pm"
                            value={formData.availability}
                            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                            rows={2}
                        />
                    </div>

                    <div>
                        <Label htmlFor="skills">Relevant Skills *</Label>
                        <Textarea
                            id="skills"
                            placeholder="List your relevant skills (e.g., Microsoft Office, customer service, organization)"
                            value={formData.skills}
                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label htmlFor="previousExperience">Previous Work Experience</Label>
                        <Textarea
                            id="previousExperience"
                            placeholder="Describe any previous work or volunteer experience (optional)"
                            value={formData.previousExperience}
                            onChange={(e) => setFormData({ ...formData, previousExperience: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label htmlFor="reason">Why do you want to join Work Study? *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Explain your motivation and what you hope to gain from the program..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onSubmit(formData)}>Submit Application</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
