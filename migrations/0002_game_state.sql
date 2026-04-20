-- Shared game state per period
CREATE TABLE IF NOT EXISTS game_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER NOT NULL UNIQUE,
  current_year INTEGER NOT NULL DEFAULT -50000,
  timeline_index INTEGER NOT NULL DEFAULT 0,
  game_data TEXT NOT NULL DEFAULT '{}',
  event_log TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE
);

-- Pending actions (wars, trades, etc) that teacher must resolve
CREATE TABLE IF NOT EXISTS pending_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_data TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_states_period ON game_states(period_id);
CREATE INDEX IF NOT EXISTS idx_pending_actions_period ON pending_actions(period_id);
CREATE INDEX IF NOT EXISTS idx_pending_actions_status ON pending_actions(status);
