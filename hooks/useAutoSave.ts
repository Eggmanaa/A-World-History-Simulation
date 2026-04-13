import { useEffect, useRef } from 'react';

/**
 * useAutoSave: Automatically saves game state to server
 * - Saves every 30 seconds
 * - Saves on page unload/tab close
 * - Silently fails if offline
 */
export function useAutoSave(gameState: any, civId: string | null): void {
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!civId || !gameState) {
      return;
    }

    const autoSave = async () => {
      if (isUnmountingRef.current) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const periodId = localStorage.getItem('periodId');

        if (!token || !periodId) {
          return; // Offline or no session
        }

        await fetch(`/api/game/student/${periodId}/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            civilizationId: civId,
            gameState,
          }),
        });
      } catch (err) {
        // Silently fail - auto-save is best-effort
        console.warn('Auto-save failed:', err);
      }
    };

    // Start interval
    saveIntervalRef.current = setInterval(autoSave, 30000); // 30 seconds

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [gameState, civId]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (!civId || !gameState) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const periodId = localStorage.getItem('periodId');

        if (!token || !periodId) {
          return;
        }

        // Use sendBeacon for reliability on unload
        const payload = JSON.stringify({
          civilizationId: civId,
          gameState,
        });

        navigator.sendBeacon(
          `/api/game/student/${periodId}/save`,
          new Blob([payload], { type: 'application/json' })
        );
      } catch (err) {
        console.warn('Failed to save on unload:', err);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      isUnmountingRef.current = true;
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [gameState, civId]);
}
