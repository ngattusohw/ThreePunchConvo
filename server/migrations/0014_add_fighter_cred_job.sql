create table reaction_weights (
	reaction_type text not null,
	user_status text not null,
	role text not null,
	weight integer not null,
	primary key (reaction_type, user_status, role)
);

insert into reaction_weights (reaction_type, user_status, role, weight) values
('LIKE', '*', 'USER', 1),
('REPLY', '*', 'USER', 5),
('POTD', '*', 'USER', 15),
('LIKE', '*', 'ADMIN', 1),
('REPLY', '*', 'ADMIN', 5),
('POTD', '*', 'ADMIN', 15),
('LIKE', '*', 'MODERATOR', 1),
('REPLY', '*', 'MODERATOR', 5),
('POTD', '*', 'MODERATOR', 15),
('LIKE', '*', 'PREMIUM_USER', 1),
('REPLY', '*', 'PREMIUM_USER', 5),
('POTD', '*', 'PREMIUM_USER', 15),
('LIKE', '*', 'FIGHTER', 3),
('REPLY', '*', 'FIGHTER', 15),
('POTD', '*', 'FIGHTER', 45),
('LIKE', '*', 'INDUSTRY_PROFESSIONAL', 2),
('REPLY', '*', 'INDUSTRY_PROFESSIONAL', 10),
('POTD', '*', 'INDUSTRY_PROFESSIONAL', 30);


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

  current_status TEXT DEFAULT 'AMATEUR',

  PRIMARY KEY (user_id, interaction_day)
);

CREATE TABLE status_config (
  status TEXT NOT NULL,
  percentile INTEGER NOT NULL,
  PRIMARY KEY (status)
);

insert into status_config (status, percentile) values
('AMATEUR', 0),
('REGIONAL_POSTER', 15),
('COMPETITOR', 35),
('RANKED_POSTER', 65),
('CONTENDER', 80),
('CHAMPION', 92),
('HALL_OF_FAMER', 97),
('P4P', 99);