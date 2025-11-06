import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, BedDouble, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Hostel {
  id: number;
  name: string;
  capacity: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  totalRooms: number;
  gender: string;
}

interface HostelDetails {
  id: number;
  name: string;
  capacity: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  totalRooms: number;
  rooms: Array<{
    id: number;
    roomNumber: string;
    roomType: string;
    capacity: number;
    occupiedBeds: number;
    availableBeds: number;
    students: Array<{
      studentId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      bedNumber: string;
    }>;
  }>;
  students: any[];
  gender: string;
}

export default function HostelsPage() {
  const [selectedHostel, setSelectedHostel] = useState<number | null>(null);

  // Fetch all hostels
  const { data: hostels, isLoading } = useQuery<Hostel[]>({
    queryKey: ["/api/dean/hostels"],
    queryFn: () => apiRequest("GET", "/api/dean/hostels"),
  });

  // Fetch hostel details when one is selected
  const { data: hostelDetails } = useQuery<HostelDetails>({
    queryKey: ["/api/dean/hostels", selectedHostel],
    queryFn: () => apiRequest("GET", `/api/dean/hostels/${selectedHostel}`),
    enabled: selectedHostel !== null,
  });

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "text-red-500";
    if (rate >= 50) return "text-yellow-500";
    return "text-green-500";
  };

  const getOccupancyBadge = (rate: number) => {
    if (rate >= 80) return <Badge variant="destructive">High</Badge>;
    if (rate >= 50) return <Badge variant="default" className="bg-yellow-500">Moderate</Badge>;
    return <Badge variant="default" className="bg-green-500">Low</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hostels</h1>
        <p className="text-muted-foreground">View and manage residence hostels</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading hostels...</div>
        </div>
      )}

      {/* Hostels Grid */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hostels?.map((hostel) => (
            <Card key={hostel.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {hostel.name}
                    </CardTitle>
                    <CardDescription>{hostel.totalRooms} rooms</CardDescription>
                  </div>
                  {getOccupancyBadge(hostel.occupancyRate)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Occupancy Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className={`font-bold ${getOccupancyColor(hostel.occupancyRate)}`}>
                      {hostel.occupancyRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        hostel.occupancyRate >= 80
                          ? "bg-red-500"
                          : hostel.occupancyRate >= 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${hostel.occupancyRate}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Users className="h-3 w-3" />
                      <span>Students</span>
                    </div>
                    <div className="text-xl font-bold">{hostel.occupiedBeds}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <BedDouble className="h-3 w-3" />
                      <span>Available</span>
                    </div>
                    <div className="text-xl font-bold">{hostel.availableBeds}</div>
                  </div>
                </div>

                {/* View Details Button */}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setSelectedHostel(hostel.id)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Hostels */}
      {!isLoading && hostels?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hostels found</p>
          </CardContent>
        </Card>
      )}

      {/* Hostel Details Dialog */}
      <Dialog open={selectedHostel !== null} onOpenChange={() => setSelectedHostel(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{hostelDetails?.name}</DialogTitle>
            <DialogDescription>
              {hostelDetails?.occupiedBeds} / {hostelDetails?.capacity} beds occupied
              ({hostelDetails?.occupancyRate}%)
            </DialogDescription>
          </DialogHeader>

          {/* Rooms Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rooms</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Students</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostelDetails?.rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.roomNumber}</TableCell>
                    <TableCell className="capitalize">{room.roomType}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>{room.occupiedBeds}</TableCell>
                    <TableCell>{room.availableBeds}</TableCell>
                    <TableCell>
                      {room.students.length > 0 ? (
                        <div className="space-y-1">
                          {room.students.map((student) => (
                            <div key={student.studentId} className="text-sm">
                              <div className="font-medium">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {student.bedNumber} • {student.email}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Empty</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
