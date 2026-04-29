/**
 * ACTION SYSTEM - Ancient World Simulation v2
 * 10 actions a student can choose each turn.
 * Each action has clear trade-offs: you can only pick ONE per turn.
 * This creates the core strategic tension of the game.
 */

import type { GameState, PlayerActionType, BuildingType, TileData, TreatyType, CombatLogEntry, Relationship } from './types';
import { FORTIFY_MAX } from './types';

export interface ActionDefinition {
  id: PlayerActionType;
  name: string;
  shortDesc: string;
  fullDesc: string;
  icon: string; // lucide-react icon name
  category: 'growth' | 'military' | 'economy' | 'knowledge' | 'diplomacy';
  color: string; // tailwind color class
  unlockedAtTurn: number; // which turn this action becomes available
  unlockMessage: string; // flavor text when unlocked
  unlockYear: string; // historical date of discovery
  unlockHistoricalContext: string; // educational explanation of how/why this was discovered
}

export interface ActionAvailability {
  available: boolean;
  reason?: string; // why it's unavailable
}

export interface ActionPreview {
  effects: string[];
  warnings?: string[];
}

// ============================================================
// ACTION DEFINITIONS
// ============================================================

/**
 * ACTION UNLOCK PROGRESSION:
 * Turn 1+  (Ancient):     Grow, Research + Build Phase every turn
 * Turn 3+  (Age of Walls): Fortify, Attack - defense and early raiding
 * Turn 4+  (Late Neolithic): Faith/Worship (early shrines and sacred sites)
 * Turn 5+  (Bronze Age):  Trade, Develop - bronze age commerce and culture
 * Turn 7+  (Age of Wonders): Wonder - monumental construction
 * Turn 9+  (Iron Age):    Diplomacy - formal diplomacy between powers
 *
 * NOTE: Attack was originally gated until Turn 11 (Age of Conquest), but early
 * playtests showed students lacked meaningful decisions in the mid-early game.
 * We moved it to Turn 3 — the Turn 11 "Age of Conquest" world event still
 * fires as a narrative beat but no longer flips the warfare flag.
 */
export const ACTION_DEFINITIONS: ActionDefinition[] = [
  {
    id: 'grow',
    name: 'Grow',
    shortDesc: '+2 Population, +1 Capacity → +Martial/+Industry',
    fullDesc: 'Place 2 houses on your map (these bypass your Fertility cap - they are a surge on TOP of your passive per-turn growth) AND gain +2 Population and +1 Population Capacity (permanent). Every 4 Population gives +1 Martial (citizen militia); every 5 Population gives +1 Industry (workers). If already at Capacity, gain +1 Capacity, +1 Population, and +1 Production Pool instead.',
    icon: 'Sprout',
    category: 'growth',
    color: 'text-green-400',
    unlockedAtTurn: 1,
    unlockMessage: 'Your people begin to settle and grow.',
    unlockYear: 'c. 10,000 BC',
    unlockHistoricalContext: 'The Neolithic Revolution marks humanity\'s shift from nomadic hunting to permanent settlements. In the Fertile Crescent, people first domesticated wheat and barley, allowing families to stay in one place and populations to grow rapidly.',
  },
  // NOTE: 'build' was removed from ACTION_DEFINITIONS because building is now
  // its own dedicated turn phase (handleBuildPhaseSelect) that runs every turn
  // before the Action phase. It's no longer one of the 9 strategic actions.
  {
    id: 'research',
    name: 'Research',
    shortDesc: 'Gain Science',
    fullDesc: 'Advance your civilization\'s knowledge. Gain Science Yield + bonus from Libraries (+2 each). Unlocks technology thresholds for powerful bonuses.',
    icon: 'FlaskConical',
    category: 'knowledge',
    color: 'text-cyan-400',
    unlockedAtTurn: 1,
    unlockMessage: 'Curiosity drives early discovery.',
    unlockYear: 'c. 8000 BC',
    unlockHistoricalContext: 'Early humans developed counting systems using tally marks on bone and clay tokens in Mesopotamia. These first steps toward mathematics and record-keeping laid the foundation for all scientific knowledge that would follow.',
  },
  {
    id: 'fortify',
    name: 'Fortify',
    shortDesc: '+1 Defense d8 (stacks, decays)',
    fullDesc: 'Take a defensive stance. Adds +1 permanent die to your Defense Dice pool (max 3). You roll these extra d8 on every defense — raids, sieges, incoming attacks. Each pool die decays by 1 at the start of every turn, so you must keep fortifying to stay dug in. Fortify never helps you attack.',
    icon: 'ShieldPlus',
    category: 'military',
    color: 'text-sky-300',
    unlockedAtTurn: 3,
    unlockMessage: 'Your people learn to dig in, raise earthworks, and stand watch.',
    unlockYear: 'c. 7000 BC',
    unlockHistoricalContext: 'Early walled settlements like Jericho (c. 8000 BC) show humans had already learned to dig ditches and raise walls as dedicated defensive effort. Fortifying was a distinct activity from everyday building — it signaled a civilization willing to trade economic time for peace of mind.',
  },
  {
    id: 'trade',
    name: 'Trade',
    shortDesc: '+3 to one stat',
    fullDesc: 'Establish trade with an adjacent civilization. Mutual trade gives +3 to one agreed stat (Production Pool, Science, Culture, or Faith). One-sided trade gives +2 Production Pool.',
    icon: 'Handshake',
    category: 'diplomacy',
    color: 'text-amber-400',
    unlockedAtTurn: 2,
    unlockMessage: 'Caravan paths and river trade emerge as settlements stabilize.',
    unlockYear: 'c. 1850 BC',
    unlockHistoricalContext: 'The Bronze Age created the world\'s first international trade networks. Bronze required tin and copper from different regions, forcing civilizations to cooperate. Merchants from Mesopotamia, Egypt, the Indus Valley, and Crete exchanged goods across thousands of miles by sea and caravan.',
  },
  {
    id: 'develop',
    name: 'Develop',
    shortDesc: 'Gain Culture',
    fullDesc: 'Grow your civilization\'s cultural influence. Gain Culture Yield + bonus from Amphitheaters (+2 each). Unlocks Cultural Stages for powerful bonuses.',
    icon: 'Palette',
    category: 'knowledge',
    color: 'text-purple-400',
    unlockedAtTurn: 1,
    unlockMessage: 'Even the earliest peoples shaped identity through stories, ritual, and craft.',
    unlockYear: 'c. 1800 BC',
    unlockHistoricalContext: 'The Bronze Age saw the birth of organized cultural expression. The Epic of Gilgamesh was written in Mesopotamia around 1800 BC, the earliest known work of literature. Egyptian art, Minoan frescoes, and Chinese oracle bone inscriptions all flourished as civilizations developed distinct cultural identities.',
  },
  {
    id: 'wonder',
    name: 'Wonder',
    shortDesc: 'Invest in a Wonder',
    fullDesc: 'Invest Production Pool toward building a World Wonder. First to complete the cost wins the Wonder. Others lose their investment.',
    icon: 'Landmark',
    category: 'economy',
    color: 'text-orange-400',
    unlockedAtTurn: 4,
    unlockMessage: 'Monumental architecture: your civilization is stable enough for multi-turn wonder projects.',
    unlockYear: 'c. 1300 BC',
    unlockHistoricalContext: 'By the Late Bronze Age, powerful civilizations began constructing monumental structures to demonstrate their wealth and devotion. The Great Pyramids of Giza (built c. 2560 BC) were already ancient, but temples like Abu Simbel (1264 BC) and the expanding ziggurats of Babylon showed that wonder-building was accelerating across the ancient world.',
  },
  {
    id: 'worship',
    name: 'Worship',
    shortDesc: 'Gain Faith / Found Religion',
    fullDesc: 'Strengthen your faith. Gain Faith Yield (counts your Temples). When you have a Temple AND Faith ≥ 10, you can found a religion and pick its tenet.',
    icon: 'Scroll',
    category: 'knowledge',
    color: 'text-violet-400',
    unlockedAtTurn: 2,
    unlockMessage: 'Faith takes form: shrines, rituals, and shared belief organize early peoples.',
    unlockYear: 'c. 1000 BC',
    unlockHistoricalContext: 'The Iron Age sparked a spiritual revolution. Around 1000 BC, the Israelites codified their monotheistic faith under King David. Zoroastrianism emerged in Persia. Vedic Hinduism developed in India. This "Axial Age" (coined by philosopher Karl Jaspers) saw humanity grapple with questions of meaning, morality, and the divine for the first time.',
  },
  {
    id: 'diplomacy',
    name: 'Diplomacy',
    shortDesc: 'Form alliance',
    fullDesc: 'Form or maintain an alliance with an adjacent civilization. Both allies gain +1 Martial while the alliance is active. Breaking an alliance costs 2 Culture.',
    icon: 'Globe',
    category: 'diplomacy',
    color: 'text-teal-400',
    unlockedAtTurn: 3,
    unlockMessage: 'Envoys, oaths, and treaties replace sporadic raiding for civilizations that prefer cooperation.',
    unlockYear: 'c. 1000 BC',
    unlockHistoricalContext: 'The earliest known diplomatic treaty, the Egyptian-Hittite peace treaty (1259 BC), established the precedent for formal agreements between nations. By 1000 BC, empires regularly exchanged ambassadors, signed treaties, and formed alliances. The Assyrian Empire maintained a vast network of vassal states through diplomacy backed by military power.',
  },
  {
    id: 'attack',
    name: 'Attack',
    shortDesc: 'Declare war',
    fullDesc: 'Attack an adjacent civilization. Your Martial + d6 vs their Martial + d6. A Decisive Victory (margin ≥ 6) conquers the civ toward your Conquest victory. Limited to one attack per turn; uses your strategic action slot.',
    icon: 'Sword',
    category: 'military',
    color: 'text-red-400',
    unlockedAtTurn: 4,
    unlockMessage: 'Organized warfare: your civilization is large enough to mount campaigns against neighbors.',
    unlockYear: 'c. 7000 BC',
    unlockHistoricalContext: 'Even the earliest settlements clashed over land, water, and trade routes. By turn 3, your civilization has enough organization and arms (spears, clubs, early bows) to mount a raid. Conquest starts small — a border skirmish — and grows as your Martial, Barracks, and technologies advance.',
  },
];

