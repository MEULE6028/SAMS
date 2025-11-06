import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  try {
    console.log('🔄 Running election voting restrictions migration...\n');

    const migrationSQL = `
      -- Add voting eligibility restrictions to election_positions
      ALTER TABLE election_positions 
      ADD COLUMN IF NOT EXISTS gender_restriction text DEFAULT 'all',
      ADD COLUMN IF NOT EXISTS residence_restriction text DEFAULT 'all',
      ADD COLUMN IF NOT EXISTS school_restriction text;

      -- Add check constraints
      ALTER TABLE election_positions 
      DROP CONSTRAINT IF EXISTS election_positions_gender_restriction_check;
      
      ALTER TABLE election_positions 
      ADD CONSTRAINT election_positions_gender_restriction_check 
      CHECK (gender_restriction IN ('male', 'female', 'all'));

      ALTER TABLE election_positions 
      DROP CONSTRAINT IF EXISTS election_positions_residence_restriction_check;
      
      ALTER TABLE election_positions 
      ADD CONSTRAINT election_positions_residence_restriction_check 
      CHECK (residence_restriction IN ('oncampus', 'offcampus', 'all'));

      -- Add position_id to votes table for tracking which positions a user has voted for
      ALTER TABLE votes 
      ADD COLUMN IF NOT EXISTS position_id varchar;

      -- Add foreign key constraint if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'votes_position_id_fk'
        ) THEN
          ALTER TABLE votes 
          ADD CONSTRAINT votes_position_id_fk 
          FOREIGN KEY (position_id) REFERENCES election_positions(id) ON DELETE SET NULL;
        END IF;
      END
      $$;

      -- Update existing votes to populate position_id from candidates table
      UPDATE votes 
      SET position_id = candidates.position_id
      FROM candidates
      WHERE votes.candidate_id = candidates.id 
      AND votes.position_id IS NULL;

      -- Add indexes for faster lookups
      CREATE INDEX IF NOT EXISTS idx_votes_voter_position ON votes(voter_id, position_id);
      CREATE INDEX IF NOT EXISTS idx_election_positions_restrictions 
      ON election_positions(gender_restriction, residence_restriction, school_restriction);
    `;

    console.log('Executing SQL migration...');
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('Changes applied:');
    console.log('  - Added gender_restriction column to election_positions');
    console.log('  - Added residence_restriction column to election_positions');
    console.log('  - Added school_restriction column to election_positions');
    console.log('  - Added position_id column to votes');
    console.log('  - Updated existing votes with position_id');
    console.log('  - Created indexes for performance\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
