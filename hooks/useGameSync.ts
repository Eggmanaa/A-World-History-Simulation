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

  // Check for saved session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedPeriodId = localStorage.getItem('periodId');

        if (!token || !savedPeriodId) {
          // No saved session
          return;
        }

        // Verify session is valid
        const response = await fetch('/api/student/game-session', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json() as any;
          setSyncState((prev) => ({
            ...prev,
            isOnline: true,
            periodId: savedPeriodId,
            lastSync: Date.now(),
            error: null,
          }));
        } else {
          // Invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('periodId');
        }
      } catch (err) {
        console.warn('Failed to initialize session:', err);
        // Silently fail - student can play offline
      }
    };

    initializeSession();

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
