# Residence Dean System - Frontend Testing Guide

## ✅ Backend Status: VERIFIED

### API Endpoints Working
- ✅ `POST /api/admin/create-residence-deans` - Both dean accounts created
- ✅ `POST /api/auth/login` - Authentication working for both deans
- ✅ `GET /api/dean/dashboard/stats` - Gender-specific statistics:
  - **Ladies Dean**: 10 female students, 3 hostels, 10 rooms, 50% occupancy
  - **Men Dean**: 15 male students, 2 hostels, 14 rooms, 54% occupancy

### Server Running
- **URL**: http://localhost:5000
- **Status**: ✅ Running (PID: 1030753)
- **Frontend**: ✅ Vite dev server active

---

## 🧪 Frontend Testing Steps

### Test 1: Ladies Residence Dean

#### Step 1: Login
1. Open your browser and navigate to: **http://localhost:5000**
2. You should see the SAMS login page
3. Enter the following credentials:
   - **Email**: `deanladies@on-campus.ueab.ac.ke`
   - **Password**: `password123`
4. Click **"Sign In"**

#### Step 2: Verify Redirect
- After successful login, you should be automatically redirected to `/dean/dashboard`
- The page title should show: **"Ladies Residence Dashboard"**

#### Step 3: Check Dashboard Statistics Cards
You should see 4 stat cards at the top:

| Card | Expected Value | Description |
|------|----------------|-------------|
| **Total Students** | 10 | Female students on campus |
| **Hostels & Rooms** | 3 hostels, 10 rooms | Ladies hostels only |
| **Occupancy Rate** | 50% | Percentage of beds occupied |
| **Available Rooms** | 10 rooms, 10 recent bookings | Empty/partial rooms |

**Hostels visible**: Box Ladies Hostel, Annex Ladies Hostel, Grace Ladies Hostel

#### Step 4: Check Overview Tab (Analytics Charts)
Click on the **"Overview"** tab and verify:

1. **Bar Chart - Students by Hostel**
   - Should show 3 bars (one for each ladies hostel)
   - Distribution of students across Box, Annex, and Grace hostels

2. **Pie Chart - Occupancy Breakdown**
   - Shows Full/Partial/Empty room distribution
   - Legend with color coding (green=full, yellow=partial, red=empty)

3. **Line Chart - Monthly Allocations**
   - Shows booking trends over last 6 months
   - Line graph with allocation counts

#### Step 5: Check Rooms Tab
Click on the **"Rooms"** tab:

1. **Filters**:
   - Hostel dropdown should show: "All Hostels", "Box Ladies Hostel", "Annex Ladies Hostel", "Grace Ladies Hostel"
   - Status filter: "All", "Empty", "Partial", "Full"

2. **Table Columns**:
   - Hostel | Room Number | Capacity | Occupied | Available | Status
   
3. **Expected Data**:
   - Only ladies hostels should appear
   - Status badges (green/yellow/red) should display
   - 10 total rows (10 rooms)

4. **Test Filtering**:
   - Select "Box Ladies Hostel" from dropdown → should filter to only Box hostel rooms
   - Select "Empty" status → should show only empty rooms

#### Step 6: Check Students Tab
Click on the **"Students"** tab:

1. **Search Bar**: Type a student name/ID to test search
2. **Hostel Filter**: Dropdown to filter by hostel
3. **Table Columns**: Student ID | Name | Hostel | Room | Bed | Course

4. **Expected Data**:
   - Only female students visible
   - 10 total students
   - All from ladies hostels

5. **Test Search**: Type "student" in search → should filter results

#### Step 7: Check Sidebar Navigation
Verify sidebar shows:
- ✅ "Residence Management" section visible
- ✅ Dashboard link active
- ❌ **Should NOT see**: Chapa360 Finance, SWSMS Work Study, SGMS Governance sections

---

### Test 2: Men Residence Dean

#### Step 1: Logout
1. Click on your profile/avatar in the top right
2. Select **"Logout"** from dropdown menu
3. You should return to the login page

#### Step 2: Login as Men Dean
1. Enter credentials:
   - **Email**: `deanmen@on-campus.ueab.ac.ke`
   - **Password**: `password123`
2. Click **"Sign In"**

#### Step 3: Verify Redirect
- Should redirect to `/dean/dashboard`
- Page title: **"Men Residence Dashboard"**

#### Step 4: Check Dashboard Statistics

| Card | Expected Value | Description |
|------|----------------|-------------|
| **Total Students** | 15 | Male students on campus |
| **Hostels & Rooms** | 2 hostels, 14 rooms | Men hostels only |
| **Occupancy Rate** | 54% | Higher than ladies dorm |
| **Available Rooms** | 13 rooms, 15 recent bookings | |

