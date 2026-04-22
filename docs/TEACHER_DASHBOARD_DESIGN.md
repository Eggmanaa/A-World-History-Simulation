# Teacher Dashboard — Design Doc

Status: design-only, not yet implemented. This doc is the pitch + scope
for the build. No code lands until Aaron signs off on scope.

## Why

A period contains 8-30 students, each running a civilization on their
own device. The teacher is currently blind: they can see their own civ
(if logged in as one) or squint at the shared leaderboard. They can't:

- See at a glance who's still deciding vs. who's submitted.
- Pause or extend a turn if a student gets stuck.
- Spot the fast learners to pair with stragglers.
- Debrief the class afterward with data about who did what.

The dashboard is the tool the Dean-of-Students lens wants here: a live
classroom-management surface over the simulation. This is the highest-
leverage feature left before Aaron runs the sim with real Bishop Diego
classes at scale.

## Scope (v1)

**In scope:**

1. Roster view: who's in the period, their civ, current turn phase, last
   submitted turn, "submitted this turn Y/N" indicator.
2. Live leaderboard (reuse existing `LiveLeaderboard` component; add
   teacher-mode filters).
3. Diplomacy matrix: NxN grid of civ-to-civ relationships (Ally /
   Neutral / Enemy / Treaty-active).
4. Combat log feed: chronological attacks/raids across the whole
   class, filterable by civ.
5. Basic intervention: "Advance Turn" forces turn submission for
   lagging students (configurable timeout); "Freeze Turn" pauses the
   countdown.
6. Post-game analytics export: a one-click PDF/CSV per class of
   standings, wonders built, treaties formed, action-distribution
   histograms.

**Out of scope for v1:**

- Private teacher-to-student messaging (use existing chat or in-
  person).
- Live grade calculation (post-game only).
- Multi-period roll-ups (one period at a time).
- Spectator replay of a past game.

**Deferred to v2:**

- Student struggle detection (behavioral flags: no actions for 3 turns,
  repeated defeats, etc.).
- Differentiation suggestions ("Maria's Development score is 3x class
  median — consider pairing her with José").
- Diplomacy timeline visualization (Gantt-style).

## Data model additions

The server already exposes most of what we need via existing endpoints:

- `GET /game-session?periodId=X` — all students' public state (already
  returns `civs[]` with stats, combatLog, treaties, etc.).
- `GET /turn-state?periodId=X` — `submittedCount / totalPlayers` for
  the current turn.

**New endpoints needed:**

- `GET /period/:id/teacher-summary` — aggregate view: roster with last-
  login time, submission status, lightweight stats (so the dashboard
  can render without pulling the full game state). Target payload
  under 20 KB for a class of 30.
- `POST /period/:id/force-advance` — teacher overrides turn
  advancement. Requires teacher role JWT.
- `POST /period/:id/freeze-turn` — teacher pauses the timer. Same
  auth.

**Role-based auth:**

- Add a `role` claim to the JWT: `"student" | "teacher"`.
- `D1` migration: `users.role` column, default `'student'`.
- Teacher role required for all dashboard endpoints and any
  intervention action.

**No new game-state fields.** The dashboard is a read-view + two
intervention commands; it doesn't alter civ state.

## UI skeleton

```
+----------------------------------------------------------+
| Bishop Diego — Period 3 | Turn 7 of 24 | 18/22 submitted |
| [Force Advance]  [Freeze Timer]  [Download Class Report] |
+----+-----------------------------------------------------+
|    | OVERVIEW                                            |
| O  | +----+---------+---------+-------+-----+----------+ |
| v  | | #  | Student | Civ     | Stage | Pop | Status   | |
| e  | +----+---------+---------+-------+-----+----------+ |
| r  | | 1  | Ana     | Egypt   | Class | 22  | ✓ Done   | |
| v  | | 2  | Ben     | Sparta  | Barb  | 14  | ⏳ Action | |
| i  | | 3  | Carlos  | Rome    | Class | 19  | ⏳ Build  | |
| e  | | 4  | Diana   | Troy    | Barb  | 11  | ❗ Idle   | |
| w  | | ...                                              | |
|    | +----+---------+---------+-------+-----+----------+ |
| L  |                                                     |
| e  | Filter: [Stage ▾] [Civ ▾] [Status ▾] [Search]       |
| a  | Click any row -> zoomed civ view                    |
| d  |                                                     |
+----+-----------------------------------------------------+
```

