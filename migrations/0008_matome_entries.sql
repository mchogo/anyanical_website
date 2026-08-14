CREATE TABLE IF NOT EXISTS matome_entries (
  id            TEXT PRIMARY KEY,
  entry_date    TEXT NOT NULL,
  source_url    TEXT NOT NULL,
  source_author TEXT NOT NULL DEFAULT '',
  headline      TEXT NOT NULL,
  commentary    TEXT NOT NULL,
  hidden        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_matome_entries_date
  ON matome_entries(entry_date, created_at);

CREATE INDEX IF NOT EXISTS idx_matome_entries_hidden
  ON matome_entries(hidden, entry_date);
