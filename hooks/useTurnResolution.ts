import { useState, useCallback } from 'react';
import type { GameState, TurnResolution, PlayerActionType } from '../types';

/**
 * useTurnResolution
 *
 * First, narrow extraction: own the `v2TurnResolution` state that GameApp
 * was managing as a raw `useState`, plus a small family of pure helpers
 * for building `TurnResolution` objects consistently.
 *
 * Long-term goal: grow this hook into the full owner of the turn-advance
 * pipeline (income -> unlocks -> world_event -> action -> build_phase ->
 * resolution -> idle) so the V2 turn state machine is testable in
 * isolation and GameApp becomes a thinner shell.
 *
 * For now we deliberately stay surgical: state ownership + pure helpers,
 * no behavior change. See INVARIANTS.md for the turn pipeline ordering
 * rules that this hook will eventually encode.
 */
export function useTurnResolution() {
  const [turnResolution, setTurnResolutionState] = useState<TurnResolution | null>(null);

  const setTurnResolution = useCallback((res: TurnResolution | null) => {
    setTurnResolutionState(res);
  }, []);

  const clearTurnResolution = useCallback(() => {
    setTurnResolutionState(null);
  }, []);

  return {
    turnResolution,
    setTurnResolution,
    clearTurnResolution,
  };
}

/**
 * buildTurnResolution
 *
 * Pure factory that constructs a TurnResolution from the pre-action
 * GameState snapshot (`prev`), the selected action, and the effect
 * strings. Keeps the default-filling logic in one place instead of
 * scattered across every action handler.
 *
 * Pass `statsBefore` as the snapshot captured at income-time (v2StatsBefore).
 * Pass `statsAfter` as the POST-action stats (usually `{ ...prev.stats, ...statChanges }`).
 */
export function buildTurnResolution(
  prev: GameState,
  actionId: PlayerActionType,
  actionEffects: string[],
  statsBefore: Record<string, number>,
  statsAfter: Record<string, number>,
  extras?: Partial<TurnResolution>,
): TurnResolution {
  return {
    turn: prev.turnNumber || 1,
    incomeGained:
      prev.civilization.stats.productionIncome ||
      prev.civilization.stats.industry ||
      0,
    populationChange: 0,
    worldEventName: prev.currentWorldEvent?.name || 'None',
    choiceMade: prev.selectedWorldChoice || 'A',
    choiceEffects: [],
    civEventName: prev.currentCivEvent?.name,
    civEventEffects:
      prev.currentCivEvent?.effects.map((e) => (e as any).message || '') || [],
    actionTaken: actionId,
    actionEffects,
    statsBefore,
    statsAfter,
    ...extras,
  };
}
