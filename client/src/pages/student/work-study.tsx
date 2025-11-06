import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Clock, DollarSign, Calendar, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";

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

export default function WorkStudyPage() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [loading, setLoading] = useState(true);
    const [workStatus, setWorkStatus] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [timeCards, setTimeCards] = useState<any[]>([]);
    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [appealDialogOpen, setAppealDialogOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [appealReason, setAppealReason] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Helper function to safely format currency
    const formatCurrency = (value: string | number | null | undefined): string => {
        if (!value) return '0.00';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
    };

    // Helper function to safely format hours
    const formatHours = (value: string | number | null | undefined): string => {
        if (!value) return '0';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(numValue) ? '0' : numValue.toString();
    };

    useEffect(() => {
        loadWorkData();
    }, []);

    async function loadWorkData() {
        try {
            setLoading(true);
            const [statusData, applicationsData, timeCardsData] = await Promise.all([
                apiRequest("/api/student/work-status"),
                apiRequest("/api/swsms/applications"),
                apiRequest("/api/swsms/timecards"),
            ]);

            setWorkStatus(statusData); // Store the entire status object
            setApplications(applicationsData.applications || applicationsData || []);
            setTimeCards(timeCardsData.timeCards || timeCardsData || []);
        } catch (error: any) {
            console.error("Error loading work data:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleApply(formData: any) {
        try {
            await apiRequest("/api/swsms/applications", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            toast({
                title: "Success",
                description: "Work study application submitted successfully!",
            });

            setShowApplyDialog(false);
            loadWorkData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    }

    async function handleAppealSubmit() {
        if (!selectedApp || !appealReason.trim()) {
            toast({
                title: "Invalid input",
                description: "Please provide a reason for your appeal",
                variant: "destructive",
            });
            return;
        }

        try {
            await apiRequest(`/api/swsms/applications/${selectedApp.id}/appeal`, {
                method: "POST",
                body: JSON.stringify({ reason: appealReason }),
            });

            toast({
                title: "Appeal submitted",
                description: "Your appeal has been submitted for review",
            });

            setAppealDialogOpen(false);
            setAppealReason("");
            loadWorkData();
        } catch (error: any) {
            toast({
                title: "Appeal failed",
                description: error.message,
                variant: "destructive",
            });
        }
    }

    const handleCardClick = (app: any) => {
        setSelectedApp(app);
        setDetailDialogOpen(true);
    };

    const parseEligibilityDetails = (details: any) => {
        if (!details) return null;
        try {
            return typeof details === 'string' ? JSON.parse(details) : details;
        } catch {
            return null;
        }
    };

    const filteredApplications = applications.filter((app: any) => {
        if (statusFilter === "all") return true;
        return app.status === statusFilter;
    });

    const getCountByStatus = (status: string) => {
        if (status === "all") return applications.length;
        return applications.filter((app: any) => app.status === status).length;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    const isEnrolled = workStatus?.enrolled === true;
    // Only include verified timecards in totals
    const verifiedTimecards = timeCards.filter((tc: any) => tc.status === 'verified');
    const totalHoursWorked = verifiedTimecards.reduce((sum: number, tc: any) => sum + (parseFloat(tc.hoursWorked) || 0), 0);
    const totalEarnings = verifiedTimecards.reduce((sum: number, tc: any) => sum + (parseFloat(tc.earnings) || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Work Study Program</h1>
                    <p className="text-muted-foreground">Manage your work study activities</p>
                </div>
                <div className="flex gap-2">
                    {!isEnrolled && (
                        <Button onClick={() => setShowApplyDialog(true)}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            Apply for Work Study
                        </Button>
                    )}
                    {isEnrolled && (
                        <Button onClick={() => setLocation('/swsms/timecards')}>
                            <Clock className="mr-2 h-4 w-4" />
                            Go to Timecards
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            {isEnrolled && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Hours Worked</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatHours(totalHoursWorked)}h</div>
                            <p className="text-xs text-muted-foreground">
                                This semester
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">KSh {formatCurrency(totalEarnings)}</div>
                            <p className="text-xs text-muted-foreground">
                                Accumulated earnings
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Status</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <Badge className="bg-green-600 text-sm">Active</Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                                {workStatus?.department || "N/A"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Current Work Assignment */}
            {isEnrolled && workStatus && (
                <Card className="border-2 border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-6 w-6 text-primary" />
                            Current Assignment
                        </CardTitle>
                        <CardDescription>Your active work study position</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Department</p>
                                <p className="text-lg font-semibold">{workStatus.department || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Position</p>
                                <p className="text-lg font-semibold">{workStatus.position || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Hours Per Week</p>
                                <p className="text-lg font-semibold">{formatHours(workStatus.hoursPerWeek)} hours</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                                <p className="text-lg font-semibold">KSh {formatCurrency(workStatus.hourlyRate)}/hr</p>
                            </div>
                        </div>
                        {workStatus.supervisor && (
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-1">Supervisor</p>
                                <p className="font-medium">{workStatus.supervisor}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Application Status with Tabs */}
            {!isEnrolled && applications.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Applications</CardTitle>
                        <CardDescription>Track the status of your work study applications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="all" className="gap-2">
                                    All
                                    <Badge variant="secondary" className="ml-1 text-xs">
                                        {getCountByStatus("all")}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="gap-2">
                                    Pending
                                    <Badge variant="secondary" className="ml-1 text-xs bg-yellow-100">
                                        {getCountByStatus("pending")}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="approved" className="gap-2">
                                    Approved
                                    <Badge variant="secondary" className="ml-1 text-xs bg-green-100">
                                        {getCountByStatus("approved")}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="rejected" className="gap-2">
                                    Rejected
                                    <Badge variant="secondary" className="ml-1 text-xs bg-red-100">
                                        {getCountByStatus("rejected")}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="space-y-3">
                            {filteredApplications.map((app) => (
                                <div
                                    key={app.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${app.status === 'rejected' ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''
                                        }`}
                                    onClick={() => app.status === 'rejected' && handleCardClick(app)}
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{app.position}</p>
                                        <p className="text-sm text-muted-foreground">{app.department}</p>
                                        {app.applicationId && (
                                            <p className="text-xs text-muted-foreground font-mono mt-1">
                                                ID: {app.applicationId}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Applied on {new Date(app.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={
                                            app.status === "approved" ? "default" :
                                                app.status === "rejected" ? "destructive" :
                                                    "secondary"
                                        }>
                                            {app.status === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
                                            {app.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                            {app.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                                            {app.status}
                                        </Badge>
                                        {app.status === "rejected" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCardClick(app);
                                                }}
                                            >
                                                View Details
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {filteredApplications.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No {statusFilter === "all" ? "" : statusFilter} applications found
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!isEnrolled && applications.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Not Enrolled in Work Study</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Apply for work study to earn while you learn
                        </p>
                        <Button onClick={() => setShowApplyDialog(true)}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            Apply Now
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Time Cards History */}
            {isEnrolled && timeCards.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Time Card History</CardTitle>
                        <CardDescription>Your logged work hours and earnings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {verifiedTimecards.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No verified timecards yet</p>
                        ) : (
                            verifiedTimecards.slice(0, 5).map((card: any) => (
                                <div key={card.id} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <p className="font-medium">{card.description || card.taskDescription || "Work Shift"}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{new Date(card.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{formatHours(card.hoursWorked)}h</p>
                                        {card.earnings && (
                                            <p className="text-sm text-green-600">KSh {formatCurrency(card.earnings)}</p>
                                        )}
                                        {!card.earnings && (
                                            <p className="text-sm text-muted-foreground">Pending</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Work Study Application Dialog */}
            <WorkStudyApplicationDialog
                open={showApplyDialog}
                onOpenChange={setShowApplyDialog}
                onSubmit={handleApply}
            />

            {/* Application Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Application Details</DialogTitle>
                    </DialogHeader>
                    {selectedApp && (
                        <div className="space-y-4">
                            {/* Application ID - Prominent Display */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-muted-foreground mb-1">Application ID</p>
                                <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {selectedApp.applicationId || "N/A"}
                                </p>
                            </div>

                            {/* Application Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Position</p>
                                    <p className="text-sm font-medium">{selectedApp.position}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Department</p>
                                    <p className="text-sm font-medium">{selectedApp.department}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Hours per Week</p>
                                    <p className="text-sm font-medium">{selectedApp.hoursPerWeek}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                                    <Badge variant="destructive">{selectedApp.status}</Badge>
                                </div>
                            </div>

                            {/* Eligibility Check Results */}
                            {selectedApp.eligibilityDetails && (
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <h3 className="font-semibold">Eligibility Check Results</h3>
                                    </div>
                                    {(() => {
                                        const details = parseEligibilityDetails(selectedApp.eligibilityDetails);
                                        if (!details || !details.checks) {
                                            return <p className="text-sm text-muted-foreground">No eligibility data available</p>;
                                        }

                                        return (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-background rounded border">
                                                    <div className="flex items-center gap-2">
                                                        {details.checks.semesterCompletion?.passed ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        )}
                                                        <span className="text-sm font-medium">Semester Completion</span>
                                                    </div>
                                                    <span className={`text-xs ${details.checks.semesterCompletion?.passed ? 'text-green-600' : 'text-red-600'}`}>
                                                        {details.checks.semesterCompletion?.message || "Check failed"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-background rounded border">
                                                    <div className="flex items-center gap-2">
                                                        {details.checks.feeBalance?.passed ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        )}
                                                        <span className="text-sm font-medium">Fee Balance</span>
                                                    </div>
                                                    <span className={`text-xs ${details.checks.feeBalance?.passed ? 'text-green-600' : 'text-red-600'}`}>
                                                        {details.checks.feeBalance?.message || "Check failed"}
                                                    </span>
                                                </div>

                                                <div className="mt-3 p-3 bg-background/50 rounded">
                                                    <p className="text-xs text-muted-foreground">
                                                        <strong>Overall:</strong> {details.eligible ? "Eligible" : "Not Eligible"}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Review Notes */}
                            {selectedApp.reviewNotes && (
                                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-muted-foreground mb-2">Rejection Reason</p>
                                    <p className="text-sm">{selectedApp.reviewNotes}</p>
                                </div>
                            )}

                            {/* Appeal Button */}
                            {selectedApp.status === "rejected" && (
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setDetailDialogOpen(false)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        onClick={() => {
                                            setDetailDialogOpen(false);
                                            setAppealDialogOpen(true);
                                        }}
                                    >
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Submit Appeal
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Appeal Dialog */}
            <Dialog open={appealDialogOpen} onOpenChange={setAppealDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Submit Appeal</DialogTitle>
                    </DialogHeader>
                    {selectedApp && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Application ID</p>
                                <p className="text-sm font-mono font-medium">
                                    {selectedApp.applicationId || "N/A"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {selectedApp.position} - {selectedApp.department}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="appealReason" className="text-sm font-medium mb-2 block">
                                    Reason for Appeal <span className="text-red-600">*</span>
                                </Label>
                                <Textarea
                                    id="appealReason"
                                    value={appealReason}
                                    onChange={(e) => setAppealReason(e.target.value)}
                                    placeholder="Explain why you believe this application should be reconsidered..."
                                    rows={6}
                                    maxLength={500}
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {appealReason.length}/500 characters
                                </p>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setAppealDialogOpen(false);
                                        setAppealReason("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={handleAppealSubmit}
                                    disabled={!appealReason.trim()}
                                >
                                    Submit Appeal
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function WorkStudyApplicationDialog({ open, onOpenChange, onSubmit }: any) {
    const [formData, setFormData] = useState({
        // Personal Information
        fullName: "",
        gender: "",
        age: "",
        maritalStatus: "",
        major: "",
        academicClassification: "",
        mobileContact: "",

        // Sponsorship
        isSponsored: false,
        sponsorName: "",

        // Work Experience
        workExperiences: "",
        hasWorkedOnCampusBefore: false,
        previousCampusWorkLocation: "",

        // UEAB History
        firstRegistrationYear: "",
        firstRegistrationSemester: "",
        startedWorkingMonth: "",
        startedWorkingYear: "",

        // Current Application
        department: "",
        position: "",
        isRegisteringFirstSemester: false,
        registeredUnitsHours: "",
        hoursPerWeek: "",

        // Financial
        accountNumber: "",
        latestAccountBalance: "",
        accountStatementAttached: false,

        // Legacy fields
        availability: "",
        skills: "",
        previousExperience: "",
        reason: "",

        // Rules acknowledgment
        rulesAcknowledged: false,
    });

    const handleSubmit = () => {
        if (!formData.rulesAcknowledged) {
            alert("⚠️ You must acknowledge the rules and regulations to submit your application.");
            return;
        }
        onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">DVC-SAS Student Work Study Program Application</DialogTitle>
                    <DialogDescription>
                        Complete all sections of this official UEAB work study application form
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Section 1: Personal Information */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                        <h3 className="font-semibold text-lg mb-4">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="fullName">Full Name *</Label>
                                <Input
                                    id="fullName"
                                    placeholder="Enter your full name"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="gender">Gender *</Label>
                                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="age">Age *</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    min="16"
                                    max="100"
                                    placeholder="Your age"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="maritalStatus">Marital Status *</Label>
                                <Select value={formData.maritalStatus} onValueChange={(v) => setFormData({ ...formData, maritalStatus: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Single</SelectItem>
                                        <SelectItem value="married">Married</SelectItem>
                                        <SelectItem value="divorced">Divorced</SelectItem>
                                        <SelectItem value="widowed">Widowed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="major">Major *</Label>
                                <Input
                                    id="major"
                                    placeholder="e.g., Computer Science"
                                    value={formData.major}
                                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="academicClassification">Academic Classification *</Label>
                                <Select value={formData.academicClassification} onValueChange={(v) => setFormData({ ...formData, academicClassification: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select classification" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Freshman">Freshman</SelectItem>
                                        <SelectItem value="Sophomore">Sophomore</SelectItem>
                                        <SelectItem value="Junior">Junior</SelectItem>
                                        <SelectItem value="Senior">Senior</SelectItem>
                                        <SelectItem value="Graduate">Graduate</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="mobileContact">Mobile Telephone Contact Number *</Label>
                                <Input
                                    id="mobileContact"
                                    type="tel"
                                    placeholder="+254..."
                                    value={formData.mobileContact}
                                    onChange={(e) => setFormData({ ...formData, mobileContact: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Sponsorship */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                        <h3 className="font-semibold text-lg mb-4">Sponsorship Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isSponsored"
                                    checked={formData.isSponsored}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isSponsored: !!checked })}
                                />
                                <Label htmlFor="isSponsored" className="cursor-pointer">
                                    Are you sponsored?
                                </Label>
                            </div>

                            {formData.isSponsored && (
                                <div>
                                    <Label htmlFor="sponsorName">Name of Sponsor *</Label>
                                    <Input
                                        id="sponsorName"
                                        placeholder="Enter sponsor name"
                                        value={formData.sponsorName}
                                        onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Work Experience */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                        <h3 className="font-semibold text-lg mb-4">Work Experience</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="workExperiences">Work Experiences</Label>
                                <Textarea
                                    id="workExperiences"
                                    placeholder="Describe your previous work experiences..."
                                    value={formData.workExperiences}
                                    onChange={(e) => setFormData({ ...formData, workExperiences: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hasWorkedOnCampusBefore"
                                    checked={formData.hasWorkedOnCampusBefore}
                                    onCheckedChange={(checked) => setFormData({ ...formData, hasWorkedOnCampusBefore: !!checked })}
                                />
                                <Label htmlFor="hasWorkedOnCampusBefore" className="cursor-pointer">
                                    Have you worked before on campus?
                                </Label>
                            </div>

                            {formData.hasWorkedOnCampusBefore && (
                                <div>
                                    <Label htmlFor="previousCampusWorkLocation">If yes, where? *</Label>
                                    <Input
                                        id="previousCampusWorkLocation"
                                        placeholder="e.g., Library, IT Department"
                                        value={formData.previousCampusWorkLocation}
                                        onChange={(e) => setFormData({ ...formData, previousCampusWorkLocation: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 4: UEAB Registration History */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                        <h3 className="font-semibold text-lg mb-4">UEAB Registration & Work History</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstRegistrationYear">When did you first register for class at UEAB? (Year) *</Label>
                                <Input
                                    id="firstRegistrationYear"
                                    placeholder="e.g., 2023"
                                    value={formData.firstRegistrationYear}
                                    onChange={(e) => setFormData({ ...formData, firstRegistrationYear: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="firstRegistrationSemester">Semester *</Label>
                                <Select value={formData.firstRegistrationSemester} onValueChange={(v) => setFormData({ ...formData, firstRegistrationSemester: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Fall">Fall</SelectItem>
                                        <SelectItem value="Spring">Spring</SelectItem>
                                        <SelectItem value="Summer">Summer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="startedWorkingMonth">When did you start working at UEAB? (Month)</Label>
                                <Select value={formData.startedWorkingMonth} onValueChange={(v) => setFormData({ ...formData, startedWorkingMonth: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(month => (
                                            <SelectItem key={month} value={month}>{month}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="startedWorkingYear">Year</Label>
                                <Input
                                    id="startedWorkingYear"
                                    placeholder="e.g., 2024"
                                    value={formData.startedWorkingYear}
                                    onChange={(e) => setFormData({ ...formData, startedWorkingYear: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Current Application */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                        <h3 className="font-semibold text-lg mb-4">Current Application Details</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="department">Department Applying For *</Label>
                                <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Library">Library</SelectItem>
                                        <SelectItem value="IT Services">IT Services</SelectItem>
                                        <SelectItem value="Administration">Administration</SelectItem>
                                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                                        <SelectItem value="Cafeteria">Cafeteria</SelectItem>
                                        <SelectItem value="Security">Security</SelectItem>
                                        <SelectItem value="Chapel">Chapel</SelectItem>
                                        <SelectItem value="Academics">Academics</SelectItem>
                                        <SelectItem value="Student Affairs">Student Affairs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="position">Position *</Label>
                                <Input
                                    id="position"
                                    placeholder="e.g., Library Assistant, IT Support"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isRegisteringFirstSemester"
                                    checked={formData.isRegisteringFirstSemester}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isRegisteringFirstSemester: !!checked })}
                                />
                                <Label htmlFor="isRegisteringFirstSemester" className="cursor-pointer">
                                    Are you registering for class first semester?
                                </Label>
                            </div>

                            {formData.isRegisteringFirstSemester && (
                                <div>
                                    <Label htmlFor="registeredUnitsHours">If yes, how many units/hours? *</Label>
                                    <Input
                                        id="registeredUnitsHours"
                                        type="number"
                                        placeholder="e.g., 15"
                                        value={formData.registeredUnitsHours}
                                        onChange={(e) => setFormData({ ...formData, registeredUnitsHours: e.target.value })}
                                    />
                                </div>
                            )}

                            <div>
                                <Label htmlFor="hoursPerWeek">Hours Per Week *</Label>
                                <Select value={formData.hoursPerWeek} onValueChange={(v) => setFormData({ ...formData, hoursPerWeek: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select hours" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 hours</SelectItem>
                                        <SelectItem value="10">10 hours</SelectItem>
                                        <SelectItem value="15">15 hours</SelectItem>
                                        <SelectItem value="20">20 hours</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Section 6: Financial Information */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                        <h3 className="font-semibold text-lg mb-4">Financial Information</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="accountNumber">Account Number *</Label>
                                <Input
                                    id="accountNumber"
                                    placeholder="Your student account number"
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="latestAccountBalance">Latest Account Balance</Label>
                                <Input
                                    id="latestAccountBalance"
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 25000.00"
                                    value={formData.latestAccountBalance}
                                    onChange={(e) => setFormData({ ...formData, latestAccountBalance: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Please attach the latest account statement
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="accountStatementAttached"
                                    checked={formData.accountStatementAttached}
                                    onCheckedChange={(checked) => setFormData({ ...formData, accountStatementAttached: !!checked })}
                                />
                                <Label htmlFor="accountStatementAttached" className="cursor-pointer">
                                    I have attached my latest account statement
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Section 7: Rules Acknowledgment */}
                    <div className="border-2 rounded-lg p-4 bg-amber-50 border-amber-200">
                        <h3 className="font-semibold text-lg mb-3 text-amber-900">Rules and Regulations</h3>
                        <div className="space-y-3">
                            <p className="text-sm text-amber-900">
                                Any violation of the rules and regulations which govern student work study program in UEAB
                                and in the department to which you may be assigned to will render a stoppage/suspension from
                                work program.
                            </p>

                            <div className="flex items-start space-x-2 mt-4">
                                <Checkbox
                                    id="rulesAcknowledged"
                                    checked={formData.rulesAcknowledged}
                                    onCheckedChange={(checked) => setFormData({ ...formData, rulesAcknowledged: !!checked })}
                                />
                                <Label htmlFor="rulesAcknowledged" className="cursor-pointer text-sm font-medium">
                                    I acknowledge and agree to abide by all rules and regulations of the UEAB Student Work Study Program *
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.rulesAcknowledged}
                    >
                        Submit Application
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