Left nav tabs: **Overview** | Leaderboard | Diplomacy | Combat Log |
Analytics | Intervene.

**Overview** is the default. Red flags (❗ Idle, taken zero actions in
N turns) sort to the top so the teacher sees strugglers first.

**Leaderboard** reuses the existing `LiveLeaderboard` component with a
teacher toggle that adds: "low-performer" sort, action-count-per-turn
average, last-submission-time.

**Diplomacy** shows a grid:

```
       Ana  Ben  Carlos  Diana
Ana     -    N     A       E
Ben     N    -     N       E
Carlos  A    N     -       N
Diana   E    E     N       -
```

Cells colored: A = blue (ally), N = grey, E = red, T = outlined (treaty
active). Click a cell to see the treaty details or recent combat
between those two.

**Combat Log** is a time-sorted feed:

```
Turn 7: Ben (Sparta) attacks Diana (Troy) — Decisive Victory
Turn 6: Raiders vs Carlos (Rome) — Repelled
Turn 6: Diana (Troy) attacks Ben (Sparta) — Defeat
...
```

Click to expand roll details (reuse `AttackOutcomePopup`'s breakdown).

**Analytics** is end-of-game only. One-page summary:

- Class median / mean / stddev of final Population, Culture, Science.
- Action histogram (how many times was each of the 10 actions taken
  across the class? who was the outlier?).
- Wonders built (which civs, at what turns).
- Treaties formed / broken count.
- Export to PDF (reuse existing per-student PDF skill; bundle into one
  multi-page class report).

**Intervene** is a small utility panel:

- Force-advance turn (with confirmation)
- Freeze timer (with duration picker)
- Kick student (rare — archives their civ and removes from turn
  counting)
- Send class-wide announcement (optional; writes to each civ's
  `messages` array)

## Implementation steps

Rough sequence, each a separate commit:

1. Add `role` column to users table; migration 0004_user_roles.sql.
2. Update JWT issuance to include `role`; update auth middleware to
   guard `/period/*/teacher-*` routes.
3. Build `GET /period/:id/teacher-summary` endpoint.
4. New `TeacherDashboard.tsx` page mounted at `/teacher/:periodId`.
   Start with Overview tab only.
5. Leaderboard tab (thin wrapper around existing `LiveLeaderboard`).
6. Diplomacy matrix tab (new component; reuses treaty types).
7. Combat Log tab (aggregate across all civs' `combatLog` arrays).
8. Force-advance endpoint + button.
9. Freeze-timer endpoint + button.
10. End-of-game class report PDF (extends per-student PDF export).

Each commit ships independently. The dashboard is behind a
`?teacher=1` query flag until ~step 6 so we don't expose an
incomplete UI to real teachers during development.

## Effort estimate

For a solo dev with this codebase context:

- Steps 1-3 (auth + data endpoint): ~2 hours
- Steps 4-6 (UI tabs): ~4 hours
- Steps 7-8 (combat feed + force advance): ~2 hours
- Steps 9-10 (freeze + end-of-game report): ~2 hours
- Smoke-test with a mock 10-civ period: ~1 hour

**~10-12 hours total.** Reasonable to split across two sessions.

## Open questions

1. Auth: does Aaron want a separate teacher login, or "promote this
   student to teacher" via an admin flag? Former is cleaner; latter is
   faster to ship.
2. Force-advance semantics: should non-submitted students be given a
   default "skip turn" action, or should their current state just
   freeze until next turn? Former keeps the game moving; latter
   preserves agency.
3. Class report: per-period or per-class (= period × date)? A teacher
   running 5 periods/day probably wants the latter but v1 can do per-
   period only.
4. Do we need multi-teacher support (co-teachers)? Probably yes at
   Bishop Diego (Aaron is Dean + International Coordinator + counselor
   so there's overlap). Easy to add later — a period has `teacher_ids[]`
   instead of single owner.

## Aaron — decisions needed

Before implementation:

- Scope: is v1 as listed above the right cut? Anything to add / drop?
- Auth model: separate teacher login, or role promotion?
- Force-advance default: skip-turn action or freeze?
- Class report: per-period or per-class day in v1?

Answer those four and we can start step 1.
