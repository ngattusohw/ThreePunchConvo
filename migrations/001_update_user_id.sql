-- Migration to convert user ID from integer to text
-- Note: This is a potentially destructive operation that may lose data
-- First, create a backup of the existing users table

-- Create a backup of the users table
CREATE TABLE users_backup AS SELECT * FROM users;

-- Drop constraints that reference the users table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS referenced_table
             FROM pg_constraint 
             WHERE confrelid = 'users'::regclass)
    LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

-- Drop primary key constraint on users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;

-- Alter the ID column type from integer to text
ALTER TABLE users ALTER COLUMN id TYPE text USING id::text;

-- Re-add primary key constraint
ALTER TABLE users ADD PRIMARY KEY (id);

-- Note: You would need to update foreign key constraints manually as well
-- This is a simplified example and should be expanded for all related tables