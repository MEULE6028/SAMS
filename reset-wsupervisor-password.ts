import { config } from 'dotenv';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function resetPassword() {
  try {
    console.log('🔄 Resetting wSupervisor password...\n');

    // Generate new password hash with bcrypt
    const newPassword = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    console.log('Generated hash:', hashedPassword.substring(0, 20) + '...');
    console.log('Hash length:', hashedPassword.length);

    // Update the password
    const result = await pool.query(`
      UPDATE users 
      SET password = $1 
      WHERE email = 'wsupervisor@ueab.ac.ke'
      RETURNING id, email, full_name, role
    `, [hashedPassword]);

    if (result.rows.length > 0) {
      console.log('\n✅ Password updated successfully for:');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Name: ${result.rows[0].full_name}`);
      console.log(`   Role: ${result.rows[0].role}`);
      console.log(`   New Password: ${newPassword}`);

      // Immediately test it
      const checkResult = await pool.query(`
        SELECT password FROM users WHERE email = 'wsupervisor@ueab.ac.ke'
      `);

      const isValid = await bcrypt.compare(newPassword, checkResult.rows[0].password);
      console.log(`\n🔐 Verification test: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);

    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

resetPassword();
