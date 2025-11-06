import { config } from "dotenv";
import { Pool } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkWSupervisor() {
  try {
    console.log("🔍 Checking wSupervisor users...\n");

    // Check all users with wSupervisor role
    const result = await pool.query(
      "SELECT id, email, full_name, role, created_at FROM users WHERE role = 'wSupervisor' ORDER BY created_at DESC"
    );

    if (result.rows.length === 0) {
      console.log("❌ No wSupervisor users found in database!");
      console.log("\nLet me check if the role exists in the constraint...");

      const constraintCheck = await pool.query(`
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'users'::regclass AND conname LIKE '%role%'
      `);

      console.log("\nRole constraint:");
      console.log(constraintCheck.rows);

    } else {
      console.log(`✅ Found ${result.rows.length} wSupervisor user(s):\n`);
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.full_name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.created_at}`);
        console.log("");
      });

      // Test password for each user
      console.log("🔐 Testing password 'password123' for each user...\n");

      for (const user of result.rows) {
        const passwordCheck = await pool.query(
          "SELECT password FROM users WHERE email = $1",
          [user.email]
        );

        if (passwordCheck.rows[0]?.password) {
          const isValid = await bcrypt.compare('password123', passwordCheck.rows[0].password);
          console.log(`   ${user.email}: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

          if (!isValid) {
            console.log(`      ⚠️  Password does NOT match 'password123'`);
            console.log(`      🔄 Would you like to reset? Run: pnpm exec tsx add-wsupervisor-role.ts`);
          }
        }
      }
    }

    // Also check all users to see what roles exist
    console.log("\n📋 All user roles in database:");
    const allRoles = await pool.query(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role"
    );
    allRoles.rows.forEach(row => {
      console.log(`   ${row.role}: ${row.count} user(s)`);
    });

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkWSupervisor();
