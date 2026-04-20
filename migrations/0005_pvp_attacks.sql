-- 0005_pvp_attacks.sql
-- Student-vs-student (PvP) combat resolution log.
--
-- Each row is one resolved attack. The server computes the outcome
-- synchronously when the attacker POSTs /diplomacy/student/attacks:
--   1. Pull attacker.progress_data.stats.martial, defender.progress_data.stats.martial
--   2. Attack total  = attackerMartial + 1d6
--   3. Defense total = defenderMartial + 1d6 + min(3, walls)*1d8 + fortifyDice*1d8
--   4. margin = attack_total - defend_total
--   5. outcome tier is derived from margin (stalemate / minor / decisive)
--
-- Neither progress_data blob is mutated by the server. The attacker's
-- client applies its own effects (culture gain, warsWon++) when the POST
-- returns; the defender's client applies its effects (population loss,
-- culture hit) when it polls and sees a new incoming attack.
--
-- attacker_ack / defender_ack let each side mark "I've applied the
-- consequences locally" so we can tell the defender that there are unread
-- incoming attacks. A fresh row starts with both acks = 0.

CREATE TABLE IF NOT EXISTS pvp_attacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id INTEGER NOT NULL,
  attacker_id INTEGER NOT NULL,           -- students.id of aggressor
  defender_id INTEGER NOT NULL,           -- students.id of target
  turn_number INTEGER NOT NULL DEFAULT 0,
  attack_total INTEGER NOT NULL,
  defend_total INTEGER NOT NULL,
  margin INTEGER NOT NULL,                -- attack_total - defend_total
  outcome TEXT NOT NULL,                  -- 'attacker_decisive' | 'attacker_victory' | 'stalemate' | 'defender_victory' | 'defender_decisive'
  rolls_json TEXT NOT NULL DEFAULT '{}',  -- full dice breakdown for client display
  effects_json TEXT NOT NULL DEFAULT '{}',-- { attacker: {culture, warsWon, ...}, defender: {populationPct, culture, ...} }
  attacker_ack INTEGER NOT NULL DEFAULT 0,
  defender_ack INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
  FOREIGN KEY (attacker_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (defender_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pvp_attacks_period ON pvp_attacks(period_id);
CREATE INDEX IF NOT EXISTS idx_pvp_attacks_attacker ON pvp_attacks(attacker_id);
CREATE INDEX IF NOT EXISTS idx_pvp_attacks_defender ON pvp_attacks(defender_id);
CREATE INDEX IF NOT EXISTS idx_pvp_attacks_period_turn ON pvp_attacks(period_id, turn_number);
CREATE INDEX IF NOT EXISTS idx_pvp_attacks_defender_unack ON pvp_attacks(defender_id, defender_ack);
