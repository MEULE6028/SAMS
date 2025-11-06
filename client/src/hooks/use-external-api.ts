import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { externalAPI } from "@/lib/externalAPI";
import { useAuth } from "@/lib/auth";

/**
 * Hook to fetch student data from external API
 */
export function useExternalStudent() {
    const { user } = useAuth();
    // Extract student ID from email (e.g., student001@ueab.ac.ke -> student001)
    const studentId = user?.universityId || user?.email?.split("@")[0] || "";

    return useQuery({
        queryKey: ["external-student", studentId],
        queryFn: () => externalAPI.getStudent(studentId),
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: 2,
    });
}

/**
 * Hook to fetch appointments from external API
 */
export function useExternalAppointments(params?: {
    type?: string;
    startDate?: string;
    endDate?: string;
}) {
    return useQuery({
        queryKey: ["external-appointments", params],
        queryFn: () => externalAPI.getAppointments(params),
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
        retry: 2,
    });
}

/**
 * Hook to fetch appointment attendance
 */
export function useAppointmentAttendance(appointmentId: number | null) {
    return useQuery({
        queryKey: ["appointment-attendance", appointmentId],
        queryFn: () => externalAPI.getAppointmentAttendance(appointmentId!),
        enabled: !!appointmentId,
        staleTime: 1 * 60 * 1000,
    });
}

/**
 * Hook to mark attendance at an appointment
 */
export function useMarkAttendance() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const studentId = user?.universityId || user?.email?.split("@")[0] || "";

    return useMutation({
        mutationFn: ({ appointmentId }: { appointmentId: number }) =>
            externalAPI.markAttendance(appointmentId, studentId),
        onSuccess: (_, { appointmentId }) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["external-appointments"] });
            queryClient.invalidateQueries({ queryKey: ["appointment-attendance", appointmentId] });
            queryClient.invalidateQueries({ queryKey: ["student-attendance-summary", studentId] });
        },
    });
}

/**
 * Hook to fetch student's attendance summary
 */
export function useStudentAttendanceSummary() {
    const { user } = useAuth();
    const studentId = user?.universityId || user?.email?.split("@")[0] || "";

    return useQuery({
        queryKey: ["student-attendance-summary", studentId],
        queryFn: () => externalAPI.getStudentAttendanceSummary(studentId),
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch hostels from external API
 */
export function useExternalHostels(gender?: string) {
    return useQuery({
        queryKey: ["external-hostels", gender],
        queryFn: () => externalAPI.getHostels(gender),
        staleTime: 10 * 60 * 1000, // Cache for 10 minutes
        retry: 2,
    });
}

/**
 * Hook to fetch rooms in a specific hostel
 */
export function useHostelRooms(hostelId: number | null) {
    return useQuery({
        queryKey: ["hostel-rooms", hostelId],
        queryFn: () => externalAPI.getHostelRooms(hostelId!),
        enabled: !!hostelId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to get available rooms in a hostel
 */
export function useAvailableRooms(hostelId: number | null) {
    return useQuery({
        queryKey: ["available-rooms", hostelId],
        queryFn: async () => {
            const rooms = await externalAPI.getHostelRooms(hostelId!);
            return rooms?.filter((room: any) => room.status === 'available' || room.currentOccupancy < room.capacity) || [];
        },
        enabled: !!hostelId,
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Hook to fetch all students (admin only)
 */
export function useAllStudents() {
    return useQuery({
        queryKey: ["external-all-students"],
        queryFn: () => externalAPI.getAllStudents(),
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}
