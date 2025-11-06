# External Residence API Documentation

## Base URL
`https://studedatademo.azurewebsites.net`

## Available Endpoints

### Residences
- `GET /api/residences` - All residence allocations with hostel/room details
- `GET /api/residences/student/:studentId` - Get residence by student ID (e.g., "student001")
- `GET /api/residences/roommates/:studentId` - Get roommates for a student
- `GET /api/residences/:studentId` - Get residence by numeric student ID
- `POST /api/residences` - Allocate residence to student
- `PUT /api/residences/:studentId` - Update residence allocation
- `DELETE /api/residences/:studentId` - Delete residence allocation

### Room Bookings
- `GET /api/residences/bookings` - All room booking requests
- `POST /api/residences/bookings` - Submit room booking request
- `GET /api/residences/bookings/:id` - Get booking by ID
- `PUT /api/residences/bookings/:id/approve` - Approve/reject booking

### Attendance
- `GET /api/residences/attendance/student/:studentId` - Student attendance history
- `GET /api/residences/attendance/date/:date` - Attendance by date

## Data Structure

### Residence Object (from GET /api/residences)
```json
{
  "id": 1,
  "studentId": 5,
  "residenceType": "on-campus",
  "hostelId": 26,
  "roomId": 1007,
  "bedNumber": "Bed A",
  "hostelName": "New Men Dorm",
  "roomNumber": "1D07",
  "offCampusHostelName": null,
  "offCampusRoomNumber": null,
  "offCampusArea": null,
  "allocated": true,
  "allocatedAt": "2025-11-01T08:05:27.266Z"
}
```

### Residence with Student Details (from GET /api/residences/student/:studentId)
```json
{
  "id": 1,
  "studentId": "student009",
  "studentName": "Irene",
  "studentLastName": "Omondi",
  "residenceType": "on-campus",
  "hostelName": "New Men Dorm",
  "hostelLocation": "Main Campus",
  "roomNumber": "1D07",
  "bedNumber": "Bed A",
  "roomCapacity": 4,
  "roomOccupancy": 1,
  "offCampusHostelName": null,
  "offCampusRoomNumber": null,
  "offCampusArea": null,
  "allocatedAt": "2025-11-01T08:05:27.266Z"
}
```

### Roommates Response
```json
{
  "studentId": "student009",
  "studentName": "Irene Omondi",
  "residenceType": "on-campus",
  "hostelName": "New Men Dorm",
  "roomNumber": "1D07",
  "totalRoommates": 2,
  "roommates": [
    {
      "studentId": "student010",
      "firstName": "John",
      "lastName": "Doe",
      "gender": "Male",
      "email": "john@ueab.ac.ke",
      "phone": "+254712345678",
      "yearOfStudy": 2,
      "bedNumber": "Bed B",
      "departmentName": "Computer Science",
      "schoolName": "School of Computing"
    }
  ]
}
```

## Key Notes

1. **Gender Filtering**: The external API does NOT directly provide gender on residence records. Gender comes from:
   - The `students` table (joined in queries like `/api/residences/student/:studentId`)
   - The `hostels` table (hostels are gender-specific)

2. **No Direct Hostel/Room Endpoints**: The external API doesn't expose direct hostel or room listing endpoints. All data comes through residence allocations with joins.

3. **Student IDs**: The API uses string IDs like "student001", "student002", etc.

4. **Room Capacity**: Rooms support 1-4 beds (single, double, triple, quad)

5. **Off-Campus**: Off-campus students have `offCampusHostelName`, `offCampusRoomNumber`, `offCampusArea` instead of hostel/room IDs

## For Dean Implementation

To implement dean dashboards with gender filtering, we need to:
1. Fetch all residences from `/api/residences`
2. For each residence, fetch student details from `/api/students/:id` (external API)
3. Filter by student gender based on dean role
4. Group by hostel and room for statistics