// ============================================================
// AVAILABILITY CHECKS
// ============================================================

export function checkActionAvailability(
  actionId: PlayerActionType,
  state: GameState,
): ActionAvailability {
  const stats = state.civilization.stats;
  const currentTurn = state.turnNumber || 1;

  // Check turn-based unlock first
  const def = ACTION_DEFINITIONS.find(a => a.id === actionId);
  if (def && currentTurn < def.unlockedAtTurn) {
    return { available: false, reason: `Unlocks Turn ${def.unlockedAtTurn} (${def.unlockMessage})` };
  }

  switch (actionId) {
    case 'grow':
      if (stats.houses >= stats.capacity) {
        return { available: true, reason: 'At capacity: will gain +1 Production Pool instead' };
      }
      return { available: true };

    case 'research':
      return { available: true };

    case 'trade':
      if (state.neighbors.length === 0) {
        return { available: false, reason: 'No adjacent civilizations to trade with' };
      }
      return { available: true };

    case 'attack':
      if (state.neighbors.filter(n => !n.isConquered).length === 0) {
        return { available: false, reason: 'No civilizations to attack' };
      }
      return { available: true };

    case 'develop':
      return { available: true };

    case 'worship':
      return { available: true };

    case 'wonder':
      if ((stats.productionPool || 0) < 1) {
        return { available: false, reason: 'Need Production Pool to invest in a Wonder' };
      }
      return { available: true };

    case 'diplomacy':
      if (state.neighbors.length === 0) {
        return { available: false, reason: 'No adjacent civilizations for diplomacy' };
      }
      return { available: true };

    case 'fortify':
      if ((stats.fortifyDice || 0) >= FORTIFY_MAX) {
        return { available: true, reason: `Already at max Defense Dice (${FORTIFY_MAX}). Fortifying again refreshes them.` };
      }
      return { available: true };

    default:
      return { available: false, reason: 'Unknown action' };
  }
}

/**
 * Get list of actions that are newly unlocked at a given turn
 */
export function getNewlyUnlockedActions(turn: number): ActionDefinition[] {
  return ACTION_DEFINITIONS.filter(a => a.unlockedAtTurn === turn);
}

// ============================================================
// ACTION PREVIEWS
// ============================================================

