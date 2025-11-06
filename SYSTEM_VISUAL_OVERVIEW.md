# 📊 Residence Management System - Visual Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STUDENT SUBMITS REQUEST                      │
│                    (Via External API - Port 4000)                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DEAN LOGS INTO SAMS                              │
│          deanladies@ or deanmen@on-campus.ueab.ac.ke               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SAMS FRONTEND (React)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Hostels    │  │   Bookings   │  │   Allocate   │             │
│  │     Tab      │  │     Tab      │  │    Room      │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                       │
│         └─────────────────┼─────────────────┘                       │
│                          │                                          │
└──────────────────────────┼──────────────────────────────────────────┘
                           │ JWT Token + API Calls
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SAMS BACKEND (Express - Port 5000)                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │               7 Dean Management Endpoints                      │ │
│  │                                                               │ │
│  │  ┌─────────────────┐  ┌──────────────────┐                  │ │
│  │  │  Authentication │  │  Authorization   │                  │ │
│  │  │   Middleware    │  │  (Dean Roles)    │                  │ │
│  │  └────────┬────────┘  └────────┬─────────┘                  │ │
│  │           │                     │                            │ │
│  │           └──────────┬──────────┘                            │ │
│  │                      ▼                                       │ │
│  │           ┌──────────────────────┐                          │ │
│  │           │  Gender Filtering    │                          │ │
│  │           │  Ladies → Female     │                          │
│  │           │  Men → Male          │                          │
│  │           └──────────┬───────────┘                          │ │
│  │                      │                                       │ │
│  └──────────────────────┼───────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │ External API Calls
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│            EXTERNAL API (Azure - Port 4000)                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Endpoints Used:                                              │ │
│  │  • GET  /api/hostels                                          │ │
│  │  • GET  /api/hostels/:id                                      │ │
│  │  • GET  /api/hostels/:id/available-rooms                      │ │
│  │  • GET  /api/residences/bookings                              │ │
│  │  • PUT  /api/residences/bookings/:id/approve                  │ │
│  │  • POST /api/residences                                       │ │
│  │  • DELETE /api/residences/:studentId                          │ │
│  │  • GET  /api/students/:id                                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Database Tables:                                             │ │
│  │  • hostels          (hostel info)                             │ │
│  │  • rooms            (room details)                            │ │
│  │  • residences       (student allocations)                     │ │
│  │  • booking_requests (pending requests)                        │ │
│  │  • students         (student profiles)                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1️⃣ View Hostels Workflow

```
Dean Opens Dashboard
       │
       ▼
Frontend: GET /api/dean/hostels
       │
       ▼
Backend: Authenticate & check role
       │
       ├─→ Not dean? → 403 Forbidden
       │
       ▼
Backend: Fetch all hostels from External API
       │
       ▼
Backend: For each hostel:
       │   • Fetch hostel details
       │   • Check student genders
       │   • Keep if has target gender
       │
       ▼
Backend: Return filtered hostels
       │
       ▼
Frontend: Display hostel cards
       │
       └─→ User sees: "3 Ladies Hostels" or "2 Men Hostels"
```

---

### 2️⃣ Approve Booking Workflow

```
Student submits booking (External API)
       │
       ▼
Booking stored with status: "pending"
       │
       ▼
Dean opens "Bookings" tab
       │
       ▼
Frontend: GET /api/dean/bookings?status=pending
       │
       ▼
Backend: Fetch all pending bookings
       │
       ▼
Backend: For each booking:
       │   • Fetch student profile
       │   • Check gender
       │   • Keep if matches dean's gender
       │
       ▼
Backend: Return filtered bookings with student details
       │
       ▼
Frontend: Display booking cards
       │
       ▼
Dean clicks "Approve"
       │
       ▼
Frontend: PUT /api/dean/bookings/123/approve
          Body: { status: "approved", note: "Approved" }
       │
       ▼
Backend: Verify booking exists
       │
       ├─→ Not found? → 404
       │
       ▼
Backend: Fetch student profile
       │
       ├─→ Wrong gender? → 403 Forbidden
       │
       ▼
Backend: Call External API to approve
       │
       ▼
External API: Update booking status
              Set approvedBy = dean's ID
              Set approvedAt = current time
       │
       ▼
Backend: Return success with details
       │
       ▼
Frontend: Show success toast
          Refresh bookings list
       │
       └─→ Booking removed from pending list
```

---

### 3️⃣ Allocate Room Workflow

