-- Drop foreign key constraints first
ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_follower_id_users_id_fk;
ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_following_id_users_id_fk;
ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_user_id_users_id_fk;
ALTER TABLE poll_votes DROP CONSTRAINT IF EXISTS poll_votes_user_id_users_id_fk;
ALTER TABLE replies DROP CONSTRAINT IF EXISTS replies_user_id_users_id_fk;
ALTER TABLE thread_reactions DROP CONSTRAINT IF EXISTS thread_reactions_user_id_users_id_fk;
ALTER TABLE reply_reactions DROP CONSTRAINT IF EXISTS reply_reactions_user_id_users_id_fk;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_users_id_fk;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_related_user_id_users_id_fk;

-- Convert users.id to text first
ALTER TABLE users ALTER COLUMN id TYPE text USING id::text;

-- Convert follows table columns
ALTER TABLE follows ALTER COLUMN follower_id TYPE text USING follower_id::text;
ALTER TABLE follows ALTER COLUMN following_id TYPE text USING following_id::text;

-- Convert other tables
ALTER TABLE threads ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE poll_votes ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE replies ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE thread_reactions ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE reply_reactions ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE notifications ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE notifications ALTER COLUMN related_user_id TYPE text USING related_user_id::text;

-- Recreate foreign key constraints
ALTER TABLE follows ADD CONSTRAINT follows_follower_id_users_id_fk 
    FOREIGN KEY (follower_id) REFERENCES users(id);
ALTER TABLE follows ADD CONSTRAINT follows_following_id_users_id_fk 
    FOREIGN KEY (following_id) REFERENCES users(id);
ALTER TABLE threads ADD CONSTRAINT threads_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE poll_votes ADD CONSTRAINT poll_votes_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE replies ADD CONSTRAINT replies_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE thread_reactions ADD CONSTRAINT thread_reactions_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE reply_reactions ADD CONSTRAINT reply_reactions_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_users_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE notifications ADD CONSTRAINT notifications_related_user_id_users_id_fk 
    FOREIGN KEY (related_user_id) REFERENCES users(id); 