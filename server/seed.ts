import { db } from "./db";
import {
  users,
  accounts,
  transactions,
  workApplications,
  timecards,
  elections,
  candidates,
  votes,
  handovers,
} from "@shared/schema";
import { hashPassword } from "./auth";

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
        userId: student.id,
        department: "Library",
        position: "Library Assistant",
        hoursPerWeek: 15,
        reason:
          "I have a passion for organizing information and helping fellow students find resources. My attention to detail and customer service skills make me ideal for this position.",
        status: "approved",
        reviewedBy: supervisor.id,
        reviewNotes:
          "Excellent application. Student has shown responsibility and good communication skills.",
      })
      .returning();

    await db.insert(workApplications).values([
      {
        userId: student.id,
        department: "IT Services",
        position: "Help Desk Technician",
        hoursPerWeek: 10,
        reason:
          "I have experience with troubleshooting computer issues and providing technical support. I'm patient and enjoy helping others solve problems.",
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
      },
    ]);

    console.log("✅ Timecards created");

    const [election] = await db
      .insert(elections)
      .values({
        title: "Student Body President Election 2025",
        description:
          "Annual election for Student Body President to represent UEAB students and lead student governance initiatives.",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-15"),
        status: "active",
      })
      .returning();

    const [candidate1] = await db
      .insert(candidates)
      .values({
        electionId: election.id,
        userId: student.id,
        position: "Student Body President",
        manifesto:
          "I pledge to improve campus facilities, enhance student services, and ensure every student voice is heard. My priorities include better cafeteria options, extended library hours, and increased mental health resources.",
        status: "approved",
      })
      .returning();

    const [candidate2User] = await db
      .insert(users)
      .values({
        email: "grace@ueab.ac.ke",
        password: hashedPassword,
        fullName: "Grace Akinyi",
        universityId: "UEAB123457",
        role: "student",
      })
      .returning();

    const [candidate2] = await db
      .insert(candidates)
      .values({
        electionId: election.id,
        userId: candidate2User.id,
        position: "Student Body President",
        manifesto:
          "Together we can build a more inclusive campus. My focus is on sustainability initiatives, cultural diversity programs, and transparent student government operations.",
        status: "approved",
      })
      .returning();

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
    ]);

    console.log("✅ Elections and candidates created");

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
        toUserId: candidate2User.id,
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
