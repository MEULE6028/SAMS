import { db } from "./server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";

async function runMigration() {
  try {
    console.log("Running earnings migration...");

    const migrationSQL = fs.readFileSync("./migrations/0009_add_timecard_earnings.sql", "utf8");

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      console.log("Executing:", statement.substring(0, 80) + "...");
      await db.execute(sql.raw(statement));
    }

    console.log("✅ Migration completed successfully!");

    // Verify the changes
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'timecards' 
      AND column_name IN ('hourly_rate', 'earnings', 'department')
    `);

    console.log("\n📋 New columns added:");
    console.log(result.rows);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
