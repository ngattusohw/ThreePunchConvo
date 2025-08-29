-- New migration: add_fighter_invitations_table.sql
CREATE TABLE fighter_invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  invited_by_admin_id TEXT NOT NULL REFERENCES users(id),
  invitation_token TEXT NOT NULL UNIQUE,
  fighter_name TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, EXPIRED
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by_user_id TEXT REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fighter_invitations_email ON fighter_invitations(email);
CREATE INDEX idx_fighter_invitations_token ON fighter_invitations(invitation_token);
CREATE INDEX idx_fighter_invitations_status ON fighter_invitations(status);