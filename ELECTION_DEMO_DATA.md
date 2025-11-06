# Demo Election Seed Data - Complete Guide

## Overview
Comprehensive demo election data has been added to showcase the full election management system capabilities.

## What's Been Seeded

### 👥 Users Created

#### Original Users
1. **John Kamau** (student@ueab.ac.ke)
   - Student Body President Candidate
   - University ID: UEAB123456

2. **Dr. Mary Wanjiru** (admin@ueab.ac.ke)
   - Admin/Electoral Commission
   - Reviews applications

3. **Prof. David Ochieng** (supervisor@ueab.ac.ke)
   - Supervisor

#### New Student Users (Candidates)
4. **Grace Akinyi** (grace.akinyi@ueab.ac.ke)
   - Student Body President Candidate
   - University ID: UEAB123457

5. **Peter Mwangi** (peter.mwangi@ueab.ac.ke)
   - Vice President Candidate
   - University ID: UEAB123458

6. **Faith Wambui** (faith.wambui@ueab.ac.ke)
   - Secretary General Candidate
   - University ID: UEAB123459

7. **James Omondi** (james.omondi@ueab.ac.ke)
   - Treasurer Applicant (Pending)
   - University ID: UEAB123460

8. **Sarah Njeri** (sarah.njeri@ueab.ac.ke)
   - Class Rep Applicant (Rejected)
   - University ID: UEAB123461

9. **Daniel Kipchoge** (daniel.kipchoge@ueab.ac.ke)
   - Class Representative Candidate
   - University ID: UEAB123462

**All passwords:** `password123`

### 📋 Election Positions (5 positions)

| Position | Slots | Category | Status |
|----------|-------|----------|--------|
| Student Body President | 1 | Executive | Active |
| Vice President | 1 | Executive | Active |
| Secretary General | 1 | Executive | Active |
| Treasurer | 1 | Executive | Active |
| Class Representative - Year 2 | 2 | Class Representative | Active |

#### Position Details

**1. Student Body President**
- **Responsibilities:** Preside over student council meetings, represent students in university committees, oversee student activities and budgets
- **Requirements:** Must be a continuing student with GPA above 3.0, no disciplinary record
- **Available Slots:** 1

**2. Vice President**
- **Responsibilities:** Support the president, chair committees, coordinate student events and welfare programs
- **Requirements:** Must be a continuing student with GPA above 2.8
- **Available Slots:** 1

**3. Secretary General**
- **Responsibilities:** Keep minutes of meetings, handle correspondence, maintain student government records
- **Requirements:** Must have strong organizational and communication skills
- **Available Slots:** 1

**4. Treasurer**
- **Responsibilities:** Oversee student funds, prepare financial reports, manage budget allocation
- **Requirements:** Must be a student in Business, Economics, or related field with GPA above 3.0
- **Available Slots:** 1

**5. Class Representative - Year 2**
- **Responsibilities:** Voice class concerns, coordinate class activities, liaise between students and administration
- **Requirements:** Must be a Year 2 student
- **Available Slots:** 2 (Multiple winners possible)

### 🗳️ Main Election

**UEAB Student Government Elections 2025**

- **Description:** Annual student government elections to select leaders who will represent and serve the UEAB student body for the academic year 2025/2026
- **Application Period:** Jan 15, 2025 - Jan 31, 2025
- **Voting Period:** Feb 10, 2025 - Feb 15, 2025
- **Status:** Active (Voting ongoing)
- **Results Status:** Not yet approved

### 📝 Candidate Applications (7 applications)

#### Approved Applications (5)

1. **John Kamau → Student Body President**
   - Status: ✅ Approved (Jan 25, 2025 by Admin)
   - Manifesto: Three-pillar approach - Enhanced Services, Student Wellness, Transparent Governance
   - Qualifications: Treasurer of Debate Club, Dean's List, Campus Beautification Leader
   - Vision: "A UEAB where every student voice matters"

2. **Grace Akinyi → Student Body President**
   - Status: ✅ Approved (Jan 26, 2025 by Admin)
   - Manifesto: Sustainability and cultural diversity focus
   - Qualifications: President of Environmental Club, 3 cultural events, GPA: 3.7
   - Vision: "Leading in sustainability while celebrating diversity"

3. **Peter Mwangi → Vice President**
   - Status: ✅ Approved (Jan 26, 2025 by Admin)
   - Manifesto: Student welfare and activities coordination
   - Qualifications: Basketball Captain, Career Week Coordinator, Student Mentor
   - Vision: "Pursue passion while building future skills"

4. **Faith Wambui → Secretary General**
   - Status: ✅ Approved (Jan 27, 2025 by Admin)
   - Manifesto: Efficient communication and digital records
   - Qualifications: Student Newsletter Editor, CS Club Secretary
   - Vision: "Transparent, organized, accessible communications"

5. **Daniel Kipchoge → Class Representative - Year 2**
   - Status: ✅ Approved (Jan 28, 2025 by Admin)
   - Manifesto: Organize study groups, advocate for materials, strengthen class bonds
   - Qualifications: Year 2 Engineering, Class coordinator, GPA: 3.2
   - Vision: "United Year 2 class supporting each other"

#### Pending Application (1)

6. **James Omondi → Treasurer**
   - Status: ⏳ Pending (Awaiting admin review)
   - Manifesto: Financial transparency and accountability
   - Qualifications: Business major, KCB intern, Finance Club member
   - Vision: "Students deserve to know how money is spent"
   - *Note: Perfect for testing admin approval workflow*

#### Rejected Application (1)

7. **Sarah Njeri → Class Representative - Year 2**
   - Status: ❌ Rejected (Jan 28, 2025 by Admin)
   - Manifesto: Basic representation promise
   - Rejection Reason: "Application does not meet minimum requirements. Please provide more detailed manifesto and qualifications."
   - *Note: Demonstrates rejection workflow with feedback*

