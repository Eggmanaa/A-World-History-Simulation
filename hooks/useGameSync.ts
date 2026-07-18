import { useState, useEffect, useCallback, useRef } from 'react';
import type { TurnState, TurnDecision } from '../types';

interface SyncState {
  isOnline: boolean;           // Connected to a game room
  periodId: string | null;
  serverYear: number | null;
  serverTimelineIndex: number | null;
  turnState: TurnState | null; // Current turn phase and timer
  teacherTurnNumber: number;   // Teacher's authoritative turn counter
  gameStarted: boolean;        // Whether teacher has started the game
  lastSync: number;            // Timestamp of last successful sync
  pendingActions: any[];
  error: string | null;
}

interface SyncActionPayload {
  type: string;
  [key: string]: any;
}

interface GameSyncReturn {
  syncState: SyncState;
  syncAction: (action: SyncActionPayload) => Promise<any>;
  submitTurn: (decision: TurnDecision) => Promise<any>;
  pollForUpdates: () => Promise<void>;
}

/**
 * useGameSync: Synchronizes game state with the server
 * - Checks for saved session on load
 * - Periodically polls for updates from teacher's timeline
 * - Tracks teacher's turn number so the client can detect turn advances
 * - Provides method to send player actions to server
 */
export function useGameSync(civId: string | null): GameSyncReturn {
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: false,
    periodId: null,
    serverYear: null,
    serverTimelineIndex: null,
    turnState: null,
    teacherTurnNumber: 0,
    gameStarted: false,
    lastSync: 0,
    pendingActions: [],
    error: null,
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);

  // Check for saved session on mount.
  //
  // FAIL-CLOSED (Apr 2026 MP gating fix): if localStorage says this is a
  // student session (token + periodId + role), we mark isOnline TRUE
  // SYNCHRONOUSLY - before any network round-trip. GameApp derives
  // isSinglePlayer from !isOnline, and game initialization can run on the
  // very first render; the old async check meant a multiplayer student
  // raced into singleplayer mode (manual Advance Turn button, no teacher
  // gating) whenever init won the race. Background validation only kicks
  // the student out on a REAL auth failure (401/403). Transient network
  // errors keep the session online: for a classroom sim, wrongly-offline
  // (student escapes teacher control) is worse than wrongly-online
  // (student sees a waiting screen until the next successful poll).
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedPeriodId = localStorage.getItem('periodId');
    const role = localStorage.getItem('user_role');
    const playMode = localStorage.getItem('play_mode');

    // SINGLE-PLAYER INDEPENDENCE: an explicit single-player session is
    // NEVER captured by class sync, even when student credentials exist
    // in this browser. A student can play a personal game at home
    // without teacher gating; their class game is untouched (separate
    // save key). The landing page sets play_mode=single; the student
    // dashboard sets play_mode=multi.
    if (playMode === 'single' || !token || !savedPeriodId || role !== 'student') {
      // Not a student multiplayer session - stays offline (singleplayer).
      return () => {
        isUnmountingRef.current = true;
      };
    }

    // Synchronous: multiplayer mode is ON from the first render.
    setSyncState((prev) => ({
      ...prev,
      isOnline: true,
      periodId: savedPeriodId,
      lastSync: Date.now(),
      error: null,
    }));

    // Background validation - only 401/403 (bad token) takes us offline.
    const validate = async () => {
      try {
        const response = await fetch('/api/student/game-session', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('periodId');
          if (!isUnmountingRef.current) {
            setSyncState((prev) => ({
              ...prev,
              isOnline: false,
              error: 'Session expired',
            }));
          }
        }
      } catch (err) {
        // Network hiccup: stay online, next poll retries.
        console.warn('Session validation deferred (network):', err);
      }
    };
    validate();

    return () => {
      isUnmountingRef.current = true;
    };
  }, []);

  // Poll for updates every 5 seconds when online
  const pollForUpdates = useCallback(async () => {
    if (!syncState.isOnline || !syncState.periodId) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSyncState((prev) => ({ ...prev, isOnline: false }));
        return;
      }

      const response = await fetch(
        `/api/game/student/${syncState.periodId}/state`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired
          localStorage.removeItem('token');
          localStorage.removeItem('periodId');
          setSyncState((prev) => ({
            ...prev,
            isOnline: false,
            error: 'Session expired',
          }));
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
        return;
      }

      const data = await response.json() as any;

      if (!isUnmountingRef.current) {
        setSyncState((prev) => ({
          ...prev,
          serverYear: data.currentYear,
          serverTimelineIndex: data.timelineIndex,
          gameStarted: !!data.gameStarted,
          lastSync: Date.now(),
          error: null,
        }));
      }

      // Also poll for turn state
      const turnResponse = await fetch(
        `/api/game/student/${syncState.periodId}/turn-state`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (turnResponse.ok) {
        const turnData = await turnResponse.json() as any;
        if (!isUnmountingRef.current) {
          setSyncState((prev) => ({
            ...prev,
            turnState: turnData,
            // The server now includes teacherTurnNumber and gameStarted
            // on the turn-state response as well.
            teacherTurnNumber: turnData.teacherTurnNumber ?? prev.teacherTurnNumber,
            gameStarted: turnData.gameStarted ?? prev.gameStarted,
          }));
        }
      }
    } catch (err) {
      // Network error - stay online but don't update
      console.warn('Sync error:', err);
      if (!isUnmountingRef.current) {
        setSyncState((prev) => ({
          ...prev,
          error: 'Network error',
        }));
      }
    }
  }, [syncState.isOnline, syncState.periodId]);

  // Set up polling interval
  useEffect(() => {
    if (!syncState.isOnline || !syncState.periodId) {
      return;
    }

    // Poll immediately on mount
    pollForUpdates();

    // Then poll every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      pollForUpdates();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [syncState.isOnline, syncState.periodId, pollForUpdates]);

  // Send action to server
  const syncAction = useCallback(
    async (action: SyncActionPayload): Promise<any> => {
      if (!syncState.isOnline || !syncState.periodId || !civId) {
        // Queue action for later or fail silently
        console.warn('Cannot sync action - offline or no civId');
        return null;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setSyncState((prev) => ({ ...prev, isOnline: false }));
          return null;
        }

        const response = await fetch(
          `/api/game/student/${syncState.periodId}/action`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              civilizationId: civId,
              action,
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('periodId');
            setSyncState((prev) => ({
              ...prev,
              isOnline: false,
              error: 'Session expired',
            }));
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
          return null;
        }

        const data = await response.json() as any;
        return data.result || data;
      } catch (err) {
        console.error('Failed to sync action:', err);
        return null;
      }
    },
    [syncState.isOnline, syncState.periodId, civId]
  );

  // Submit turn decisions
  const submitTurn = useCallback(
    async (decision: TurnDecision): Promise<any> => {
      if (!syncState.isOnline || !syncState.periodId || !civId) {
        console.warn('Cannot submit turn - offline or no civId');
        return null;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setSyncState((prev) => ({ ...prev, isOnline: false }));
          return null;
        }

        const response = await fetch(
          `/api/game/student/${syncState.periodId}/submit-turn`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              civilizationId: civId,
              decision,
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('periodId');
            setSyncState((prev) => ({
              ...prev,
              isOnline: false,
              error: 'Session expired',
            }));
          }
          return null;
        }

        const data = await response.json() as any;
        return data.result || data;
      } catch (err) {
        console.error('Failed to submit turn:', err);
        return null;
      }
    },
    [syncState.isOnline, syncState.periodId, civId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  return {
    syncState,
    syncAction,
    submitTurn,
    pollForUpdates,
  };
}
