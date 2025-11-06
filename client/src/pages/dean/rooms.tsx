import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Room {
  id: number;
  hostelName: string;
  roomNumber: string;
  capacity: number;
  occupiedBeds: number;
  availableBeds: number;
  status: string;
}

export default function RoomsPage() {
  const { data, isLoading } = useQuery<Room[]>({
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
              {data?.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>{room.hostelName}</TableCell>
                  <TableCell className="font-medium">{room.roomNumber}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell>{room.occupiedBeds}</TableCell>
                  <TableCell>{room.availableBeds}</TableCell>
                  <TableCell className="capitalize">{room.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
