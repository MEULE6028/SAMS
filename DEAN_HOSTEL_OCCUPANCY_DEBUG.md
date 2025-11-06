# 🔍 Hostel Occupancy Display Issue - Debug Plan

## Problem

The hostel details modal shows:
- ✅ **Correct occupancy stats** in header: "5 / 108 beds occupied (5%)"
- ❌ **All rooms show "Empty"** in the Students column
- ❌ **But `Occupied` column shows correct numbers** (e.g., some rooms show 1)

This means:
- Backend is correctly calculating `occupiedBeds` from `currentOccupancy`
- But `room.students` array is empty (not being populated)

---

## Root Cause Analysis

### Data Flow

1. **Fetch residences** → Get list of student allocations
   ```json
   {
     "studentId": 284,
     "hostelId": 38,
     "roomNumber": "2A01",
     "bedNumber": "Bed A"
   }
   ```

2. **Fetch student details** for each residence
   ```json
   {
     "id": 284,
     "firstName": "Brian",
     "lastName": "Ouma",
     "roomNumber": "2A01",  // ← Added from residence
     "bedNumber": "Bed A"    // ← Added from residence
   }
   ```

3. **Fetch hostel rooms** from external API
   ```json
   {
     "id": 1501,
     "roomNumber": "2A01",  // ← Should match!
     "currentOccupancy": 1
   }
   ```

4. **Filter students by room** 
   ```typescript
   const roomStudents = students.filter((s: any) => 
     s.roomNumber === room.roomNumber  // ← This should match "2A01" === "2A01"
   );
   ```

### Possible Issues

1. **Network/API failure** - Students not being fetched
2. **Gender filtering** - Students filtered out before nesting
3. **Room number mismatch** - Subtle difference in format
4. **Timing issue** - Data not ready when modal opens

---

## Debug Logging Added

Added console logs to track the issue:

```typescript
console.log(`[DEAN HOSTEL DETAILS] Hostel ${hostelId} - Found ${students.length} students`);
console.log(`[DEAN HOSTEL DETAILS] Sample student roomNumber:`, students[0].roomNumber);
console.log(`[DEAN HOSTEL DETAILS] Total rooms: ${hostelDetails.rooms?.length}`);
console.log(`[DEAN HOSTEL DETAILS] Sample room:`, hostelDetails.rooms?.[0]?.roomNumber);

// For each room with students:
console.log(`[DEAN HOSTEL DETAILS] Room ${room.roomNumber} has ${roomStudents.length} students`);
```

---

## Testing Steps

### 1. Restart Server
```bash
# Stop current server (Ctrl+C)
pnpm dev
```

### 2. Open Server Logs
```bash
# In another terminal:
tail -f server.log | grep "DEAN HOSTEL"
```

### 3. Test in Browser
1. Navigate to Hostels page: `http://localhost:5000/dean/hostels`
2. Click **"View Details"** on Box Ladies Hostel
3. Watch the server logs

### 4. Check Log Output

**Expected logs:**
```
[DEAN HOSTEL DETAILS] Hostel 38 - Found 5 students
[DEAN HOSTEL DETAILS] Sample student roomNumber: 2A01
[DEAN HOSTEL DETAILS] Total rooms: 45, Sample room: 1A01
[DEAN HOSTEL DETAILS] Room 2A01 has 1 students
[DEAN HOSTEL DETAILS] Room 3D07 has 1 students
... etc
```

**If logs show "Found 0 students":**
- API fetch failed
- Gender filtering issue
- Wrong hostel ID

**If logs show students but no "Room X has Y students":**
- Room number mismatch
- String comparison issue

---

## Manual API Test

Test the endpoint directly:

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"deanladies@on-campus.ueab.ac.ke","password":"password123"}' \
  | jq -r '.token')

# Get hostel details
curl http://localhost:5000/api/dean/hostels/38 \
  -H "Authorization: Bearer $TOKEN" \
  | jq '{
    totalStudents: .students | length,
    sampleRoom: .rooms[10],
    occupiedRooms: [.rooms[] | select(.occupiedBeds > 0) | {roomNumber, occupiedBeds, studentsCount: (.students | length)}]
  }'
```

**Expected output:**
```json
{
  "totalStudents": 5,
  "sampleRoom": {
    "roomNumber": "2A01",
    "occupiedBeds": 1,
    "students": [
      {
        "firstName": "Brian",
        "lastName": "Ouma",
        "roomNumber": "2A01",
        "bedNumber": "Bed A"
      }
    ]
  },
  "occupiedRooms": [
    {"roomNumber": "2A01", "occupiedBeds": 1, "studentsCount": 1},
    {"roomNumber": "3D07", "occupiedBeds": 1, "studentsCount": 1}
  ]
}
```

---

## Potential Fixes

### Fix 1: If students array is empty
```typescript
// Check if API is returning students
if (students.length === 0) {
  console.warn(`[DEAN HOSTEL DETAILS] No students found for hostel ${hostelId}`);
  console.warn(`[DEAN HOSTEL DETAILS] Residences count: ${hostelResidences.length}`);
}
```

### Fix 2: If room numbers don't match
```typescript
// Add trimming and case normalization
const roomStudents = students.filter((s: any) => 
  s.roomNumber?.trim().toLowerCase() === room.roomNumber?.trim().toLowerCase()
);
```

### Fix 3: If it's a gender filtering issue
```typescript
// Log before gender filtering
console.log(`[DEAN HOSTEL DETAILS] All residences: ${allResidences.length}`);
console.log(`[DEAN HOSTEL DETAILS] Filtered for hostel ${hostelId}: ${hostelResidences.length}`);
```

---

## Expected Behavior

### Box Ladies Hostel (ID: 38)

Should show:
- **Total:** 5 students allocated
- **Room 2A01:** 1 student (Brian Ouma, Bed A)
- **Room 3D07:** 1 student  
- **Room 2E09:** 1 student
- **Room 5B03:** 1 student
- **Room 1C05:** 1 student
- **Other rooms:** Empty

### What Frontend Should Display

| Room | Type | Capacity | Occupied | Available | Students |
|------|------|----------|----------|-----------|----------|
| 2A01 | Quad | 4 | 1 | 3 | Brian Ouma<br>Bed A • student2@ueab.ac.ke |
| 3D07 | Quad | 4 | 1 | 3 | [Student Name]<br>Bed A • [email] |
| ... other rooms with Empty |

---

## Next Steps

1. ✅ **Restart server** with debug logging
2. ⏳ **Check logs** when clicking View Details
3. ⏳ **Share log output** to identify exact issue
4. ⏳ **Apply targeted fix** based on logs

---

## Quick Verification

**Check if students are in database:**
```bash
curl -s https://studedatademo.azurewebsites.net/api/residences \
  | jq '[.[] | select(.hostelId == 38)] | length'
```
Expected: 5

**Check if students API works:**
```bash
curl -s https://studedatademo.azurewebsites.net/api/students/284 \
  | jq '{id, firstName, lastName}'
```
Expected: Valid student object

---

## Status

🟡 **DEBUGGING** - Added logging to identify root cause

**Next:** Restart server and check logs to pinpoint the exact issue!
