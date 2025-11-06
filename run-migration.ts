import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("🔄 Running migration to add academic_semester column...");

  try {
    await db.execute(sql`
      ALTER TABLE work_applications 
      ADD COLUMN IF NOT EXISTS academic_semester text;
    `);

    console.log("✅ Migration completed successfully!");
    console.log("   - Added academic_semester column to work_applications table");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();
