import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';

/**
 * MissedTurnBanner
 *
 * Polls /api/game/student/:periodId/missed-turns on mount and periodically,
 * surfacing a banner when the calling student has outstanding turns to
 * make up (status='missed' rows in turn_decisions).
 *
 * UX philosophy: a student who was absent yesterday shouldn't log in to a
 * silently-lost turn. The banner is persistent (not dismissable long-term),
 * high-contrast, and leads to a make-up flow via onMakeUpClick.
 *
 * Self-contained. Does not mutate game state. If the fetch fails or the
 * endpoint doesn't exist yet (old backend), it renders nothing.
 */

type MissedTurn = {
  turnNumber: number;
  createdAt?: string;
};

export const MissedTurnBanner: React.FC<{
  /** Student's current period id. If null, no fetch is made. */
  periodId: string | null;
  /** JWT token for the /missed-turns endpoint. If null, no fetch is made. */
  authToken: string | null;
  /**
   * Called when the student clicks "Make it up" for a given turn.
   * Parent should open a simplified action-selection UI scoped to that turn,
   * POST /makeup-turn with the decision, then refresh the banner.
   */
  onMakeUpClick?: (turnNumber: number) => void;
  /** Polling interval in ms (default 30s). */
  pollMs?: number;
}> = ({ periodId, authToken, onMakeUpClick, pollMs = 30_000 }) => {
  const [missed, setMissed] = useState<MissedTurn[]>([]);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!periodId || !authToken) return;

    let alive = true;

    const fetchMissed = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/game/student/${periodId}/missed-turns`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) return;
        const body = (await res.json()) as { missedTurns?: MissedTurn[] };
        if (alive) setMissed(body.missedTurns || []);
      } catch {
        // network or backend error — swallow silently, the banner will
        // just not appear rather than erroring into a student's view.
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchMissed();
    const t = setInterval(fetchMissed, pollMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [periodId, authToken, pollMs]);

  if (dismissedThisSession) return null;
  if (missed.length === 0) return null;

  const plural = missed.length > 1;
  const firstTurn = missed[0].turnNumber;

  return (
    <div
      className="w-full bg-gradient-to-r from-amber-600 to-amber-500 border-b-2 border-amber-700 shadow-lg"
      role="alert"
    >
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 py-3">
        <AlertTriangle className="w-5 h-5 text-amber-950 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-amber-950 text-sm sm:text-base">
            {plural
              ? `You have ${missed.length} turns to make up`
              : `You missed Turn ${firstTurn}`}
          </p>
          <p className="text-xs text-amber-900/90 truncate">
            {plural
              ? `Turns ${missed.map((m) => m.turnNumber).join(', ')} are waiting for your decisions.`
              : 'Submit your decision for that turn when you have a moment.'}
          </p>
        </div>
        {onMakeUpClick && (
          <button
            onClick={() => onMakeUpClick(firstTurn)}
            disabled={loading}
            className="flex items-center gap-1 rounded-md bg-amber-950 hover:bg-black text-amber-100 font-semibold px-3 py-1.5 text-sm transition-colors shrink-0"
          >
            Make it up
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setDismissedThisSession(true)}
          className="text-amber-950/70 hover:text-amber-950 shrink-0"
          aria-label="Dismiss for this session"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MissedTurnBanner;

/**
 * Helper for the make-up POST. Keeps the fetch logic out of GameApp so
 * callers just pass in the student's token + target turn.
 * Returns true on success.
 */
export async function submitMakeupTurn(
  periodId: string,
  authToken: string,
  turnNumber: number,
  decision: unknown,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/game/student/${periodId}/makeup-turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ turnNumber, decision }),
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: res.ok, message: body.message };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Network error' };
  }
}
