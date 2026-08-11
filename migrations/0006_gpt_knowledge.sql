CREATE TABLE IF NOT EXISTS gpt_knowledge_chunks (
  id         TEXT PRIMARY KEY,
  source_id  TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  keywords   TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gpt_knowledge_source
  ON gpt_knowledge_chunks(source_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_gpt_knowledge_title
  ON gpt_knowledge_chunks(title);
