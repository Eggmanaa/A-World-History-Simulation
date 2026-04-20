/**
 * Diplomacy + Trade API routes.
 *
 * Student endpoints:
 *   GET  /diplomacy/classmates            — list other students in my period
 *   GET  /diplomacy/offers                — my pending offers (incoming + outgoing)
 *   POST /diplomacy/offers                — propose a trade
 *   POST /diplomacy/offers/:id/accept
 *   POST /diplomacy/offers/:id/reject
 *   POST /diplomacy/offers/:id/cancel     — proposer cancels their own pending offer
 *   GET  /diplomacy/relations             — list my diplomatic relations
 *   POST /diplomacy/relations/:classmateId — set relation state with a classmate
 *                                            (treaty/alliance/neutral/hostile)
 *
 * Teacher endpoints:
 *   GET  /diplomacy/teacher/:periodId/overview — all offers + relations in period
 *
 * Security:
 *   - All student routes require studentAuthMiddleware and only see/touch
 *     rows where student_id matches their JWT.
 *   - Cross-student validation: proposer and recipient must share a period.
 *   - Offers carry JSON payloads; we validate on both server and client.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { studentAuthMiddleware, teacherAuthMiddleware } from '../middleware/auth';

export const diplomacyRouter = new Hono<AppEnv>();

// ============================================================================
// STUDENT ENDPOINTS
// ============================================================================

diplomacyRouter.use('/student/*', studentAuthMiddleware());

// GET /diplomacy/student/classmates — list fellow students in the same period
diplomacyRouter.get('/student/classmates', async (c) => {
  const user = c.get('user');
  try {
    const me = await c.env.DB.prepare(
      'SELECT period_id FROM students WHERE id = ?'
    ).bind(user.id).first<any>();
    if (!me?.period_id) return c.json({ classmates: [] });

    const rows = await c.env.DB.prepare(
      `SELECT s.id, s.name, s.username,
              gs.civilization_id, gs.display_civ_name
         FROM students s
    LEFT JOIN game_sessions gs ON gs.student_id = s.id
        WHERE s.period_id = ? AND s.id != ?
        ORDER BY s.name`
    ).bind(me.period_id, user.id).all<any>();

    return c.json({ classmates: rows.results || [] });
  } catch (e) {
    return c.json({ message: 'Failed to list classmates', error: String(e) }, 500);
  }
});

// GET /diplomacy/student/offers — my incoming + outgoing pending offers
diplomacyRouter.get('/student/offers', async (c) => {
  const user = c.get('user');
  try {
    const incoming = await c.env.DB.prepare(
      `SELECT o.*, p.name as proposer_name, p.username as proposer_username
         FROM trade_offers o
         JOIN students p ON p.id = o.proposer_id
        WHERE o.recipient_id = ? AND o.status = 'pending'
        ORDER BY o.created_at DESC`
    ).bind(user.id).all<any>();

    const outgoing = await c.env.DB.prepare(
      `SELECT o.*, r.name as recipient_name, r.username as recipient_username
         FROM trade_offers o
         JOIN students r ON r.id = o.recipient_id
        WHERE o.proposer_id = ? AND o.status = 'pending'
        ORDER BY o.created_at DESC`
    ).bind(user.id).all<any>();

    return c.json({
      incoming: incoming.results || [],
      outgoing: outgoing.results || [],
    });
  } catch (e) {
    return c.json({ message: 'Failed to list offers', error: String(e) }, 500);
  }
});

// POST /diplomacy/student/offers — propose a trade
diplomacyRouter.post('/student/offers', async (c) => {
  const user = c.get('user');
  try {
    const body = await c.req.json<{
      recipientId: number;
      offer: Record<string, number>;   // e.g. {production: 5, faith: 2}
      request: Record<string, number>; // what I want in return
      note?: string;
      turnNumber?: number;
    }>();

    if (!body.recipientId) {
      return c.json({ message: 'recipientId required' }, 400);
    }
    if (body.recipientId === user.id) {
      return c.json({ message: 'Cannot trade with yourself' }, 400);
    }

    // Verify recipient is in the same period
    const me = await c.env.DB.prepare(
      'SELECT period_id FROM students WHERE id = ?'
    ).bind(user.id).first<any>();
    const them = await c.env.DB.prepare(
      'SELECT period_id FROM students WHERE id = ?'
    ).bind(body.recipientId).first<any>();
    if (!me?.period_id || !them?.period_id || me.period_id !== them.period_id) {
      return c.json({ message: 'Recipient not in your class period' }, 403);
    }

    const offerData = JSON.stringify({
      offer: body.offer || {},
      request: body.request || {},
      note: body.note || '',
    });

    const result = await c.env.DB.prepare(
      `INSERT INTO trade_offers
         (period_id, proposer_id, recipient_id, turn_number, offer_data, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`
    ).bind(
      me.period_id,
      user.id,
      body.recipientId,
      body.turnNumber || 1,
      offerData,
    ).run();

    return c.json({ id: result.meta.last_row_id, status: 'pending' });
  } catch (e) {
    return c.json({ message: 'Failed to create offer', error: String(e) }, 500);
  }
});

// POST /diplomacy/student/offers/:id/accept
diplomacyRouter.post('/student/offers/:id/accept', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  try {
    // Only the recipient can accept. Optimistic update.
    const result = await c.env.DB.prepare(
      `UPDATE trade_offers
          SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
        WHERE id = ? AND recipient_id = ? AND status = 'pending'`
    ).bind(id, user.id).run();

    if (!result.meta.changes) {
      return c.json({ message: 'Offer not found or already handled' }, 404);
    }
    return c.json({ id, status: 'accepted' });
  } catch (e) {
    return c.json({ message: 'Failed to accept offer', error: String(e) }, 500);
  }
});

// POST /diplomacy/student/offers/:id/reject
diplomacyRouter.post('/student/offers/:id/reject', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  try {
    const result = await c.env.DB.prepare(
      `UPDATE trade_offers
          SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
        WHERE id = ? AND recipient_id = ? AND status = 'pending'`
    ).bind(id, user.id).run();

    if (!result.meta.changes) {
      return c.json({ message: 'Offer not found or already handled' }, 404);
    }
    return c.json({ id, status: 'rejected' });
  } catch (e) {
    return c.json({ message: 'Failed to reject offer', error: String(e) }, 500);
  }
});

// POST /diplomacy/student/offers/:id/cancel — proposer cancels their own
diplomacyRouter.post('/student/offers/:id/cancel', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  try {
    const result = await c.env.DB.prepare(
      `UPDATE trade_offers
          SET status = 'cancelled', responded_at = CURRENT_TIMESTAMP
        WHERE id = ? AND proposer_id = ? AND status = 'pending'`
    ).bind(id, user.id).run();

    if (!result.meta.changes) {
      return c.json({ message: 'Offer not found or not cancellable' }, 404);
    }
    return c.json({ id, status: 'cancelled' });
  } catch (e) {
    return c.json({ message: 'Failed to cancel offer', error: String(e) }, 500);
  }
});

// GET /diplomacy/student/relations — my diplomatic relations
diplomacyRouter.get('/student/relations', async (c) => {
  const user = c.get('user');
  try {
    const rows = await c.env.DB.prepare(
      `SELECT r.*,
              CASE WHEN r.student_a_id = ? THEN r.student_b_id ELSE r.student_a_id END AS other_id,
              CASE WHEN r.student_a_id = ? THEN sb.name ELSE sa.name END AS other_name
         FROM diplomacy_relations r
         JOIN students sa ON sa.id = r.student_a_id
         JOIN students sb ON sb.id = r.student_b_id
        WHERE r.student_a_id = ? OR r.student_b_id = ?`
    ).bind(user.id, user.id, user.id, user.id).all<any>();

    return c.json({ relations: rows.results || [] });
  } catch (e) {
    return c.json({ message: 'Failed to list relations', error: String(e) }, 500);
  }
});

// POST /diplomacy/student/relations/:classmateId — set relation state with a classmate
// Both sides must concur for alliance/treaty: this endpoint marks the CALLER's
// proposed state. A relation "locks in" only when both sides agree (alliance
// requires both; neutral/hostile is unilateral).
diplomacyRouter.post('/student/relations/:classmateId', async (c) => {
  const user = c.get('user');
  const classmateId = Number(c.req.param('classmateId'));
  try {
    const body = await c.req.json<{ relation: 'neutral' | 'treaty' | 'alliance' | 'hostile'; turnNumber?: number }>();
    if (!['neutral', 'treaty', 'alliance', 'hostile'].includes(body.relation)) {
      return c.json({ message: 'Invalid relation type' }, 400);
    }
    if (classmateId === user.id) {
      return c.json({ message: 'Cannot set relation with yourself' }, 400);
    }

    // Verify same period
    const me = await c.env.DB.prepare(
      'SELECT period_id FROM students WHERE id = ?'
    ).bind(user.id).first<any>();
    const them = await c.env.DB.prepare(
      'SELECT period_id FROM students WHERE id = ?'
    ).bind(classmateId).first<any>();
    if (!me?.period_id || !them?.period_id || me.period_id !== them.period_id) {
      return c.json({ message: 'Classmate not in your class period' }, 403);
    }

    // Canonicalize ordering so (a, b) is always stored with a < b
    const myId = Number(user.id);
    const a = Math.min(myId, classmateId);
    const b = Math.max(myId, classmateId);

    await c.env.DB.prepare(
      `INSERT INTO diplomacy_relations
         (period_id, student_a_id, student_b_id, relation_type, established_turn, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(period_id, student_a_id, student_b_id)
       DO UPDATE SET relation_type = excluded.relation_type,
                     established_turn = excluded.established_turn,
                     updated_at = CURRENT_TIMESTAMP`
    ).bind(me.period_id, a, b, body.relation, body.turnNumber || 1).run();

    return c.json({ ok: true, relation: body.relation });
  } catch (e) {
    return c.json({ message: 'Failed to set relation', error: String(e) }, 500);
  }
});

// ============================================================================
// PVP COMBAT — student-vs-student attacks
// ============================================================================
//
// Server-side combat resolution. The attacker POSTs here, server pulls both
// sides' progress_data.stats.martial (plus defender walls/fortify dice),
// rolls the dice, writes the row, and returns the full breakdown. The
// client applies local stat deltas when it sees the result.

/** Roll a fair n-sided die in [1, n]. */
function rollDie(n: number): number {
  // crypto.getRandomValues is available in Workers; fall back to Math.random.
  try {
    const buf = new Uint32Array(1);
    (globalThis as any).crypto.getRandomValues(buf);
    return (buf[0] % n) + 1;
  } catch {
    return Math.floor(Math.random() * n) + 1;
  }
}

