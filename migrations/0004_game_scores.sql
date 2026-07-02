CREATE TABLE IF NOT EXISTS game_scores (
  id              TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  game            TEXT NOT NULL,
  score           INTEGER NOT NULL,
  best_streak     INTEGER NOT NULL DEFAULT 0,
  meta_json       TEXT,
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(discord_user_id, game);
CREATE INDEX IF NOT EXISTS idx_game_scores_lb   ON game_scores(game, score DESC);