```
Dean opens "Allocate Room" tab
       │
       ├─→ Select Student (dropdown with search)
       ├─→ Select Hostel (filtered by gender)
       ├─→ Select Room (shows available beds)
       └─→ Select Bed (Bed A, Bed B, etc.)
       │
       ▼
Dean clicks "Allocate"
       │
       ▼
Frontend: POST /api/dean/allocate-room
          Body: {
            studentId: "287",
            hostelId: "36",
            roomId: "1460",
            bedNumber: "Bed B"
          }
       │
       ▼
Backend: Validate required fields
       │
       ├─→ Missing field? → 400 Bad Request
       │
       ▼
Backend: Fetch student profile
       │
       ├─→ Not found? → 404
       ├─→ Wrong gender? → 403 Forbidden
       │
       ▼
Backend: Check if student already has room
       │
       ├─→ Already allocated? → 400 "Deallocate first"
       │
       ▼
Backend: Fetch hostel details
       │
       ├─→ Hostel not found? → 404
       │
       ▼
Backend: Find room in hostel
       │
       ├─→ Room not found? → 404
       ├─→ No available beds? → 400 "Room full"
       │
       ▼
Backend: Call External API to create allocation
       │
       ▼
External API: Create residence record
              residenceType: "on-campus"
              allocated: true
              allocatedBy: dean's ID
              allocatedAt: current time
       │
       ▼
Backend: Return success with enriched data
       │
       ▼
Frontend: Show success message
          "Room allocated to Eunice Mutua"
          "New Ladies Hostel - Room 1A01 - Bed B"
       │
       └─→ Update dashboard stats
           Update available rooms list
```

---

## 🎯 Gender Separation Enforcement

```
┌──────────────────────────────────────────────────┐
│            EVERY ENDPOINT CHECKS:                 │
│                                                   │
│  1. Is user authenticated? (JWT token)           │
│     └─→ No? → 401 Unauthorized                   │
│                                                   │
│  2. Is user role deanLadies or deanMen?          │
│     └─→ No? → 403 Forbidden                      │
│                                                   │
│  3. For data access:                             │
│     • Ladies Dean → Only Female students         │
│     • Men Dean → Only Male students              │
│                                                   │
│  4. For actions (approve, allocate, deallocate): │
│     • Fetch student profile from External API    │
│     • Check student.gender                       │
│     • If mismatch → 403 Forbidden                │
│                                                   │
│  Result: ZERO cross-gender data leakage! ✅      │
└──────────────────────────────────────────────────┘
```

---

## 📱 Frontend Component Hierarchy

```
DeanDashboard
│
├── StatCards (existing - stays as is)
│   ├── Total Students
│   ├── Total Hostels
│   ├── Occupancy Rate
│   └── Available Beds
│
├── Tabs
│   │
│   ├── Overview Tab (existing - stays as is)
│   │   ├── Hostel Distribution Chart
│   │   ├── Occupancy Pie Chart
│   │   └── Monthly Trends Line Chart
│   │
│   ├── 🆕 Hostels Tab (NEW)
│   │   └── HostelCard[]
│   │       ├── Hostel Name
│   │       ├── Occupancy Bar
│   │       ├── Stats (rooms, beds)
│   │       └── [View Details] Button
│   │           └── Opens RoomDetailsModal
│   │               ├── Room List
│   │               ├── Student List
│   │               └── [Deallocate] Buttons
│   │
│   ├── 🆕 Bookings Tab (NEW)
│   │   └── BookingCard[]
│   │       ├── Student Info
│   │       ├── Requested Room
│   │       ├── Request Date
│   │       ├── [✓ Approve] Button
│   │       └── [✗ Reject] Button
│   │
│   ├── 🆕 Allocate Room Tab (NEW)
│   │   └── AllocationForm
│   │       ├── StudentSearchDropdown
│   │       ├── HostelDropdown
│   │       ├── RoomDropdown
│   │       ├── BedSelector
│   │       └── [Allocate] Button
│   │
│   ├── Rooms Tab (existing - stays as is)
│   │   └── RoomsTable with filters
│   │
│   └── Students Tab (existing - stays as is)
│       └── StudentsDirectory with search
```

---

## 🔢 Data Statistics (Example)

### Ladies Dean Dashboard

```
┌─────────────────────────────────────────────┐
│  👥 10 Female Students                      │
│  🏠 3 Ladies Hostels                        │
│  🛏️  10 Total Beds Occupied                │
│  📊 50% Occupancy Rate                      │
└─────────────────────────────────────────────┘

Hostels:
  • New Ladies Hostel    (5/10 beds, 50%)
  • Old Ladies Hostel    (3/8 beds, 37%)
  • Ladies Annex         (2/6 beds, 33%)

Pending Bookings: 2
  • Eunice Mutua → New Ladies - Room 1A02
  • Grace Wanjiru → Ladies Annex - Room 3B01
```

### Men Dean Dashboard

```
┌─────────────────────────────────────────────┐
│  👥 15 Male Students                        │
│  🏠 2 Men Hostels                           │
│  🛏️  14 Total Beds Occupied                │
│  📊 54% Occupancy Rate                      │
└─────────────────────────────────────────────┘

Hostels:
  • New Men Dorm         (8/12 beds, 67%)
  • Old Men Dorm         (7/14 beds, 50%)

Pending Bookings: 1
  • John Kamau → New Men Dorm - Room 2C05
```

---

## 🎨 UI/UX Flow

### User Journey: Approving a Booking

```
Step 1: Login
   ├─→ Email: deanladies@on-campus.ueab.ac.ke
   └─→ Password: password123

Step 2: Dashboard Loads
   └─→ See: "2 Pending Bookings" notification badge

Step 3: Click "Bookings" Tab
   └─→ See list of booking cards

Step 4: Review Booking
   ├─→ Student Name: Eunice Mutua
   ├─→ Email: student5@ueab.ac.ke
   ├─→ Requested: New Ladies Hostel - Room 1A01
   ├─→ Date: Nov 6, 2025
   └─→ Buttons: [✓ Approve] [✗ Reject]

Step 5: Click [Approve]
   └─→ Optional: Add note in dialog

Step 6: Confirm
   ├─→ Show loading spinner
   └─→ API call happens

Step 7: Success
   ├─→ Toast: "✓ Booking approved successfully!"
   ├─→ Card removed from pending list
   ├─→ Badge count decrements: "1 Pending Booking"
   └─→ Stats refresh automatically
```

---

## 📊 Endpoint Usage Matrix

| Endpoint | Used By Tab | Frequency | Cache? |
|----------|-------------|-----------|--------|
| `/api/dean/hostels` | Hostels | On mount | Yes |
| `/api/dean/hostels/:id` | Hostel Details Modal | On click | No |
| `/api/dean/hostels/:id/available-rooms` | Allocate Room | On hostel select | Yes |
| `/api/dean/bookings` | Bookings | On mount + after action | Yes |
| `/api/dean/bookings/:id/approve` | Bookings | On approve/reject | No |
| `/api/dean/allocate-room` | Allocate Room | On form submit | No |
| `/api/dean/deallocate/:studentId` | Hostel Details Modal | On deallocate click | No |

---

## 🧪 Testing Scenarios

### ✅ Happy Path
1. Ladies Dean logs in
2. Views ladies hostels only
3. Sees only female students
4. Approves booking from female student → Success
5. Allocates room to female student → Success

### ❌ Security Tests
1. Ladies Dean tries to approve booking from male student → 403
2. Men Dean tries to allocate room to female student → 403
3. Student tries to access dean endpoints → 403
4. Unauthenticated request → 401

### 🔍 Edge Cases
1. Try to allocate room to student who already has room → 400
2. Try to allocate room that's full → 400
3. Try to approve non-existent booking → 404
4. Try to deallocate student with no allocation → 404

---

## 📝 Implementation Checklist

### Backend ✅ COMPLETE
- [x] 7 endpoints implemented in `server/routes.ts`
- [x] Authentication middleware applied
- [x] Role validation (deanLadies/deanMen)
- [x] Gender-based filtering
- [x] Error handling (400, 403, 404, 500)
- [x] External API integration
- [x] Request validation
- [x] Response enrichment (student names, etc.)
- [x] Audit fields (allocatedBy, approvedBy)
- [x] Documentation created
- [x] Test script created

### Frontend ⏳ TODO
- [ ] Create `HostelsTab.tsx`
- [ ] Create `BookingsTab.tsx`
- [ ] Create `AllocateRoomTab.tsx`
- [ ] Create `HostelCard.tsx` component
- [ ] Create `BookingCard.tsx` component
- [ ] Create `RoomDetailsModal.tsx` component
- [ ] Create `AllocationForm.tsx` component
- [ ] Create `StudentSearchDropdown.tsx` component
- [ ] Add API hooks in `lib/api.ts`
- [ ] Add tabs to `dean/dashboard.tsx`
- [ ] Implement loading states
- [ ] Implement error handling
- [ ] Add toast notifications
- [ ] Style with Tailwind/shadcn

### Testing ⏳ TODO
- [ ] Test Ladies Dean workflow end-to-end
- [ ] Test Men Dean workflow end-to-end
- [ ] Verify gender isolation
- [ ] Test all action endpoints
- [ ] Test error scenarios
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

---

**🎉 Backend Implementation: 100% Complete!**  
**🎨 Frontend Implementation: Ready to Start!**  
**📚 Documentation: Comprehensive & Complete!**
