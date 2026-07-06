CREATE TABLE IF NOT EXISTS daily_missions (
  discord_user_id TEXT NOT NULL,
  date            TEXT NOT NULL,
  completed_json  TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  PRIMARY KEY (discord_user_id, date)
);
