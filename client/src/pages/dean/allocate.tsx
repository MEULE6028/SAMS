import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Building2, BedDouble, Search, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Student {
  studentId: string;
  name: string;
  email: string;
  gender: string;
  hostelName?: string;
  roomNumber?: string;
}

interface Hostel {
  id: number;
  name: string;
  availableBeds: number;
}

interface AvailableRoom {
  roomId: number;
  roomNumber: string;
  roomType: string;
  availableBeds: string[];
  totalBedsInRoom: number;
}

interface AvailableRoomsResponse {
  hostelId: string;
  gender: string;
  availableRooms: AvailableRoom[];
}

export default function AllocateRoomPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedBed, setSelectedBed] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch students
  const { data: studentsData } = useQuery({
    queryKey: ["/api/dean/students"],
    queryFn: () => apiRequest("GET", "/api/dean/students"),
  });

  // Fetch hostels
  const { data: hostels } = useQuery<Hostel[]>({
    queryKey: ["/api/dean/hostels"],
    queryFn: () => apiRequest("GET", "/api/dean/hostels"),
  });

  // Fetch available rooms when hostel is selected
  const { data: availableRooms } = useQuery<AvailableRoomsResponse>({
    queryKey: ["/api/dean/hostels", selectedHostel, "available-rooms"],
    queryFn: () => apiRequest("GET", `/api/dean/hostels/${selectedHostel}/available-rooms`),
    enabled: selectedHostel !== "",
  });

  // Allocate room mutation
  const allocateMutation = useMutation({
    mutationFn: (data: {
      studentId: string;
      hostelId: string;
      roomId: string;
      bedNumber: string;
    }) => apiRequest("POST", "/api/dean/allocate-room", data),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dean/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dean/hostels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dean/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dean/rooms"] });

      // Reset form
      setSelectedStudent(null);
      setSelectedHostel("");
      setSelectedRoom("");
      setSelectedBed("");
      setSearchQuery("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredStudents = studentsData?.students?.filter((student: Student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const selectedRoomData = availableRooms?.availableRooms.find(
    (r) => r.roomId.toString() === selectedRoom
  );

  const handleAllocate = () => {
    if (!selectedStudent || !selectedHostel || !selectedRoom || !selectedBed) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    allocateMutation.mutate({
      studentId: selectedStudent.studentId.replace("student", ""),
      hostelId: selectedHostel,
      roomId: selectedRoom,
      bedNumber: selectedBed,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Allocate Room</h1>
        <p className="text-muted-foreground">Manually assign rooms to students</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Room Allocation Form
            </CardTitle>
            <CardDescription>Select student, hostel, room, and bed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Select Student */}
            <div className="space-y-2">
              <Label>1. Select Student</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {searchQuery && (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No students found
                      </div>
                    ) : (
                      filteredStudents.slice(0, 5).map((student: Student) => (
                        <button
                          key={student.studentId}
                          onClick={() => {
                            setSelectedStudent(student);
                            setSearchQuery("");
                          }}
                          className="w-full p-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                        >
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.studentId} • {student.email}
                          </div>
                          {student.hostelName && (
                            <div className="text-xs text-red-500 mt-1">
                              Already allocated: {student.hostelName} - {student.roomNumber}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedStudent && !searchQuery && (
                  <div className="p-3 border rounded-md bg-accent">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{selectedStudent.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedStudent.studentId} • {selectedStudent.email}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStudent(null)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Select Hostel */}
            <div className="space-y-2">
              <Label>2. Select Hostel</Label>
              <Select value={selectedHostel} onValueChange={(value) => {
                setSelectedHostel(value);
                setSelectedRoom("");
                setSelectedBed("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a hostel" />
                </SelectTrigger>
                <SelectContent>
                  {hostels?.map((hostel) => (
                    <SelectItem key={hostel.id} value={hostel.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{hostel.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({hostel.availableBeds} beds available)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 3: Select Room */}
            <div className="space-y-2">
              <Label>3. Select Room</Label>
              <Select
                value={selectedRoom}
                onValueChange={(value) => {
                  setSelectedRoom(value);
                  setSelectedBed("");
                }}
                disabled={!selectedHostel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms?.availableRooms.map((room) => (
                    <SelectItem key={room.roomId} value={room.roomId.toString()}>
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4" />
                        <span>Room {room.roomNumber}</span>
                        <span className="text-muted-foreground text-xs capitalize">
                          ({room.roomType}, {room.availableBeds.length} available)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 4: Select Bed */}
            <div className="space-y-2">
              <Label>4. Select Bed</Label>
              <div className="grid grid-cols-2 gap-2">
                {selectedRoomData?.availableBeds.map((bed) => (
                  <Button
                    key={bed}
                    variant={selectedBed === bed ? "default" : "outline"}
                    onClick={() => setSelectedBed(bed)}
                    disabled={!selectedRoom}
                    className="justify-start"
                  >
                    <BedDouble className="h-4 w-4 mr-2" />
                    {bed}
                  </Button>
                ))}
              </div>
              {selectedRoom && selectedRoomData?.availableBeds.length === 0 && (
                <p className="text-sm text-muted-foreground">No beds available in this room</p>
              )}
            </div>

            {/* Allocate Button */}
            <Button
              onClick={handleAllocate}
              disabled={
                !selectedStudent ||
                !selectedHostel ||
                !selectedRoom ||
                !selectedBed ||
                allocateMutation.isPending
              }
              className="w-full"
              size="lg"
            >
              {allocateMutation.isPending ? (
                "Allocating..."
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Allocate Room
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right Column: Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Allocation Summary</CardTitle>
            <CardDescription>Review before confirming</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Student</Label>
                <div className="mt-1 text-lg font-medium">
                  {selectedStudent ? selectedStudent.name : "Not selected"}
                </div>
                {selectedStudent && (
                  <div className="text-sm text-muted-foreground">
                    {selectedStudent.studentId} • {selectedStudent.email}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Hostel</Label>
                <div className="mt-1 text-lg font-medium">
                  {selectedHostel
                    ? hostels?.find((h) => h.id.toString() === selectedHostel)?.name
                    : "Not selected"}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Room</Label>
                <div className="mt-1 text-lg font-medium">
                  {selectedRoomData
                    ? `Room ${selectedRoomData.roomNumber}`
                    : "Not selected"}
                </div>
                {selectedRoomData && (
                  <div className="text-sm text-muted-foreground capitalize">
                    {selectedRoomData.roomType} • {selectedRoomData.totalBedsInRoom} beds
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Bed</Label>
                <div className="mt-1 text-lg font-medium">
                  {selectedBed || "Not selected"}
                </div>
              </div>
            </div>

            {selectedStudent && selectedHostel && selectedRoom && selectedBed && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-900">Ready to Allocate</div>
                    <div className="text-sm text-green-700 mt-1">
                      All fields are filled. Click "Allocate Room" to confirm.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
