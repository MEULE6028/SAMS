# Work Study Page Data Display Fix

## Issues Fixed

### 1. Missing Data on Work Study Page
**Problem:** 
- Department showed "Assigned Department" instead of actual department (e.g., "Library")
- Position showed "Work Study Student" instead of actual position title (e.g., "Library Assistant")
- Hours Per Week showed "0 hours" instead of actual hours (e.g., "15 hours")
- Hourly Rate showed "ETB 0/hr" instead of actual rate (e.g., "KSh 150/hr")

**Root Cause:**
The `/api/student/work-status` endpoint was not properly joining with the `workPositions` table to fetch position details. It was returning:
- `application.position` (which was NULL or just an ID)
- `application.department` (which existed but wasn't being used properly)

**Solution:**
Updated the endpoint to use a LEFT JOIN to fetch complete position details:
```typescript
.select({
  id: workApplications.id,
  userId: workApplications.userId,
  positionId: workApplications.positionId,
  department: workApplications.department,
  status: workApplications.status,
  position: {
    id: workPositions.id,
    title: workPositions.title,
    department: workPositions.department,
    hoursPerWeek: workPositions.hoursPerWeek,
    payRate: workPositions.payRate,
  }
})
.from(workApplications)
.leftJoin(workPositions, eq(workApplications.positionId, workPositions.id))
```

Now returns:
- `position: application.position?.title` - Shows actual position title
- `department: application.department` - Shows actual department
- `hoursPerWeek: application.position?.hoursPerWeek` - Shows actual hours
- `hourlyRate: application.position?.payRate` - Shows actual rate

### 2. Wrong Currency (ETB → KSh)
**Problem:**
System was showing Ethiopian Birr (ETB) instead of Kenyan Shilling (KSh) throughout the work study module.

**Solution:**
Changed all currency references from ETB to KSh in:

1. **client/src/pages/student/work-study.tsx**
   - Total Earnings card: `ETB {totalEarnings}` → `KSh {totalEarnings}`
   - Hourly Rate display: `ETB {workStatus.hourlyRate}` → `KSh {workStatus.hourlyRate}`
   - Recent timecards: `ETB {card.earnings}` → `KSh {card.earnings}`

2. **client/src/pages/swsms/timecards.tsx**
   - Earnings column: `ETB {parseFloat(card.earnings)}` → `KSh {parseFloat(card.earnings)}`

3. **server/departmentRates.ts**
   - Comments updated to reflect KSh instead of ETB
   - Function documentation updated

## Files Modified

### Backend
1. **server/routes.ts** (Line ~622-680)
   - Updated `/api/student/work-status` endpoint
   - Added LEFT JOIN with workPositions table
   - Fixed position title, hours, and rate extraction

### Frontend
2. **client/src/pages/student/work-study.tsx**
   - Line ~225: Total Earnings card currency
   - Line ~265: Hourly Rate display
   - Line ~412: Recent timecards earnings

3. **client/src/pages/swsms/timecards.tsx**
   - Line ~503: Earnings column in timecards table

### Configuration
4. **server/departmentRates.ts**
   - Updated all comments and documentation to use KSh

## Expected Results

### Before Fix
```
Current Assignment:
- Department: Assigned Department
- Position: Work Study Student  
- Hours Per Week: 0 hours
- Hourly Rate: ETB 0/hr

Total Earnings: ETB 0.00
```

### After Fix (for student001)
```
Current Assignment:
- Department: Library
- Position: Library Assistant
- Hours Per Week: 15 hours
- Hourly Rate: KSh 150/hr

Total Earnings: KSh 0.00 (until timecards are verified)
```

## Testing
To verify the fix:
1. Log in as student001 (password: password123)
2. Navigate to Work Study page
3. Verify:
   - ✅ Department shows "Library"
   - ✅ Position shows "Library Assistant"
   - ✅ Hours Per Week shows "15 hours"
   - ✅ Hourly Rate shows "KSh 150/hr"
   - ✅ All currency displays show "KSh" not "ETB"

## Related Files
- Work application seed data: `server/seed.ts` (Lines ~508-524)
- Work position seed data: `server/seed.ts` (Lines ~455-465)
- Department rates: `server/departmentRates.ts`
- Schema: `shared/schema.ts`

## Notes
- The work study system now correctly fetches and displays all position details
- Currency standardized to KSh (Kenyan Shilling) throughout the system
- Student must have an approved work application for data to display
- Position details come from the workPositions table via the approved application
