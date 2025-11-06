import { config } from "dotenv";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { readFileSync } from "fs";
import { join } from "path";
import * as schema from "./shared/schema.js";

// Load environment variables
config();

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString });
const db = drizzle({ client: pool, schema });

async function runMigration() {
  try {
    console.log("🚀 Seeding department rates...");

    // Insert initial department rates
    const insertSQL = `
      INSERT INTO "department_rates" ("department", "hourly_rate") VALUES
        ('Library', 51.00),
        ('IT Services', 51.00),
        ('Admissions', 51.00),
        ('Facilities', 51.00),
        ('Student Affairs', 51.00),
        ('Cafeteria', 51.00),
        ('Security', 51.00),
        ('Maintenance', 51.00),
        ('Administration', 51.00),
        ('Chapel', 51.00),
        ('Sports', 51.00),
        ('Health Center', 51.00)
      ON CONFLICT (department) DO UPDATE SET hourly_rate = EXCLUDED.hourly_rate;
    `;

    // Execute the seed
    await pool.query(insertSQL);

    console.log("✅ Department rates seeded successfully!");

    // Verify the data
    const result = await pool.query("SELECT * FROM department_rates ORDER BY department");
    console.log("\n📊 Current department rates:");
    result.rows.forEach((rate: any) => {
      console.log(`   ${rate.department}: ${rate.hourly_rate} KSh/hour`);
    });

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