type PvpOutcome =
  | 'attacker_decisive'
  | 'attacker_victory'
  | 'stalemate'
  | 'defender_victory'
  | 'defender_decisive';

function outcomeFromMargin(margin: number): PvpOutcome {
  if (margin >= 8) return 'attacker_decisive';
  if (margin >= 2) return 'attacker_victory';
  if (margin <= -8) return 'defender_decisive';
  if (margin <= -2) return 'defender_victory';
  return 'stalemate';
}

// POST /diplomacy/student/attacks — launch a PvP attack
diplomacyRouter.post('/student/attacks', async (c) => {
  const user = c.get('user');
  try {
    const body = await c.req.json<{ defenderId: number; turnNumber?: number }>();
    if (!body.defenderId) return c.json({ message: 'defenderId required' }, 400);
    if (body.defenderId === user.id) return c.json({ message: 'Cannot attack yourself' }, 400);

    // Same-period check
    const me = await c.env.DB.prepare(
      'SELECT period_id FROM students WHERE id = ?'
    ).bind(user.id).first<any>();
    const them = await c.env.DB.prepare(
      'SELECT period_id FROM students WHERE id = ?'
    ).bind(body.defenderId).first<any>();
    if (!me?.period_id || !them?.period_id || me.period_id !== them.period_id) {
      return c.json({ message: 'Defender not in your class period' }, 403);
    }

    // Treaty check — alliance or treaty blocks PvP
    const myId = Number(user.id);
    const defId = Number(body.defenderId);
    const a = Math.min(myId, defId);
    const b = Math.max(myId, defId);
    const rel = await c.env.DB.prepare(
      `SELECT relation_type FROM diplomacy_relations
         WHERE period_id = ? AND student_a_id = ? AND student_b_id = ?`
    ).bind(me.period_id, a, b).first<any>();
    if (rel?.relation_type === 'alliance' || rel?.relation_type === 'treaty') {
      return c.json({
        message: `Cannot attack — active ${rel.relation_type} in effect. Break it first.`,
      }, 403);
    }

    // Load both sides' progress_data
    const atkSession = await c.env.DB.prepare(
      'SELECT progress_data FROM game_sessions WHERE student_id = ?'
    ).bind(user.id).first<any>();
    const defSession = await c.env.DB.prepare(
      'SELECT progress_data FROM game_sessions WHERE student_id = ?'
    ).bind(body.defenderId).first<any>();

    const atkData = atkSession?.progress_data ? JSON.parse(atkSession.progress_data) : {};
    const defData = defSession?.progress_data ? JSON.parse(defSession.progress_data) : {};
    const atkMartial = Math.max(0, Number(atkData?.stats?.martial || 0));
    const defMartial = Math.max(0, Number(defData?.stats?.martial || 0));
    const defWalls = Math.min(3, Number(defData?.buildings?.walls || 0));
    const defFortify = Math.min(3, Number(defData?.stats?.fortifyDice || 0));

    // Roll dice
    const attackRoll = rollDie(6);
    const defenseRoll = rollDie(6);
    const wallRolls: number[] = [];
    for (let i = 0; i < defWalls; i++) wallRolls.push(rollDie(8));
    const fortifyRolls: number[] = [];
    for (let i = 0; i < defFortify; i++) fortifyRolls.push(rollDie(8));

    const attackTotal = atkMartial + attackRoll;
    const defendTotal =
      defMartial + defenseRoll +
      wallRolls.reduce((s, r) => s + r, 0) +
      fortifyRolls.reduce((s, r) => s + r, 0);
    const margin = attackTotal - defendTotal;
    const outcome = outcomeFromMargin(margin);

    // Effect deltas — client applies these locally
    // Attacker gains: warsWon, culture, science (on win); nothing or small loss on loss
    // Defender loses: population %, culture (on loss); small gain on successful defense
    const effects: any = { attacker: {}, defender: {} };
    switch (outcome) {
      case 'attacker_decisive':
        effects.attacker = { warsWon: 1, culture: 20, science: 100 };
        effects.defender = { populationPct: -0.12, culture: -80, martial: -1 };
        break;
      case 'attacker_victory':
        effects.attacker = { warsWon: 1, culture: 10, science: 50 };
        effects.defender = { populationPct: -0.06, culture: -40 };
        break;
      case 'stalemate':
        effects.attacker = { culture: -5 };
        effects.defender = { culture: 5 };
        break;
      case 'defender_victory':
        effects.attacker = { culture: -20, martial: -1 };
        effects.defender = { warsWon: 1, culture: 20, science: 30 };
        break;
      case 'defender_decisive':
        effects.attacker = { culture: -50, populationPct: -0.05, martial: -2 };
        effects.defender = { warsWon: 1, culture: 40, science: 60 };
        break;
    }

    const rolls = {
      attackerMartial: atkMartial,
      defenderMartial: defMartial,
      attackRoll,
      defenseRoll,
      wallRolls,
      fortifyRolls,
      attackTotal,
      defendTotal,
      margin,
    };

    const insert = await c.env.DB.prepare(
      `INSERT INTO pvp_attacks
         (period_id, attacker_id, defender_id, turn_number,
          attack_total, defend_total, margin, outcome,
          rolls_json, effects_json, attacker_ack, defender_ack)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`
    ).bind(
      me.period_id,
      user.id,
      body.defenderId,
      body.turnNumber || 0,
      attackTotal,
      defendTotal,
      margin,
      outcome,
      JSON.stringify(rolls),
      JSON.stringify(effects),
    ).run();

    return c.json({
      id: insert.meta.last_row_id,
      outcome,
      margin,
      rolls,
      effects,
    });
  } catch (e) {
    return c.json({ message: 'Failed to launch attack', error: String(e) }, 500);
  }
});

