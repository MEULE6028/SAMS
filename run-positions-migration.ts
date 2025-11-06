import { config } from "dotenv";
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
config();

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString });

async function runMigration() {
  try {
    console.log("🚀 Running department positions migration...");

    // Read and execute the SQL migration
    const migrationSQL = readFileSync(
      join(process.cwd(), "migrations", "0011_add_department_positions.sql"),
      "utf-8"
    );

    await pool.query(migrationSQL);

    console.log("✅ Department positions table created and departments updated!");

    // Get department IDs for adding positions
    const depts = await pool.query(`
      SELECT id, department FROM department_rates ORDER BY department
    `);

    console.log("\n📋 Adding positions for each department...");

    // Create a map of department names to IDs
    const deptMap: Record<string, string> = {};
    depts.rows.forEach((row: any) => {
      deptMap[row.department] = row.id;
    });

    // Define positions for each department
    const positions = [
      // DVC SAS
      { dept: 'DVC SAS', position: 'Assistant Secretary', description: 'Administrative support for DVC office' },

      // Registry
      { dept: 'Registry', position: 'Assistant', description: 'Registry administrative support' },

      // Administration
      { dept: 'Administration', position: 'Janitor', description: 'Cleaning and maintenance of admin offices' },
      { dept: 'Administration', position: 'Secretary Assistant', description: 'Administrative and secretarial support' },

      // Cafeteria
      { dept: 'Cafeteria', position: 'Cleaner', description: 'Cleaning cafeteria spaces' },
      { dept: 'Cafeteria', position: 'Cook', description: 'Food preparation' },
      { dept: 'Cafeteria', position: 'Server', description: 'Serving food to students and staff' },
      { dept: 'Cafeteria', position: 'Dishwasher', description: 'Washing dishes and utensils' },
      { dept: 'Cafeteria', position: 'General Staff', description: 'Various cafeteria duties' },

      // PPD (Physical Plant Department)
      { dept: 'PPD', position: 'Cleaner', description: 'General cleaning of university premises' },
      { dept: 'PPD', position: 'Groundskeeper', description: 'Maintaining outdoor areas and landscaping' },
      { dept: 'PPD', position: 'Maintenance Assistant', description: 'Assisting with repairs and maintenance' },

      // Dorm Management
      { dept: 'Dorm Management', position: 'Janitor', description: 'Cleaning dormitory facilities' },
      { dept: 'Dorm Management', position: 'Residential Assistant', description: 'Supporting residential officers' },
      { dept: 'Dorm Management', position: 'On-Campus Officer', description: 'Managing on-campus residence halls' },
      { dept: 'Dorm Management', position: 'Off-Campus Officer', description: 'Managing off-campus housing' },

      // Library
      { dept: 'Library', position: 'Library Assistant', description: 'Assisting with library operations' },
      { dept: 'Library', position: 'Security', description: 'Security at library entrance' },
      { dept: 'Library', position: 'Janitor', description: 'Cleaning library spaces' },
      { dept: 'Library', position: 'Clerk', description: 'Administrative support for library' },

      // Existing departments - add some positions
      { dept: 'IT Services', position: 'IT Assistant', description: 'Technical support for IT services' },
      { dept: 'IT Services', position: 'Help Desk', description: 'First-line IT support' },

      { dept: 'Admissions', position: 'Front Desk', description: 'Welcoming and directing visitors' },
      { dept: 'Admissions', position: 'Administrative Assistant', description: 'Supporting admissions processes' },

      { dept: 'Facilities', position: 'Maintenance Assistant', description: 'Assisting with facility maintenance' },
      { dept: 'Facilities', position: 'Custodian', description: 'Custodial services' },

      { dept: 'Student Affairs', position: 'Office Assistant', description: 'General office support' },

      { dept: 'Security', position: 'Security Guard', description: 'Campus security patrol' },
      { dept: 'Security', position: 'Gate Officer', description: 'Managing entry/exit points' },

      { dept: 'Maintenance', position: 'General Maintenance', description: 'Various maintenance tasks' },
      { dept: 'Maintenance', position: 'Electrician Assistant', description: 'Assisting with electrical work' },
      { dept: 'Maintenance', position: 'Plumber Assistant', description: 'Assisting with plumbing work' },

      { dept: 'Chapel', position: 'Chapel Assistant', description: 'Supporting chapel activities' },
      { dept: 'Chapel', position: 'Event Setup', description: 'Setting up for chapel events' },

      { dept: 'Sports', position: 'Equipment Manager', description: 'Managing sports equipment' },
      { dept: 'Sports', position: 'Field Assistant', description: 'Maintaining sports fields' },

      { dept: 'Health Center', position: 'Receptionist', description: 'Front desk at health center' },
      { dept: 'Health Center', position: 'Cleaner', description: 'Cleaning health center facilities' },
    ];

    // Insert positions
    for (const pos of positions) {
      const deptId = deptMap[pos.dept];
      if (deptId) {
        await pool.query(`
          INSERT INTO department_positions (department_id, position, description)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [deptId, pos.position, pos.description]);
        console.log(`  ✓ Added ${pos.position} to ${pos.dept}`);
      } else {
        console.log(`  ⚠ Department not found: ${pos.dept}`);
      }
    }

    // Show final count
    const countResult = await pool.query(`
      SELECT 
        dr.department,
        COUNT(dp.id) as position_count
      FROM department_rates dr
      LEFT JOIN department_positions dp ON dp.department_id = dr.id
      GROUP BY dr.department
      ORDER BY dr.department
    `);

    console.log("\n📊 Department Position Summary:");
    countResult.rows.forEach((row: any) => {
      console.log(`   ${row.department}: ${row.position_count} position(s)`);
    });

    console.log("\n✨ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
