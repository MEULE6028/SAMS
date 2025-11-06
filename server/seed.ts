import { db } from "./db";
import {
  users,
  accounts,
  transactions,
  workApplications,
  timecards,
  electionPositions,
  elections,
  candidateApplications,
  candidates,
  votes,
  handovers,
} from "@shared/schema";
import { hashPassword } from "./auth";
import { formatAcademicSemester } from "./workStudyUtils";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    const hashedPassword = await hashPassword("password123");

    const [student] = await db
      .insert(users)
      .values({
        email: "student@ueab.ac.ke",
        password: hashedPassword,
        fullName: "John Kamau",
        universityId: "UEAB123456",
        role: "student",
      })
      .returning();

    const [admin] = await db
      .insert(users)
      .values({
        email: "admin@ueab.ac.ke",
        password: hashedPassword,
        fullName: "Dr. Mary Wanjiru",
        universityId: "UEAB100001",
        role: "admin",
      })
      .returning();

    const [supervisor] = await db
      .insert(users)
      .values({
        email: "supervisor@ueab.ac.ke",
        password: hashedPassword,
        fullName: "Prof. David Ochieng",
        universityId: "UEAB100002",
        role: "supervisor",
      })
      .returning();

    // Additional students for election candidates
    const [student2] = await db
      .insert(users)
      .values({
        email: "grace.akinyi@ueab.ac.ke",
        password: hashedPassword,
        fullName: "Grace Akinyi",
        universityId: "UEAB123457",
        role: "student",
      })
      .returning();

    const [student3] = await db
      .insert(users)
      .values({
        email: "peter.mwangi@ueab.ac.ke",
        password: hashedPassword,
        fullName: "Peter Mwangi",
        universityId: "UEAB123458",
        role: "student",
      })
      .returning();

    const [student4] = await db
      .insert(users)
      .values({
        email: "faith.wambui@ueab.ac.ke",
        password: hashedPassword,
        fullName: "Faith Wambui",
        universityId: "UEAB123459",
        role: "student",
      })
      .returning();

    const [student5] = await db
      .insert(users)
      .values({
        email: "james.omondi@ueab.ac.ke",
        password: hashedPassword,
        fullName: "James Omondi",
        universityId: "UEAB123460",
        role: "student",
      })
      .returning();

    const [student6] = await db
      .insert(users)
      .values({
        email: "sarah.njeri@ueab.ac.ke",
        password: hashedPassword,
        fullName: "Sarah Njeri",
        universityId: "UEAB123461",
        role: "student",
      })
      .returning();

    const [student7] = await db
      .insert(users)
      .values({
        email: "daniel.kipchoge@ueab.ac.ke",
        password: hashedPassword,
        fullName: "Daniel Kipchoge",
        universityId: "UEAB123462",
        role: "student",
      })
      .returning();

    // Add student001 - matches external API studentId "student001"
    const [student001] = await db
      .insert(users)
      .values({
        email: "student001@ueab.ac.ke",
        password: hashedPassword,
        fullName: "Aisha Ouma",
        universityId: "UEAB123463",
        studentId: "student001", // Matches external API
        role: "student",
      })
      .returning();

    console.log("✅ Users created");

    const [studentAccount] = await db
      .insert(accounts)
      .values({
        userId: student.id,
        accountNumber: "UEAB45678901",
        balance: "28500.00",
      })
      .returning();

    const [adminAccount] = await db
      .insert(accounts)
      .values({
        userId: admin.id,
        accountNumber: "UEAB45678902",
        balance: "50000.00",
      })
      .returning();

    const [student001Account] = await db
      .insert(accounts)
      .values({
        userId: student001.id,
        accountNumber: "UEAB45678903",
        balance: "15250.00",
      })
      .returning();

    console.log("✅ Accounts created");

    await db.insert(transactions).values([
      {
        accountId: studentAccount.id,
        amount: "30000.00",
        type: "credit",
        category: "Scholarship",
        description: "Academic Excellence Scholarship Q1",
        status: "completed",
      },
      {
        accountId: studentAccount.id,
        amount: "1500.00",
        type: "debit",
        category: "Books",
        description: "Textbook Purchase - Engineering 301",
        status: "completed",
      },
      {
        accountId: studentAccount.id,
        amount: "5000.00",
        type: "credit",
        category: "Work Study",
        description: "Library Assistant Pay - January",
        status: "completed",
      },
      {
        accountId: studentAccount.id,
        amount: "3500.00",
        type: "debit",
        category: "Cafeteria",
        description: "Meal Plan - Monthly",
        status: "completed",
      },
      {
        accountId: studentAccount.id,
        amount: "2500.00",
        type: "credit",
        category: "Refund",
        description: "Lab Fee Adjustment",
        status: "completed",
      },
    ]);

    console.log("✅ Transactions created");

    const [approvedApp] = await db
      .insert(workApplications)
      .values({
        academicSemester: formatAcademicSemester(new Date()),
        userId: student.id,
        fullName: "John Doe",
        gender: "male",
        age: 21,
        maritalStatus: "single",
        major: "Computer Science",
        academicClassification: "Junior",
        mobileContact: "+254712345678",
        isSponsored: true,
        sponsorName: "XYZ Foundation",
        workExperiences: "Worked as IT assistant at local school for 2 years",
        hasWorkedOnCampusBefore: false,
        firstRegistrationYear: "2023",
        firstRegistrationSemester: "Fall",
        accountNumber: "UEAB-001-2023",
        latestAccountBalance: "5000.00",
        accountStatementAttached: true,
        department: "Library",
        position: "Library Assistant",
        hoursPerWeek: 15,
        isRegisteringFirstSemester: false,
        registeredUnitsHours: 15,
        reason: "I have a passion for organizing information and helping fellow students find resources.",
        rulesAcknowledged: true,
        status: "approved",
        reviewedBy: supervisor.id,
        reviewNotes: "Excellent application. Student has shown responsibility and good communication skills.",
      })
      .returning();

    // Add approved work application for student001 (Library Assistant)
    const [student001App] = await db
      .insert(workApplications)
      .values({
        academicSemester: formatAcademicSemester(new Date("2025-01-10")),
        applicationId: "WS-2025-001",
        userId: student001.id,
        fullName: "Aisha Ouma",
        gender: "female",
        age: 20,
        maritalStatus: "single",
        major: "Information Science",
        academicClassification: "Sophomore",
        mobileContact: "+254722334455",
        isSponsored: false,
        workExperiences: "Volunteer librarian at community center",
        hasWorkedOnCampusBefore: false,
        firstRegistrationYear: "2024",
        firstRegistrationSemester: "Fall",
        accountNumber: "UEAB-001-2024",
        latestAccountBalance: "12000.00",
        accountStatementAttached: true,
        department: "Library",
        position: "Library Assistant",
        hoursPerWeek: 15,
        isRegisteringFirstSemester: false,
        registeredUnitsHours: 18,
        reason: "I am passionate about helping students access learning resources and have experience in library organization.",
        rulesAcknowledged: true,
        acknowledgedAt: new Date("2025-01-10"),
        signatureData: "signature_base64_data",
        signedAt: new Date("2025-01-10"),
        status: "approved",
        eligibilityChecked: true,
        eligibilityPassed: true,
        feeBalanceAtSubmission: "12000.00",
        feeBalanceEligible: true,
        isRegisteredCurrentSemester: true,
        creditHoursAtSubmission: 18,
        creditHoursEligible: true,
        reviewedBy: supervisor.id,
        supervisorId: supervisor.id,
        supervisorReviewedAt: new Date("2025-01-12"),
        reviewNotes: "Approved. Student meets all requirements and demonstrates strong commitment to the role.",
      })
      .returning();

    await db.insert(workApplications).values([
      {
        academicSemester: formatAcademicSemester(new Date()),
        userId: student.id,
        fullName: "John Doe",
        gender: "male",
        age: 21,
        maritalStatus: "single",
        major: "Computer Science",
        academicClassification: "Junior",
        mobileContact: "+254712345678",
        isSponsored: false,
        hasWorkedOnCampusBefore: false,
        accountNumber: "UEAB-001-2023",
        latestAccountBalance: "5000.00",
        accountStatementAttached: true,
        department: "IT Services",
        position: "Help Desk Technician",
        hoursPerWeek: 10,
        isRegisteringFirstSemester: false,
        registeredUnitsHours: 15,
        reason: "I have experience with troubleshooting computer issues and providing technical support.",
        rulesAcknowledged: true,
        status: "pending",
      },
    ]);

    console.log("✅ Work applications created");

    await db.insert(timecards).values([
      {
        applicationId: approvedApp.id,
        userId: student.id,
        date: new Date("2025-01-15"),
        hoursWorked: "8.00",
        taskDescription:
          "Organized returned books, assisted 15 students with research queries, updated library catalog system",
        qrCode: "QR-1705334400-abc123",
        status: "verified",
        verifiedBy: supervisor.id,
        department: "Library",
        hourlyRate: "150.00",
        earnings: "1200.00",
      },
      {
        applicationId: approvedApp.id,
        userId: student.id,
        date: new Date("2025-01-22"),
        hoursWorked: "7.50",
        taskDescription:
          "Shelved new acquisitions, helped students with printing services, maintained reading room cleanliness",
        qrCode: "QR-1705939200-def456",
        status: "verified",
        verifiedBy: supervisor.id,
        department: "Library",
        hourlyRate: "150.00",
        earnings: "1125.00",
      },
      {
        applicationId: approvedApp.id,
        userId: student.id,
        date: new Date(),
        hoursWorked: "6.00",
        taskDescription:
          "Assisted with book inventory, updated digital catalog, provided reference desk support",
        qrCode: "QR-1706544000-ghi789",
        status: "pending",
        department: "Library",
        hourlyRate: "150.00",
      },
      // Timecards for student001
      {
        applicationId: student001App.id,
        userId: student001.id,
        date: new Date("2025-01-20"),
        hoursWorked: "8.00",
        taskDescription:
          "Assisted students with research, organized reference materials, maintained library database",
        qrCode: "QR-1705766400-student001-1",
        status: "verified",
        verifiedBy: supervisor.id,
        department: "Library",
        hourlyRate: "150.00",
        earnings: "1200.00",
      },
      {
        applicationId: student001App.id,
        userId: student001.id,
        date: new Date("2025-01-27"),
        hoursWorked: "7.00",
        taskDescription:
          "Helped with book checkouts, shelved returned materials, assisted with library orientation",
        qrCode: "QR-1706371200-student001-2",
        status: "verified",
        verifiedBy: supervisor.id,
        department: "Library",
        hourlyRate: "150.00",
        earnings: "1050.00",
      },
      {
        applicationId: student001App.id,
        userId: student001.id,
        date: new Date("2025-02-03"),
        hoursWorked: "6.50",
        taskDescription:
          "Maintained study areas, assisted with digital resources, processed new book acquisitions",
        qrCode: "QR-1706976000-student001-3",
        status: "pending",
        department: "Library",
        hourlyRate: "150.00",
      },
    ]);

    console.log("✅ Timecards created");

    // ========== ELECTION SYSTEM SEED DATA ==========

    // Create Election Positions
    const [presidentPosition] = await db
      .insert(electionPositions)
      .values({
        title: "Student Body President",
        description: "Lead the student government and represent all UEAB students",
        responsibilities: "Preside over student council meetings, represent students in university committees, oversee student activities and budgets",
        requirements: "Must be a continuing student with GPA above 3.0, no disciplinary record",
        slotsAvailable: 1,
        category: "Executive",
        isActive: true,
      })
      .returning();

    const [vicePresidentPosition] = await db
      .insert(electionPositions)
      .values({
        title: "Vice President",
        description: "Assist the president and lead specific student initiatives",
        responsibilities: "Support the president, chair committees, coordinate student events and welfare programs",
        requirements: "Must be a continuing student with GPA above 2.8",
        slotsAvailable: 1,
        category: "Executive",
        isActive: true,
      })
      .returning();

    const [secretaryPosition] = await db
      .insert(electionPositions)
      .values({
        title: "Secretary General",
        description: "Manage student government records and communications",
        responsibilities: "Keep minutes of meetings, handle correspondence, maintain student government records",
        requirements: "Must have strong organizational and communication skills",
        slotsAvailable: 1,
        category: "Executive",
        isActive: true,
      })
      .returning();

    const [treasurerPosition] = await db
      .insert(electionPositions)
      .values({
        title: "Treasurer",
        description: "Manage student government finances and budget",
        responsibilities: "Oversee student funds, prepare financial reports, manage budget allocation",
        requirements: "Must be a student in Business, Economics, or related field with GPA above 3.0",
        slotsAvailable: 1,
        category: "Executive",
        isActive: true,
      })
      .returning();

    const [classRepPosition] = await db
      .insert(electionPositions)
      .values({
        title: "Class Representative - Year 2",
        description: "Represent Year 2 students in the student council",
        responsibilities: "Voice class concerns, coordinate class activities, liaise between students and administration",
        requirements: "Must be a Year 2 student",
        slotsAvailable: 2,
        category: "Class Representative",
        isActive: true,
      })
      .returning();

    console.log("✅ Election positions created");

    // Create Main Election
    const [election] = await db
      .insert(elections)
      .values({
        title: "UEAB Student Government Elections 2025",
        description:
          "Annual student government elections to select leaders who will represent and serve the UEAB student body for the academic year 2025/2026.",
        applicationStartDate: new Date("2025-01-15"),
        applicationEndDate: new Date("2025-01-31"),
        votingStartDate: new Date("2025-02-10"),
        votingEndDate: new Date("2025-02-15"),
        startDate: new Date("2025-02-10"), // Legacy field
        endDate: new Date("2025-02-15"), // Legacy field
        status: "active",
        resultsApproved: false,
      })
      .returning();

    console.log("✅ Election created");

    // Create Candidate Applications
    // President Applications
    const [app1] = await db
      .insert(candidateApplications)
      .values({
        electionId: election.id,
        positionId: presidentPosition.id,
        studentId: student.id,
        manifesto:
          "I pledge to bridge the gap between students and administration. My three-pillar approach focuses on: 1) Enhanced Student Services - extended library hours, better cafeteria options, and improved Wi-Fi connectivity. 2) Student Wellness - expanded mental health resources and peer support programs. 3) Transparent Governance - regular town halls and accessible student leadership.",
        qualifications:
          "Current Treasurer of Debate Club, Dean's List student, Led successful Campus Beautification project",
        visionStatement:
          "A UEAB where every student voice matters and every concern receives action. Together, we'll build a more inclusive, supportive, and thriving campus community.",
        photoUrl: "/images/candidates/john-kamau.jpg",
        status: "approved",
        reviewedAt: new Date("2025-01-25"),
        reviewedBy: admin.id,
      })
      .returning();

    const [app2] = await db
      .insert(candidateApplications)
      .values({
        electionId: election.id,
        positionId: presidentPosition.id,
        studentId: student2.id,
        manifesto:
          "Building a sustainable and culturally diverse campus is my mission. I will: 1) Launch green initiatives including recycling programs and solar-powered facilities. 2) Celebrate our diversity through monthly cultural festivals and exchange programs. 3) Modernize student governance with digital platforms for feedback and transparent budget tracking.",
        qualifications:
          "President of Environmental Club, Organized 3 successful cultural events, GPA: 3.7",
        visionStatement:
          "I envision a UEAB that leads in sustainability while celebrating the rich tapestry of cultures that make our campus unique.",
        photoUrl: "/images/candidates/grace-akinyi.jpg",
        status: "approved",
        reviewedAt: new Date("2025-01-26"),
        reviewedBy: admin.id,
      })
      .returning();

    // Vice President Applications
    const [app3] = await db
      .insert(candidateApplications)
      .values({
        electionId: election.id,
        positionId: vicePresidentPosition.id,
        studentId: student3.id,
        manifesto:
          "As VP, I'll focus on student welfare and activities coordination. My priorities: enhanced sports facilities, more student clubs support, better health services access, and creating more networking opportunities with alumni and industry professionals.",
        qualifications:
          "Captain of Basketball Team, Coordinator of Career Week 2024, Student Mentor",
        visionStatement:
          "A campus where every student can pursue their passion while building skills for the future.",
        photoUrl: "/images/candidates/peter-mwangi.jpg",
        status: "approved",
        reviewedAt: new Date("2025-01-26"),
        reviewedBy: admin.id,
      })
      .returning();

    // Secretary Applications
    const [app4] = await db
      .insert(candidateApplications)
      .values({
        electionId: election.id,
        positionId: secretaryPosition.id,
        studentId: student4.id,
        manifesto:
          "Efficient communication is key to effective governance. I will digitize student government records, create a monthly newsletter highlighting student achievements, maintain active social media presence, and ensure all students stay informed about decisions affecting them.",
        qualifications:
          "Editor of Student Newsletter, Secretary of Computer Science Club, Excellent written and verbal communication skills",
        visionStatement:
          "Transparent, organized, and accessible student government communications.",
        photoUrl: "/images/candidates/faith-wambui.jpg",
        status: "approved",
        reviewedAt: new Date("2025-01-27"),
        reviewedBy: admin.id,
      })
      .returning();

    // Pending Application (not yet approved)
    const [app5] = await db
      .insert(candidateApplications)
      .values({
        electionId: election.id,
        positionId: treasurerPosition.id,
        studentId: student5.id,
        manifesto:
          "Financial transparency and accountability will be my hallmarks. I'll implement monthly budget reports, create an online platform for fund requests, and ensure every shilling serves student interests.",
        qualifications:
          "Business Administration major, Interned at Kenya Commercial Bank, Member of Finance Club",
        visionStatement:
          "Every student deserves to know how their money is spent and have a say in budget priorities.",
        photoUrl: "/images/candidates/james-omondi.jpg",
        status: "pending",
      })
      .returning();

    // Rejected Application (for demonstration)
    const [app6] = await db
      .insert(candidateApplications)
      .values({
        electionId: election.id,
        positionId: classRepPosition.id,
        studentId: student6.id,
        manifesto:
          "I will ensure Year 2 student voices are heard in all university decisions.",
        qualifications:
          "Year 2 student, active class participant",
        visionStatement:
          "Better representation for our class.",
        photoUrl: "/images/candidates/sarah-njeri.jpg",
        status: "rejected",
        rejectionReason: "Application does not meet the minimum requirements. Please provide more detailed manifesto and qualifications.",
        reviewedAt: new Date("2025-01-28"),
        reviewedBy: admin.id,
      })
      .returning();

    // Class Rep Applications (2 slots available)
    const [app7] = await db
      .insert(candidateApplications)
      .values({
        electionId: election.id,
        positionId: classRepPosition.id,
        studentId: student7.id,
        manifesto:
          "As Year 2 representative, I'll ensure our class concerns reach the right ears. I'll organize study groups, advocate for better course materials, and create social events to strengthen our class bonds.",
        qualifications:
          "Year 2 Engineering student, Class coordinator for group projects, GPA: 3.2",
        visionStatement:
          "A united Year 2 class that supports each other academically and socially.",
        photoUrl: "/images/candidates/daniel-kipchoge.jpg",
        status: "approved",
        reviewedAt: new Date("2025-01-28"),
        reviewedBy: admin.id,
      })
      .returning();

    console.log("✅ Candidate applications created");

    // Create Approved Candidates (from approved applications)
    const [candidate1] = await db
      .insert(candidates)
      .values({
        electionId: election.id,
        positionId: presidentPosition.id,
        applicationId: app1.id,
        userId: student.id,
        position: "Student Body President",
        manifesto: app1.manifesto,
        qualifications: app1.qualifications,
        visionStatement: app1.visionStatement,
        photoUrl: app1.photoUrl,
        status: "approved",
        voteCount: 0,
        votePercentage: "0",
      })
      .returning();

    const [candidate2] = await db
      .insert(candidates)
      .values({
        electionId: election.id,
        positionId: presidentPosition.id,
        applicationId: app2.id,
        userId: student2.id,
        position: "Student Body President",
        manifesto: app2.manifesto,
        qualifications: app2.qualifications,
        visionStatement: app2.visionStatement,
        photoUrl: app2.photoUrl,
        status: "approved",
        voteCount: 0,
        votePercentage: "0",
      })
      .returning();

    const [candidate3] = await db
      .insert(candidates)
      .values({
        electionId: election.id,
        positionId: vicePresidentPosition.id,
        applicationId: app3.id,
        userId: student3.id,
        position: "Vice President",
        manifesto: app3.manifesto,
        qualifications: app3.qualifications,
        visionStatement: app3.visionStatement,
        photoUrl: app3.photoUrl,
        status: "approved",
        voteCount: 0,
        votePercentage: "0",
      })
      .returning();

    const [candidate4] = await db
      .insert(candidates)
      .values({
        electionId: election.id,
        positionId: secretaryPosition.id,
        applicationId: app4.id,
        userId: student4.id,
        position: "Secretary General",
        manifesto: app4.manifesto,
        qualifications: app4.qualifications,
        visionStatement: app4.visionStatement,
        photoUrl: app4.photoUrl,
        status: "approved",
        voteCount: 0,
        votePercentage: "0",
      })
      .returning();

    const [candidate5] = await db
      .insert(candidates)
      .values({
        electionId: election.id,
        positionId: classRepPosition.id,
        applicationId: app7.id,
        userId: student7.id,
        position: "Class Representative - Year 2",
        manifesto: app7.manifesto,
        qualifications: app7.qualifications,
        visionStatement: app7.visionStatement,
        photoUrl: app7.photoUrl,
        status: "approved",
        voteCount: 0,
        votePercentage: "0",
      })
      .returning();

    // Add some votes for demonstration
    await db.insert(votes).values([
      {
        electionId: election.id,
        candidateId: candidate1.id,
        voterId: admin.id,
      },
      {
        electionId: election.id,
        candidateId: candidate2.id,
        voterId: supervisor.id,
      },
      {
        electionId: election.id,
        candidateId: candidate3.id,
        voterId: admin.id,
      },
      {
        electionId: election.id,
        candidateId: candidate4.id,
        voterId: supervisor.id,
      },
    ]);

    console.log("✅ Candidates and votes created");

    await db.insert(handovers).values([
      {
        fromUserId: student.id,
        position: "Class Representative - Engineering",
        notes:
          "All class meeting minutes are stored in the shared drive. Budget tracking spreadsheet has been updated. Key contacts list is in the handover folder.",
        status: "completed",
        completedAt: new Date("2024-12-15"),
      },
      {
        fromUserId: admin.id,
        position: "Student Council Secretary",
        toUserId: student2.id,
        notes:
          "Important: Council meetings are every Tuesday at 4 PM. Minutes template is in the documents folder. Please review the constitution bylaws.",
        documentUrl: "https://example.com/handover-docs",
        status: "pending",
      },
    ]);

    console.log("✅ Handovers created");
    console.log("\n✅ Database seeding completed successfully!");
    console.log("\nTest Credentials:");
    console.log("━".repeat(50));
    console.log("Student Account:");
    console.log("  Email: student@ueab.ac.ke");
    console.log("  Password: password123");
    console.log("\nAdmin Account:");
    console.log("  Email: admin@ueab.ac.ke");
    console.log("  Password: password123");
    console.log("\nSupervisor Account:");
    console.log("  Email: supervisor@ueab.ac.ke");
    console.log("  Password: password123");
    console.log("━".repeat(50));
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }

  process.exit(0);
}

seed();
