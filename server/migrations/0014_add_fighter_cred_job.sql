create table reaction_weights (
	reaction_type text not null,
	user_status text not null,
	role text not null,
	weight integer not null,
	primary key (reaction_type, user_status, role)
);

insert into reaction_weights (reaction_type, user_status, role, weight) values
('LIKE', 'AMATEUR', 'USER', 1),
('REPLY', 'AMATEUR', 'USER', 5),
('POTD', 'AMATEUR', 'USER', 15),
('LIKE', 'AMATEUR', 'ADMIN', 1),
('REPLY', 'AMATEUR', 'ADMIN', 5),
('POTD', 'AMATEUR', 'ADMIN', 15);


CREATE TABLE daily_fighter_cred (
  user_id TEXT NOT NULL,
  interaction_day DATE NOT NULL,
  
  like_count INTEGER DEFAULT 0,
  potd_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,

  like_score INTEGER DEFAULT 0,
  potd_score INTEGER DEFAULT 0,
  reply_score INTEGER DEFAULT 0,

  daily_fighter_cred INTEGER DEFAULT 0,
  total_fighter_cred INTEGER DEFAULT 0,

  PRIMARY KEY (user_id, interaction_day)
);