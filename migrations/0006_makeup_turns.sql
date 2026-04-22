-- Make-up turns: absent students can submit a decision for a past turn
-- after the teacher has ended the phase. Rather than silently dropping
-- their turn, we now record an explicit row in turn_decisions with
-- status='missed', and when the student comes back we flip it to
-- 'made_up' (with real decision_data attached).
--
-- Status lifecycle:
--   submitted -> set when student submits during the active decision phase.
--   missed    -> inserted by end-phase for every enrolled student in the
--                period who does NOT already have a turn_decisions row for
--                the current turn_number.
--   made_up   -> existing 'missed' row is updated when the student
--                retroactively submits a decision.
--
-- All existing rows are 'submitted' (that's what they were when they
-- were written, before we introduced this mechanic).
ALTER TABLE turn_decisions
  ADD COLUMN status TEXT NOT NULL DEFAULT 'submitted';

-- Fast lookup: "which of my students have missed turns outstanding?"
CREATE INDEX IF NOT EXISTS idx_turn_decisions_status
  ON turn_decisions(period_id, status);

-- Fast lookup per-student: "which turns do I need to make up?"
CREATE INDEX IF NOT EXISTS idx_turn_decisions_student_status
  ON turn_decisions(student_id, status);
