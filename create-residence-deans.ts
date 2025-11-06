import { db } from "./server/db";
import { users } from "./shared/schema";
import { hashPassword } from "./server/auth";
import { eq } from "drizzle-orm";

async function createResidenceDeans() {
  console.log("🏠 Creating Residence Deans...\n");

  const deans = [
    {
      email: "deanladies@on-campus.ueab.ac.ke",
      password: "password123",
      fullName: "Ladies Residence Dean",
      universityId: "DEAN-L-001",
      studentId: null,
      role: "deanLadies" as const,
    },
    {
      email: "deanmen@on-campus.ueab.ac.ke",
      password: "password123",
      fullName: "Men Residence Dean",
      universityId: "DEAN-M-001",
      studentId: null,
      role: "deanMen" as const,
    },
  ];

  for (const dean of deans) {
    try {
      // Check if user already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, dean.email))
        .limit(1);

      if (existing.length > 0) {
        console.log(`✓ ${dean.fullName} already exists`);
        console.log(`  Email: ${dean.email}`);
        console.log(`  Role: ${dean.role}\n`);
        continue;
      }

      // Hash password
      const hashedPassword = await hashPassword(dean.password);

      // Create user
      await db.insert(users).values({
        ...dean,
        password: hashedPassword,
      });

      console.log(`✓ Created ${dean.fullName}`);
      console.log(`  Email: ${dean.email}`);
      console.log(`  Password: ${dean.password}`);
      console.log(`  Role: ${dean.role}\n`);
    } catch (error) {
      console.error(`✗ Failed to create ${dean.fullName}:`, error);
    }
  }

  console.log("✅ Residence deans creation complete!");
  console.log("\n📝 Login Credentials:");
  console.log("Ladies Dean: deanladies@on-campus.ueab.ac.ke / password123");
  console.log("Men Dean: deanmen@on-campus.ueab.ac.ke / password123");
  
  process.exit(0);
}

createResidenceDeans().catch((error) => {
  console.error("Error creating residence deans:", error);
  process.exit(1);
});
