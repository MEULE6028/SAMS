-- Add voting eligibility restrictions to election_positions
ALTER TABLE election_positions 
ADD COLUMN IF NOT EXISTS gender_restriction text DEFAULT 'all' CHECK (gender_restriction IN ('male', 'female', 'all')),
ADD COLUMN IF NOT EXISTS residence_restriction text DEFAULT 'all' CHECK (residence_restriction IN ('oncampus', 'offcampus', 'all')),
ADD COLUMN IF NOT EXISTS school_restriction text;

-- Add position_id to votes table for tracking which positions a user has voted for
ALTER TABLE votes 
ADD COLUMN IF NOT EXISTS position_id varchar REFERENCES election_positions(id) ON DELETE SET NULL;

-- Update existing votes to populate position_id from candidates table
UPDATE votes 
SET position_id = candidates.position_id
FROM candidates
WHERE votes.candidate_id = candidates.id 
AND votes.position_id IS NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_votes_voter_position ON votes(voter_id, position_id);
CREATE INDEX IF NOT EXISTS idx_election_positions_restrictions ON election_positions(gender_restriction, residence_restriction, school_restriction);
