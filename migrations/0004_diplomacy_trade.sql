-- 0004_diplomacy_trade.sql
-- Student-to-student diplomacy and trading.
--
-- Two tables:
--   * trade_offers: one-side proposes a resource swap; the other accepts or
--     rejects. Both sides must be in the same period. Status transitions are
--     'pending' -> 'accepted' | 'rejected' | 'expired' | 'cancelled'.
--   * diplomacy_relations: one row per (period_id, student_a, student_b)
--     where student_a < student_b (so the pair is canonical). Tracks alliance
--     state and treaty-of-non-aggression. Teachers can inspect/override.
--
-- Indexes cover the common queries: a student fetching their own pending
-- offers, and a teacher overview listing all offers in a period.

CREATE TABLE IF NOT EXISTS trade_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER NOT NULL,
  proposer_id INTEGER NOT NULL,          -- students.id of proposer
  recipient_id INTEGER NOT NULL,         -- students.id of recipient
  turn_number INTEGER NOT NULL DEFAULT 1,
  offer_data TEXT NOT NULL DEFAULT '{}', -- JSON: { offer: {resource: amount}, request: {resource: amount}, note: string }
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | rejected | expired | cancelled
  responded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
  FOREIGN KEY (proposer_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trade_offers_period ON trade_offers(period_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_recipient_pending ON trade_offers(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_trade_offers_proposer ON trade_offers(proposer_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_period_turn ON trade_offers(period_id, turn_number);

CREATE TABLE IF NOT EXISTS diplomacy_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER NOT NULL,
  student_a_id INTEGER NOT NULL,         -- canonical: always the lower ID
  student_b_id INTEGER NOT NULL,         -- canonical: always the higher ID
  relation_type TEXT NOT NULL DEFAULT 'neutral', -- neutral | treaty | alliance | hostile
  established_turn INTEGER,
  notes TEXT,                            -- optional teacher-visible notes
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
  FOREIGN KEY (student_a_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (student_b_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(period_id, student_a_id, student_b_id)
);

CREATE INDEX IF NOT EXISTS idx_diplomacy_period ON diplomacy_relations(period_id);
CREATE INDEX IF NOT EXISTS idx_diplomacy_a ON diplomacy_relations(period_id, student_a_id);
CREATE INDEX IF NOT EXISTS idx_diplomacy_b ON diplomacy_relations(period_id, student_b_id);
