CREATE TABLE IF NOT EXISTS gpt_oauth_sessions (
  token_hash TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  access_allowed INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gpt_oauth_sessions_user
  ON gpt_oauth_sessions(discord_user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_gpt_oauth_sessions_expiry
  ON gpt_oauth_sessions(expires_at);
