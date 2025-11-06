-- Add residence dean roles (deanLadies and deanMen) to users table
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('student', 'admin', 'supervisor', 'treasurer', 'vc', 'wSupervisor', 'deanLadies', 'deanMen'));
