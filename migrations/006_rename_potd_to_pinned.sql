-- Rename potd_count to pinned_by_user_count in users table
ALTER TABLE users RENAME COLUMN potd_count TO pinned_by_user_count;

-- Rename is_potd to is_pinned_by_user in threads table
ALTER TABLE threads RENAME COLUMN is_potd TO is_pinned_by_user;

-- Update the thread_reactions table to change POTD to PINNED_BY_USER
UPDATE thread_reactions SET type = 'PINNED_BY_USER' WHERE type = 'POTD'; 