**Hostels visible**: New Men Dorm, Old Men Dorm

#### Step 5: Verify Gender Separation
- **CRITICAL CHECK**: Confirm you do NOT see:
  - ❌ Box Ladies Hostel
  - ❌ Annex Ladies Hostel
  - ❌ Grace Ladies Hostel
  - ❌ Any female student names

- **SHOULD ONLY SEE**:
  - ✅ New Men Dorm
  - ✅ Old Men Dorm
  - ✅ Male student names only

#### Step 6: Test All Tabs Again
Repeat Overview, Rooms, and Students tab checks:
- All charts should show only men's data
- All rooms should be from men's hostels
- All students should be male

---

## 🔍 What to Look For (Validation Checklist)

### ✅ Success Indicators
- [ ] Both deans can login successfully
- [ ] Redirects to `/dean/dashboard` after login
- [ ] Dashboard shows correct title (Ladies/Men Residence Dashboard)
- [ ] Statistics are non-zero and gender-specific
- [ ] Ladies dean sees ONLY ladies hostels (Box, Annex, Grace)
- [ ] Men dean sees ONLY men hostels (New, Old)
- [ ] Charts display data (no empty states)
- [ ] Room filtering works (hostel and status dropdowns)
- [ ] Student search works
- [ ] No other modules visible in sidebar (Chapa360, SWSMS, SGMS)

### ❌ Failure Indicators
- Dashboard shows 0 students/hostels/rooms
- Both deans see the same data
- Ladies dean can see men's hostels or vice versa
- Charts don't load or show errors
- Filters don't work or throw errors
- Page doesn't redirect after login
- Sidebar shows student-specific modules

---

## 🐛 Troubleshooting

### Issue: Dashboard shows 0 for all stats
**Cause**: External API not responding or filtering failed  
**Solution**: Check server logs with `tail -f /tmp/sams_server.log`

### Issue: "Failed to fetch" errors in browser console
**Cause**: Authorization token not being sent  
**Solution**: Check Network tab in DevTools → Headers → verify "Authorization: Bearer..." header

### Issue: Wrong hostel data visible
**Cause**: Gender filtering not working  
**Solution**: Check `[FILTER DEBUG]` logs in server console

### Issue: Charts not rendering
**Cause**: Missing analytics data or Recharts not loaded  
**Solution**: Open browser console → check for errors → verify `/api/dean/analytics` returns data

### Issue: Can't login
**Cause**: Dean accounts not created or wrong password  
**Solution**: Re-run: `curl -X POST http://localhost:5000/api/admin/create-residence-deans`

---

## 📊 Expected API Responses (For Developer Reference)

### Ladies Dean - Dashboard Stats
```json
{
  "totalStudents": 10,
  "totalHostels": 3,
  "totalRooms": 10,
  "emptyRooms": 10,
  "occupancyRate": 50,
  "totalBeds": 20,
  "occupiedBeds": 10,
  "recentBookings": 10,
  "gender": "Female"
}
```

### Men Dean - Dashboard Stats
```json
{
  "totalStudents": 15,
  "totalHostels": 2,
  "totalRooms": 14,
  "emptyRooms": 13,
  "occupancyRate": 54,
  "totalBeds": 28,
  "occupiedBeds": 15,
  "recentBookings": 15,
  "gender": "Male"
}
```

---

## 🎯 Test Completion Criteria

**All tests pass when:**
1. ✅ Both deans can login and see their respective dashboards
2. ✅ Statistics are accurate and gender-specific
3. ✅ No cross-gender data leakage (ladies dean never sees men's data and vice versa)
4. ✅ All charts and tables display correctly
5. ✅ Filtering and search functionality works
6. ✅ Navigation restricted to Residence Management only

---

## 📝 Post-Testing Report Template

After testing, document your findings:

```markdown
## Test Results - [Date/Time]

### Ladies Dean Test
- Login: ✅/❌
- Dashboard Stats: ✅/❌ (Values: X students, Y hostels, Z% occupancy)
- Charts Load: ✅/❌
- Filters Work: ✅/❌
- Gender Separation: ✅/❌
- Issues Found: [List any issues]

### Men Dean Test  
- Login: ✅/❌
- Dashboard Stats: ✅/❌ (Values: X students, Y hostels, Z% occupancy)
- Charts Load: ✅/❌
- Filters Work: ✅/❌
- Gender Separation: ✅/❌
- Issues Found: [List any issues]

### Overall Status
- System Ready for Production: ✅/❌
- Blockers: [List if any]
- Recommendations: [Any improvements needed]
```

---

**Testing Time Estimate**: 15-20 minutes  
**Last Updated**: November 6, 2025, 12:01 AM  
**Status**: 🟢 Ready for Testing
