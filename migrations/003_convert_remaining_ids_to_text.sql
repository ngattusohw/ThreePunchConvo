-- Drop existing foreign key constraints
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_reply_id_replies_id_fk;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_thread_id_threads_id_fk;
ALTER TABLE replies DROP CONSTRAINT IF EXISTS replies_thread_id_threads_id_fk;
ALTER TABLE replies DROP CONSTRAINT IF EXISTS replies_parent_reply_id_replies_id_fk;
ALTER TABLE thread_media DROP CONSTRAINT IF EXISTS thread_media_thread_id_threads_id_fk;
ALTER TABLE reply_media DROP CONSTRAINT IF EXISTS reply_media_reply_id_replies_id_fk;
ALTER TABLE thread_reactions DROP CONSTRAINT IF EXISTS thread_reactions_thread_id_threads_id_fk;
ALTER TABLE reply_reactions DROP CONSTRAINT IF EXISTS reply_reactions_reply_id_replies_id_fk;

-- Convert primary key columns to text
ALTER TABLE replies ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE threads ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE thread_media ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE reply_media ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE thread_reactions ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE reply_reactions ALTER COLUMN id TYPE text USING id::text;

-- Convert foreign key columns to text
ALTER TABLE notifications ALTER COLUMN reply_id TYPE text USING reply_id::text;
ALTER TABLE notifications ALTER COLUMN thread_id TYPE text USING thread_id::text;
ALTER TABLE replies ALTER COLUMN thread_id TYPE text USING thread_id::text;
ALTER TABLE replies ALTER COLUMN parent_reply_id TYPE text USING parent_reply_id::text;
ALTER TABLE thread_media ALTER COLUMN thread_id TYPE text USING thread_id::text;
ALTER TABLE reply_media ALTER COLUMN reply_id TYPE text USING reply_id::text;
ALTER TABLE thread_reactions ALTER COLUMN thread_id TYPE text USING thread_id::text;
ALTER TABLE reply_reactions ALTER COLUMN reply_id TYPE text USING reply_id::text;

-- Recreate foreign key constraints
ALTER TABLE notifications ADD CONSTRAINT notifications_reply_id_replies_id_fk 
    FOREIGN KEY (reply_id) REFERENCES replies(id);
ALTER TABLE notifications ADD CONSTRAINT notifications_thread_id_threads_id_fk 
    FOREIGN KEY (thread_id) REFERENCES threads(id);
ALTER TABLE replies ADD CONSTRAINT replies_thread_id_threads_id_fk 
    FOREIGN KEY (thread_id) REFERENCES threads(id);
ALTER TABLE replies ADD CONSTRAINT replies_parent_reply_id_replies_id_fk 
    FOREIGN KEY (parent_reply_id) REFERENCES replies(id);
ALTER TABLE thread_media ADD CONSTRAINT thread_media_thread_id_threads_id_fk 
    FOREIGN KEY (thread_id) REFERENCES threads(id);
ALTER TABLE reply_media ADD CONSTRAINT reply_media_reply_id_replies_id_fk 
    FOREIGN KEY (reply_id) REFERENCES replies(id);
ALTER TABLE thread_reactions ADD CONSTRAINT thread_reactions_thread_id_threads_id_fk 
    FOREIGN KEY (thread_id) REFERENCES threads(id);
ALTER TABLE reply_reactions ADD CONSTRAINT reply_reactions_reply_id_replies_id_fk 
    FOREIGN KEY (reply_id) REFERENCES replies(id); 