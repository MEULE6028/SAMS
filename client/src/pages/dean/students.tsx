import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Student {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  hostelName?: string;
  roomNumber?: string;
  bedNumber?: string;
}

export default function StudentsPage() {
  const { data, isLoading } = useQuery<{ students: Student[] }>({
    queryKey: ["/api/dean/students"],
    queryFn: async () => await apiRequest("GET", "/api/dean/students"),
  });

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="text-muted-foreground">Student directory and allocations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Hostel</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Bed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.students.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell className="font-medium">{s.studentId}</TableCell>
                  <TableCell>{s.firstName} {s.lastName}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.hostelName || '-'}</TableCell>
                  <TableCell>{s.roomNumber || '-'}</TableCell>
                  <TableCell>{s.bedNumber || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
