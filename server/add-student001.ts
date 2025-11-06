import { db } from "./db";
import { users, accounts, workApplications, timecards } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";
import { formatAcademicSemester } from "./workStudyUtils";

async function addStudent001() {
  console.log("🌱 Adding student001 to database...");

  try {
    const hashedPassword = await hashPassword("password123");

    // Check if student001 already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.studentId, "student001"))
      .limit(1);

    if (existing.length > 0) {
      console.log("✅ student001 already exists!");
      console.log("   Email:", existing[0].email);
      console.log("   Name:", existing[0].fullName);

      // Check if they have a work application
      const existingApp = await db
        .select()
        .from(workApplications)
        .where(eq(workApplications.userId, existing[0].id))
        .limit(1);

      if (existingApp.length > 0) {
        console.log("✅ Work application exists!");
        console.log("   Department:", existingApp[0].department);
        console.log("   Position:", existingApp[0].position);
        console.log("   Status:", existingApp[0].status);
      } else {
        console.log("❌ No work application found - adding one...");

        const [supervisor] = await db
          .select()
          .from(users)
          .where(eq(users.role, "supervisor"))
          .limit(1);

        const [app] = await db
          .insert(workApplications)
          .values({
            academicSemester: formatAcademicSemester(new Date("2025-01-10")),
            applicationId: "WS-2025-001-STUDENT001",
            userId: existing[0].id,
            fullName: existing[0].fullName,
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
            reason: "I am passionate about helping students access learning resources.",
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
            reviewedBy: supervisor?.id,
            supervisorId: supervisor?.id,
            supervisorReviewedAt: new Date("2025-01-12"),
            reviewNotes: "Approved. Student meets all requirements.",
          })
          .returning();

        console.log("✅ Work application created!");

        // Add some timecards
        await db.insert(timecards).values([
          {
            applicationId: app.id,
            userId: existing[0].id,
            date: new Date("2025-01-20"),
            hoursWorked: "8.00",
            taskDescription: "Assisted students with research, organized reference materials",
            qrCode: "QR-1705766400-student001-1",
            status: "verified",
            verifiedBy: supervisor?.id,
            department: "Library",
            hourlyRate: "150.00",
            earnings: "1200.00",
          },
          {
            applicationId: app.id,
            userId: existing[0].id,
            date: new Date("2025-01-27"),
            hoursWorked: "7.00",
            taskDescription: "Helped with book checkouts, shelved returned materials",
            qrCode: "QR-1706371200-student001-2",
            status: "verified",
            verifiedBy: supervisor?.id,
            department: "Library",
            hourlyRate: "150.00",
            earnings: "1050.00",
          },
        ]);

        console.log("✅ Timecards created!");
      }

      return;
    }

    // Create new student001
    const [student001] = await db
      .insert(users)
      .values({
        email: "student001@ueab.ac.ke",
        password: hashedPassword,
        fullName: "Aisha Ouma",
        universityId: "UEAB123463",
        studentId: "student001",
        role: "student",
      })
      .returning();

    console.log("✅ student001 user created!");

    // Create account
    await db
      .insert(accounts)
      .values({
        userId: student001.id,
        accountNumber: "UEAB45678903",
        balance: "15250.00",
      });

    console.log("✅ Account created!");

    // Get supervisor
    const [supervisor] = await db
      .select()
      .from(users)
      .where(eq(users.role, "supervisor"))
      .limit(1);

    // Create work application
    const [app] = await db
      .insert(workApplications)
      .values({
        academicSemester: formatAcademicSemester(new Date("2025-01-10")),
        applicationId: "WS-2025-001-STUDENT001",
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
        reason: "I am passionate about helping students access learning resources.",
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
        reviewedBy: supervisor?.id,
        supervisorId: supervisor?.id,
        supervisorReviewedAt: new Date("2025-01-12"),
        reviewNotes: "Approved. Student meets all requirements.",
      })
      .returning();

    console.log("✅ Work application created!");

    // Create timecards
    await db.insert(timecards).values([
      {
        applicationId: app.id,
        userId: student001.id,
        date: new Date("2025-01-20"),
        hoursWorked: "8.00",
        taskDescription: "Assisted students with research, organized reference materials",
        qrCode: "QR-1705766400-student001-1",
        status: "verified",
        verifiedBy: supervisor?.id,
        department: "Library",
        hourlyRate: "150.00",
        earnings: "1200.00",
      },
      {
        applicationId: app.id,
        userId: student001.id,
        date: new Date("2025-01-27"),
        hoursWorked: "7.00",
        taskDescription: "Helped with book checkouts, shelved returned materials",
        qrCode: "QR-1706371200-student001-2",
        status: "verified",
        verifiedBy: supervisor?.id,
        department: "Library",
        hourlyRate: "150.00",
        earnings: "1050.00",
      },
    ]);

    console.log("✅ Timecards created!");
    console.log("\n🎉 student001 setup complete!");
    console.log("   Email: student001@ueab.ac.ke");
    console.log("   Password: password123");
    console.log("   Department: Library");
    console.log("   Position: Library Assistant");
    console.log("   Hourly Rate: KSh 150/hr");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

addStudent001()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed:", error);
    process.exit(1);
  });
