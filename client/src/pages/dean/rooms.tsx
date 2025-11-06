import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Room {
  id?: number;
  hostelName: string;
  roomNumber: string;
  capacity: number;
  currentOccupancy?: number;
  occupiedBeds?: number;
  availableBeds: number;
  status: string;
}

interface RoomsResponse {
  rooms: Room[];
  hostels: string[];
}

export default function RoomsPage() {
  const { data, isLoading } = useQuery<RoomsResponse>({
    queryKey: ["/api/dean/rooms"],
    queryFn: async () => await apiRequest("GET", "/api/dean/rooms"),
  });

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <p className="text-muted-foreground">All rooms and occupancy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading rooms...</div>
          ) : data?.rooms?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No rooms found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.rooms?.map((room, index) => (
                  <TableRow key={`${room.hostelName}-${room.roomNumber}-${index}`}>
                    <TableCell>{room.hostelName}</TableCell>
                    <TableCell className="font-medium">{room.roomNumber}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>{room.currentOccupancy || room.occupiedBeds || 0}</TableCell>
                    <TableCell>{room.availableBeds}</TableCell>
                    <TableCell className="capitalize">{room.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
