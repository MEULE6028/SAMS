// External Student API Integration
// This service communicates with the university's student management system

const API_BASE_URL = import.meta.env.VITE_STUDENT_API_URL || 'https://studedatademo.azurewebsites.net';

export interface ExternalEnrollment {
    id: number;
    studentId: number;
    courseId: number;
    semester: string;
    status: string;
    grade: string | null;
}

export interface ExternalFee {
    id: number;
    studentId: number;
    semester: string;
    amountBilled: string;
    amountPaid: string;
}

export interface ExternalStudent {
    id: number;
    studentId: string;
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    email: string;
    phone: string;
    address: string;
    schoolId: number;
    departmentId: number;
    yearOfStudy: number;
    yearJoined: string | null;
    workStudy: boolean;
    currentSemester: string;
    enrollments?: ExternalEnrollment[];
    fees?: ExternalFee[];
    residence?: ExternalResidence;
    balance?: number;
}

export interface ExternalResidence {
    id: number;
    studentId: number;
    residenceType: string;
    hostelId?: number | null;
    roomId?: number | null;
    bedNumber?: string | null;
    offCampusAddress?: string | null;
    offCampusArea?: string | null;
    allocated: boolean;
    allocatedAt?: string | null;
}

export interface ExternalAppointment {
    id: number;
    title: string;
    appointmentType: string;
    date: string;
    venue: string;
    description?: string;
    mandatory: boolean;
    createdBy: number;
    createdAt: string;
}

export interface ExternalAttendance {
    appointmentId: number;
    studentId: string;
    attended: boolean;
    markedAt?: string;
}

export interface ExternalHostel {
    id: number;
    name: string;
    gender: string;
    totalRooms: number;
    location: string;
    description?: string;
    warden?: number;
    wardenName?: string;
    occupiedRooms: number;
    totalCapacity: number;
    currentOccupancy: number;
}

export interface ExternalRoom {
    id: number;
    hostelId: number;
    hostelName?: string;
    roomNumber: string;
    floor: number;
    capacity: number;
    currentOccupancy: number;
    roomType: string;
    amenities?: string[];
    status: string;
}

class ExternalStudentAPI {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    setToken(token: string) {
        this.token = token;
    }

    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options?.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Students
    async getStudent(studentId: string): Promise<ExternalStudent> {
        return this.request<ExternalStudent>(`/api/students/by-student-id/${studentId}`);
    }

    async getAllStudents(): Promise<ExternalStudent[]> {
        return this.request<ExternalStudent[]>(`/api/students`);
    }

    // Appointments
    async getAppointments(params?: { type?: string; startDate?: string; endDate?: string }) {
        const query = new URLSearchParams(params as any).toString();
        return this.request<ExternalAppointment[]>(`/api/appointments${query ? `?${query}` : ''}`);
    }

    async getAppointmentAttendance(appointmentId: number) {
        return this.request<ExternalAttendance[]>(`/api/appointments/${appointmentId}/attendance`);
    }

    async markAttendance(appointmentId: number, studentId: string) {
        return this.request<ExternalAttendance>(`/api/appointments/${appointmentId}/attendance`, {
            method: 'POST',
            body: JSON.stringify({ studentId }),
        });
    }

    async getStudentAttendanceSummary(studentId: string) {
        return this.request<any>(`/api/appointments/attendance/student/${studentId}`);
    }

    // Hostels
    async getHostels(gender?: string) {
        return this.request<ExternalHostel[]>(`/api/hostels${gender ? `?gender=${gender}` : ''}`);
    }

    async getHostelRooms(hostelId: number) {
        return this.request<ExternalRoom[]>(`/api/hostels/${hostelId}/rooms`);
    }

    async getRoomDetails(roomId: number) {
        return this.request<ExternalRoom>(`/api/hostels/rooms/${roomId}`);
    }

    async allocateRoom(roomId: number, studentId: string, bedNumber?: string) {
        return this.request(`/api/hostels/rooms/${roomId}/allocate`, {
            method: 'POST',
            body: JSON.stringify({ studentId, bedNumber }),
        });
    }

    // Residence
    async getStudentResidence(studentId: string) {
        return this.request<ExternalResidence>(`/api/residences/${studentId}`);
    }

    async createResidenceBooking(data: any) {
        return this.request(`/api/residences/bookings`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateResidence(studentId: string, data: any) {
        return this.request(`/api/residences/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Fees
    async getStudentFeeBalance(studentId: string) {
        return this.request<{ balance: number }>(`/api/fees/balance/${studentId}`);
    }

    async getFeeRecords(studentId: string) {
        return this.request(`/api/fees?studentId=${studentId}`);
    }

    // Church Attendance
    async getChurchAttendance(studentId: string) {
        return this.request(`/api/attendance/church?studentId=${studentId}`);
    }

    // Residence Attendance
    async getResidenceAttendance(studentId: string) {
        return this.request(`/api/attendance/residence?studentId=${studentId}`);
    }

    // Enrollments
    async getStudentEnrollments(studentId: string) {
        return this.request(`/api/enrollments?studentId=${studentId}`);
    }
}

export const externalStudentAPI = new ExternalStudentAPI();
export const externalAPI = externalStudentAPI; // Alias for convenience
