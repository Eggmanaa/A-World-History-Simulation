import React, { useEffect, useRef, useState } from 'react';
import { Trophy, Crown, Medal } from 'lucide-react';

// One row returned by GET /api/game/student/:periodId/leaderboard.
// The server ranks and sorts these; the client just renders what it gets.
interface LeaderboardRow {
  studentId: number;
  studentName: string;
  civilizationId: string;
  total: number;
  breakdown: { key: string; name: string; score: number; benchmark: number }[];
  milestones: number;
  isYou: boolean;
  rank: number;
}

interface Props {
  periodId: string | null;
  // Poll interval in ms. Default 10s \u2014 plenty live-feeling for a
  // classroom without hammering the worker.
  pollMs?: number;
}

// Classroom-friendly look for each civ. Falls back to slate for unknown ids.
const CIV_ACCENT: Record<string, string> = {
  egypt:       'text-amber-300',
  rome:        'text-red-300',
  mesopotamia: 'text-orange-300',
  persia:      'text-fuchsia-300',
  greece:      'text-sky-300',
  china:       'text-yellow-300',
  maya:        'text-emerald-300',
  india:       'text-pink-300',
  aksum:       'text-lime-300',
  carthage:    'text-cyan-300',
  celts:       'text-green-300',
  sparta:      'text-rose-300',
};

/**
 * LiveLeaderboard
 *
 * Polls the server's leaderboard endpoint and renders a ranked list of every
 * civ in the period with total Final Score + the current top track. The
 * requesting student's row is highlighted so they can find themselves
 * without scanning names. Designed to live inside the Scoreboard tab
 * above the personal per-track breakdown.
 *
 * Intentional decisions:
 *   \u2022 Polling, not websockets \u2014 the sim already polls /state and
 *     /turn-state at 5s; adding another poll at 10s is a negligible
 *     incremental cost and avoids introducing a new connection lifecycle.
 *   \u2022 We render "\u2013" when offline or on fetch error instead of hiding
 *     the panel, so students aren't confused by UI that appears/disappears.
 *   \u2022 Max 30 rows shown (defensive against huge classes).
 */
export function LiveLeaderboard({ periodId, pollMs = 10000 }: Props) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!periodId) {
      // Offline / solo play \u2014 still show the panel with an empty state.
      setRows(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (!cancelled) {
            setError('Not signed in');
            setIsLoading(false);
          }
          return;
        }
        const resp = await fetch(
          `/api/game/student/${periodId}/leaderboard`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!resp.ok) {
          if (!cancelled) {
            setError(`Server returned ${resp.status}`);
            setIsLoading(false);
          }
          return;
        }
        const payload = await resp.json() as { rows: LeaderboardRow[] };
        if (!cancelled) {
          setRows(payload.rows || []);
          setError(null);
          setIsLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError('Network error');
          setIsLoading(false);
        }
      }
    };

    // Kick off immediately, then poll.
    fetchOnce();
    timerRef.current = setInterval(fetchOnce, pollMs);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [periodId, pollMs]);

  // Offline / solo: show a compact placeholder so the UI still feels whole.
  if (!periodId) {
    return (
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Leaderboard</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Offline / single-player mode \u2014 nothing to rank. Join a class period to see live rankings.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-yellow-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Live Leaderboard</span>
        </div>
        <span className="text-[9px] text-slate-500">updates every 10s</span>
      </div>

      {isLoading && rows === null && (
        <p className="text-[11px] text-slate-500 italic">Loading\u2026</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-400">Couldn't reach leaderboard: {error}</p>
      )}
      {rows !== null && rows.length === 0 && (
        <p className="text-[11px] text-slate-500 italic">No civs have scored yet.</p>
      )}

      {rows !== null && rows.length > 0 && (
        <ol className="space-y-1">
          {rows.slice(0, 30).map((row) => {
            // Pick the top track in this civ's breakdown to show as a flavor line.
            const topTrack = row.breakdown.length > 0
              ? row.breakdown.reduce((a, b) => (b.score > a.score ? b : a))
              : null;
            const accent = CIV_ACCENT[row.civilizationId] || 'text-slate-300';
            // Rank icons only for top 3. Everyone else gets a plain number.
            const rankNode = row.rank === 1
              ? <Crown size={12} className="text-yellow-400" />
              : row.rank === 2
                ? <Medal size={12} className="text-slate-300" />
                : row.rank === 3
                  ? <Medal size={12} className="text-amber-600" />
                  : <span className="text-[10px] text-slate-500 w-3 text-right">{row.rank}</span>;
            return (
              <li
                key={row.studentId}
                className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded ${
                  row.isYou
                    ? 'bg-yellow-900/20 border border-yellow-700/40'
                    : 'bg-slate-900/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 flex justify-center">{rankNode}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold truncate">
                      <span className={accent}>{row.civilizationId.charAt(0).toUpperCase() + row.civilizationId.slice(1)}</span>
                      <span className="text-slate-500 font-normal">\u00b7</span>
                      <span className="text-slate-300 truncate">{row.studentName}</span>
                      {row.isYou && <span className="text-[9px] px-1 rounded bg-yellow-900/60 text-yellow-300 ml-1">YOU</span>}
                    </div>
                    {topTrack && (
                      <div className="text-[9px] text-slate-500">
                        Top lane: <span className="text-slate-400">{topTrack.name}</span> ({topTrack.score})
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-yellow-300">{row.total}</div>
                  {row.milestones > 0 && (
                    <div className="text-[9px] text-slate-500">+{row.milestones} bonus</div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default LiveLeaderboard;
