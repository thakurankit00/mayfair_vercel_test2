-- Migration: Add room images support
-- Created: 2025-01-19
-- Description: Add room_images table and update room_types table to support image management

-- Create room_images table
CREATE TABLE IF NOT EXISTS room_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    alt_text VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT room_images_room_reference_check CHECK (
        (room_type_id IS NOT NULL AND room_id IS NULL) OR 
        (room_type_id IS NULL AND room_id IS NOT NULL)
    ),
    CONSTRAINT room_images_file_size_check CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB
    CONSTRAINT room_images_mime_type_check CHECK (
        mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_images_room_type_id ON room_images(room_type_id);
CREATE INDEX IF NOT EXISTS idx_room_images_room_id ON room_images(room_id);
CREATE INDEX IF NOT EXISTS idx_room_images_is_primary ON room_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_room_images_display_order ON room_images(display_order);

-- Add primary_image_url column to room_types for quick access
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS primary_image_url VARCHAR(500);
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0;

-- Add primary_image_url column to rooms for individual room images
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS primary_image_url VARCHAR(500);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0;

-- Create function to update primary image URL when images are added/removed
CREATE OR REPLACE FUNCTION update_primary_image_url()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle room_type images
    IF NEW.room_type_id IS NOT NULL THEN
        -- Update room_types table
        UPDATE room_types 
        SET 
            primary_image_url = CASE 
                WHEN NEW.is_primary = TRUE THEN NEW.image_url
                ELSE COALESCE(
                    (SELECT image_url FROM room_images 
                     WHERE room_type_id = NEW.room_type_id AND is_primary = TRUE 
                     ORDER BY display_order ASC, created_at ASC LIMIT 1),
                    primary_image_url
                )
            END,
            image_count = (
                SELECT COUNT(*) FROM room_images WHERE room_type_id = NEW.room_type_id
            )
        WHERE id = NEW.room_type_id;
    END IF;
    
    -- Handle individual room images
    IF NEW.room_id IS NOT NULL THEN
        -- Update rooms table
        UPDATE rooms 
        SET 
            primary_image_url = CASE 
                WHEN NEW.is_primary = TRUE THEN NEW.image_url
                ELSE COALESCE(
                    (SELECT image_url FROM room_images 
                     WHERE room_id = NEW.room_id AND is_primary = TRUE 
                     ORDER BY display_order ASC, created_at ASC LIMIT 1),
                    primary_image_url
                )
            END,
            image_count = (
                SELECT COUNT(*) FROM room_images WHERE room_id = NEW.room_id
            )
        WHERE id = NEW.room_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle image deletion
CREATE OR REPLACE FUNCTION handle_image_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle room_type images
    IF OLD.room_type_id IS NOT NULL THEN
        UPDATE room_types 
        SET 
            primary_image_url = (
                SELECT image_url FROM room_images 
                WHERE room_type_id = OLD.room_type_id AND id != OLD.id
                ORDER BY is_primary DESC, display_order ASC, created_at ASC 
                LIMIT 1
            ),
            image_count = (
                SELECT COUNT(*) FROM room_images 
                WHERE room_type_id = OLD.room_type_id AND id != OLD.id
            )
        WHERE id = OLD.room_type_id;
    END IF;
    
    -- Handle individual room images
    IF OLD.room_id IS NOT NULL THEN
        UPDATE rooms 
        SET 
            primary_image_url = (
                SELECT image_url FROM room_images 
                WHERE room_id = OLD.room_id AND id != OLD.id
                ORDER BY is_primary DESC, display_order ASC, created_at ASC 
                LIMIT 1
            ),
            image_count = (
                SELECT COUNT(*) FROM room_images 
                WHERE room_id = OLD.room_id AND id != OLD.id
            )
        WHERE id = OLD.room_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_primary_image_url ON room_images;
CREATE TRIGGER trigger_update_primary_image_url
    AFTER INSERT OR UPDATE ON room_images
    FOR EACH ROW
    EXECUTE FUNCTION update_primary_image_url();

DROP TRIGGER IF EXISTS trigger_handle_image_deletion ON room_images;
CREATE TRIGGER trigger_handle_image_deletion
    BEFORE DELETE ON room_images
    FOR EACH ROW
    EXECUTE FUNCTION handle_image_deletion();

-- Create updated_at trigger for room_images
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_room_images_updated_at ON room_images;
CREATE TRIGGER trigger_room_images_updated_at
    BEFORE UPDATE ON room_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
