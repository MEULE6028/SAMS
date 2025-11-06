# Weekly Timecard - 3 Slots Per Day Update ✅

## Summary
Updated the weekly timecard system to include 3 time slots per day with automatic hour calculation from time in/out, starting weeks on Sunday, and better date formatting.

## Key Changes

### 1. **Three Slots Per Day**
- Each day now has 3 separate time slots
- Each slot has: Time In, Time Out, Hours (auto-calculated), Task Description
- Days are merged in the display (using rowSpan) for cleaner look

### 2. **Week Starts on Sunday**
- Changed from Saturday-based week to Sunday-based week
- Week calculation updated: `dayOfWeek = today.getDay()` (0 = Sunday)
- Days displayed in order: Sunday → Monday → Tuesday → Wednesday → Thursday → Friday → Saturday

### 3. **Week Period Display**
- Shows formatted date range: "November 2, 2025 - November 8, 2025"
- Auto-calculates week end date (start date + 6 days)
- Uses `date-fns` formatting for clean, readable dates

### 4. **Automatic Hour Calculation**
- Time In + Time Out → Hours calculated automatically
- Formula: `(timeOut - timeIn) / 60 minutes`
- Handles overnight shifts (adds 24 hours if negative)
- Rounds to 1 decimal place (e.g., 4.5 hours)
- Updates in real-time as you type

### 5. **Enhanced UI**
- Larger dialog (max-w-6xl) to accommodate more columns
- Compact table design with smaller text
- Color-coded hours display (UEAB blue)
- Slot numbers (1, 2, 3) for each day
- Total hours calculated across all slots

## Schema Structure

```typescript
const timeSlotSchema = z.object({
  timeIn: z.string(),
  timeOut: z.string(),
  task: z.string(),
  hours: z.number().min(0).max(24),
});

const weeklyTimecardSchema = z.object({
  applicationId: z.string().min(1),
  weekStartDate: z.string(),
  days: z.object({
    sunday: z.object({ slots: z.array(timeSlotSchema).length(3) }),
    monday: z.object({ slots: z.array(timeSlotSchema).length(3) }),
    tuesday: z.object({ slots: z.array(timeSlotSchema).length(3) }),
    wednesday: z.object({ slots: z.array(timeSlotSchema).length(3) }),
    thursday: z.object({ slots: z.array(timeSlotSchema).length(3) }),
    friday: z.object({ slots: z.array(timeSlotSchema).length(3) }),
    saturday: z.object({ slots: z.array(timeSlotSchema).length(3) }),
  }),
});
```

## Table Layout

```
┌──────────┬──────┬──────────┬───────────┬───────┬─────────────────┐
│   Day    │ Slot │ Time In  │ Time Out  │ Hours │ Task Description│
├──────────┼──────┼──────────┼───────────┼───────┼─────────────────┤
│          │  1   │ 08:00    │ 12:00     │ 4.0   │ Morning shift   │
│ Sunday   │  2   │ 13:00    │ 17:00     │ 4.0   │ Afternoon shift │
│          │  3   │ 18:00    │ 20:00     │ 2.0   │ Evening shift   │
├──────────┼──────┼──────────┼───────────┼───────┼─────────────────┤
│          │  1   │          │           │ 0.0   │                 │
│ Monday   │  2   │          │           │ 0.0   │                 │
│          │  3   │          │           │ 0.0   │                 │
└──────────┴──────┴──────────┴───────────┴───────┴─────────────────┘
```

## Hour Calculation Logic

```typescript
const calculateHours = (timeIn: string, timeOut: string): number => {
  if (!timeIn || !timeOut) return 0;
  
  // Parse times
  const [inHour, inMin] = timeIn.split(':').map(Number);
  const [outHour, outMin] = timeOut.split(':').map(Number);
  
  // Convert to minutes
  const inMinutes = inHour * 60 + inMin;
  const outMinutes = outHour * 60 + outMin;
  
  // Calculate difference
  let diff = outMinutes - inMinutes;
  if (diff < 0) diff += 24 * 60; // Handle overnight shifts
  
  // Convert to hours and round
  return Math.round((diff / 60) * 10) / 10;
};
```

## Submission Logic

When the form is submitted:
1. Iterates through all 7 days
2. For each day, checks all 3 slots
3. If a slot has hours > 0 and both time in/out:
   - Creates individual timecard entry
   - Calculates correct date (weekStart + dayIndex)
   - Submits with hours and task description
4. All submissions done via Promise.all() for efficiency

## Example Use Case

**Student works:**
- Sunday Slot 1: 9:00 AM - 1:00 PM (4 hours) - "Library desk"
- Sunday Slot 2: 2:00 PM - 5:00 PM (3 hours) - "Shelving books"
- Wednesday Slot 1: 10:00 AM - 2:00 PM (4 hours) - "Student assistance"

**Result:** 3 separate timecard entries created
- Entry 1: Nov 2, 2025 | 4.0 hrs | "Library desk"
- Entry 2: Nov 2, 2025 | 3.0 hrs | "Shelving books"  
- Entry 3: Nov 5, 2025 | 4.0 hrs | "Student assistance"

**Total Hours:** 11.0 hours displayed in footer

## Features

### ✅ Implemented
- 3 time slots per day (21 total slots per week)
- Automatic hour calculation from time in/out
- Week starts on Sunday (instead of Saturday)
- Week period display with formatted dates (e.g., "November 2, 2025 - November 8, 2025")
- Real-time total hours calculation
- Clean, compact table layout
- Overnight shift handling
- Back button to work study page

### 🎯 Benefits
- More accurate time tracking
- Multiple shifts per day support
- Automatic calculation reduces errors
- Professional timesheet format
- Matches physical timesheet standards

## Testing

1. **Navigate to timecards**: Click "Go to Timecards" on work study page
2. **Click "Log Weekly Hours"**: Opens the weekly dialog
3. **Select position**: Choose your work position
4. **Choose week**: Week start date (defaults to current Sunday)
5. **Enter times**: 
   - Fill Time In: e.g., "09:00"
   - Fill Time Out: e.g., "13:00"
   - Watch Hours auto-calculate: "4.0"
6. **Add task**: "Library assistance"
7. **Fill multiple slots**: Add more shifts on same or different days
8. **Check total**: Footer shows total hours across all slots
9. **Submit**: Creates individual timecards for each filled slot

## Files Modified

1. **client/src/pages/swsms/timecards.tsx**
   - Updated schema with 3 slots per day
   - Changed week start to Sunday
   - Added automatic hour calculation
   - Added week period display with date formatting
   - Redesigned table with time in/out columns
   - Updated submission logic for slots

## Status
✅ **FULLY IMPLEMENTED AND TESTED**

All features working:
- 3 slots per day ✅
- Starts on Sunday ✅
- Week period with formatted dates ✅
- Time in/out with auto-calculation ✅
- Real-time hour display ✅
- Total hours calculation ✅
- Individual timecard creation per slot ✅
