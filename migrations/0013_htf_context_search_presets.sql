CREATE TABLE IF NOT EXISTS htf_context_search_presets (
  id              TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  name            TEXT NOT NULL,
  filters_json    TEXT NOT NULL,
  schema_version  INTEGER NOT NULL DEFAULT 1,
  is_default      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_htf_search_presets_user ON htf_context_search_presets(discord_user_id);

-- 同一ユーザー内で既定プリセットは最大1件をDB層でも強制する。
CREATE UNIQUE INDEX IF NOT EXISTS idx_htf_search_presets_one_default
  ON htf_context_search_presets(discord_user_id) WHERE is_default = 1;
