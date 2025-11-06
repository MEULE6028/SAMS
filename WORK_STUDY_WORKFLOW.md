# Work Study Program - Enhanced Workflow System

## Overview

The Student Work Study Management System (SWSMS) now features a sophisticated, multi-stage approval workflow with automated eligibility checking, appeals process, and supervisor review.

---

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1: STUDENT SUBMISSION                                     │
│  Student submits work study application                          │
│  Status: pending → under_review                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 2: AUTOMATED ELIGIBILITY CHECK                            │
│  System automatically validates:                                 │
│  ✓ Work study flag in external API                              │
│  ✓ Fee balance ≤ ETB 50,000                                     │
│  ✓ Registered for current semester                              │
│  ✓ Credit hours ≥ 12                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
            ✓ PASSED              ✗ FAILED
                    │               │
                    ↓               ↓
    ┌───────────────────┐   ┌──────────────────┐
    │ STAGE 3A:         │   │ STAGE 3B:        │
    │ SUPERVISOR REVIEW │   │ AUTO-REJECTED    │
    │                   │   │ (can appeal)     │
    │ Status:           │   │ Status:          │
    │ supervisor_review │   │ auto_rejected    │
    └───────────────────┘   └──────────────────┘
            ↓                       ↓
            │               ┌───────────────┐
            │               │ STAGE 4:      │
            │               │ STUDENT       │
            │               │ APPEALS       │
            │               │ (optional)    │
            │               │ Status:       │
            │               │ appealed      │
            │               └───────────────┘
            │                       ↓
            │               ┌───────────────┐
            │               │ STAGE 5:      │
            │               │ ADMIN REVIEWS │
            │               │ APPEAL        │
            │               └───────────────┘
            │                   ↓       ↓
            │                   │       │
            │              APPROVED  REJECTED
            │                   │       │
            │                   ↓       ↓
            └───────────────────┘       │
                    ↓                   │
    ┌───────────────────────┐          │
    │ STAGE 6:              │          │
    │ SUPERVISOR DECISION   │          │
    │ (Final approval)      │          │
    └───────────────────────┘          │
            ↓       ↓                   │
            │       │                   │
       APPROVED  REJECTED               │
            │       │                   │
            ↓       ↓                   ↓
    ┌─────────────────────────────────────┐
    │ FINAL STATUS: approved OR rejected  │
    └─────────────────────────────────────┘
