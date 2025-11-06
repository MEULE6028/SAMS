import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building2,
  BedDouble,
  Calendar
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Booking {
  id: number;
  studentId: number;
  hostelId: number;
  roomId: number;
  bedNumber: string;
  status: string;
  requestedAt: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentGender: string;
  departmentName: string;
  programName: string;
  hostelName?: string;
  roomNumber?: string;
}

interface BookingsResponse {
  bookings: Booking[];
  total: number;
  status: string;
  gender: string;
}

export default function BookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bookings
  const { data, isLoading } = useQuery<BookingsResponse>({
    queryKey: ["/api/dean/bookings", statusFilter],
    queryFn: () => apiRequest("GET", `/api/dean/bookings?status=${statusFilter}`),
  });

  // Approve/Reject mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note: string }) =>
      apiRequest("PUT", `/api/dean/bookings/${id}/approve`, { status, note }),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dean/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dean/dashboard/stats"] });
      setSelectedBooking(null);
      setAction(null);
      setNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAction = () => {
    if (selectedBooking && action) {
      approveMutation.mutate({
        id: selectedBooking.id,
        status: action === "approve" ? "approved" : "rejected",
        note,
      });
    }
  };

  const openActionDialog = (booking: Booking, actionType: "approve" | "reject") => {
    setSelectedBooking(booking);
    setAction(actionType);
    setNote("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="default" className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Bookings</h1>
          <p className="text-muted-foreground">Manage student room booking requests</p>
        </div>
        {/* Status Filter */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "approved" ? "default" : "outline"}
            onClick={() => setStatusFilter("approved")}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "default" : "outline"}
            onClick={() => setStatusFilter("rejected")}
          >
            Rejected
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading bookings...</div>
        </div>
      )}

      {/* Bookings List */}
      {!isLoading && data && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Showing {data.total} {statusFilter} booking{data.total !== 1 ? 's' : ''}
          </div>

          {data.bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No {statusFilter} bookings found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {data.bookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {booking.studentName}
                        </CardTitle>
                        <CardDescription>{booking.programName}</CardDescription>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Student Info */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{booking.studentEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{booking.studentPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Requested: {new Date(booking.requestedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {booking.hostelName || `Hostel ID: ${booking.hostelId}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {booking.roomNumber || `Room ID: ${booking.roomId}`} - {booking.bedNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {booking.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => openActionDialog(booking, "approve")}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => openActionDialog(booking, "reject")}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={action !== null} onOpenChange={() => { setAction(null); setSelectedBooking(null); setNote(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve" : "Reject"} Booking Request
            </DialogTitle>
            <DialogDescription>
              {action === "approve" 
                ? `Approve booking request for ${selectedBooking?.studentName}?`
                : `Reject booking request for ${selectedBooking?.studentName}?`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (Optional)</label>
              <Textarea
                placeholder={action === "approve" ? "Add approval note..." : "Reason for rejection..."}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAction(null); setSelectedBooking(null); setNote(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={approveMutation.isPending}
              className={action === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={action === "reject" ? "destructive" : "default"}
            >
              {approveMutation.isPending ? "Processing..." : action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
