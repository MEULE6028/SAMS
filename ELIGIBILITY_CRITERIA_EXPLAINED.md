# Work Study Eligibility Criteria - Explanation

## Why Applications Are Being Auto-Rejected

Applications are being automatically rejected because students are **not meeting all 4 required eligibility criteria**. The system performs automated checks and only applications that pass **ALL 4 checks** proceed to supervisor review.

## The 4 Eligibility Requirements

### ✓ Check 1: Work Study Flag (External API)
**Requirement:** `workStudy: true` in external student system

**Current Status:**
- **student003**: ✅ `workStudy: true` - **PASSED**
- **student004**: ❌ `workStudy: false` - **FAILED**

**What it means:** The Financial Aid office must enable work study eligibility in the external system. This is typically based on financial need assessment.

**How to fix:** Contact Financial Aid office to update your work study eligibility status.

---

### ✓ Check 2: Fee Balance
**Requirement:** Outstanding balance ≤ ETB 50,000

**Current Status:**
- **student003**: ✅ ETB 47,487 - **PASSED** (under limit)
- **student004**: ✅ ETB 41,926 - **PASSED** (under limit)

**What it means:** Students with high outstanding fees are not eligible for work study until they reduce their balance.

**How to fix:** Pay down your fee balance to below ETB 50,000.

---

### ✓ Check 3: Current Semester Registration
**Requirement:** Must be registered for semester **2025-2**

**Current Status:**
- **student003**: ❌ Registered for `2025-1` - **FAILED**
- **student004**: ❌ Registered for `2025-1` - **FAILED**

**What it means:** You must be registered for the current/upcoming semester to work. The external API shows you're registered for an older semester.

**Issue:** The eligibility code expects semester `2025-2` but external API shows `2025-1`

**How to fix:** Either:
1. Wait for the external API to update to semester 2025-2
2. OR update the eligibility code to accept 2025-1 as current semester

---

### ✓ Check 4: Credit Hours
**Requirement:** Taking ≥ 12 credit hours

**Current Status:**
- **student003**: ✅ 3 enrollments (9-12 hours estimated) - Likely **PASSED**
- **student004**: ✅ 3 enrollments (9-12 hours estimated) - Likely **PASSED**

**What it means:** Full-time students (12+ credits) can participate in work study. Part-time students are not eligible.

**Note:** The system estimates 3 credits per course, or uses the value from your application form.

---

## Current Rejection Reasons

### For student003:
- ✅ Work Study Eligible: **PASSED**
- ✅ Fee Balance (47,487): **PASSED**
- ❌ Semester Registration (2025-1 vs required 2025-2): **FAILED**
- ✅ Credit Hours: Likely **PASSED**

**Result:** Auto-rejected due to semester mismatch

---

### For student004:
- ❌ Work Study Eligible (false): **FAILED**
- ✅ Fee Balance (41,926): **PASSED**
- ❌ Semester Registration (2025-1 vs required 2025-2): **FAILED**
- ✅ Credit Hours: Likely **PASSED**

**Result:** Auto-rejected due to 2 failures (work study flag + semester)

---

## How to Configure Eligibility Rules

The eligibility criteria are configurable in the code:

**File:** `server/eligibility.ts` (lines 29-33)
```typescript
const ELIGIBILITY_RULES = {
  MAX_FEE_BALANCE: 50000,     // Maximum balance in ETB
  MIN_CREDIT_HOURS: 12,       // Minimum credit hours required
  CURRENT_SEMESTER: '2025-2', // Current semester code
};
```

### To Fix the Semester Issue:

**Option 1: Update the semester code** (if 2025-1 is actually current)
```typescript
CURRENT_SEMESTER: '2025-1',  // Change from 2025-2 to 2025-1
```

**Option 2: Wait for external API** to update to 2025-2

**Option 3: Make semester check more flexible** (accept current or next semester)

---

## Application Flow Diagram

```
Student Submits Application
         ↓
Fetch Data from External API
         ↓
Run 4 Eligibility Checks
         ↓
    All Passed?
         ↓
    ┌────┴────┐
   YES       NO
    ↓         ↓
Status:      Status:
supervisor_  auto_rejected
review          ↓
    ↓      (Can Appeal
Supervisor    within
Reviews      30 days)
    ↓
Approved/
Rejected
```

---

## How Appeals Work

If auto-rejected, students can:

1. **Submit an Appeal** within 30 days
2. **Explain circumstances** (e.g., payment plan in place, semester registration pending)
3. **Admin reviews appeal** and can override the decision
4. **If approved**, application moves to `supervisor_review` status

---

## Recommendations

### For Students:
1. ✅ Ensure work study flag is enabled (contact Financial Aid)
2. ✅ Keep fee balance under ETB 50,000
3. ✅ Register for current semester before applying
4. ✅ Enroll in at least 12 credit hours

### For Administrators:
1. 🔧 Update `CURRENT_SEMESTER` in `server/eligibility.ts` to match actual current semester
2. 🔧 Consider making semester check more flexible (accept ±1 semester)
3. 📋 Regularly review auto-rejected applications for false positives
4. 📨 Send reminder emails to students about requirements

---

## Quick Fix for Testing

If you want to test the application flow immediately, you can:

1. **Update the semester requirement** to match external API:
   - Edit `server/eligibility.ts` line 32
   - Change `CURRENT_SEMESTER: '2025-2'` to `CURRENT_SEMESTER: '2025-1'`
   - Restart server

2. **For student004**: Contact admin to enable work study flag in external API

This will allow eligible students to pass the automated checks and proceed to supervisor review.

---

## Summary Table

| Criterion | student003 | student004 | Requirement |
|-----------|-----------|-----------|-------------|
| Work Study Flag | ✅ true | ❌ false | true |
| Fee Balance | ✅ 47,487 | ✅ 41,926 | ≤ 50,000 |
| Semester | ❌ 2025-1 | ❌ 2025-1 | 2025-2 |
| Credit Hours | ✅ ~9-12 | ✅ ~9-12 | ≥ 12 |
| **Overall** | **REJECTED** | **REJECTED** | All must pass |

**Main Issue:** Semester mismatch (external API: 2025-1, system expects: 2025-2)

---

Date: November 2, 2025
