import "dotenv/config";
import { db } from "./server/db";
import { users, workApplications } from "./shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createLibrarySupervisor() {
    console.log("🔧 Creating Library Supervisor (HOD) user...");

    try {
        // Check if supervisor already exists
        const existingSupervisor = await db.select()
            .from(users)
            .where(eq(users.email, "librarysupervisor@ueab.ac.ke"))
            .limit(1);

        let supervisorId: string;

        if (existingSupervisor.length > 0) {
            console.log("✅ Library Supervisor already exists:", existingSupervisor[0].email);
            supervisorId = existingSupervisor[0].id;
        } else {
            // Create new supervisor user
            const hashedPassword = await bcrypt.hash("password123", 10);

            const newSupervisor = await db.insert(users).values({
                fullName: "Library Supervisor",
                email: "librarysupervisor@ueab.ac.ke",
                password: hashedPassword,
                role: "supervisor"
            }).returning();

            supervisorId = newSupervisor[0].id;
            console.log("✅ Created Library Supervisor:", newSupervisor[0].email);
        }

        // Assign supervisor to all Library applications
        const libraryApplications = await db.select()
            .from(workApplications)
            .where(eq(workApplications.department, "Library"));

        console.log(`📚 Found ${libraryApplications.length} Library applications`);

        if (libraryApplications.length > 0) {
            for (const app of libraryApplications) {
                await db.update(workApplications)
                    .set({ supervisorId: supervisorId })
                    .where(eq(workApplications.id, app.id));
            }
            console.log(`✅ Assigned Library Supervisor to ${libraryApplications.length} applications`);
        }

        // Get final count of assigned applications
        const assignedApps = await db.select()
            .from(workApplications)
            .where(eq(workApplications.supervisorId, supervisorId));

        console.log("\n📊 Summary:");
        console.log("- Email: librarysupervisor@ueab.ac.ke");
        console.log("- Password: password123");
        console.log("- Role: supervisor");
        console.log(`- Assigned Applications: ${assignedApps.length}`);
        console.log(`- Department: Library`);

        console.log("\n✅ Library Supervisor setup complete!");
        console.log("🔐 You can now login at: /login");

    } catch (error) {
        console.error("❌ Error creating Library Supervisor:", error);
        throw error;
    }
}

// Run the function
createLibrarySupervisor()
    .then(() => {
        console.log("\n🎉 Done!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Failed:", error);
        process.exit(1);
    });