### 👤 Approved Candidates (5)

The 5 approved applications have been converted to candidates:

| Candidate | Position | Votes | Status |
|-----------|----------|-------|--------|
| John Kamau | Student Body President | 1 | Approved |
| Grace Akinyi | Student Body President | 1 | Approved |
| Peter Mwangi | Vice President | 1 | Approved |
| Faith Wambui | Secretary General | 1 | Approved |
| Daniel Kipchoge | Class Rep - Year 2 | 0 | Approved |

*Note: Vice President and Secretary General each have only 1 candidate (uncontested)*

### 🗳️ Votes Cast (4 votes)

Demo votes from admin and supervisor:
1. Admin → John Kamau (President)
2. Supervisor → Grace Akinyi (President)
3. Admin → Peter Mwangi (VP)
4. Supervisor → Faith Wambui (Secretary)

## Testing Scenarios

### Scenario 1: Admin Reviews Pending Application
1. Login as admin@ueab.ac.ke
2. Navigate to Applications Review
3. Review James Omondi's treasurer application
4. Either approve (creates candidate) or reject with reason

### Scenario 2: Student Applies for Position
1. Create new student account or login as existing
2. View available positions
3. Apply for Treasurer or Class Rep
4. Submit with manifesto and qualifications

### Scenario 3: Student Votes
1. Login as any student
2. View active election
3. See candidates by position
4. Cast votes (one per position)
5. Receive confirmation

### Scenario 4: Admin Manages Election
1. Login as admin
2. View election dashboard
3. See live vote counts
4. Approve results
5. Publish winners

### Scenario 5: View Results
1. Admin approves results
2. Students can view:
   - Winners per position
   - Vote percentages
   - Full rankings

## Data Relationships

```
Election Positions (5)
    ↓
Applications (7)
    ├─ Approved (5) → Candidates (5)
    ├─ Pending (1) → [Awaiting Review]
    └─ Rejected (1) → [Application Denied]
        ↓
    Candidates (5) ← Votes (4)
        ↓
    [Results Pending Approval]
```

## Key Features Demonstrated

### ✅ Positions Management
- Multiple position types (Executive, Class Rep)
- Different slot numbers (1 winner vs 2 winners)
- Detailed requirements and responsibilities

### ✅ Application Workflow
- Complete applications with manifesto
- Pending review state
- Admin approval/rejection
- Rejection with feedback
- Photo URLs (placeholders)

### ✅ Candidate Management
- Auto-creation from approved applications
- Vote tracking
- Multiple candidates per position
- Uncontested positions (only 1 candidate)

### ✅ Voting System
- One vote per student per position
- Vote counting
- Anonymous ballots
- Multiple positions in one election

### ✅ Results Handling
- Live vote counts
- Pending approval status
- Winner determination (not yet triggered)

## Missing Position: Treasurer

**Strategic Gap for Testing:**
- Treasurer position has 1 slot
- Only 1 pending application (James Omondi)
- No approved candidates yet
- Perfect for demonstrating:
  - Application approval workflow
  - What happens with uncontested positions
  - Admin candidate management

## Database Tables Populated

```sql
✅ users: 9 users (3 staff, 6 students)
✅ election_positions: 5 positions
✅ elections: 1 active election
✅ candidate_applications: 7 applications (5 approved, 1 pending, 1 rejected)
✅ candidates: 5 approved candidates
✅ votes: 4 demo votes
```

## Next Steps for Full Implementation

1. **Generate Migration**
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit push
   ```

2. **Run Seed**
   ```bash
   pnpm db:seed
   ```

3. **Build Admin Interface**
   - Position management page
   - Application review interface
   - Results dashboard

4. **Build Student Interface**
   - Position browsing
   - Application form
   - Enhanced voting UI

5. **Add Photo Upload**
   - File upload functionality
   - Image storage
   - Thumbnail generation

## Login Credentials for Testing

```
Admin Account:
Email: admin@ueab.ac.ke
Password: password123
Role: Electoral Commission

Student Accounts (All use password123):
- student@ueab.ac.ke (John Kamau - President Candidate)
- grace.akinyi@ueab.ac.ke (Grace Akinyi - President Candidate)
- peter.mwangi@ueab.ac.ke (Peter Mwangi - VP Candidate)
- faith.wambui@ueab.ac.ke (Faith Wambui - Secretary Candidate)
- james.omondi@ueab.ac.ke (James Omondi - Pending Application)
- sarah.njeri@ueab.ac.ke (Sarah Njeri - Rejected Application)
- daniel.kipchoge@ueab.ac.ke (Daniel Kipchoge - Class Rep Candidate)
```

## Realistic Data Highlights

### ✨ Detailed Manifestos
Each candidate has a comprehensive manifesto with:
- Clear priorities and action items
- Specific initiatives
- Measurable goals
- Personal touch

### ✨ Realistic Qualifications
Candidates have relevant experience:
- Club leadership positions
- Academic achievements
- Relevant project experience
- Skills matching position requirements

### ✨ Diverse Positions
- Executive positions (leadership)
- Administrative positions (secretary, treasurer)
- Representative positions (class reps with multiple slots)

### ✨ Complete Workflow States
- Pending applications (needs review)
- Approved applications (became candidates)
- Rejected applications (with feedback)
- Active voting
- Results awaiting approval

## System Readiness

The seed data provides a **production-ready demonstration** of:
- ✅ Complete election lifecycle
- ✅ All user roles and workflows
- ✅ Edge cases (uncontested, pending, rejected)
- ✅ Realistic student government structure
- ✅ Kenyan university context

Perfect for showcasing the system to stakeholders! 🎯
