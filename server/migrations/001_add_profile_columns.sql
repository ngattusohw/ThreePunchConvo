-- Add bio column for user description
ALTER TABLE users ADD COLUMN bio TEXT;

-- Add coverPhoto column for user banner/cover image URL
ALTER TABLE users ADD COLUMN cover_photo TEXT;

-- Add socialLinks column as JSONB to store social media URLs
ALTER TABLE users ADD COLUMN social_links JSONB DEFAULT '{}';