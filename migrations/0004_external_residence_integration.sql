-- Migration: External Residence API Integration
-- Make roomId nullable in hostel_attendance table since we're using external API

-- Drop the foreign key constraint first
ALTER TABLE "hostel_attendance" DROP CONSTRAINT IF EXISTS "hostel_attendance_room_id_hostel_rooms_id_fk";

-- Make roomId nullable
ALTER TABLE "hostel_attendance" ALTER COLUMN "room_id" DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN "hostel_attendance"."room_id" IS 'Optional room identifier - can reference local rooms or external API rooms (format: external-{hostelName}-{roomNumber})';
