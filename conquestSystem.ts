/**
 * CONQUEST & RESPAWN SYSTEM
 *
 * When a player conquers another:
 * - Victor gains a portion of the defeated civ's buildings
 * - Victor gains territory tiles added to their map
 * - Victor gets +3 Culture Total, +2 Martial, +1 territory marker
 *
 * When a player is conquered (Population reaches 0):
 * - They get to pick from available respawn civs based on current turn
 * - They pick one respawn bonus
 * - They start with Population 2 and fresh map tiles
 */

import type { GameState, RespawnCiv, RespawnBonus, TileData } from './types';
import { BuildingType, TerrainType } from './types';
import { RESPAWN_CIVS, RESPAWN_BONUSES, generateMap } from './constants';

export interface ConquestResult {
  victorMessages: string[];
  victorStatChanges: Partial<GameState['civilization']['stats']>;
  victorBuildingGains: Partial<GameState['civilization']['buildings']>;
  victorTileCount: number; // extra tiles to add
  defeatedIsEliminated: boolean; // pop reached 0
}

/**
 * Calculate what the victor gains from conquering a civ.
 * The victor gets ~50% of the defeated civ's buildings (rounded down).
 */
export function calculateConquestRewards(
  victorState: GameState,
  defeatedBuildings: GameState['civilization']['buildings'],
  wasDecisive: boolean,
): ConquestResult {
  const messages: string[] = [];
  const statChanges: Partial<GameState['civilization']['stats']> = {};

  // Culture and Martial bonuses
  statChanges.culture = (victorState.civilization.stats.culture || 0) + 3;
  statChanges.martial = (victorState.civilization.stats.martial || 0) + 2;
  messages.push('+3 Culture Total from conquest.');
  messages.push('+2 Martial from military victory.');

  // Calculate building transfer (50% of each, rounded down)
  const buildingGains: Partial<GameState['civilization']['buildings']> = {};
  const transferRate = wasDecisive ? 0.5 : 0.33; // decisive = 50%, narrow = 33%

  const buildingTypes: (keyof GameState['civilization']['buildings'])[] = [
    'farms', 'workshops', 'libraries', 'barracks', 'temples', 'amphitheatres', 'walls', 'archimedes_towers'
  ];

  let totalGained = 0;
  for (const bt of buildingTypes) {
    const count = defeatedBuildings[bt] || 0;
    const gained = Math.floor(count * transferRate);
    if (gained > 0) {
      buildingGains[bt] = gained;
      totalGained += gained;
    }
  }

  if (totalGained > 0) {
    messages.push(`Captured ${totalGained} buildings from the conquered territory.`);
  }

  // Apply stat bonuses from captured buildings
  if (buildingGains.farms) {
    statChanges.capacity = (victorState.civilization.stats.capacity || 0) + buildingGains.farms;
    statChanges.productionIncome = (victorState.civilization.stats.productionIncome || 0) + buildingGains.farms;
    messages.push(`+${buildingGains.farms} Capacity, +${buildingGains.farms} Prod Income from captured Farms.`);
  }
  if (buildingGains.workshops) {
    statChanges.productionIncome = (statChanges.productionIncome || victorState.civilization.stats.productionIncome || 0) + (buildingGains.workshops * 2);
    messages.push(`+${buildingGains.workshops * 2} Prod Income from captured Workshops.`);
  }
  if (buildingGains.barracks) {
    statChanges.martial = (statChanges.martial || victorState.civilization.stats.martial || 0) + (buildingGains.barracks * 3);
    messages.push(`+${buildingGains.barracks * 3} Martial from captured Barracks.`);
  }
  if (buildingGains.walls) {
    // Walls' defense bonus is folded into Martial now.
    statChanges.martial = (statChanges.martial || victorState.civilization.stats.martial || 0) + (buildingGains.walls * 5);
    messages.push(`+${buildingGains.walls * 5} Martial from captured Walls.`);
  }

  // Extra production loot
  const lootAmount = wasDecisive ? 5 : 3;
  statChanges.productionPool = (victorState.civilization.stats.productionPool || 0) + lootAmount;
  messages.push(`Looted ${lootAmount} Production Pool from conquered lands.`);

  // Territory tiles gained (5 for decisive, 3 for narrow)
  const tileCount = wasDecisive ? 5 : 3;
  messages.push(`Gained ${tileCount} territory tiles from conquered lands.`);

  return {
    victorMessages: messages,
    victorStatChanges: statChanges,
    victorBuildingGains: buildingGains,
    victorTileCount: tileCount,
    defeatedIsEliminated: true,
  };
}

/**
 * Get available respawn civs for the current turn.
 * Returns civs whose availableTurn <= current turn, that haven't been taken.
 */
export function getAvailableRespawnCivs(
  currentTurn: number,
  takenRespawnIds: string[] = [],
): RespawnCiv[] {
  return RESPAWN_CIVS.filter(rc =>
    rc.availableTurn <= currentTurn && !takenRespawnIds.includes(rc.id)
  );
}

/**
 * Get respawn bonus options
 */
export function getRespawnBonuses(): RespawnBonus[] {
  return RESPAWN_BONUSES;
}

/**
 * Generate territory tiles that get added to the victor's map
 * These are bonus tiles placed at the edge of their existing territory
 */
export function generateConquestTiles(
  existingTiles: TileData[],
  count: number,
  defeatedCivBiomes?: TerrainType[],
): TileData[] {
  // Find the outermost occupied coordinates
  const occupiedCoords = new Set(existingTiles.map(t => `${t.q},${t.r}`));
  const candidateTiles: TileData[] = [];

  // Look for hex positions adjacent to existing tiles but not occupied
  for (const tile of existingTiles) {
    const neighbors = [
      [tile.q + 1, tile.r, tile.s - 1],
      [tile.q - 1, tile.r, tile.s + 1],
      [tile.q, tile.r + 1, tile.s - 1],
      [tile.q, tile.r - 1, tile.s + 1],
      [tile.q + 1, tile.r - 1, tile.s],
      [tile.q - 1, tile.r + 1, tile.s],
    ];

    for (const [nq, nr, ns] of neighbors) {
      const key = `${nq},${nr}`;
      if (!occupiedCoords.has(key)) {
        const biomes = defeatedCivBiomes || [TerrainType.Plains, TerrainType.Grassland];
        const terrain = biomes[Math.floor(Math.random() * biomes.length)];
        const HEX_SIZE = 1.0;
        candidateTiles.push({
          id: key,
          q: nq, r: nr, s: ns,
          x: HEX_SIZE * Math.sqrt(3) * (nq + nr / 2),
          z: HEX_SIZE * (3 / 2) * nr,
          terrain,
          building: BuildingType.None,
        });
        occupiedCoords.add(key);
      }
    }
  }

  // Shuffle and take the requested count
  const shuffled = candidateTiles.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
