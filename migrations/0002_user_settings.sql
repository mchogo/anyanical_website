CREATE TABLE IF NOT EXISTS user_settings (
  discord_user_id TEXT PRIMARY KEY,
  favorites_json  TEXT NOT NULL DEFAULT '[]'
);
