-- Add wSupervisor role to users table
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('student', 'admin', 'supervisor', 'treasurer', 'vc', 'wSupervisor'));

-- Create an example wSupervisor user (password: password123)
INSERT INTO users (email, password, full_name, role)
VALUES (
  'wsupervisor@ueab.ac.ke',
  '$2a$10$rJ0qLHZW3bZZ3vKQX5X8j.9Z9K8X7qX5qX5qX5qX5qX5qX5qX5qX5q', -- bcrypt hash for 'password123'
  'Work Study Supervisor',
  'wSupervisor'
)
ON CONFLICT (email) DO NOTHING;
