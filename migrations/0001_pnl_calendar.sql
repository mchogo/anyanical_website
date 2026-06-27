CREATE TABLE IF NOT EXISTS accounts (
  id              TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  name            TEXT NOT NULL,
  unit            TEXT NOT NULL,
  created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_records (
  id              TEXT PRIMARY KEY,
  account_id      TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  date            TEXT NOT NULL,
  pnl             REAL NOT NULL,
  notes           TEXT,
  UNIQUE(account_id, date)
);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_records_user  ON daily_records(discord_user_id);
