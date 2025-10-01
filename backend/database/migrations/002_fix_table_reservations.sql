-- Migration: Fix table_reservations schema
-- Description: Ensure table_reservations table matches the expected schema

-- The table_reservations table should only have these columns:
-- id, reservation_reference, user_id, table_id, reservation_date, reservation_time, 
-- party_size, duration_minutes, special_requests, status, seated_at, completed_at, 
-- created_at, updated_at

-- Customer information (first_name, last_name, email, phone) should come from users table via user_id

-- Add any missing columns that might be needed
ALTER TABLE table_reservations 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_table_reservations_user_id ON table_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_table_id ON table_reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_date ON table_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_table_reservations_status ON table_reservations(status);

-- Update any existing reservations with invalid status values
UPDATE table_reservations 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled');