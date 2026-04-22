/**
 * ACTION SYSTEM - Ancient World Simulation v2
 * 10 actions a student can choose each turn.
 * Each action has clear trade-offs: you can only pick ONE per turn.
 * This creates the core strategic tension of the game.
 */

import type { GameState, PlayerActionType, BuildingType, TileData, TreatyType, CombatLogEntry } from './types';
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
    shortDesc: '+2 to one stat',
    fullDesc: 'Establish trade with an adjacent civilization. Mutual trade gives +2 to one agreed stat (Production Pool, Science, Culture, or Faith). One-sided trade gives +1 Production Pool.',
    icon: 'Handshake',
    category: 'diplomacy',
    color: 'text-amber-400',
    unlockedAtTurn: 5,
    unlockMessage: 'Bronze Age trade networks connect distant peoples.',
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
    unlockedAtTurn: 5,
    unlockMessage: 'Cultural traditions take root as civilizations mature.',
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
    unlockedAtTurn: 7,
    unlockMessage: 'The Age of Wonders begins! Monumental construction is now possible.',
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
    unlockedAtTurn: 4,
    unlockMessage: 'The Iron Age brings spiritual awakening. Religion can now be founded.',
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
    unlockedAtTurn: 9,
    unlockMessage: 'Formal diplomacy emerges as empires learn to negotiate.',
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
    unlockedAtTurn: 3,
    unlockMessage: 'Warfare: your armies can now strike at adjacent civilizations.',
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
      return { effects: [`+${stats.scienceYield} Science Yield (base)`, ...(libCount > 0 ? [`+${libCount * 2} from ${libCount} ${libCount === 1 ? 'Library' : 'Libraries'}`] : [`+2 per Library you own`]), `Total gain: +${totalGain} Science`, `Current Science Total: ${stats.science}`] };
    }

    case 'trade':
      return { effects: ['+2 to one stat (mutual trade)', '+1 Production Pool (one-sided)'] };

    case 'attack':
      return {
        effects: [`Your Martial: ${stats.martial} + d6`, 'Decisive Victory (6+): +3 Culture, loot 3, +1 territory', 'Victory (1-5): +2 Culture, loot 2', 'Defeat: -2 Population, -1 Martial'],
      };

    case 'develop': {
      return { effects: [`+${stats.cultureYield} Culture Yield (base)`, `+2 per Amphitheater you own`, `Current Culture Total: ${stats.culture}`] };
    }

    case 'worship': {
      const canFound = stats.faith >= 10 && buildings.temples > 0 && state.gameFlags.religionUnlocked && !state.civilization.religion.name;
      return {
        effects: [
          `+${stats.faithYield} Faith Yield (base)`,
          `+2 per Temple you own`,
          `Current Faith Total: ${stats.faith}`,
          ...(canFound ? ['OR: Found a Religion (requires Faith >= 10 + Temple)'] : []),
        ],
      };
    }

    case 'wonder':
      return { effects: [`Invest Production Pool toward an available Wonder`, `You have ${stats.productionPool} Production Pool to invest`] };

    case 'diplomacy':
      return { effects: ['Form alliance: +2 Martial for both parties', 'Breaking alliance costs 2 Culture Total'] };

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
      // to encourage. The gain is modest (+2 to one chosen stat, or +1
      // production for a one-sided trade) which keeps Trade balanced against
      // Research (+science), Develop (+culture), etc.
      // For NPC trade: +2 to chosen stat or +1 production if one-sided
      const tradeTarget = params?.targetId;
      const tradeStat = params?.stat || 'productionPool';
      const isMutual = params?.mutual ?? false;

      if (isMutual) {
        const bonus = 2;
        const changes: any = {};
        changes[tradeStat] = (stats as any)[tradeStat] + bonus;
        return {
          messages: [`Mutual trade! +${bonus} ${tradeStat}.`],
          statChanges: changes,
          newTreaty: tradeTarget ? { neighborId: tradeTarget, type: 'trade', turnsRemaining: 3 } : undefined,
        };
      } else {
        return {
          messages: ['+1 Production Pool from one-sided trade.'],
          statChanges: { productionPool: stats.productionPool + 1 },
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

      const wallDiceSum = wallDiceRolls.reduce((a, b) => a + b, 0);
      const fortifyDiceSum = fortifyDiceRolls.reduce((a, b) => a + b, 0);
      const attackTotal = Math.max(0, stats.martial + attackRoll - treatyPenalty);
      const defendTotal = target.martial + target.defense + defendRoll + wallDiceSum + fortifyDiceSum;
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

      // Helper to splice in treaty-violation prefix messages and cultural cost
      const applyTreatyPenalties = (
        baseMessages: string[],
        baseStats: Partial<GameState['civilization']['stats']>,
      ): { messages: string[]; statChanges: Partial<GameState['civilization']['stats']> } => {
        if (treatyPenalty === 0) {
          return { messages: baseMessages, statChanges: baseStats };
        }
        const mergedStats = { ...baseStats };
        const currentCulture =
          mergedStats.culture !== undefined ? mergedStats.culture : stats.culture;
        mergedStats.culture = Math.max(0, currentCulture - treatyCulturalCost);
        return {
          messages: [...violationMessages, ...baseMessages],
          statChanges: mergedStats,
        };
      };

      if (margin >= 6) {
        // Decisive Victory
        const base = applyTreatyPenalties(
          [
            `DECISIVE VICTORY vs ${target.name}! (${attackTotal} vs ${defendTotal})`,
            '+3 Culture Total, looted 3 Production Pool, +1 territory!',
          ],
          {
            culture: stats.culture + 3,
            productionPool: stats.productionPool + 3,
          },
        );
        result = {
          ...base,
          combatResult: { target: target.name, won: true, margin, effects: ['Decisive Victory'], rolls: rollDetail },
        };
      } else if (margin > 0) {
        // Victory
        const base = applyTreatyPenalties(
          [
            `Victory vs ${target.name}! (${attackTotal} vs ${defendTotal})`,
            '+2 Culture Total, looted 2 Production Pool.',
          ],
          {
            culture: stats.culture + 2,
            productionPool: stats.productionPool + 2,
          },
        );
        result = {
          ...base,
          combatResult: { target: target.name, won: true, margin, effects: ['Victory'], rolls: rollDetail },
        };
      } else if (margin === 0) {
        // Stalemate
        const base = applyTreatyPenalties(
          [
            `Stalemate vs ${target.name}! (${attackTotal} vs ${defendTotal})`,
            'Both sides hold their ground.',
          ],
          {},
        );
        result = {
          ...base,
          combatResult: { target: target.name, won: false, margin: 0, effects: ['Stalemate'], rolls: rollDetail },
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
      const culGain = stats.cultureYield;
      const newCulture = stats.culture + culGain;
      const ampCount = buildings.amphitheatres || 0;
      return {
        messages: [
          `Developed! +${culGain} Culture Total (now ${newCulture}).`,
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

      return {
        messages: [`Invested ${investment} Production Pool toward Wonder.`],
        statChanges: { productionPool: stats.productionPool - investment },
        wonderInvestment: { wonderId, amount: investment },
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
        messages: [`Alliance formed with ${target.name}! +2 Martial while active (5 turns).`],
        statChanges: {},
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
  const turnNumber = state.turnNumber || 1;
  if (turnNumber === 1) {
    messages.push('Turn 1: no natural growth yet — pick Grow as your action to seed your population.');
  } else if (stats.population < stats.capacity) {
    const newPop = stats.population + 1;
    changes.population = newPop;
    changes.houses = stats.houses + 1;
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

  // 5. RAID ROLL — 1-in-6 chance each turn that barbarians/raiders strike.
  // Raid power is scaled to the turn number (stronger as the game advances)
  // so early-game civs aren't obliterated but late-game civs still feel
  // threatened. Defense mitigates losses; a high-Defense civ can shrug off
  // the raid entirely. This is what makes Defense a live stat: walls,
  // Fortify, Cultural Prestige, Masonry tech all matter here.
  if (Math.floor(Math.random() * 6) === 0) {
    const turnScale = Math.max(1, Math.min(10, state.turnNumber || 1));
    const raidRoll = Math.floor(Math.random() * 6) + 1;
    const raidPower = Math.floor(turnScale * 0.8) + raidRoll; // ~2-14 by late game
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
    const effectiveDef = (stats.martial || 0) + wallSum + fortifySum;
    const damage = Math.max(0, raidPower - effectiveDef);
    const defenseBreakdown = wallCount + fortifyStacks > 0
      ? ` (Martial ${stats.martial} + ${wallCount}d8 walls [${wallDiceRolls.join('+') || 0}] + ${fortifyStacks}d8 fortify [${fortifyDiceRolls.join('+') || 0}])`
      : ` (Martial ${stats.martial})`;
    const raidPopLoss = damage > 0 ? Math.min(damage, Math.max(0, (changes.population ?? stats.population) - 1)) : 0;
    const raidProdLoss = damage > 0 ? Math.min(Math.floor(damage / 2), changes.productionPool ?? stats.productionPool ?? 0) : 0;
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
      messages.push(`⚔️ RAID! Barbarians strike (power ${raidPower} vs defense ${effectiveDef}${defenseBreakdown}). Lost ${raidPopLoss} Population${raidProdLoss > 0 ? ` and ${raidProdLoss} Production` : ''}.`);
    } else {
      messages.push(`🛡️ A raid was beaten back — defense ${effectiveDef}${defenseBreakdown} held off raid power ${raidPower}. No losses.`);
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
  const hasAggression = enemyNeighbors.length > 0 || warsWon >= 2;
  if (hasAggression && state.turnNumber >= 4) {
    const retaliationChance = Math.min(0.5, 0.2 + warsWon * 0.05);
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
        const attackTotal = (attacker.martial || 0) + rRoll;
        const defendTotal = (stats.martial || 0) + rDefRoll + rWallSum + rFortifySum;
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
      }
    }
  }


  return {
    messages,
    statChanges: changes,
    combatLogEntries: combatLogEntries.length > 0 ? combatLogEntries : undefined,
    neighborRelationshipChanges: neighborRelationshipChanges.length > 0 ? neighborRelationshipChanges : undefined,
  };
}
