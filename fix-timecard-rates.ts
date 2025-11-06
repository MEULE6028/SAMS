import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './shared/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function fixTimecardRates() {
  try {
    console.log('🔍 Checking existing timecards...\n');

    // Get all timecards
    const allTimecards = await db
      .select()
      .from(schema.timecards)
      .leftJoin(
        schema.workApplications,
        eq(schema.timecards.applicationId, schema.workApplications.id)
      );

    console.log(`Found ${allTimecards.length} total timecards\n`);

    // Get current department rates
    const departmentRates = await db
      .select()
      .from(schema.departmentRates);

    const rateMap = new Map(
      departmentRates.map(r => [r.department, r.hourlyRate])
    );

    console.log('📊 Current Department Rates:');
    rateMap.forEach((rate, dept) => {
      console.log(`  ${dept}: ${rate} KSh/hr`);
    });
    console.log();

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const record of allTimecards) {
      const timecard = record.timecards;
      const application = record.work_applications;

      if (!application || !timecard) {
        console.log(`⚠️  Skipping timecard ${timecard?.id} - no application found`);
        continue;
      }

      const department = application.department;
      const newRate = rateMap.get(department);

      if (!newRate) {
        console.log(`⚠️  No rate found for department: ${department}`);
        continue;
      }

      const currentRate = parseFloat(timecard.hourlyRate);
      const correctRate = parseFloat(newRate);

      if (currentRate === correctRate) {
        unchangedCount++;
        continue;
      }

      // Update the rate
      const hoursWorked = parseFloat(timecard.hoursWorked);
      let newEarnings = null;

      // Recalculate earnings if timecard is verified
      if (timecard.status === 'verified') {
        newEarnings = hoursWorked * correctRate;
      }

      console.log(`🔧 Updating timecard ${timecard.id}:`);
      console.log(`   Department: ${department}`);
      console.log(`   Hours: ${hoursWorked}h`);
      console.log(`   Old rate: ${currentRate} KSh/hr`);
      console.log(`   New rate: ${correctRate} KSh/hr`);
      if (newEarnings !== null) {
        const oldEarnings = timecard.earnings ? parseFloat(timecard.earnings) : 0;
        console.log(`   Old earnings: ${oldEarnings} KSh`);
        console.log(`   New earnings: ${newEarnings.toFixed(2)} KSh`);
      }
      console.log();

      const updateData: any = {
        hourlyRate: correctRate.toString(),
      };

      if (newEarnings !== null) {
        updateData.earnings = newEarnings.toString();
      }

      await db
        .update(schema.timecards)
        .set(updateData)
        .where(eq(schema.timecards.id, timecard.id));

      updatedCount++;
    }

    console.log('\n✅ Update complete!');
    console.log(`   Updated: ${updatedCount} timecards`);
    console.log(`   Unchanged: ${unchangedCount} timecards`);
    console.log(`   Total: ${allTimecards.length} timecards\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixTimecardRates();