```

---

## 📋 Status Definitions

### `pending`
**Initial submission**
- Application just submitted
- Awaiting system processing
- Duration: < 1 minute

### `under_review`
**Automated checks in progress**
- System validating eligibility
- Checking external API data
- Running automated rules
- Duration: < 1 minute

### `auto_rejected`
**Failed automated checks**
- Did not meet one or more requirements
- Student can view detailed reasons
- **Can appeal within 30 days**
- Terminal status unless appealed

### `appealed`
**Student submitted appeal**
- Student provided justification
- Awaiting admin review
- Appeal reason must be ≥ 50 characters
- Duration: 3-5 business days

### `supervisor_review`
**Passed checks, awaiting approval**
- All automated checks passed OR appeal approved
- Department supervisor reviews application
- Checks: experience, availability, fit
- Duration: 5-7 business days

### `approved`
**Final approval - Active**
- Supervisor approved application
- Student can log work hours
- Can generate timecards
- Terminal success status

### `rejected`
**Final rejection**
- Supervisor or appeal reviewer rejected
- Cannot reapply same semester
- Can reapply next semester
- Terminal failure status

---

## 🔍 Automated Eligibility Checks

### Check 1: Work Study Flag
- **Source**: External Student API
- **Requirement**: `workStudy === true`
- **Purpose**: Verifies financial aid eligibility
- **Failure Message**: "Student is not eligible for work study. Please contact the Financial Aid office."

### Check 2: Fee Balance
- **Source**: External Student API (`balance` field)
- **Requirement**: Balance ≤ ETB 50,000
- **Purpose**: Ensures students with high arrears clear fees first
- **Failure Message**: "Outstanding fee balance (ETB X) exceeds maximum allowed (ETB 50,000). Please clear your arrears."

### Check 3: Semester Registration
- **Source**: External Student API (`currentSemester`, `enrollments`)
- **Requirement**: 
  - Registered for current semester (2025-2)
  - At least 1 course enrollment
- **Purpose**: Work study only for actively enrolled students
- **Failure Message**: "Not registered for current semester" OR "No course enrollments found"

### Check 4: Credit Hours
- **Source**: Application form + External API
- **Requirement**: ≥ 12 credit hours
- **Purpose**: Ensures students maintain full-time status
- **Failure Message**: "Insufficient credit hours (X). Minimum required: 12 hours"

**All checks must pass to proceed to supervisor review.**

---

## 🙋 Appeal Process

### Eligibility for Appeal
- Application status must be `auto_rejected`
- Can only appeal once per application
- Must appeal within 30 days of rejection
- Appeal reason must be ≥ 50 characters

### How to Appeal
**Endpoint**: `POST /api/swsms/applications/:id/appeal`

**Request Body**:
```json
{
  "appealReason": "I understand my fee balance is ETB 52,000, but I have already made arrangements with the Bursar's office to pay ETB 10,000 this week, which will bring my balance below the threshold. I have attached proof of my payment plan agreement."
}
```

### What Happens
1. Application status → `appealed`
2. `hasAppealed` flag set to `true`
3. `appealedAt` timestamp recorded
4. Notification sent to Financial Aid office
5. Admin reviews appeal within 3-5 business days

### Appeal Outcomes
- **Approved**: Status → `supervisor_review` (moves to next stage)
- **Rejected**: Status → `rejected` (permanent rejection)

---

## 👥 Role Permissions

### Student
- ✅ Submit application
- ✅ View own applications
- ✅ Appeal auto-rejection
- ✅ Log work hours (if approved)
- ❌ Review applications
- ❌ Verify timecards

### Financial Aid / Admin
- ✅ View all applications
- ✅ Review appeals (`appealed` status)
- ✅ Approve/reject appeals
- ✅ Override eligibility decisions
- ✅ View system reports

### Department Supervisor
- ✅ View applications for their department
- ✅ Review applications (`supervisor_review` status)
- ✅ Final approve/reject
- ✅ Verify timecards
- ✅ View department reports

### Treasurer
- ✅ View all applications
- ✅ Verify timecards
- ✅ Process payments
- ✅ Financial reports

---

## 🛠️ API Endpoints

### Student Endpoints

#### Submit Application
```http
POST /api/swsms/applications
Authorization: Bearer {token}

{
  "fullName": "Grace Akinyi",
  "gender": "female",
  "age": 22,
  "department": "IT Department",
  "position": "IT Support Assistant",
  "hoursPerWeek": 20,
  ...
}

Response: {
  "application": { ... },
  "eligibility": {
    "passed": true/false,
    "message": "...",
    "canAppeal": true/false,
    "checks": { ... }
  }
}
```

#### Submit Appeal
```http
POST /api/swsms/applications/:id/appeal
Authorization: Bearer {token}

{
  "appealReason": "Detailed explanation (min 50 characters)..."
}

Response: {
  "application": { ... },
  "message": "Appeal submitted successfully..."
}
```

#### Get My Applications
```http
GET /api/swsms/applications
Authorization: Bearer {token}

Response: {
  "applications": [ ... ]
}
```

### Admin Endpoints

#### Review Appeal
```http
PATCH /api/swsms/applications/:id/review-appeal
Authorization: Bearer {token}
Roles: admin, financial_aid

{
  "decision": "approved" | "rejected",
  "notes": "Reason for decision..."
}

Response: {
  "application": { ... },
  "message": "Appeal approved/rejected..."
}
```

#### Get Pending Appeals
```http
GET /api/swsms/admin/appeals
Authorization: Bearer {token}
Roles: admin, financial_aid

Response: {
  "appeals": [
    {
      ...application,
      "student": { ... }
    }
  ]
}
```

### Supervisor Endpoints

#### Get Applications for Review
```http
GET /api/swsms/supervisor/applications?department=IT%20Department
Authorization: Bearer {token}
Roles: admin, supervisor

Response: {
  "applications": [
    {
      ...application,
      "student": { ... }
    }
  ]
}
```

#### Supervisor Review
```http
PATCH /api/swsms/applications/:id/supervisor-review
Authorization: Bearer {token}
Roles: admin, supervisor

{
  "decision": "approved" | "rejected",
  "notes": "Excellent candidate with relevant skills..."
}

