-- Add turn tracking columns to game_states.
-- turn_state: JSON blob with phase, timer, paused flag, deadline, etc.
-- turn_number: monotonically increasing turn counter for the period.
-- turn_state_version: optimistic-concurrency counter. Every write bumps it,
--   every conditional write checks the expected value. Prevents lost updates
--   when two teacher tabs race to advance or when 25 students submit at once.
ALTER TABLE game_states ADD COLUMN turn_state TEXT NOT NULL DEFAULT '{}';
ALTER TABLE game_states ADD COLUMN turn_number INTEGER NOT NULL DEFAULT 0;
ALTER TABLE game_states ADD COLUMN turn_state_version INTEGER NOT NULL DEFAULT 0;

-- turn_decisions: one row per (period, student, turn). The UNIQUE constraint
-- plus INSERT OR REPLACE gives idempotent submits — a student mashing the
-- button only produces one row. Used to compute submittedCount from truth
-- instead of a drifty counter stored in turn_state JSON.
CREATE TABLE IF NOT EXISTS turn_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  turn_number INTEGER NOT NULL DEFAULT 1,
  decision_data TEXT NOT NULL DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(period_id, student_id, turn_number)
);

CREATE INDEX IF NOT EXISTS idx_turn_decisions_period ON turn_decisions(period_id);
CREATE INDEX IF NOT EXISTS idx_turn_decisions_period_turn ON turn_decisions(period_id, turn_number);
CREATE INDEX IF NOT EXISTS idx_turn_decisions_student ON turn_decisions(student_id);
