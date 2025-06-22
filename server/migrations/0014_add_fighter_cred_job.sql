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


WITH all_interactions AS (
  -- Reactions to threads
  SELECT
    t.user_id,
    tr.user_id AS actor_id,
    tr.type AS interaction_type,
    DATE_TRUNC('day', tr.created_at) AS interaction_day
  FROM threads t
  JOIN thread_reactions tr ON tr.thread_id = t.id
  WHERE tr.user_id IS DISTINCT FROM t.user_id

  UNION ALL

  -- Replies
  SELECT 
    t.user_id,
    r.user_id AS actor_id,
    'REPLY' AS interaction_type,
    DATE_TRUNC('day', r.created_at) AS interaction_day
  FROM threads t
  JOIN replies r ON r.thread_id = t.id 
  WHERE r.user_id IS DISTINCT FROM t.user_id

  UNION ALL

  -- Reactions to replies
  SELECT
    t.user_id,
    rr.user_id AS actor_id,
    rr.type AS interaction_type,
    DATE_TRUNC('day', rr.created_at) AS interaction_day
  FROM reply_reactions rr
  JOIN replies r ON rr.reply_id = r.id
  JOIN threads t ON r.thread_id = t.id
  WHERE rr.user_id IS DISTINCT FROM r.user_id
),

scored_interactions_today AS (
  SELECT
    ai.user_id,
    ai.interaction_day,
    ai.interaction_type,
    COALESCE(w.weight, 0) AS weight
  FROM all_interactions ai
  LEFT JOIN users u ON ai.actor_id = u.id 
  LEFT JOIN reaction_weights w
    ON w.reaction_type = ai.interaction_type
       AND w.user_status = u.status
       AND w.role = u.role
  WHERE u.disabled IS DISTINCT FROM TRUE
    AND ai.interaction_day = CURRENT_DATE
),

aggregated_scores AS (
  SELECT
    si.user_id,
    si.interaction_day,
    COUNT(*) FILTER (WHERE si.interaction_type = 'LIKE') AS like_count,
    COUNT(*) FILTER (WHERE si.interaction_type = 'POTD') AS potd_count,
    COUNT(*) FILTER (WHERE si.interaction_type = 'REPLY') AS reply_count,

    SUM(weight) FILTER (WHERE si.interaction_type = 'LIKE') AS like_score,
    SUM(weight) FILTER (WHERE si.interaction_type = 'POTD') AS potd_score,
    SUM(weight) FILTER (WHERE si.interaction_type = 'REPLY') AS reply_score,

    SUM(weight) AS daily_fighter_cred
  FROM scored_interactions_today si
  GROUP BY si.user_id, si.interaction_day
)

SELECT
  u.id AS user_id,
  CURRENT_DATE AS interaction_day,
  COALESCE(a.like_count, 0) AS like_count,
  COALESCE(a.potd_count, 0) AS potd_count,
  COALESCE(a.reply_count, 0) AS reply_count,

  COALESCE(a.like_score, 0) AS like_score,
  COALESCE(a.potd_score, 0) AS potd_score,
  COALESCE(a.reply_score, 0) AS reply_score,

  COALESCE(a.daily_fighter_cred, 0) AS daily_fighter_cred
FROM users u
LEFT JOIN aggregated_scores a ON a.user_id = u.id
WHERE u.disabled IS DISTINCT FROM TRUE
ORDER BY daily_fighter_cred DESC;