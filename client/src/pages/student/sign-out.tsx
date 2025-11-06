import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";

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

export default function SignOutPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [signOuts, setSignOuts] = useState<any[]>([]);
    const [signOutCount, setSignOutCount] = useState(0);
    const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

    useEffect(() => {
        loadSignOutData();
    }, []);

    async function loadSignOutData() {
        try {
            setLoading(true);
            const [history, count] = await Promise.all([
                apiRequest("/api/student/sign-out-history"),
                apiRequest("/api/student/sign-out-count"),
            ]);

            setSignOuts(history.signOuts || []);
            setSignOutCount(count.count || 0);
        } catch (error: any) {
            console.error("Error loading sign-out data:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleNewRequest(formData: any) {
        try {
            await apiRequest("/api/student/sign-out", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            toast({
                title: "Success",
                description: "Sign-out request submitted successfully!",
            });

            setShowNewRequestDialog(false);
            loadSignOutData();
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

    const filteredSignOuts = signOuts.filter(s =>
        filter === "all" ? true : s.status === filter
    );

    const pendingCount = signOuts.filter(s => s.status === "pending").length;
    const approvedCount = signOuts.filter(s => s.status === "approved").length;
    const rejectedCount = signOuts.filter(s => s.status === "rejected").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Sign-Out Requests</h1>
                    <p className="text-muted-foreground">Manage your campus leave applications</p>
                </div>
                <Button onClick={() => setShowNewRequestDialog(true)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    New Sign-Out Request
                </Button>
            </div>

            {/* Semester Limit Card */}
            <Card className={signOutCount >= 4 ? "border-2 border-destructive" : "border-2 border-primary"}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-6 w-6" />
                        Semester Limit
                    </CardTitle>
                    <CardDescription>
                        You can sign out a maximum of 4 times per semester
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="text-5xl font-bold">
                            {signOutCount}/4
                        </div>
                        <div className="flex-1">
                            <div className="w-full bg-muted rounded-full h-4">
                                <div
                                    className={`h-4 rounded-full transition-all ${signOutCount >= 4 ? "bg-red-600" : "bg-primary"
                                        }`}
                                    style={{ width: `${(signOutCount / 4) * 100}%` }}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                {signOutCount >= 4 ? (
                                    <span className="text-red-600 font-medium">Limit reached! No more sign-outs allowed this semester.</span>
                                ) : (
                                    <span>{4 - signOutCount} sign-out(s) remaining</span>
                                )}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{approvedCount}</div>
                        <p className="text-xs text-muted-foreground">Successfully approved</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rejectedCount}</div>
                        <p className="text-xs text-muted-foreground">Denied requests</p>
                    </CardContent>
                </Card>
            </div>

            {/* Sign-Out History */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Sign-Out History</CardTitle>
                    <CardDescription>View all your past and current sign-out requests</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filter Tabs */}
                    <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        </TabsList>

                        <TabsContent value={filter} className="space-y-4 mt-4">
                            {filteredSignOuts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No sign-out requests found</p>
                                </div>
                            ) : (
                                filteredSignOuts.map((signOut) => (
                                    <SignOutItem key={signOut.id} signOut={signOut} />
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* New Sign-Out Request Dialog */}
            <NewSignOutDialog
                open={showNewRequestDialog}
                onOpenChange={setShowNewRequestDialog}
                onSubmit={handleNewRequest}
                disabled={signOutCount >= 4}
            />
        </div>
    );
}

function SignOutItem({ signOut }: { signOut: any }) {
    const startDate = new Date(signOut.startDate);
    const endDate = new Date(signOut.endDate);
    const createdDate = new Date(signOut.createdAt || signOut.submittedAt);

    const statusConfig = {
        pending: { variant: "secondary" as const, icon: AlertCircle, color: "text-yellow-600" },
        approved: { variant: "default" as const, icon: CheckCircle2, color: "text-green-600" },
        rejected: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    };

    const config = statusConfig[signOut.status as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = config.icon;

    // Format leave type for display
    const leaveTypeDisplay = signOut.leaveType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A';

    return (
        <div className="flex items-start justify-between p-4 rounded-lg border hover:shadow-md transition-shadow">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-lg">{signOut.destination}</p>
                    {signOut.roomNumber && (
                        <Badge variant="outline" className="text-xs">Room {signOut.roomNumber}</Badge>
                    )}
                </div>

                <div className="space-y-2 text-sm">
                    {/* Dates */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">
                            {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {" → "}
                            {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* Leave Type */}
                    <div className="flex gap-4">
                        <span className="text-muted-foreground">Leave Type:</span>
                        <Badge variant="secondary">{leaveTypeDisplay}</Badge>
                    </div>

                    {/* Purpose and Travel */}
                    {signOut.purposeOfTravel && (
                        <div>
                            <span className="text-muted-foreground">Purpose: </span>
                            <span className="font-medium">{signOut.purposeOfTravel}</span>
                        </div>
                    )}

                    {signOut.meansOfTravel && (
                        <div>
                            <span className="text-muted-foreground">Travel by: </span>
                            <span>{signOut.meansOfTravel}</span>
                        </div>
                    )}

                    {/* Emergency Contact */}
                    {signOut.emergencyContact && (
                        <div className="pt-2 border-t">
                            <span className="text-muted-foreground">Emergency Contact: </span>
                            <span className="font-medium">{signOut.emergencyContact}</span>
                            {signOut.emergencyPhone && <span className="text-muted-foreground"> • {signOut.emergencyPhone}</span>}
                        </div>
                    )}

                    {/* Approval Progress */}
                    {signOut.status === "pending" && (
                        <div className="pt-2 border-t">
                            <p className="text-xs font-medium mb-1">Approval Progress:</p>
                            <div className="flex gap-2">
                                <Badge variant={signOut.dormDeanApproval === "approved" ? "default" : "outline"} className="text-xs">
                                    {signOut.dormDeanApproval === "approved" ? "✓" : "○"} Dorm Dean
                                </Badge>
                                <Badge variant={signOut.deanOfStudentsApproval === "approved" ? "default" : "outline"} className="text-xs">
                                    {signOut.deanOfStudentsApproval === "approved" ? "✓" : "○"} Dean of Students
                                </Badge>
                                <Badge variant={signOut.registrarApproval === "approved" ? "default" : "outline"} className="text-xs">
                                    {signOut.registrarApproval === "approved" ? "✓" : "○"} Registrar
                                </Badge>
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground pt-1">
                        Submitted on {createdDate.toLocaleDateString()} at {createdDate.toLocaleTimeString()}
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 ml-4">
                <Badge variant={config.variant} className="text-sm">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {signOut.status}
                </Badge>

                {signOut.parentApproval && (
                    <Badge variant="outline" className="text-xs bg-blue-50">
                        ✓ Parent Approved
                    </Badge>
                )}

                {signOut.semesterCount && (
                    <Badge variant="outline" className="text-xs">
                        #{signOut.semesterCount} this semester
                    </Badge>
                )}
            </div>
        </div>
    );
}

function NewSignOutDialog({ open, onOpenChange, onSubmit, disabled }: any) {
    const [formData, setFormData] = useState({
        roomNumber: "",
        destination: "",
        meansOfTravel: "",
        purposeOfTravel: "",
        leaveType: "",
        leaveTypeOther: "",
        startDate: "",
        endDate: "",
        contactDuringAbsence: "",
        emergencyContact: "",
        emergencyPhone: "",
        missedClasses: [] as Array<{ className: string; instructorName: string }>,
        parentApproval: false,
    });

    const handleSubmit = () => {
        if (!formData.parentApproval) {
            return;
        }

        // Calculate days in advance
        const startDate = new Date(formData.startDate);
        const today = new Date();
        const daysInAdvance = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysInAdvance < 3) {
            alert("⚠️ According to university policy, requests must be made at least 3 days before intended departure.");
            return;
        }

        onSubmit(formData);
    };

    const addMissedClass = () => {
        setFormData({
            ...formData,
            missedClasses: [...formData.missedClasses, { className: "", instructorName: "" }],
        });
    };

    const removeMissedClass = (index: number) => {
        const updated = formData.missedClasses.filter((_, i) => i !== index);
        setFormData({ ...formData, missedClasses: updated });
    };

    const updateMissedClass = (index: number, field: string, value: string) => {
        const updated = [...formData.missedClasses];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, missedClasses: updated });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">UEAB Sign-Out Request Form</DialogTitle>
                    <DialogDescription>
                        {disabled ? (
                            <span className="text-red-600 font-medium">
                                You have reached the maximum of 4 sign-outs per semester
                            </span>
                        ) : (
                            <div className="space-y-1 text-sm">
                                <p className="font-medium">FOR BOARDING STUDENTS ONLY</p>
                                <p className="text-amber-600">⚠️ Request must be made at least 3 days before intended departure</p>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {!disabled && (
                    <div className="space-y-4">
                        {/* Basic Information */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                                <Label htmlFor="roomNumber">Room Number *</Label>
                                <Input
                                    id="roomNumber"
                                    placeholder="e.g., A-204"
                                    value={formData.roomNumber}
                                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="destination">Destination *</Label>
                                <Input
                                    id="destination"
                                    placeholder="Where are you going?"
                                    value={formData.destination}
                                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Travel Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="meansOfTravel">Means of Travel *</Label>
                                <Select value={formData.meansOfTravel} onValueChange={(v) => setFormData({ ...formData, meansOfTravel: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select means of travel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Personal Car">Personal Car</SelectItem>
                                        <SelectItem value="Public Transport (Matatu)">Public Transport (Matatu)</SelectItem>
                                        <SelectItem value="Bus">Bus</SelectItem>
                                        <SelectItem value="School Transport">School Transport</SelectItem>
                                        <SelectItem value="Taxi/Uber/Bolt">Taxi/Uber/Bolt</SelectItem>
                                        <SelectItem value="Picked by Parent/Guardian">Picked by Parent/Guardian</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="purposeOfTravel">Purpose of Travel *</Label>
                                <Input
                                    id="purposeOfTravel"
                                    placeholder="e.g., Family visit, Medical appointment"
                                    value={formData.purposeOfTravel}
                                    onChange={(e) => setFormData({ ...formData, purposeOfTravel: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Leave Type */}
                        <div>
                            <Label>Leave Type *</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {[
                                    { value: "day_leave", label: "Day Leave" },
                                    { value: "overnight", label: "Overnight" },
                                    { value: "weekend", label: "Weekend" },
                                    { value: "other", label: "Other" },
                                ].map((type) => (
                                    <div
                                        key={type.value}
                                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.leaveType === type.value
                                                ? "border-primary bg-primary/10"
                                                : "border-muted hover:border-primary/50"
                                            }`}
                                        onClick={() => setFormData({ ...formData, leaveType: type.value })}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div className={`h-4 w-4 rounded-full border-2 ${formData.leaveType === type.value ? "border-primary bg-primary" : "border-muted-foreground"
                                                }`} />
                                            <span className="text-sm font-medium">{type.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {formData.leaveType === "other" && (
                                <Input
                                    className="mt-2"
                                    placeholder="Please specify"
                                    value={formData.leaveTypeOther}
                                    onChange={(e) => setFormData({ ...formData, leaveTypeOther: e.target.value })}
                                />
                            )}
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate">Date & Time of Departure *</Label>
                                <Input
                                    id="startDate"
                                    type="datetime-local"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="endDate">Date & Time of Return *</Label>
                                <Input
                                    id="endDate"
                                    type="datetime-local"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="contactDuringAbsence">Contact Tel # During Absence *</Label>
                                <Input
                                    id="contactDuringAbsence"
                                    type="tel"
                                    placeholder="+254..."
                                    value={formData.contactDuringAbsence}
                                    onChange={(e) => setFormData({ ...formData, contactDuringAbsence: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                                <Input
                                    id="emergencyContact"
                                    placeholder="Contact person"
                                    value={formData.emergencyContact}
                                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                                <Input
                                    id="emergencyPhone"
                                    type="tel"
                                    placeholder="+254..."
                                    value={formData.emergencyPhone}
                                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Missed Classes Section */}
                        <div className="border rounded-lg p-4 bg-amber-50">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <Label className="text-base">Missed Classes (If Any)</Label>
                                    <p className="text-xs text-muted-foreground">List classes you will miss and obtain instructor approval</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addMissedClass}>
                                    + Add Class
                                </Button>
                            </div>

                            {formData.missedClasses.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    No classes will be missed (or click "Add Class" to add)
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {formData.missedClasses.map((cls, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-5">
                                                <Input
                                                    placeholder="Class name"
                                                    value={cls.className}
                                                    onChange={(e) => updateMissedClass(index, "className", e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-5">
                                                <Input
                                                    placeholder="Instructor name"
                                                    value={cls.instructorName}
                                                    onChange={(e) => updateMissedClass(index, "instructorName", e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeMissedClass(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Parent Approval */}
                        <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                            <Checkbox
                                id="parentApproval"
                                checked={formData.parentApproval}
                                onCheckedChange={(checked) => setFormData({ ...formData, parentApproval: !!checked })}
                            />
                            <Label
                                htmlFor="parentApproval"
                                className="text-sm font-medium cursor-pointer"
                            >
                                ✓ I confirm that my parent/guardian has approved this sign-out request *
                            </Label>
                        </div>

                        {/* Form Notes */}
                        <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
                            <p className="font-medium">Important Notes:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Form is for all campus leaves other than field trips and official off-campus leaves</li>
                                <li>Request must be made no later than 3 days before intended departure</li>
                                <li>Form requires approval from: Dormitory Dean → Dean of Students → Registrar</li>
                                <li>You will be notified via email when your request is approved or rejected</li>
                            </ul>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={disabled || !formData.parentApproval}
                    >
                        {disabled ? "Limit Reached" : "Submit Request for Approval"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