export function previewAction(
  actionId: PlayerActionType,
  state: GameState,
): ActionPreview {
  const stats = state.civilization.stats;
  const buildings = state.civilization.buildings;

  switch (actionId) {
    case 'grow': {
      if (stats.houses >= stats.capacity) {
        return { effects: [
          '+1 Population Capacity (permanent — room to grow next turn)',
          '+1 Population',
          '+1 Production Pool',
        ] };
      }
      const canGrow = Math.min(2, stats.capacity - stats.houses);
      // Forecast the Martial/Industry jump the +2 Population will unlock.
      // Pop gain is capped at the new cap (current + 1 bonus).
      const currentPop = stats.population || 0;
      const newCap = stats.capacity + 1;
      const nextPop = Math.min(currentPop + 2, newCap);
      const popGain = nextPop - currentPop;
      const martialNow = Math.floor(currentPop / 4);
      const martialNext = Math.floor(nextPop / 4);
      const industryNow = Math.floor(currentPop / 5);
      const industryNext = Math.floor(nextPop / 5);
      const martialDelta = martialNext - martialNow;
      const industryDelta = industryNext - industryNow;
      const bonusHints: string[] = [];
      if (martialDelta > 0) bonusHints.push(`+${martialDelta} Martial threshold`);
      if (industryDelta > 0) bonusHints.push(`+${industryDelta} Industry threshold`);
      return {
        effects: [
          `Place ${canGrow} Houses on your map`,
          `+${popGain} Population (now ${nextPop})`,
          '+1 Population Capacity (permanent)',
          'Every 4 Population → +1 Martial (citizen militia)',
          'Every 5 Population → +1 Industry (workers)',
          ...(bonusHints.length > 0
            ? [`This Grow unlocks: ${bonusHints.join(', ')}`]
            : ['No new threshold crossed — but every Pop still counts toward the next one']),
        ],
      };
    }

    case 'research': {
      const libCount = buildings.libraries || 0;
      const totalGain = stats.scienceYield + (libCount * 2);
      return { effects: [
        `+${stats.scienceYield} Science Yield (base)`,
        ...(libCount > 0 ? [`+${libCount * 2} from ${libCount} ${libCount === 1 ? 'Library' : 'Libraries'} (action bonus)`] : [`+2 per Library you own`]),
        `Total Research gain: +${totalGain} Science`,
        ...(libCount > 0 ? [`Note: your Libraries also drip +${libCount} Science passively each turn even without Research.`] : []),
        `Current Science Total: ${stats.science}`,
      ] };
    }

    case 'trade':
      return { effects: [
        '+3 to one chosen stat (mutual trade with a partner)',
        '+2 Production Pool (one-sided trade, no partner needed)',
        'Mutual trade also opens a 3-turn Trade treaty (+2 Industry while active)',
      ] };

    case 'attack':
      return {
        effects: [`Your Martial: ${stats.martial} + d6`, 'Decisive Victory (6+): loot +3 Production Pool, +1 territory', 'Victory (1-5): loot +2 Production Pool', 'Defeat: -2 Population, -1 Martial', 'Victim rallies next turn (+2 Martial, +1 d8 defense)'],
      };

    case 'develop': {
      const ampCount = buildings.amphitheatres || 0;
      return { effects: [
        `+${stats.cultureYield} Culture Yield (base, includes Amphitheatre yields)`,
        `+2 per Amphitheatre you own (action bonus)`,
        ...(ampCount > 0 ? [`Note: your Amphitheatres also drip +${ampCount} Culture passively each turn.`] : []),
        `Current Culture Total: ${stats.culture}`,
      ] };
    }

    case 'worship': {
      const canFound = stats.faith >= 10 && buildings.temples > 0 && state.gameFlags.religionUnlocked && !state.civilization.religion.name;
      const tCount = buildings.temples || 0;
      return {
        effects: [
          `+${stats.faithYield} Faith Yield (base, includes Temple yields)`,
          `+2 per Temple you own (action bonus)`,
          ...(tCount > 0 ? [`Note: your Temples also drip +${tCount} Faith passively each turn.`] : []),
          `Current Faith Total: ${stats.faith}`,
          ...(canFound ? ['OR: Found a Religion (requires Faith >= 10 + Temple)'] : []),
        ],
      };
    }

    case 'wonder':
      return {
        effects: [
          `Invest Production Pool toward an available Wonder.`,
          `Project Leadership bonus: every 1 Production = 1.5 wonder progress.`,
          `You have ${stats.productionPool} Production Pool available.`,
          `Partial investments carry over to next turn.`,
        ],
      };

    case 'diplomacy':
      return { effects: [
        'Form a 5-turn alliance: +2 Martial while active (both parties)',
        '+1 Culture from cultural exchange (one-shot)',
        'Backstabbing an ally: -8 attack roll, -3 Culture',
      ] };

    case 'fortify': {
      const current = stats.fortifyDice || 0;
      const next = Math.min(FORTIFY_MAX, current + 1);
      const wallDice = state.civilization.buildings.walls || 0;
      return {
        effects: [
          `Defense Dice: ${current} → ${next} (cap ${FORTIFY_MAX}).`,
          `Each die adds +1d8 to every defense roll (raids + incoming attacks).`,
          `Pool decays by 1 per turn — keep fortifying to stay dug in.`,
          wallDice > 0
            ? `Your ${wallDice} Wall${wallDice === 1 ? '' : 's'} already grant ${wallDice} defensive d8${wallDice === 1 ? '' : ' each'}. Fortify stacks on top.`
            : `Build Walls too — each Wall tile grants an additional +1d8 on defense.`,
        ],
      };
    }

    default:
      return { effects: [] };
  }
}

// ============================================================
// ACTION EXECUTION
// ============================================================

export interface ActionExecutionResult {
  messages: string[];
  statChanges: Partial<GameState['civilization']['stats']>;
  buildingChanges?: Partial<GameState['civilization']['buildings']>;
  enableMapPlacement?: 'house' | 'building' | 'wall';
  maxPlacements?: number;
  newTreaty?: { neighborId: string; type: TreatyType; turnsRemaining: number };
  combatResult?: {
    target: string;
    won: boolean;
    margin: number;
    effects: string[];
    // Full dice breakdown so the UI can show a proper "battle report" popup
    // with every roll visible. Students see WHY they won or lost.
    rolls?: {
      attackerMartial: number;
      attackerBaseRoll: number;
      defenderMartial: number;
      defenderBaseRoll: number;
      wallDice: number[];
      fortifyDice: number[];
      bypassedWalls: boolean;
      attackTotal: number;
      defendTotal: number;
      treatyPenalty?: number;
      treatyCulturalCost?: number;
    };
  };
  // When the 'attack' action breaks one or more treaties, list the neighbor
  // IDs whose treaties should be expired by the turn-resolution pipeline.
  brokenTreatiesWithNeighbors?: string[];
  // VICTIM'S RALLY plumbing — when the player attacks an NPC neighbor,
  // the neighbor earns a defensive buff for their NEXT turn. Set to the
  // attacked neighbor's id so GameApp can update that neighbor's
  // rallyUntilTurn in the neighbors array.
  attackedNeighborId?: string;
  // DIPLOMATIC BLOWBACK — every attack erodes non-target, non-conquered,
  // non-treaty-protected neighbors one step (Ally -> Neutral, Neutral -> Enemy).
  // GameApp applies these alongside the target's rally update.
  relationshipErosions?: Array<{
    neighborId: string;
    from: Relationship;
    to: Relationship;
    name: string;
  }>;
  wonderInvestment?: { wonderId: string; amount: number };
  foundReligion?: boolean;
}

