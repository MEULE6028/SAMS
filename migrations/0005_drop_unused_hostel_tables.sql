-- Migration: Drop unused hostel tables (data now from external API)
-- Only keeping hostel_attendance for local roll call tracking

-- Drop tables in order (respecting foreign key dependencies)
DROP TABLE IF EXISTS "room_assignments" CASCADE;
DROP TABLE IF EXISTS "hostel_applications" CASCADE;
DROP TABLE IF EXISTS "hostel_rooms" CASCADE;
DROP TABLE IF EXISTS "hostels" CASCADE;

-- Note: hostel_attendance table is kept for local attendance tracking
-- The roomId column is now nullable and can reference external API rooms
