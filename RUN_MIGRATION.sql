-- Run this SQL to add the created_by column to table_reservations
-- This will enable tracking who created each reservation

ALTER TABLE table_reservations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_table_reservations_created_by ON table_reservations(created_by);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'table_reservations' 
AND column_name = 'created_by';