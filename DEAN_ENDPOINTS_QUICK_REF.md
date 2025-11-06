# 🎯 Dean Endpoints - Quick Reference Card

## 📡 All 7 Endpoints at a Glance

```
BASE: http://localhost:5000/api/dean
AUTH: Bearer <jwt_token>
ROLES: deanLadies, deanMen
```

---

## 1. List Hostels
```http
GET /api/dean/hostels
```
**Returns:** Array of hostels with occupancy stats (gender-filtered)

---

## 2. Hostel Details
```http
GET /api/dean/hostels/:id
```
**Returns:** Complete hostel info with rooms and students

---

## 3. Available Rooms
```http
GET /api/dean/hostels/:id/available-rooms
```
**Returns:** List of rooms with available beds

---

## 4. Booking Requests
```http
GET /api/dean/bookings?status=pending
```
**Query Params:** `status` = pending | approved | rejected  
**Returns:** Booking requests from gender-matched students

---

## 5. Approve/Reject Booking
```http
PUT /api/dean/bookings/:id/approve
Body: {
  "status": "approved" | "rejected",
  "note": "optional message"
}
```
**Returns:** Updated booking with success message

---

## 6. Allocate Room
```http
POST /api/dean/allocate-room
Body: {
  "studentId": "287",
  "hostelId": "36",
  "roomId": "1460",
  "bedNumber": "Bed B"
}
```
**Returns:** Allocation details with student and room info

---

## 7. Deallocate Student
```http
DELETE /api/dean/deallocate/:studentId
```
**Returns:** Success message with previous allocation details

---

## 🎨 Frontend Integration Pattern

```typescript
// 1. Create API hook
export const useHostels = () => {
  return useQuery({
    queryKey: ['/api/dean/hostels'],
    queryFn: async () => {
      const res = await fetch('/api/dean/hostels', {
        headers: { 
          'Authorization': `Bearer ${getToken()}` 
        }
      });
      if (!res.ok) throw new Error('Failed to fetch hostels');
      return res.json();
    }
  });
};

// 2. Use in component
function HostelsTab() {
  const { data: hostels, isLoading } = useHostels();
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="grid gap-4">
      {hostels.map(hostel => (
        <HostelCard key={hostel.id} hostel={hostel} />
      ))}
    </div>
  );
}

// 3. Mutation for actions
export const useApproveBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, note }) => {
      const res = await fetch(`/api/dean/bookings/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, note })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/dean/bookings']);
      toast.success('Booking updated successfully!');
    }
  });
};
```

---

## 🔒 Security Reminders

✅ All endpoints check: `deanLadies` OR `deanMen` role  
✅ All endpoints filter by gender automatically  
✅ Cross-gender access returns `403 Forbidden`  
✅ Invalid IDs return `404 Not Found`  
✅ Missing fields return `400 Bad Request`

---

## 📋 Common Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process the data |
| 400 | Bad Request | Check required fields |
| 403 | Forbidden | Gender mismatch - can't manage this student |
| 404 | Not Found | Invalid ID - check student/hostel/booking exists |
| 500 | Server Error | Check external API is running |

---

## 🧪 Quick Test

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"deanladies@on-campus.ueab.ac.ke","password":"password123"}' \
  | jq -r '.token')

# 2. Test endpoint
curl http://localhost:5000/api/dean/hostels \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 📂 File Locations

**Backend:** `server/routes.ts` (lines ~3210-3690)  
**Docs:** `DEAN_ENDPOINTS_IMPLEMENTATION.md`  
**Summary:** `RESIDENCE_MANAGEMENT_COMPLETE.md`  
**Test:** `test-dean-endpoints.sh`

---

## 🎯 Implementation Status

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| List Hostels | ✅ | ⏳ | Ready for UI |
| Hostel Details | ✅ | ⏳ | Ready for UI |
| Available Rooms | ✅ | ⏳ | Ready for UI |
| View Bookings | ✅ | ⏳ | Ready for UI |
| Approve/Reject | ✅ | ⏳ | Ready for UI |
| Allocate Room | ✅ | ⏳ | Ready for UI |
| Deallocate | ✅ | ⏳ | Ready for UI |

---

**🚀 All 7 endpoints are live and ready for frontend integration!**
