import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BedDouble, Users, MapPin, Calendar, CheckCircle2, Home, Building2, AlertCircle, Phone, IdCard, Clock, UserCheck, Mail, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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


export default function HostelPage() {
    const { toast } = useToast();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [residenceStatus, setResidenceStatus] = useState<'on-campus' | 'off-campus' | null>(null);
    const [roomAssignment, setRoomAssignment] = useState<any>(null);
    const [roommates, setRoommates] = useState<any[]>([]);
    const [showApplyDialog, setShowApplyDialog] = useState(false);

    const studentId = user?.universityId || user?.email?.split("@")[0] || "";

    useEffect(() => {
        loadHostelData();
    }, [studentId]);

    async function loadHostelData() {
        try {
            setLoading(true);
            console.log('[HOSTEL] Loading data for student:', studentId);

            const data = await apiRequest(`/api/student/hostel/dashboard`);

            console.log('[HOSTEL] Received data:', data);

            setResidenceStatus(data.residenceStatus);
            setRoomAssignment(data.roomAssignment);
            setRoommates(data.roommates || []);

        } catch (error: any) {
            console.error("[HOSTEL] Error loading data:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load hostel data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleApplyForHostel(formData: any) {
        try {
            await apiRequest("/api/student/hostel/apply", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            toast({
                title: "Success",
                description: "Hostel application submitted successfully! You will be notified once reviewed.",
            });

            setShowApplyDialog(false);
            loadHostelData();
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
            <div className="space-y-6 p-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Hostel & Residence</h1>
                    <p className="text-muted-foreground">Your accommodation dashboard</p>
                </div>
                {residenceStatus === 'off-campus' && !roomAssignment && (
                    <Button onClick={() => setShowApplyDialog(true)}>
                        <BedDouble className="mr-2 h-4 w-4" />
                        Apply for Hostel
                    </Button>
                )}
            </div>

            {/* Residence Status Card */}
            <Card className={`border-2 ${residenceStatus === 'on-campus' ? 'border-primary' : 'border-muted'}`}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            Residence Status
                        </span>
                        <Badge variant={residenceStatus === 'on-campus' ? 'default' : 'secondary'} className="text-sm">
                            {residenceStatus === 'on-campus' ? 'ON-CAMPUS' : 'OFF-CAMPUS'}
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        {residenceStatus === 'on-campus'
                            ? 'You are currently living in university hostel'
                            : 'You are currently living off-campus'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {residenceStatus === 'off-campus' && !roomAssignment && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                You are not currently assigned to a hostel. Click "Apply for Hostel" to submit an application for on-campus housing.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Off-Campus Residence Details */}
            {residenceStatus === 'off-campus' && roomAssignment && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Home className="h-5 w-5 text-primary" />
                                Off-Campus Residence Details
                            </CardTitle>
                            <CardDescription>Your current off-campus accommodation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Area */}
                            {roomAssignment.area && (
                                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Area</div>
                                        <div className="font-semibold">{roomAssignment.area}</div>
                                    </div>
                                </div>
                            )}

                            {/* Hostel/Residence Name */}
                            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Hostel/Residence</div>
                                    <div className="font-semibold">{roomAssignment.hostelName || 'Not specified'}</div>
                                </div>
                            </div>

                            {/* Room Number */}
                            {roomAssignment.roomNumber && (
                                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                    <BedDouble className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Room Number</div>
                                        <div className="font-semibold text-lg">{roomAssignment.roomNumber}</div>
                                    </div>
                                </div>
                            )}

                            {/* Assigned Date */}
                            {roomAssignment.assignedDate && (
                                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Living Since</div>
                                        <div className="font-semibold">
                                            {new Date(roomAssignment.assignedDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Info Alert for Off-Campus Students */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Off-Campus Resident</AlertTitle>
                        <AlertDescription>
                            You are currently residing off-campus. Daily roll call check-in is not required for off-campus residents.
                            If you wish to apply for on-campus accommodation, please use the "Apply for Hostel" button above.
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Room Details Card - Only show if on-campus */}
            {residenceStatus === 'on-campus' && roomAssignment && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-primary" />
                            Room Details
                        </CardTitle>
                        <CardDescription>Your accommodation information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Hostel/Building</p>
                                <p className="text-lg font-semibold">{roomAssignment.hostelName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Room Number</p>
                                    <p className="text-xl font-bold text-primary">{roomAssignment.roomNumber}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Floor</p>
                                    <p className="text-xl font-bold">{roomAssignment.floor || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Room Type</p>
                                    <Badge variant="outline">{roomAssignment.roomType}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Occupancy</p>
                                    <p className="font-medium">{roomAssignment.currentOccupancy}/{roomAssignment.capacity}</p>
                                </div>
                            </div>
                            {roomAssignment.hasEnsuite && (
                                <div className="pt-2 border-t">
                                    <Badge variant="secondary">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        En-suite Bathroom
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Roommates Card - Only show if on-campus and has roommates */}
            {residenceStatus === 'on-campus' && roommates.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Your Roommates
                        </CardTitle>
                        <CardDescription>
                            {roommates.length} roommate{roommates.length > 1 ? 's' : ''} in {roomAssignment?.roomNumber}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            {roommates.map((roommate, index) => (
                                <Card key={index} className="border-2 hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            {/* Header with Avatar and Name */}
                                            <div className="flex items-start gap-4 pb-3 border-b">
                                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-xl font-bold shadow-md">
                                                    {roommate.studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg">{roommate.studentName}</h3>
                                                    <p className="text-sm text-muted-foreground">Roommate</p>
                                                    {roommate.startDate && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Since {new Date(roommate.startDate).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contact Information */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                                    <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                                        <IdCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs text-muted-foreground">Student ID</p>
                                                        <p className="font-mono font-semibold text-sm">{roommate.studentId}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                                    <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                                        <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs text-muted-foreground">Phone Number</p>
                                                        <a
                                                            href={`tel:${roommate.phoneNumber}`}
                                                            className="font-semibold text-sm hover:underline hover:text-primary"
                                                        >
                                                            {roommate.phoneNumber}
                                                        </a>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => window.location.href = `tel:${roommate.phoneNumber}`}
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {roommate.email && (
                                                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                                        <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                                            <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-muted-foreground">Email</p>
                                                            <a
                                                                href={`mailto:${roommate.email}`}
                                                                className="font-semibold text-sm hover:underline hover:text-primary truncate block"
                                                                title={roommate.email}
                                                            >
                                                                {roommate.email}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Empty slot message if room not full */}
                        {roomAssignment && roommates.length < (roomAssignment.capacity - 1) && (
                            <Alert className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    This room has space for {roomAssignment.capacity - roommates.length - 1} more student{roomAssignment.capacity - roommates.length - 1 > 1 ? 's' : ''}.
                                    New roommates may be assigned later.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Show message if on-campus but no roommates */}
            {residenceStatus === 'on-campus' && roommates.length === 0 && roomAssignment && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            Roommates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground font-medium">
                                {roomAssignment.capacity === 1
                                    ? 'You have a single room - no roommates'
                                    : 'No roommates assigned yet'
                                }
                            </p>
                            {roomAssignment.capacity > 1 && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Your room can accommodate up to {roomAssignment.capacity} students.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Hostel Application Dialog */}
            <HostelApplicationDialog
                open={showApplyDialog}
                onOpenChange={setShowApplyDialog}
                onSubmit={handleApplyForHostel}
                studentId={studentId}
                user={user}
            />
        </div>
    );
}


function HostelApplicationDialog({ open, onOpenChange, onSubmit, studentId, user }: any) {
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        universityId: studentId,
        phoneNumber: '',
        email: user?.email || '',
        gender: user?.gender || '',
        yearOfStudy: '',
        program: '',
        currentResidenceType: 'off-campus',
        currentAddress: '',
        preferredRoomType: '',
        specialRequirements: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        emergencyContactPhone: '',
    });

    const handleSubmit = () => {
        if (!formData.phoneNumber || !formData.yearOfStudy || !formData.program ||
            !formData.emergencyContactName || !formData.emergencyContactPhone) {
            alert('Please fill in all required fields');
            return;
        }
        onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Apply for Hostel Accommodation</DialogTitle>
                    <DialogDescription>
                        Submit your application for on-campus housing. Only off-campus students can apply.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Personal Information</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="fullName">Full Name *</Label>
                                <Input
                                    id="fullName"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    disabled
                                />
                            </div>
                            <div>
                                <Label htmlFor="universityId">University ID *</Label>
                                <Input
                                    id="universityId"
                                    value={formData.universityId}
                                    disabled
                                />
                            </div>
                            <div>
                                <Label htmlFor="phoneNumber">Phone Number *</Label>
                                <Input
                                    id="phoneNumber"
                                    placeholder="+254..."
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled
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
                                <Label htmlFor="yearOfStudy">Year of Study *</Label>
                                <Select value={formData.yearOfStudy} onValueChange={(v) => setFormData({ ...formData, yearOfStudy: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Year 1</SelectItem>
                                        <SelectItem value="2">Year 2</SelectItem>
                                        <SelectItem value="3">Year 3</SelectItem>
                                        <SelectItem value="4">Year 4</SelectItem>
                                        <SelectItem value="5">Year 5+</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="program">Program/Major *</Label>
                                <Input
                                    id="program"
                                    placeholder="e.g., Computer Science"
                                    value={formData.program}
                                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Current Residence */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Current Residence</h3>
                        <div>
                            <Label htmlFor="currentAddress">Current Off-Campus Address *</Label>
                            <Textarea
                                id="currentAddress"
                                placeholder="Enter your current residence address..."
                                value={formData.currentAddress}
                                onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Hostel Preferences */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Hostel Preferences</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="preferredRoomType">Preferred Room Type</Label>
                                <Select value={formData.preferredRoomType} onValueChange={(v) => setFormData({ ...formData, preferredRoomType: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select room type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Single Room</SelectItem>
                                        <SelectItem value="double">Double Room</SelectItem>
                                        <SelectItem value="triple">Triple Room</SelectItem>
                                        <SelectItem value="quad">Quad Room</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="specialRequirements">Special Requirements (Optional)</Label>
                            <Textarea
                                id="specialRequirements"
                                placeholder="Any medical, accessibility, or other special needs..."
                                value={formData.specialRequirements}
                                onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Emergency Contact</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="emergencyContactName">Contact Name *</Label>
                                <Input
                                    id="emergencyContactName"
                                    placeholder="Parent/Guardian name"
                                    value={formData.emergencyContactName}
                                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="emergencyContactRelation">Relationship *</Label>
                                <Input
                                    id="emergencyContactRelation"
                                    placeholder="e.g., Father, Mother, Guardian"
                                    value={formData.emergencyContactRelation}
                                    onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
                                <Input
                                    id="emergencyContactPhone"
                                    placeholder="+254..."
                                    value={formData.emergencyContactPhone}
                                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        Submit Application
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
