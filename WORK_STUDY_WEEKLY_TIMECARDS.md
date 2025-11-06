# Weekly Timecard System - Complete Guide

## Overview
Transformed the timecard logging from single-day entries to a **weekly format** matching the physical timesheet structure.

## New Weekly Format

### Visual Table Layout
```
+----------------------------------------------------------+
| Day       | Hours | Task Description                     |
|-----------|-------|--------------------------------------|
| Saturday  | [0.0] | [                                  ] |
| Friday    | [4.0] | [Organized books                   ] |
| Thursday  | [5.0] | [Assisted students                 ] |
| Wednesday | [0.0] | [                                  ] |
| Tuesday   | [3.5] | [Shelved materials                 ] |
| Monday    | [4.0] | [Catalog updates                   ] |
| Sunday    | [0.0] | [                                  ] |
|-----------|-------|--------------------------------------|
| TOTAL     | 16.5  |                                      |
+----------------------------------------------------------+
```

## How It Works

### Student Workflow
1. **Click**: "Log Weekly Hours" button
2. **Select**: Work position from dropdown
3. **Choose**: Week starting date (defaults to current Saturday)
4. **Fill**: Hours and tasks for each working day
5. **Review**: Auto-calculated total hours
6. **Submit**: Creates individual timecards for each working day

### What Gets Created
For each day with hours > 0, a separate timecard is created:
- ✅ Individual date
- ✅ Specific hours for that day
- ✅ Task description for that day
- ✅ Separate QR code
- ✅ Independent verification status

### Example
**Input:**
```
Week: Jan 13-19, 2025
Friday: 4 hours - "Organized books"
Monday: 5 hours - "Assisted students"
Wednesday: 3 hours - "Shelved materials"
```

**Output:** 3 separate timecard records
```
Jan 13 (Fri): 4 hrs | Organized books      | Status: Pending
Jan 15 (Mon): 5 hrs | Assisted students    | Status: Pending
Jan 17 (Wed): 3 hrs | Shelved materials    | Status: Pending
```

## Key Features

### Auto-Calculation
- Real-time total hours display
- Updates as you enter each day's hours
- Shows in footer row

### Validation
- Must enter at least 1 day with hours > 0
- Maximum 12 hours per day
- 0.5 hour increments (0.5, 1.0, 1.5, etc.)

### Smart Defaults
- Week start: Current Saturday
- Hours: 0 for all days
- Task: "Work performed" if left empty

### Day Order
Matches standard work week format:
1. Saturday (week start)
2. Friday
3. Thursday
4. Wednesday
5. Tuesday
6. Monday
7. Sunday (week end)

## Benefits

### For Students ✅
- Fill entire week at once
- See weekly total instantly
- Familiar paper timesheet format
- Faster than daily entry

### For Supervisors ✅
- Verify each day individually
- Flexible approval process
- Detailed day-by-day tracking
- Can reject specific days

### For Analytics 📊
- Granular per-day data
- Weekly/monthly reports
- Pattern analysis
- Detailed audit trail

## Testing

### Test Case 1: Basic Entry
1. Open timecards page
2. Click "Log Weekly Hours"
3. Select position
4. Enter hours for 3 days
5. Submit
6. **Expected**: 3 timecards created, all showing "Pending"

### Test Case 2: Empty Form
1. Submit without entering hours
2. **Expected**: Error - "Please enter hours for at least one day"

### Test Case 3: Total Calculation
1. Enter: Fri=4, Mon=5, Wed=3.5
2. **Expected**: Total shows 12.5 hours

## Files Modified
- `client/src/pages/swsms/timecards.tsx` - Complete overhaul to weekly format

## Status
✅ **IMPLEMENTED AND READY**

The weekly timecard system is now live, providing a streamlined way to log work hours that matches the familiar paper timesheet format!