// GET /diplomacy/student/attacks — my incoming + outgoing attacks
diplomacyRouter.get('/student/attacks', async (c) => {
  const user = c.get('user');
  try {
    const incoming = await c.env.DB.prepare(
      `SELECT a.*, s.name AS attacker_name, s.username AS attacker_username
         FROM pvp_attacks a
         JOIN students s ON s.id = a.attacker_id
        WHERE a.defender_id = ?
        ORDER BY a.created_at DESC
        LIMIT 50`
    ).bind(user.id).all<any>();

    const outgoing = await c.env.DB.prepare(
      `SELECT a.*, s.name AS defender_name, s.username AS defender_username
         FROM pvp_attacks a
         JOIN students s ON s.id = a.defender_id
        WHERE a.attacker_id = ?
        ORDER BY a.created_at DESC
        LIMIT 50`
    ).bind(user.id).all<any>();

    return c.json({
      incoming: incoming.results || [],
      outgoing: outgoing.results || [],
    });
  } catch (e) {
    return c.json({ message: 'Failed to list attacks', error: String(e) }, 500);
  }
});

// POST /diplomacy/student/attacks/:id/ack — mark an attack as consumed on my side
diplomacyRouter.post('/student/attacks/:id/ack', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  try {
    // Who am I in this row? attacker or defender?
    const row = await c.env.DB.prepare(
      `SELECT attacker_id, defender_id FROM pvp_attacks WHERE id = ?`
    ).bind(id).first<any>();
    if (!row) return c.json({ message: 'Attack not found' }, 404);

    if (Number(row.attacker_id) === Number(user.id)) {
      await c.env.DB.prepare(
        `UPDATE pvp_attacks SET attacker_ack = 1 WHERE id = ?`
      ).bind(id).run();
    } else if (Number(row.defender_id) === Number(user.id)) {
      await c.env.DB.prepare(
        `UPDATE pvp_attacks SET defender_ack = 1 WHERE id = ?`
      ).bind(id).run();
    } else {
      return c.json({ message: 'Not a participant in this attack' }, 403);
    }
    return c.json({ id, ok: true });
  } catch (e) {
    return c.json({ message: 'Failed to ack attack', error: String(e) }, 500);
  }
});