Response: {
  "application": { ... },
  "message": "Application approved/rejected..."
}
```

---

## 📊 Database Schema Changes

### New Fields in `work_applications`

```sql
-- Enhanced workflow status
status TEXT NOT NULL DEFAULT 'pending'
  -- Values: pending, under_review, auto_rejected, appealed, 
  --         supervisor_review, approved, rejected

-- Eligibility check results
eligibility_checked BOOLEAN NOT NULL DEFAULT false
eligibility_passed BOOLEAN
eligibility_details TEXT -- JSON with detailed results

-- Fee balance check
fee_balance_at_submission DECIMAL(10, 2)
fee_balance_eligible BOOLEAN

-- Registration check
is_registered_current_semester BOOLEAN
credit_hours_at_submission INTEGER
credit_hours_eligible BOOLEAN

-- Appeal information
has_appealed BOOLEAN NOT NULL DEFAULT false
appeal_reason TEXT
appealed_at TIMESTAMP
appeal_reviewed_by VARCHAR REFERENCES users(id)
appeal_review_notes TEXT

-- Supervisor review
supervisor_id VARCHAR REFERENCES users(id)
supervisor_reviewed_at TIMESTAMP
reviewed_by VARCHAR REFERENCES users(id)
review_notes TEXT

-- Timestamps
submitted_at TIMESTAMP
created_at TIMESTAMP NOT NULL DEFAULT NOW()
updated_at TIMESTAMP NOT NULL DEFAULT NOW()
```

---

## 🧪 Testing the Workflow

### Test Case 1: Successful Application (student004)

```bash
# Run seed script
cd server
npm run seed:student004
```

**Expected Result**:
- ✅ User created for student004
- ✅ Approved application in IT Department
- ✅ 6 timecards created (4 verified, 2 pending)
- ✅ Can view work hours and earnings on dashboard

### Test Case 2: Auto-Rejection Scenario

**Create test student with high fee balance**:
```typescript
// External API returns:
{
  "workStudy": true,
  "balance": 75000, // Exceeds 50,000 limit
  "currentSemester": "2025-2",
  "enrollments": [...]
}

// Application submitted
// Result: auto_rejected (fee balance check failed)
// Can appeal with justification
```

### Test Case 3: Appeal Flow

```bash
# 1. Submit application (gets auto-rejected)
POST /api/swsms/applications

# 2. Submit appeal
POST /api/swsms/applications/{id}/appeal
{
  "appealReason": "I have payment plan with Bursar..."
}

# 3. Admin reviews appeal
PATCH /api/swsms/applications/{id}/review-appeal
{
  "decision": "approved",
  "notes": "Payment plan verified. Approved."
}

# Result: Application moves to supervisor_review
```

---

## 📈 Benefits

### For Students
- ✅ Instant eligibility feedback
- ✅ Clear reasons for rejection
- ✅ Fair appeal process
- ✅ Transparent workflow
- ✅ Reduced waiting time

### For Administrators
- ✅ Automated eligibility checking
- ✅ Reduced manual review workload
- ✅ Consistent decision-making
- ✅ Audit trail for all decisions
- ✅ Data-driven insights

### For Supervisors
- ✅ Only review qualified candidates
- ✅ Focus on fit and experience
- ✅ Department-specific filtering
- ✅ Clear applicant history

---

## 🔐 Security & Compliance

- All checks logged with timestamps
- Audit trail for every decision
- Role-based access control
- Appeal window limits (30 days)
- One appeal per application
- External API integration for data accuracy

---

## 📝 Configuration

Update eligibility rules in `server/eligibility.ts`:

```typescript
const ELIGIBILITY_RULES = {
  MAX_FEE_BALANCE: 50000,    // Adjust maximum balance
  MIN_CREDIT_HOURS: 12,       // Adjust minimum hours
  CURRENT_SEMESTER: '2025-2', // Update each semester
};
```

---

## 🚀 Next Steps

1. Run migration: `npm run db:migrate`
2. Seed student004 data: `npm run seed:student004`
3. Test application submission
4. Test appeal workflow
5. Test supervisor review
6. Create admin dashboard views

---

## 📞 Support

For questions about the work study workflow:
- **Technical Issues**: IT Support (itsupport@ueab.ac.ke)
- **Eligibility Questions**: Financial Aid (finaid@ueab.ac.ke)
- **Application Status**: Student Affairs (studentaffairs@ueab.ac.ke)