export function executeAction(
  actionId: PlayerActionType,
  state: GameState,
  params?: any,
): ActionExecutionResult {
  const stats = state.civilization.stats;
  const buildings = state.civilization.buildings;

  switch (actionId) {
    case 'grow': {
      // +1 permanent Capacity every time Grow is used. Stored in
      // capacityBonus so calculateStats re-applies it on every render
      // (raw stats.capacity is overwritten each recompute).
      const newCapacityBonus = (stats.capacityBonus || 0) + 1;
      const newCap = stats.capacity + 1; // cached immediate cap

      if (stats.houses >= stats.capacity) {
        // At-capacity escape valve: give +1 Cap (room to grow next turn),
        // +1 Population (fills the new slot), and +1 Production Pool.
        const newPop = Math.min(stats.population + 1, newCap);
        return {
          messages: [
            'At capacity! +1 Population Capacity (permanent) and +1 Production Pool.',
            `Population: ${stats.population} → ${newPop}.`,
          ],
          statChanges: {
            capacity: newCap,
            capacityBonus: newCapacityBonus,
            population: newPop,
            productionPool: stats.productionPool + 1,
          },
        };
      }

      const canGrow = Math.min(2, stats.capacity - stats.houses);
      // +2 Population, capped at the new capacity (which just went up by 1).
      const newPop = Math.min(stats.population + 2, newCap);
      const popGain = newPop - stats.population;
      return {
        messages: [
          `Place ${canGrow} houses on your map.`,
          `+${popGain} Population (${stats.population} → ${newPop}).`,
          '+1 Population Capacity (permanent).',
        ],
        statChanges: {
          capacity: newCap,
          capacityBonus: newCapacityBonus,
          population: newPop,
        },
        enableMapPlacement: 'house',
        maxPlacements: canGrow,
      };
    }

    case 'research': {
      // scienceYield already includes Library tile bonuses (calculateStats
      // bumps yield by +2 per Library). Just add yield once — no second
      // libraryCount * 2 multiplier or it double-counts.
      const sciGain = stats.scienceYield;
      const newScience = stats.science + sciGain;
      const libraryCount = buildings.libraries || 0;
      return {
        messages: [
          `Researched! +${sciGain} Science Total (now ${newScience}).`,
          ...(libraryCount > 0
            ? [`(${libraryCount} ${libraryCount === 1 ? 'Library' : 'Libraries'} contributed +${libraryCount * 2} of that)`]
            : []),
        ],
        statChanges: { science: newScience },
      };
    }

    case 'trade': {
      // DESIGN NOTE: Trade has no resource cost on purpose. In the V2 turn
      // flow, picking Trade consumes the player's single strategic action for
      // the turn — that IS the cost. Taxing Industry on top would double-
      // charge and discourage diplomatic play, which this classroom sim wants
      // to encourage. The gain is modest (+3 to one chosen stat, or +2
      // production for a one-sided trade) which keeps Trade balanced against
      // Research (+science), Develop (+culture), etc.
      // For NPC trade: +3 to chosen stat or +2 production if one-sided
      const tradeTarget = params?.targetId;
      const tradeStat = params?.stat || 'productionPool';
      const isMutual = params?.mutual ?? false;

      if (isMutual) {
        // Mutual trade: +3 to chosen stat (bumped from +2 in Apr 2026 parity
        // pass). The 3-turn trade treaty also adds +2 Industry passively
        // while active, applied via calculateStats.
        const bonus = 3;
        const changes: any = {};
        changes[tradeStat] = (stats as any)[tradeStat] + bonus;
        return {
          messages: [
            `Mutual trade! +${bonus} ${tradeStat}.`,
            tradeTarget ? `Trade treaty opened (3 turns, +2 Industry passively).` : '',
          ].filter(Boolean),
          statChanges: changes,
          newTreaty: tradeTarget ? { neighborId: tradeTarget, type: 'trade', turnsRemaining: 3 } : undefined,
        };
      } else {
        // One-sided trade: bumped from +1 to +2 productionPool. Still the
        // weakest payout but no longer a near-pointless action when no
        // partner is available.
        return {
          messages: ['+2 Production Pool from one-sided trade.'],
          statChanges: { productionPool: stats.productionPool + 2 },
        };
      }
    }

    case 'attack': {
      const targetId = params?.targetId;
      const target = state.neighbors.find(n => n.id === targetId);
      if (!target) {
        return { messages: ['No valid target selected.'], statChanges: {} };
      }
      if (target.isConquered) {
        return { messages: [`${target.name} is already conquered — pick another target.`], statChanges: {} };
      }
      if ((stats.martial || 0) < 1) {
        return { messages: ['You have no martial strength. Build Barracks first.'], statChanges: {} };
      }

      // TREATY VIOLATION CHECK
      // Peace treaty    = non-aggression pact.  Breaking it: -5 attack penalty, -2 Culture.
      // Alliance        = mutual defense pact.  Backstabbing: -8 attack penalty, -3 Culture.
      // Military pact   = joint military pact.  Breaking it: -6 attack penalty, -2 Culture.
      // (Trade and cultural treaties do not constrain attacks.)
      // Penalty applies to the attack ROLL (not Martial itself) so the backstabber
      // has a realistic chance of losing the war they started. Penalties stack if
      // multiple restrictive treaties exist with the same target. All broken
      // treaties expire at turn resolution.
      const activeTreaties = (state.treaties || []).filter(
        (t) => t.neighborId === targetId && t.turnsRemaining > 0,
      );
      const hasPeace = activeTreaties.some((t) => t.type === 'peace');
      const hasAlliance = activeTreaties.some((t) => t.type === 'alliance');
      const hasMilitaryPact = activeTreaties.some((t) => t.type === 'military');

      let treatyPenalty = 0;
      let treatyCulturalCost = 0;
      const violationMessages: string[] = [];
      if (hasAlliance) {
        treatyPenalty += 8;
        treatyCulturalCost += 3;
        violationMessages.push(
          `BETRAYAL! ${target.name} was your ally — alliance broken. -8 attack roll, -3 Culture.`,
        );
      }
      if (hasMilitaryPact) {
        treatyPenalty += 6;
        treatyCulturalCost += 2;
        violationMessages.push(
          `Military pact with ${target.name} broken. -6 attack roll, -2 Culture.`,
        );
      }
      if (hasPeace) {
        treatyPenalty += 5;
        treatyCulturalCost += 2;
        violationMessages.push(
          `Peace treaty with ${target.name} broken. -5 attack roll, -2 Culture.`,
        );
      }
      const treatiesToExpire = activeTreaties.map((t) => t.neighborId);

      // DIPLOMATIC BLOWBACK — every attack erodes non-target neighbors one step.
      // Skip the target (their relationship is handled by combat resolution),
      // skip conquered neighbors (they're out of the game), and skip neighbors
      // protected by an active peace/alliance/military treaty with US (treaties
      // shelter diplomacy — breaking them is already punished above).
      const erosions: Array<{ neighborId: string; from: Relationship; to: Relationship; name: string }> = [];
      const nextRelationship = (r: Relationship): Relationship | null => {
        if (r === 'Ally') return 'Neutral';
        if (r === 'Neutral') return 'Enemy';
        return null; // Enemy stays Enemy
      };
      const erosionViolationMessages: string[] = [];
      for (const n of state.neighbors) {
        if (n.id === targetId) continue;
        if (n.isConquered) continue;
        // Skip if a shielding treaty exists between us and this neighbor.
        const shield = (state.treaties || []).find(
          (t) => t.neighborId === n.id
            && t.turnsRemaining > 0
            && (t.type === 'peace' || t.type === 'alliance' || t.type === 'military'),
        );
        if (shield) continue;
        const next = nextRelationship(n.relationship);
        if (!next || next === n.relationship) continue;
        erosions.push({ neighborId: n.id, from: n.relationship, to: next, name: n.name });
      }
      if (erosions.length > 0) {
        const demotions = erosions.map((e) => `${e.name} (${e.from} -> ${e.to})`).join(', ');
        erosionViolationMessages.push(`Your aggression worries neighbors: ${demotions}.`);
      }

      // Combat math:
      //   Attacker = Martial + d6 - treatyPenalty
      //   Defender = Martial + Defense + d6 + 1d8 per Wall (up to 3) + 1d8 per Fortify stack
      // Why bigger dice for walls/fortify? Martial scales multiplicatively
      // via traits (Strength ×2), cultural stages (Barbarism ×1.5, etc.),
      // wonders, and tenets. Walls/fortify are linear flat adds, so they
      // need a beefier die to keep defense-focused play viable against a
      // snowballing Martial civ. d8 vs d6 is a ~29% uplift per die.
      // Siege Engineering (Science L30) lets attackers bypass wall dice but
      // does NOT bypass Fortify — digging in beats sapping.
      const attackRoll = Math.floor(Math.random() * 6) + 1;
      const defendRoll = Math.floor(Math.random() * 6) + 1;

      // Wall dice: target may carry a walls count. For the PLAYER's own
      // attack path, the defender is an NPC neighbor — we approximate their
      // walls with a small buffer based on their defense stat so even NPCs
      // benefit from a d8 defense roll. 0-3 dice.
      const defenderWallCount = Math.max(
        0,
        Math.min(3, Math.floor((target.defense || 0) / 3)),
      );
      const hasBypass = state.civilization.stats.science >= 30; // Siege Engineering
      const wallDiceRolls = hasBypass
        ? []
        : Array.from({ length: defenderWallCount }, () => Math.floor(Math.random() * 8) + 1);

      // Fortify dice — NPC neighbors don't accrue fortifyDice today, so this
      // is 0 for the player-attacks-NPC path. When Civ-vs-Civ pvp lands, the
      // defender's fortifyDice will flow through here too.
      const defenderFortifyStacks = 0;
      const fortifyDiceRolls = Array.from({ length: defenderFortifyStacks }, () =>
        Math.floor(Math.random() * 8) + 1,
      );

      // VICTIM'S RALLY for NPC defender — if this neighbor was attacked
      // previously and their rallyUntilTurn is still active, they get
      // +2 Martial and roll an extra d8 in their defense pool.
      const targetRallyActive = (target.rallyUntilTurn || 0) >= (state.turnNumber || 1);
      const targetRallyMartial = targetRallyActive ? 2 : 0;
      const targetRallyDice = targetRallyActive
        ? [Math.floor(Math.random() * 8) + 1]
        : [];
      const targetRallySum = targetRallyDice.reduce((a, b) => a + b, 0);

      const wallDiceSum = wallDiceRolls.reduce((a, b) => a + b, 0);
      const fortifyDiceSum = fortifyDiceRolls.reduce((a, b) => a + b, 0);
      const attackTotal = Math.max(0, stats.martial + attackRoll - treatyPenalty);
      const defendTotal = target.martial + target.defense + targetRallyMartial + defendRoll + wallDiceSum + fortifyDiceSum + targetRallySum;
      const margin = attackTotal - defendTotal;

      const rollDetail = {
        attackerMartial: stats.martial,
        attackerBaseRoll: attackRoll,
        defenderMartial: target.martial + target.defense,
        defenderBaseRoll: defendRoll,
        wallDice: wallDiceRolls,
        fortifyDice: fortifyDiceRolls,
        bypassedWalls: hasBypass && defenderWallCount > 0,
        attackTotal,
        defendTotal,
        treatyPenalty,
        treatyCulturalCost,
      };

      let result: ActionExecutionResult;

      // Helper to splice in treaty-violation prefix messages and cultural cost,
      // and also append diplomatic-blowback messages for non-target neighbors.
      const applyTreatyPenalties = (
        baseMessages: string[],
        baseStats: Partial<GameState['civilization']['stats']>,
      ): { messages: string[]; statChanges: Partial<GameState['civilization']['stats']> } => {
        const prefixMessages = [...violationMessages, ...erosionViolationMessages];
        if (treatyPenalty === 0) {
          return { messages: [...prefixMessages, ...baseMessages], statChanges: baseStats };
        }
        const mergedStats = { ...baseStats };
        const currentCulture =
          mergedStats.culture !== undefined ? mergedStats.culture : stats.culture;
        mergedStats.culture = Math.max(0, currentCulture - treatyCulturalCost);
        return {
          messages: [...prefixMessages, ...baseMessages],
          statChanges: mergedStats,
        };
      };

      if (margin >= 6) {
        // Decisive Victory — loot Production only; Culture comes from Develop.
        const base = applyTreatyPenalties(
          [
            `DECISIVE VICTORY vs ${target.name}! (${attackTotal} vs ${defendTotal})`,
            '+3 Production Pool (loot), +1 territory!',
            `${target.name} rallies their survivors — they get +2 Martial & +1d8 defense next turn.`,
          ],
          {
            productionPool: stats.productionPool + 3,
          },
        );
        result = {
          ...base,
          combatResult: { target: target.name, won: true, margin, effects: ['Decisive Victory'], rolls: rollDetail },
          attackedNeighborId: targetId,
          relationshipErosions: erosions.length > 0 ? erosions : undefined,
        };
      } else if (margin > 0) {
        // Victory — loot Production only; Culture comes from Develop.
        const base = applyTreatyPenalties(
          [
            `Victory vs ${target.name}! (${attackTotal} vs ${defendTotal})`,
            '+2 Production Pool (loot).',
            `${target.name} rallies their survivors — they get +2 Martial & +1d8 defense next turn.`,
          ],
          {
            productionPool: stats.productionPool + 2,
          },
        );
        result = {
          ...base,
          combatResult: { target: target.name, won: true, margin, effects: ['Victory'], rolls: rollDetail },
          attackedNeighborId: targetId,
          relationshipErosions: erosions.length > 0 ? erosions : undefined,
        };
      } else if (margin === 0) {
        // Stalemate — still counts as an attack for rally purposes.
        const base = applyTreatyPenalties(
          [
            `Stalemate vs ${target.name}! (${attackTotal} vs ${defendTotal})`,
            'Both sides hold their ground.',
            `${target.name} rallies their survivors — they get +2 Martial & +1d8 defense next turn.`,
          ],
          {},
        );
        result = {
          ...base,
          combatResult: { target: target.name, won: false, margin: 0, effects: ['Stalemate'], rolls: rollDetail },
          attackedNeighborId: targetId,
          relationshipErosions: erosions.length > 0 ? erosions : undefined,
        };
      } else {
        // Defeat — simple loss. Defense is exercised by the random raid
        // system at the start of each turn rather than retaliation here,
        // which keeps attack outcomes clean and predictable.
        const popLoss = Math.min(2, stats.population);
        const base = applyTreatyPenalties(
          [
            `DEFEAT vs ${target.name}! (${attackTotal} vs ${defendTotal})`,
            `-${popLoss} Population, -1 Martial.`,
          ],
          {
            population: stats.population - popLoss,
            houses: Math.max(0, stats.houses - popLoss),
            martial: Math.max(0, stats.martial - 1),
          },
        );
        result = {
          ...base,
          combatResult: { target: target.name, won: false, margin, effects: ['Defeat'], rolls: rollDetail },
          attackedNeighborId: targetId,
          relationshipErosions: erosions.length > 0 ? erosions : undefined,
        };
      }

      if (treatiesToExpire.length > 0) {
        result.brokenTreatiesWithNeighbors = treatiesToExpire;
      }

      return result;
    }

    case 'fortify': {
      const current = stats.fortifyDice || 0;
      const next = Math.min(FORTIFY_MAX, current + 1);
      const messages = current >= FORTIFY_MAX
        ? [`Defense Dice already at max (${FORTIFY_MAX}). Refreshed — they hold through next turn.`]
        : [`Fortified! Defense Dice: ${current} → ${next}. You now roll +${next}d8 on every defense until decay.`];
      return {
        messages,
        statChanges: { fortifyDice: next },
      };
    }

    case 'develop': {
      // cultureYield already includes Amphitheatre tile bonuses (calculateStats
      // bumps yield by +2 per Amphitheatre). Just add yield once.
      // AGGRESSOR TAG — 3+ total attacks initiated eats -1 Culture per Develop
      // (floor 1). Reputation cost of being a warmonger.
      const isAggressor = (state.totalAttacksInitiated || 0) >= 3;
      const rawCulGain = stats.cultureYield;
      const culGain = isAggressor ? Math.max(1, rawCulGain - 1) : rawCulGain;
      const newCulture = stats.culture + culGain;
      const ampCount = buildings.amphitheatres || 0;
      return {
        messages: [
          `Developed! +${culGain} Culture Total (now ${newCulture}).`,
          ...(isAggressor ? [`Aggressor reputation taxes your Culture: -1 (base was ${rawCulGain}).`] : []),
          ...(ampCount > 0
            ? [`(${ampCount} ${ampCount === 1 ? 'Amphitheatre' : 'Amphitheatres'} contributed +${ampCount * 2} of that)`]
            : []),
        ],
        statChanges: { culture: newCulture },
      };
    }

    case 'worship': {
      if (params?.foundReligion) {
        return {
          messages: ['You have founded a religion! Choose your tenets.'],
          statChanges: {},
          foundReligion: true,
        };
      }

      // faithYield already includes Temple tile bonuses (calculateStats
      // bumps yield by +1 per Temple). Just add yield once.
      const templeCount = buildings.temples || 0;
      const faithGain = stats.faithYield;
      const newFaith = stats.faith + faithGain;
      return {
        messages: [
          `Worshipped! +${faithGain} Faith Total (now ${newFaith}).`,
          ...(templeCount > 0
            ? [`(${templeCount} ${templeCount === 1 ? 'Temple' : 'Temples'} contributed +${templeCount} of that)`]
            : []),
        ],
        statChanges: { faith: newFaith },
      };
    }

    case 'wonder': {
      const wonderId = params?.wonderId;
      const investment = params?.amount || 0;

      if (!wonderId || investment <= 0) {
        return { messages: ['Select a Wonder and investment amount.'], statChanges: {} };
      }

      if (investment > stats.productionPool) {
        return { messages: ['Not enough Production Pool!'], statChanges: {} };
      }

      // Project Leadership: 1.5x contribution to wonder progress.
      // The player still spends `investment` from productionPool, but the
      // wonder receives the boosted total. Caller (GameApp) reads
      // wonderInvestment.amount and credits it as wonder progress.
      const bonusMultiplier = 1.5;
      const contribution = Math.floor(investment * bonusMultiplier);
      const bonus = contribution - investment;

      return {
        messages: [
          `Invested ${investment} Production Pool toward Wonder.`,
          `Project Leadership: +${bonus} bonus contribution (${investment} × 1.5 = ${contribution} wonder progress).`,
        ],
        statChanges: { productionPool: stats.productionPool - investment },
        wonderInvestment: { wonderId, amount: contribution },
      };
    }

    case 'diplomacy': {
      // Form an ALLIANCE with a specific neighbor.
      // +2 Martial per active alliance while it lasts (5 turns). Stronger than
      // a peace treaty (+1) because alliances require mutual commitment. We do
      // NOT bump stats.martial here — that would double-count once the treaty
      // bonus gets re-applied by calculateStats on next render.
      //
      // Backstabbing an ally via 'attack' breaks the alliance AND takes a -8
      // attack roll penalty + 3 Culture loss (see case 'attack').
      const allyId = params?.targetId;
      const target = state.neighbors.find(n => n.id === allyId);
      if (!target) {
        return { messages: ['No valid alliance target.'], statChanges: {} };
      }

      return {
        messages: [
          `Alliance formed with ${target.name}! +2 Martial while active (5 turns).`,
          `+1 Culture from cultural exchange.`,
        ],
        statChanges: { culture: stats.culture + 1 },
        newTreaty: { neighborId: allyId, type: 'alliance', turnsRemaining: 5 },
      };
    }

    default:
      return { messages: ['Unknown action.'], statChanges: {} };
  }
}

