import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("🔄 Running migration to add residence dean roles...");

  try {
    // Drop the old constraint
    await db.execute(sql`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_check;
    `);

    console.log("✅ Dropped old role constraint");

    // Add the new constraint with dean roles
    await db.execute(sql`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('student', 'admin', 'supervisor', 'treasurer', 'vc', 'wSupervisor', 'deanLadies', 'deanMen'));
    `);

    console.log("✅ Migration completed successfully!");
    console.log("   - Added deanLadies and deanMen roles to users table constraint");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();
