CREATE TABLE IF NOT EXISTS htf_context_states (
  symbol            TEXT NOT NULL,
  timeframe         TEXT NOT NULL,
  state             INTEGER NOT NULL,
  ref_high          REAL,
  ref_low           REAL,
  reversal_warning  INTEGER NOT NULL DEFAULT 0,
  bar_time          INTEGER NOT NULL,
  updated_at        TEXT NOT NULL,
  PRIMARY KEY (symbol, timeframe)
);