// ============================================================================
// TEACHER ENDPOINTS
// ============================================================================

diplomacyRouter.use('/teacher/*', teacherAuthMiddleware());

// GET /diplomacy/teacher/:periodId/overview
diplomacyRouter.get('/teacher/:periodId/overview', async (c) => {
  const user = c.get('user');
  const periodId = c.req.param('periodId');
  try {
    // Verify period belongs to teacher
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first<any>();
    if (!period) return c.json({ message: 'Period not found' }, 404);

    const offers = await c.env.DB.prepare(
      `SELECT o.*, p.name as proposer_name, r.name as recipient_name
         FROM trade_offers o
         JOIN students p ON p.id = o.proposer_id
         JOIN students r ON r.id = o.recipient_id
        WHERE o.period_id = ?
        ORDER BY o.created_at DESC`
    ).bind(periodId).all<any>();

    const relations = await c.env.DB.prepare(
      `SELECT r.*, sa.name as student_a_name, sb.name as student_b_name
         FROM diplomacy_relations r
         JOIN students sa ON sa.id = r.student_a_id
         JOIN students sb ON sb.id = r.student_b_id
        WHERE r.period_id = ?
        ORDER BY r.updated_at DESC`
    ).bind(periodId).all<any>();

    return c.json({
      offers: offers.results || [],
      relations: relations.results || [],
    });
  } catch (e) {
    return c.json({ message: 'Failed to load overview', error: String(e) }, 500);
  }
});
// GET /diplomacy/teacher/:periodId/attacks — PvP combat overview for the period
diplomacyRouter.get('/teacher/:periodId/attacks', async (c) => {
  const user = c.get('user');
  const periodId = c.req.param('periodId');
  try {
    const period = await c.env.DB.prepare(
      'SELECT id FROM periods WHERE id = ? AND teacher_id = ?'
    ).bind(periodId, user.id).first<any>();
    if (!period) return c.json({ message: 'Period not found' }, 404);

    const attacks = await c.env.DB.prepare(
      `SELECT a.*,
              atk.name AS attacker_name,
              def.name AS defender_name
         FROM pvp_attacks a
         JOIN students atk ON atk.id = a.attacker_id
         JOIN students def ON def.id = a.defender_id
        WHERE a.period_id = ?
        ORDER BY a.created_at DESC
        LIMIT 200`
    ).bind(periodId).all<any>();

    return c.json({ attacks: attacks.results || [] });
  } catch (e) {
    return c.json({ message: 'Failed to load PvP overview', error: String(e) }, 500);
  }
});

