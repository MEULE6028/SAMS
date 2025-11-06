# Quick Test Guide - Work Study Earnings

## Test the Complete Workflow

### Step 1: Verify student001 has work study access
```bash
curl "https://studedatademo.azurewebsites.net/api/students/by-student-id/student001"
```
Expected response:
```json
{
  "studentId": "student001",
  "workStudy": true,  ✓
  "balance": 21,
  "currentSemester": "2025-1"
}
```

### Step 2: Login as student001
- URL: http://localhost:5173/login
- Username: `student001`
- Password: (your test password)

### Step 3: Check Dashboard
- Should see "Work Study" section
- Shows: Active Participant badge
- Shows: Position, hours, earnings summary

### Step 4: Submit Timecard
1. Navigate to: http://localhost:5173/swsms/timecards
2. Click "Log New Hours" button
3. Fill in the form:
   - Position: Select any approved position (e.g., Library)
   - Date: Today's date
   - Hours Worked: 5
   - Task Description: "Organized books and assisted students"
4. Submit
5. **Expected Result:**
   - New row appears in table
   - Status: "pending" (yellow badge)
   - Earnings: "Pending verification" (gray text)

### Step 5: Verify as Supervisor
1. Logout from student001
2. Login as admin or supervisor
3. Navigate to: http://localhost:5173/admin/swsms/timecards
4. Find the timecard you just submitted
5. Click the verify button
6. **Expected Result:**
   - Status changes to "verified"
   - Earnings calculated: 5 hours × 50 ETB = 250 ETB (for Library)

### Step 6: Check Earnings Display
1. Logout from admin
2. Login as student001 again
3. Navigate to: http://localhost:5173/swsms/timecards
4. **Expected Result:**
   - Status: "verified" (green badge)
   - Earnings: "ETB 250.00" (green text)

## Quick Department Rate Reference

| Department | Rate/Hour | 5 Hours | 8 Hours | 10 Hours |
|-----------|-----------|---------|---------|----------|
| Library | 50 ETB | 250 ETB | 400 ETB | 500 ETB |
| IT Services | 75 ETB | 375 ETB | 600 ETB | 750 ETB |
| Admissions | 60 ETB | 300 ETB | 480 ETB | 600 ETB |
| Health Center | 70 ETB | 350 ETB | 560 ETB | 700 ETB |
| Research Center | 80 ETB | 400 ETB | 640 ETB | 800 ETB |

## Troubleshooting

### Issue: "No work positions available"
**Solution:** Student needs to have an approved work application first
1. Go to /swsms/applications
2. Submit an application
3. Login as admin and approve it
4. Then submit timecards

### Issue: "Earnings not showing"
**Check:**
- Is the timecard status "verified"?
- Was the timecard approved by a supervisor?
- Refresh the page

### Issue: "Wrong earnings amount"
**Check:**
- Which department is the position?
- How many hours were logged?
- Formula: hours × department rate
- Example: 5 hours at Library (50 ETB) = 250 ETB

### Issue: "Can't submit timecard"
**Check:**
- Is student logged in?
- Does student have `workStudy: true` in external API?
- Does student have an approved application?

## API Endpoints

### Get Student's Timecards
```bash
GET /api/swsms/timecards
Authorization: Bearer <token>
```

### Submit New Timecard
```bash
POST /api/swsms/timecards
Authorization: Bearer <token>
Content-Type: application/json

{
  "applicationId": "app-id-here",
  "date": "2025-01-20",
  "hoursWorked": "5",
  "taskDescription": "Task details"
}
```

### Verify Timecard (Admin/Supervisor)
```bash
PATCH /api/swsms/timecards/:id/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "verified"
}
```

## Server Information

- **Server URL:** http://localhost:5000
- **Frontend URL:** http://localhost:5173
- **Server Log:** /home/sidney/Documents/SAMS/server.log

Check server status:
```bash
tail -f server.log
```

Restart server:
```bash
cd /home/sidney/Documents/SAMS
pkill -f "tsx.*server/index.ts"
nohup npx tsx server/index.ts > server.log 2>&1 &
```
