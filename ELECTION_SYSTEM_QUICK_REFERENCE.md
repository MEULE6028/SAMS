# Election System Quick Reference

## Voting Restrictions Summary

### Gender-Based Positions
- **CS Gender Representative** → Female students only
- **Senator - On-Campus Men Dorms** → Male on-campus students
- **Senator - On-Campus Ladies Dorms** → Female on-campus students
- **Senator - Off-Campus Men** → Male off-campus students
- **Senator - Off-Campus Ladies** → Female off-campus students

### School-Based Positions
- **Senator - School of Business** → Business students only
- **Senator - School of Science and Technology** → Science/Tech students only
- **Senator - School of Arts and Humanities** → Arts students only
- **Senator - School of Education** → Education students only

### Open Positions
- **CS Finance Representative** → All students

## Key Features

✅ **Automatic Eligibility Filtering**
- Students only see positions they can vote for
- Ineligible positions are hidden completely

✅ **Visual Voting Indicators**
- Green checkmark on position title after voting
- Green card background for voted positions
- "Voted" badge displayed prominently
- Green avatar with checkmark for your candidate

✅ **Position-Level Voting**
- Vote for one candidate per position
- Can vote for multiple different positions
- Each position tracks votes independently

✅ **Server-Side Validation**
- All restrictions enforced at API level
- Cannot bypass restrictions via frontend
- Clear error messages if ineligible

## How It Works

1. **Student Views Elections Page**
   - System fetches student profile (gender, residence, school)
   - Filters candidates to show only eligible positions

2. **Student Clicks Vote Button**
   - Frontend sends vote request to server
   - Server validates eligibility again
   - If eligible: Vote recorded with position_id
   - If ineligible: Error returned with reason

3. **After Voting**
   - Position card turns green
   - Checkmark appears on position title
   - Your candidate shows green avatar with check
   - "Voted" badge displayed
   - Can still vote for other eligible positions

## Example Student Scenarios

### Scenario 1: Female On-Campus CS Student
**Can Vote For:**
- ✅ CS Gender Representative (female + CS)
- ✅ CS Finance Representative (all students)
- ✅ Senator - On-Campus Ladies Dorms (female + oncampus)
- ✅ Senator - School of Science and Technology (their school)

**Cannot Vote For (Hidden):**
- ❌ Senator - On-Campus Men Dorms (male only)
- ❌ Senator - Off-Campus positions (offcampus only)
- ❌ Senators for other schools

### Scenario 2: Male Off-Campus Business Student
**Can Vote For:**
- ✅ CS Finance Representative (all students)
- ✅ Senator - Off-Campus Men (male + offcampus)
- ✅ Senator - School of Business (their school)

**Cannot Vote For (Hidden):**
- ❌ CS Gender Representative (female only)
- ❌ Senator - On-Campus positions (oncampus only)
- ❌ Senator - Off-Campus Ladies (female only)
- ❌ Senators for other schools

## Adding New Restricted Positions

Simple SQL insert:

```sql
INSERT INTO election_positions 
(title, description, responsibilities, requirements, slots_available, 
 category, gender_restriction, residence_restriction, school_restriction)
VALUES 
('New Position Title',
 'Description of the position',
 'List of responsibilities',
 'Requirements for candidates',
 1,
 'Senate',
 'female',              -- 'male', 'female', or 'all'
 'oncampus',           -- 'oncampus', 'offcampus', or 'all'
 'School of Business'  -- School name or NULL for all
);
```

No code changes needed - restrictions automatically enforced!

## Troubleshooting

### Student can't see any positions
- Check their profile data from external API
- Verify gender, residence, and school fields populated
- Ensure at least one position matches their profile

### Vote rejected with "not eligible" error
- Position has restrictions that don't match student profile
- Check position's gender_restriction, residence_restriction, school_restriction
- Verify student data from external API is correct

### Checkmark not appearing after voting
- Refresh the page
- Check votedPositionIds in API response
- Verify position_id was saved in votes table

## Files Modified

**Backend:**
- `server/electionEligibility.ts` - Eligibility validation
- `server/routes.ts` - Enhanced voting & candidate endpoints

**Frontend:**
- `client/src/pages/student/elections.tsx` - Visual indicators

**Database:**
- Added columns to `election_positions` and `votes` tables

**Documentation:**
- `ELECTION_VOTING_RESTRICTIONS.md` - Complete documentation
- `ELECTION_SYSTEM_QUICK_REFERENCE.md` - This file
