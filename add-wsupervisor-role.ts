import { config } from 'dotenv';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// Load environment variables
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addWSupervisorRole() {
  try {
    console.log('🔄 Adding wSupervisor role...\n');

    // First, check for any invalid roles (but exclude wSupervisor which we're adding)
    const invalidUsers = await pool.query(`
      SELECT id, email, role 
      FROM users 
      WHERE role NOT IN ('student', 'admin', 'supervisor', 'treasurer', 'vc', 'wSupervisor')
    `);

    if (invalidUsers.rows.length > 0) {
      console.log('⚠️  Found users with invalid roles:');
      invalidUsers.rows.forEach(user => {
        console.log(`   - ${user.email}: ${user.role}`);
      });
      console.log('\nUpdating invalid roles to "student"...\n');

      await pool.query(`
        UPDATE users 
        SET role = 'student' 
        WHERE role NOT IN ('student', 'admin', 'supervisor', 'treasurer', 'vc', 'wSupervisor')
      `);
    }

    // Drop and recreate the role constraint
    await pool.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_check;
    `);

    await pool.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('student', 'admin', 'supervisor', 'treasurer', 'vc', 'wSupervisor'));
    `);

    console.log('✅ Successfully added wSupervisor to role enum\n');

    // Create example wSupervisor user
    const hashedPassword = await bcrypt.hash('password123', 10);

    const result = await pool.query(`
      INSERT INTO users (email, password, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE 
      SET role = $4
      RETURNING id, email, full_name, role
    `, ['wsupervisor@ueab.ac.ke', hashedPassword, 'Work Study Supervisor', 'wSupervisor']);

    console.log('✅ Created/Updated wSupervisor user:');
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Name: ${result.rows[0].full_name}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log(`   Password: password123\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addWSupervisorRole();
