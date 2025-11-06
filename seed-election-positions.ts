import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedElectionPositions() {
  try {
    console.log('🌱 Seeding election positions...\n');

    const positions = [
      // CS (Computer Science) Gender Rep - Female only
      {
        title: 'CS Gender Representative',
        description: 'Represents female students in the Computer Science department',
        responsibilities: 'Advocate for gender equality, organize women in tech events, address concerns specific to female CS students',
        requirements: 'Must be a female student enrolled in Computer Science',
        slotsAvailable: 1,
        department: 'Computer Science',
        category: 'Department Representative',
        genderRestriction: 'female',
        residenceRestriction: 'all',
        schoolRestriction: null
      },

      // CS Finance Rep - All genders
      {
        title: 'CS Finance Representative',
        description: 'Manages departmental finances and budgets for Computer Science',
        responsibilities: 'Track department spending, prepare budget reports, coordinate fundraising activities',
        requirements: 'Must be a student enrolled in Computer Science with good academic standing',
        slotsAvailable: 1,
        department: 'Computer Science',
        category: 'Department Representative',
        genderRestriction: 'all',
        residenceRestriction: 'all',
        schoolRestriction: null
      },

      // Senator Dorms - On Campus Men
      {
        title: 'Senator - On-Campus Men Dorms',
        description: 'Represents male students residing in on-campus dormitories',
        responsibilities: 'Address dormitory concerns, coordinate with dorm management, represent male on-campus students in senate',
        requirements: 'Must be a male student living in on-campus dormitories',
        slotsAvailable: 1,
        department: null,
        category: 'Senate',
        genderRestriction: 'male',
        residenceRestriction: 'oncampus',
        schoolRestriction: null
      },

      // Senator Dorms - On Campus Ladies
      {
        title: 'Senator - On-Campus Ladies Dorms',
        description: 'Represents female students residing in on-campus dormitories',
        responsibilities: 'Address dormitory concerns, coordinate with dorm management, represent female on-campus students in senate',
        requirements: 'Must be a female student living in on-campus dormitories',
        slotsAvailable: 1,
        department: null,
        category: 'Senate',
        genderRestriction: 'female',
        residenceRestriction: 'oncampus',
        schoolRestriction: null
      },

      // Senator Dorms - Off Campus Men
      {
        title: 'Senator - Off-Campus Men',
        description: 'Represents male students residing off-campus',
        responsibilities: 'Address off-campus living concerns, coordinate with off-campus housing resources, represent male off-campus students',
        requirements: 'Must be a male student living off-campus',
        slotsAvailable: 1,
        department: null,
        category: 'Senate',
        genderRestriction: 'male',
        residenceRestriction: 'offcampus',
        schoolRestriction: null
      },

      // Senator Dorms - Off Campus Ladies
      {
        title: 'Senator - Off-Campus Ladies',
        description: 'Represents female students residing off-campus',
        responsibilities: 'Address off-campus living concerns, coordinate with off-campus housing resources, represent female off-campus students',
        requirements: 'Must be a female student living off-campus',
        slotsAvailable: 1,
        department: null,
        category: 'Senate',
        genderRestriction: 'female',
        residenceRestriction: 'offcampus',
        schoolRestriction: null
      },

      // School Senators - One for each school
      {
        title: 'Senator - School of Business',
        description: 'Represents all students from the School of Business',
        responsibilities: 'Voice business school concerns, coordinate school events, represent School of Business in senate',
        requirements: 'Must be enrolled in the School of Business',
        slotsAvailable: 1,
        department: 'Business',
        category: 'Senate',
        genderRestriction: 'all',
        residenceRestriction: 'all',
        schoolRestriction: 'School of Business'
      },

      {
        title: 'Senator - School of Science and Technology',
        description: 'Represents all students from the School of Science and Technology',
        responsibilities: 'Voice science and tech concerns, coordinate school events, represent School of Science and Technology in senate',
        requirements: 'Must be enrolled in the School of Science and Technology',
        slotsAvailable: 1,
        department: 'Science and Technology',
        category: 'Senate',
        genderRestriction: 'all',
        residenceRestriction: 'all',
        schoolRestriction: 'School of Science and Technology'
      },

      {
        title: 'Senator - School of Arts and Humanities',
        description: 'Represents all students from the School of Arts and Humanities',
        responsibilities: 'Voice arts and humanities concerns, coordinate school events, represent School of Arts and Humanities in senate',
        requirements: 'Must be enrolled in the School of Arts and Humanities',
        slotsAvailable: 1,
        department: 'Arts and Humanities',
        category: 'Senate',
        genderRestriction: 'all',
        residenceRestriction: 'all',
        schoolRestriction: 'School of Arts and Humanities'
      },

      {
        title: 'Senator - School of Education',
        description: 'Represents all students from the School of Education',
        responsibilities: 'Voice education school concerns, coordinate school events, represent School of Education in senate',
        requirements: 'Must be enrolled in the School of Education',
        slotsAvailable: 1,
        department: 'Education',
        category: 'Senate',
        genderRestriction: 'all',
        residenceRestriction: 'all',
        schoolRestriction: 'School of Education'
      }
    ];

    console.log(`Inserting ${positions.length} election positions...\n`);

    for (const position of positions) {
      const result = await pool.query(
        `INSERT INTO election_positions 
         (title, description, responsibilities, requirements, slots_available, department, category, 
          gender_restriction, residence_restriction, school_restriction, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, title`,
        [
          position.title,
          position.description,
          position.responsibilities,
          position.requirements,
          position.slotsAvailable,
          position.department,
          position.category,
          position.genderRestriction,
          position.residenceRestriction,
          position.schoolRestriction,
          true
        ]
      );

      const restrictions = [];
      if (position.genderRestriction !== 'all') {
        restrictions.push(`Gender: ${position.genderRestriction}`);
      }
      if (position.residenceRestriction !== 'all') {
        restrictions.push(`Residence: ${position.residenceRestriction}`);
      }
      if (position.schoolRestriction) {
        restrictions.push(`School: ${position.schoolRestriction}`);
      }

      const restrictionText = restrictions.length > 0
        ? ` [${restrictions.join(', ')}]`
        : ' [Open to all]';

      console.log(`✓ ${result.rows[0].title}${restrictionText}`);
    }

    console.log(`\n✅ Successfully seeded ${positions.length} election positions!\n`);

    // Display summary
    const summary = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count,
        COUNT(CASE WHEN gender_restriction != 'all' THEN 1 END) as gender_restricted,
        COUNT(CASE WHEN residence_restriction != 'all' THEN 1 END) as residence_restricted,
        COUNT(CASE WHEN school_restriction IS NOT NULL THEN 1 END) as school_restricted
      FROM election_positions
      GROUP BY category
      ORDER BY category
    `);

    console.log('📊 Summary by Category:');
    for (const row of summary.rows) {
      console.log(`\n${row.category}:`);
      console.log(`  Total: ${row.count}`);
      console.log(`  Gender-restricted: ${row.gender_restricted}`);
      console.log(`  Residence-restricted: ${row.residence_restricted}`);
      console.log(`  School-restricted: ${row.school_restricted}`);
    }

  } catch (error) {
    console.error('❌ Error seeding positions:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedElectionPositions();