// ============================================================
// INCOME PHASE
// ============================================================

export function calculateIncome(state: GameState): {
  messages: string[];
  statChanges: Partial<GameState['civilization']['stats']>;
  combatLogEntries?: CombatLogEntry[];
  // Per-neighbor relationship changes from NPC retaliation (if any). The
  // turn-resolution pipeline in GameApp applies these to state.neighbors.
  neighborRelationshipChanges?: { id: string; relationship: 'Neutral' | 'Ally' | 'Enemy' }[];
  // Fertility-granted placement budget (number of houses player can place
  // this turn). GameState.actionPlacements lives at the GameState level,
  // not on civ.stats, so we return it as a separate field for the caller
  // to apply.
  actionPlacementsGrant?: number;
} {
  const stats = state.civilization.stats;
  const messages: string[] = [];
  const changes: Partial<GameState['civilization']['stats']> = {};
  const combatLogEntries: CombatLogEntry[] = [];
  const neighborRelationshipChanges: { id: string; relationship: 'Neutral' | 'Ally' | 'Enemy' }[] = [];

  // 1. Production Pool += Production Income
  // Use ?? (not ||) so a legitimately-zero productionIncome is respected instead
  // of silently falling through to industry. Industry is the legacy base stat
  // used only when productionIncome hasn't been initialized (pre-V2 saves).
  const income = stats.productionIncome ?? stats.industry;
  changes.productionPool = (stats.productionPool || 0) + income;
  messages.push(`+${income} Production Pool from income (total: ${changes.productionPool}).`);

  // 2. Population adjustment — also call out when a new Martial/Industry
  // threshold is crossed so students see the concrete reward from growing.
  // TURN 1 GATE: no natural growth on Turn 1. Civs start at baseline and
  // must pick an action (typically Grow) to begin expansion. This keeps the
  // Turn 1 house count pinned to fertility for every civ and closes the
  // Troy loophole where pre-action natural growth stacked with the Grow
  // action for 3+ houses on Turn 1.
  // FERTILITY-AS-PLACEMENT-BUDGET (Apr 2026):
  // Each turn's income grants the player `fertility` house placements.
  // The player chooses where to settle them on the map. This represents
  // natural population growth: Fertile Crescent civs settle 2 houses
  // per turn passively, while desert civs (fertility 1) grow slower.
  // Grow action ADDS +2 more on top (handled in handleActionSelect).
  const fertilityBudget = Math.max(0, stats.fertility || 0);
  if (fertilityBudget > 0) {
    messages.push(`+${fertilityBudget} House placement${fertilityBudget === 1 ? '' : 's'} (Fertility ${fertilityBudget} natural growth).`);
  }

  const turnNumber = state.turnNumber || 1;
  if (turnNumber === 1) {
    messages.push('Turn 1: place your fertility-granted houses to settle your founding population.');
  } else if (stats.population < stats.capacity) {
    const newPop = stats.population + 1;
    changes.population = newPop;
    const crossedMartial = Math.floor(newPop / 4) > Math.floor(stats.population / 4);
    const crossedIndustry = Math.floor(newPop / 5) > Math.floor(stats.population / 5);
    const bonusNote = crossedMartial && crossedIndustry
      ? ' — +1 Martial and +1 Industry unlocked!'
      : crossedMartial
        ? ' — +1 Martial unlocked (every 4 Pop).'
        : crossedIndustry
          ? ' — +1 Industry unlocked (every 5 Pop).'
          : '';
    messages.push(`+1 Population (natural growth, now ${newPop}).${bonusNote}`);
  } else if (stats.population > stats.capacity) {
    changes.population = stats.population - 1;
    changes.houses = Math.max(0, stats.houses - 1);
    messages.push('-1 Population (over capacity — build more Farms or grab Hanging Gardens).');
  }

  // 3. Legacy: clear any lingering tempDefenseBonus so older saves migrate.
  if (stats.tempDefenseBonus && stats.tempDefenseBonus > 0) {
    changes.tempDefenseBonus = 0;
  }

  // 3b. Decay fortify dice by 1 per turn — the "standing army relaxes"
  // effect. Players must keep Fortifying each turn if they want to stay
  // dug in. This is the balance lever that prevents Fortify from turning
  // into a free permanent stack.
  const currentFortify = stats.fortifyDice || 0;
  if (currentFortify > 0) {
    changes.fortifyDice = Math.max(0, currentFortify - 1);
  }

  // 4. Reset houses built this turn
  changes.housesBuiltThisTurn = 0;

  // 4b. PASSIVE YIELD TRICKLE.
  // Libraries / Temples / Amphitheatres each contribute +1 per turn to
  // their respective stat totals, even without picking the matching
  // action. Without this, owning the building was worthless to a
  // student who never Researched / Worshipped / Developed — a design
  // hole compared to Farms / Workshops / Walls / Barracks which all
  // give passive value. The matching action still pays more (yield
  // includes +2 per building), so Research/Worship/Develop remain
  // the burst option; this is the steady drip.
  const buildings = state.civilization.buildings;
  const libCount = buildings.libraries || 0;
  const templeCount = buildings.temples || 0;
  const amphiCount = buildings.amphitheatres || 0;
  if (libCount > 0) {
    const sciBefore = changes.science ?? stats.science;
    changes.science = sciBefore + libCount;
    messages.push(`+${libCount} Science (passive from ${libCount} ${libCount === 1 ? 'Library' : 'Libraries'}).`);
  }
  if (templeCount > 0) {
    const faithBefore = changes.faith ?? stats.faith;
    changes.faith = faithBefore + templeCount;
    messages.push(`+${templeCount} Faith (passive from ${templeCount} ${templeCount === 1 ? 'Temple' : 'Temples'}).`);
  }
  if (amphiCount > 0) {
    const culBefore = changes.culture ?? stats.culture;
    changes.culture = culBefore + amphiCount;
    messages.push(`+${amphiCount} Culture (passive from ${amphiCount} ${amphiCount === 1 ? 'Amphitheatre' : 'Amphitheatres'}).`);
  }

  // 5. RAID ROLL — 1-in-5 chance each turn that barbarians/raiders strike.
  // Apr 2026 tuning pass: bumped frequency 1/6 -> 1/5 and base power
  // (added +2 floor) so peaceful civs that ignore Martial actually feel
  // pressure. Raid power scales to turn number so early-game civs aren't
  // obliterated but late-game civs without defense lose serious pop.
  // Defense (walls + fortify + martial) still mitigates, but won't shrug
  // off raids automatically anymore.
  if (Math.floor(Math.random() * 5) === 0) {
    const turnScale = Math.max(1, Math.min(15, state.turnNumber || 1));
    const raidRoll = Math.floor(Math.random() * 6) + 1;
    // Base 2 floor + 1.0 * turnScale + d6: T1 = 4-9, T10 = 13-18, T20 = 18-23
    const raidPower = 2 + Math.floor(turnScale * 1.0) + raidRoll;
    // Wall dice + Fortify dice make the raid check meaningful: each Wall
    // tile (up to 3) adds a d8, and each Fortify stack adds a d8. These are
    // the levers students have for "I'm a peaceful civ but I want to
    // survive" — no need to build Martial, just dig in. d8 (not d6) because
    // Martial scales multiplicatively, and a linear defense mechanic needs
    // a bigger die to keep up with late-game Martial stacks.
    // Wall count — Troy's flag doubles the dice count (up to cap 3),
    // reflecting their legendary fortifications.
    const baseWallCount = Math.min(3, state.civilization.buildings.walls || 0);
    const wallCount = state.civilization.flags.troyWallDouble
      ? Math.min(3, baseWallCount * 2)
      : baseWallCount;
    const wallDiceRolls = Array.from({ length: wallCount }, () => Math.floor(Math.random() * 8) + 1);
    const fortifyStacks = currentFortify; // use the pre-decay value for THIS raid
    const fortifyDiceRolls = Array.from({ length: fortifyStacks }, () => Math.floor(Math.random() * 8) + 1);
    const wallSum = wallDiceRolls.reduce((a, b) => a + b, 0);
    const fortifySum = fortifyDiceRolls.reduce((a, b) => a + b, 0);
    // VICTIM'S RALLY — if still active this turn, apply +2 Martial and
    // roll one extra d8 for defense. Expires naturally when turnNumber
    // passes rallyUntilTurn.
    const raidRallyActive = (stats.rallyUntilTurn || 0) >= (state.turnNumber || 1);
    const raidRallyMartial = raidRallyActive ? 2 : 0;
    const raidRallyDice = raidRallyActive ? [Math.floor(Math.random() * 8) + 1] : [];
    const raidRallySum = raidRallyDice.reduce((a, b) => a + b, 0);
    const effectiveDef = (stats.martial || 0) + raidRallyMartial + wallSum + fortifySum + raidRallySum;
    const damage = Math.max(0, raidPower - effectiveDef);
    const defenseBreakdown = wallCount + fortifyStacks + raidRallyDice.length > 0
      ? ` (Martial ${stats.martial}${raidRallyActive ? ' +2 rally' : ''} + ${wallCount}d8 walls [${wallDiceRolls.join('+') || 0}] + ${fortifyStacks}d8 fortify [${fortifyDiceRolls.join('+') || 0}]${raidRallyActive ? ` + 1d8 rally [${raidRallySum}]` : ''})`
      : ` (Martial ${stats.martial})`;
    const raidPopLoss = damage > 0 ? Math.min(damage, Math.max(0, (changes.population ?? stats.population) - 1)) : 0;
    const raidProdLoss = damage > 0 ? Math.min(Math.floor(damage / 2), changes.productionPool ?? stats.productionPool ?? 0) : 0;
    // VICTIM'S RALLY — being raided (even a repelled raid) rallies the
    // population for the next turn: +2 Martial and +1d8 defense.
    changes.rallyUntilTurn = (state.turnNumber || 1) + 1;
    if (damage > 0) {
      const currentPop = changes.population ?? stats.population;
      const currentHouses = changes.houses ?? stats.houses;
      if (raidPopLoss > 0) {
        changes.population = Math.max(1, currentPop - raidPopLoss);
        changes.houses = Math.max(0, currentHouses - raidPopLoss);
      }
      if (raidProdLoss > 0) {
        changes.productionPool = Math.max(0, (changes.productionPool ?? stats.productionPool ?? 0) - raidProdLoss);
      }
      messages.push(`⚔️ RAID! Barbarians strike (power ${raidPower} vs defense ${effectiveDef}${defenseBreakdown}). Lost ${raidPopLoss} Population${raidProdLoss > 0 ? ` and ${raidProdLoss} Production` : ''}. Your people rally — +2 Martial & +1d8 defense next turn.`);
    } else {
      messages.push(`🛡️ A raid was beaten back — defense ${effectiveDef}${defenseBreakdown} held off raid power ${raidPower}. Your people rally — +2 Martial & +1d8 defense next turn.`);
    }

    // Log raid as an INCOMING combat entry so the war tab shows it.
    combatLogEntries.push({
      turn: state.turnNumber || 1,
      target: state.civilization.name, // target OF the raid = us
      attackerName: 'Barbarian Raiders',
      incoming: true,
      attackTotal: raidPower,
      defendTotal: effectiveDef,
      margin: effectiveDef - raidPower,
      outcome: damage > 0 ? 'defeat' : 'victory',
      popLost: raidPopLoss,
      martialLost: 0,
      rolls: {
        attackerMartial: 0,
        attackerBaseRoll: raidRoll,
        defenderMartial: stats.martial || 0,
        defenderBaseRoll: 0,
        wallDice: wallDiceRolls,
        fortifyDice: fortifyDiceRolls,
        bypassedWalls: false,
      },
    });
  }

  // 6. NPC RETALIATION — If the player has been aggressive (warsWon > 0 and
  // they attacked any neighbor recently), rival civs may strike back.
  // Trigger conditions:
  //   - At least 1 neighbor is Enemy (player attacked them before), OR
  //   - Player's warsWon >= 2 (they've built a reputation as a warmonger)
  // Chance: 20% base per turn, +5% per warsWon, capped at 50%.
  // Attacker = highest-martial non-conquered non-allied neighbor.
  // This keeps aggressive play risky — conquest snowballs invite pushback.
  // Alliance/peace/military treaties with the attacker block retaliation.
  const enemyNeighbors = state.neighbors.filter(
    (n) => !n.isConquered && n.relationship === 'Enemy',
  );
  const warsWon = state.warsWon || 0;
  const totalAttacks = state.totalAttacksInitiated || 0;
  const isAggressor = totalAttacks >= 3;
  const hasAggression = enemyNeighbors.length > 0 || warsWon >= 2 || isAggressor;
  if (hasAggression && state.turnNumber >= 4) {
    // Aggressor tag adds +10% on top of warsWon scaling. Cap raised to 60%.
    const retaliationChance = Math.min(
      isAggressor ? 0.6 : 0.5,
      0.2 + warsWon * 0.05 + (isAggressor ? 0.1 : 0),
    );
    if (Math.random() < retaliationChance) {
      // Pick attacker: strongest unconquered enemy with no blocking treaty.
      const eligibleAttackers = state.neighbors
        .filter((n) => !n.isConquered)
        .filter((n) => {
          const treaty = (state.treaties || []).find(
            (t) => t.neighborId === n.id && t.turnsRemaining > 0,
          );
          // Peace/alliance/military treaties prevent retaliation.
          return !treaty || (treaty.type !== 'peace' && treaty.type !== 'alliance' && treaty.type !== 'military');
        })
        .sort((a, b) => (b.martial || 0) - (a.martial || 0));
      const attacker = eligibleAttackers[0];
      if (attacker && (attacker.martial || 0) >= 1) {
        const rRoll = Math.floor(Math.random() * 6) + 1;
        const rDefRoll = Math.floor(Math.random() * 6) + 1;
        const rWallCount = Math.min(3, state.civilization.buildings.walls || 0);
        const rFortify = currentFortify;
        const rWallDice = Array.from({ length: rWallCount }, () => Math.floor(Math.random() * 8) + 1);
        const rFortifyDice = Array.from({ length: rFortify }, () => Math.floor(Math.random() * 8) + 1);
        const rWallSum = rWallDice.reduce((a, b) => a + b, 0);
        const rFortifySum = rFortifyDice.reduce((a, b) => a + b, 0);
        // VICTIM'S RALLY — if still active, apply +2 Martial and +1d8.
        const retalRallyActive = (stats.rallyUntilTurn || 0) >= (state.turnNumber || 1);
        const retalRallyMartial = retalRallyActive ? 2 : 0;
        const retalRallyDice = retalRallyActive ? [Math.floor(Math.random() * 8) + 1] : [];
        const retalRallySum = retalRallyDice.reduce((a, b) => a + b, 0);
        const attackTotal = (attacker.martial || 0) + rRoll;
        const defendTotal = (stats.martial || 0) + retalRallyMartial + rDefRoll + rWallSum + rFortifySum + retalRallySum;
        const margin = attackTotal - defendTotal;
        let retPopLoss = 0;
        let retMartialLost = 0;
        let outcome: CombatLogEntry['outcome'];
        if (margin > 0) {
          retPopLoss = Math.min(2, Math.max(0, (changes.population ?? stats.population) - 1));
          if (retPopLoss > 0) {
            changes.population = Math.max(1, (changes.population ?? stats.population) - retPopLoss);
            changes.houses = Math.max(0, (changes.houses ?? stats.houses) - retPopLoss);
          }
          if (margin >= 5) {
            retMartialLost = 1;
            changes.martial = Math.max(0, (changes.martial ?? stats.martial) - 1);
          }
          outcome = margin >= 5 ? 'decisive_victory' : 'victory';
          messages.push(`🗡️ RETALIATION! ${attacker.name} strikes back (${attackTotal} vs ${defendTotal}). Lost ${retPopLoss} Population${retMartialLost ? ' and 1 Martial' : ''}.`);
        } else if (margin === 0) {
          outcome = 'stalemate';
          messages.push(`🛡️ ${attacker.name} attempted retaliation but it was a stalemate (${attackTotal} vs ${defendTotal}).`);
        } else {
          outcome = 'defeat';
          messages.push(`🛡️ ${attacker.name} attempted retaliation but we held (${attackTotal} vs ${defendTotal}).`);
        }
        // Reverse the outcome value since we recorded it from the attacker's
        // perspective above; for an INCOMING entry the outcome should reflect
        // whether THE ATTACKER won.
        combatLogEntries.push({
          turn: state.turnNumber || 1,
          target: state.civilization.name,
          attackerName: attacker.name,
          incoming: true,
          attackTotal,
          defendTotal,
          margin,
          outcome,
          popLost: retPopLoss,
          martialLost: retMartialLost,
          rolls: {
            attackerMartial: attacker.martial || 0,
            attackerBaseRoll: rRoll,
            defenderMartial: stats.martial || 0,
            defenderBaseRoll: rDefRoll,
            wallDice: rWallDice,
            fortifyDice: rFortifyDice,
            bypassedWalls: false,
          },
        });
        // Retaliation marks the attacker as Enemy going forward.
        if (attacker.relationship !== 'Enemy') {
          neighborRelationshipChanges.push({ id: attacker.id, relationship: 'Enemy' });
        }
        // VICTIM'S RALLY — being attacked rallies the population next turn.
        changes.rallyUntilTurn = (state.turnNumber || 1) + 1;
      }
    }
  }


  return {
    messages,
    statChanges: changes,
    combatLogEntries: combatLogEntries.length > 0 ? combatLogEntries : undefined,
    neighborRelationshipChanges: neighborRelationshipChanges.length > 0 ? neighborRelationshipChanges : undefined,
    actionPlacementsGrant: fertilityBudget,
  };
}
