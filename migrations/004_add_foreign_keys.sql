-- Add foreign key constraints for threads
ALTER TABLE threads 
    ADD CONSTRAINT threads_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE threads 
    ADD CONSTRAINT threads_category_id_fk 
    FOREIGN KEY (category_id) REFERENCES categories(id);

-- Add foreign key constraints for replies
ALTER TABLE replies 
    ADD CONSTRAINT replies_thread_id_fk 
    FOREIGN KEY (thread_id) REFERENCES threads(id);

ALTER TABLE replies 
    ADD CONSTRAINT replies_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE replies 
    ADD CONSTRAINT replies_parent_reply_id_fk 
    FOREIGN KEY (parent_reply_id) REFERENCES replies(id);

-- Add foreign key constraints for notifications
ALTER TABLE notifications 
    ADD CONSTRAINT notifications_user_id_fk 
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE notifications 
    ADD CONSTRAINT notifications_related_user_id_fk 
    FOREIGN KEY (related_user_id) REFERENCES users(id);

ALTER TABLE notifications 
    ADD CONSTRAINT notifications_thread_id_fk 
    FOREIGN KEY (thread_id) REFERENCES threads(id);

ALTER TABLE notifications 
    ADD CONSTRAINT notifications_reply_id_fk 
    FOREIGN KEY (reply_id) REFERENCES replies(id); 