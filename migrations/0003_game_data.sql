CREATE TABLE IF NOT EXISTS gap_predictions (
  id              TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  week_key        TEXT NOT NULL,
  symbol          TEXT NOT NULL,
  direction       TEXT NOT NULL,
  confidence      INTEGER NOT NULL,
  note            TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL,
  UNIQUE(discord_user_id, week_key, symbol)
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id              TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  type_code       TEXT NOT NULL,
  answers_json    TEXT,
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gap_pred_user ON gap_predictions(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_gap_pred_week ON gap_predictions(week_key);
CREATE INDEX IF NOT EXISTS idx_quiz_user     ON quiz_results(discord_user_id);
