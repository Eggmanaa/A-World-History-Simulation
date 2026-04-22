import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Warehouse,
  Sprout,
  Hammer,
  Sword,
  Shield,
  FlaskConical,
  Palette,
  Scroll,
  History,
  Play,
  BrickWall,
  Landmark,
  Star,
  Crown,
  X,
  Check,
  Handshake,
  TowerControl,
  Globe,
  MapPin,
  Zap,
  RotateCcw,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import MapScene from "./components/MapScene";
import TurnPhaseUI, { ConquestRewardPanel, RespawnPanel } from "./components/TurnPhaseUI";
import ReflectionTurn, { type ReflectionResult } from "./components/ReflectionTurn";
import { useGameSync } from "./hooks/useGameSync";
import { useAutoSave } from "./hooks/useAutoSave";
import {
  generateMap,
  CIV_PRESETS,
  TIMELINE_EVENTS,
  WONDERS_LIST,
  RELIGION_TENETS,
  GENERATE_NEIGHBORS,
  buildCivNeighbors,
  SCIENCE_UNLOCKS,
  TECHNOLOGIES,
  CULTURAL_STAGE_MULTIPLIERS,
  CULTURAL_STAGE_THRESHOLDS,
  SCORING_TRACKS,
  calculateFinalScore,
} from "./constants";
import { LiveLeaderboard } from "./components/LiveLeaderboard";
import { DiplomacyPanel } from "./components/DiplomacyPanel";
import {
  TileData,
  TerrainType,
  BuildingType,
  BUILDING_COSTS,
  TERRAIN_BONUSES,
  GameState,
  CivPreset,
  WATER_CAPACITIES,
  WonderDefinition,
  TimelineEventAction,
  StatKey,
  NeighborCiv,
  TurnState,
  TurnDecision,
  Treaty,
  TreatyType,
  TurnPhaseV2,
  PlayerActionType,
  TurnResolution,
  CombatLogEntry,
  AttackOutcomePopup,
  ThresholdPopup,
} from "./types";
import {
  AttackOutcomeModal,
  ThresholdModal,
  TechTreeModal,
  ReligionTreeModal,
  CultureTreeModal,
  CULTURE_CHOICES,
  RELIGION_TENET_THRESHOLDS,
  TECH_CHOICES,
} from "./components/DecisionModals";
import { getAdjacentCivs, areAdjacent, CIV_ADJACENCY } from "./adjacency";
import { WORLD_EVENTS } from "./worldEvents";
import {
  calculateIncome,
  executeAction,
  getNewlyUnlockedActions,
  ACTION_DEFINITIONS,
} from "./actionSystem";
import {
  calculateConquestRewards,
  getAvailableRespawnCivs,
  getRespawnBonuses,
  generateConquestTiles,
} from "./conquestSystem";
import { RESPAWN_CIVS, RESPAWN_BONUSES } from "./constants";

// --- HELPER LOGIC ---

const checkSavingThrow = (
  civ: GameState["civilization"],
  trait?: string,
  stat?: StatKey,
  dc?: number,
): boolean => {
  if (!trait && !stat) return true; // No check required

  // 1. Trait Check (Auto-pass)
  if (trait) {
    const normalizedTrait = trait.toLowerCase();
    if (civ.traits.some((t) => t.toLowerCase() === normalizedTrait)) {
      return true;
    }
  }

  // 2. Stat Check (Roll vs DC)
  if (stat && dc !== undefined) {
    const statValue = civ.stats[stat];
    if (statValue >= dc) return true;
  }

  return false;
};

// Rich stat explanations used by the left-sidebar click-to-expand info panels.
// Each entry is keyed by the info ID and supplies a title, detailed body, and
// optional list of "how to raise it" bullets. Kept as data (not JSX) so it's
// easy to edit copy without touching the render.
const STAT_EXPLANATIONS: Record<string, {
  title: string;
  body: string;
  raise?: string[];
  affects?: string[];
}> = {
  martial: {
    title: 'Martial',
    body: 'Your unified combat stat — used for BOTH attack rolls and defense against raids. Walls, terrain, Archimedes Tower, cultural prestige, Holy War, Masonry tech, and peace treaties all feed directly into Martial, so a single number tells you how strong your civ is in combat.',
    raise: [
      'Population: every 4 pop adds +1 Martial (citizen militia).',
      'Build Barracks (+3 Martial each) — the dedicated offense/defense stat building.',
      'Walls do NOT add Martial; they add +1d8 to every defense roll (raids + incoming attacks), up to 3 dice. Troy doubles the wall-dice count.',
      'Fortify action: +1 Defense Die (d8), stacks to 3, decays by 1 each turn.',
      'Archimedes Tower gives +20 Martial (requires 30 Science).',
      'Terrain: mountains, hills, islands, and rivers contribute Martial.',
      'Science: Bronze Working +3, Masonry +2, Steel +5, Siege Engineering +2, Iron Working path +5.',
      'Religion tenet: Holy War adds +2 per converted neighbor, +1 baseline.',
      'Cultural Prestige: +1 Martial per 10 Culture Total.',
      'Peace treaties: +1 Martial each; Military treaties: +3 Martial each.',
      'Trait bonus: Strength doubles your Martial total.',
      'Cultural Stages (Imperial/Modern) scale Martial.',
    ],
    affects: ['Attack rolls (vs target Martial)', 'Raid mitigation each turn', 'Conquest score (8 pts per decisive conquest)'],
  },
  faith: {
    title: 'Faith',
    body: 'Spiritual power. Needed to found a religion (10 Faith + 1 Temple) and required for conversion attempts against neighbors. Many religion tenets scale with Faith.',
    raise: [
      'Temples give +2 baseline Faith and boost Faith Yield.',
      'Religion tenets (Monotheism +5, Scriptures doubles, Asceticism +15).',
      'Trait bonus: Wisdom doubles Faith.',
      'Worship action adds your Faith Yield.',
    ],
    affects: ['Religion founding', 'Conversion success vs neighbors', 'Philosophy tenet (converts 50% to Science)'],
  },
  culture: {
    title: 'Culture',
    body: 'Arts, customs, and identity. Drives progression through Cultural Stages and contributes directly to the Legacy score track. Also grants passive Cultural Prestige bonuses to Martial and Diplomacy.',
    raise: [
      'Develop action: +Culture Yield and +2 per Amphitheatre.',
      'Amphitheatres give +3 base Culture.',
      'Wonders (Oracle +10, Hanging Gardens +5, Pyramids +5, and more).',
      'Religion tenets: Philosophy, Universal Faith, Scriptures.',
      'Science unlocks: Writing, Philosophy, Printing Press.',
      'Cultural treaties: +2 Culture per active treaty.',
      'Trait bonus: Creativity doubles Culture.',
    ],
    affects: ['Cultural Stage progression', 'Legacy score track', 'Cultural Prestige passive bonuses (Martial, Diplomacy)'],
  },
  science: {
    title: 'Science',
    body: 'Your civilization\'s knowledge. Reaching science thresholds permanently unlocks stat bonuses and abilities like siege engineering. Contributes to the Innovation score track.',
    raise: [
      'Research action: +Science Yield and +2 per Library.',
      'Libraries give +2 yield on Research.',
      'Religion tenet: Scriptures (+2) and Philosophy (converts Faith).',
      'Wonders: Great Library (+15).',
      'Trait bonus: Intelligence doubles Science.',
      'Cultural Stages (Classical/Enlightenment/Modern) scale Science heavily.',
    ],
    affects: ['Science unlock milestones (every 5–80)', 'Wall-bypass in combat (30+)', 'Innovation score track'],
  },
  diplomacy: {
    title: 'Diplomacy',
    body: 'Your ability to form alliances and conduct treaty-based negotiations. Forming alliances requires at least 1 Diplomacy. Passive boost from Cultural Prestige (every 20 Culture = +1 Diplomacy).',
    raise: [
      'Form alliances via the Action phase Diplomacy action.',
      'Science unlocks: Writing, Currency, Printing Press.',
      'Religion tenet: Universal Faith.',
      'Trait bonus: Beauty adds +1 Diplomacy.',
      'Cultural Prestige: +1 Diplomacy per 20 Culture Total.',
    ],
    affects: ['Alliance formation', 'Treaty-based relationships'],
  },
  cultural_stage: {
    title: 'Cultural Stage',
    body: 'Your civilization\'s overall cultural maturity. Advances automatically as Culture Total reaches each threshold. Each stage applies a distinct set of percentage modifiers to your core stats.',
    raise: [
      'Barbarism (start): +50% Martial, +30% Fertility. Science, Faith, Industry reduced.',
      'Classical (20 Culture): +50% Science, +30% Faith, +20% Industry.',
      'Imperial (50 Culture): +30% Martial, +50% Industry, +20% Science. Fertility -20%.',
      'Enlightenment (100 Culture): +100% Science, +50% Industry, +20% Faith.',
      'Modern (200 Culture): Every major yield amplified.',
      'Decline is only entered via penalty events, not by culture drop.',
    ],
    affects: ['All stat calculations via CULTURAL_STAGE_MULTIPLIERS'],
  },
  technologies: {
    title: 'Technologies',
    body: 'Concrete inventions you\'ve earned, usually by advancing through the timeline or via world events. Unlike Science-level thresholds, these are specific named technologies with one-off effects (e.g., Bronze Working doubles Martial).',
    affects: ['Per-tech multipliers and gated abilities applied in calculateStats.'],
  },
  industry: {
    title: 'Industry',
    body: 'Your raw production capacity. Each turn it generates Production Pool income that funds the Build Phase. Higher Industry means more buildings per turn. Wonder and Workshop costs all pull from the Production Pool, not Industry directly.',
    raise: [
      'Population: every 5 pop adds +1 Industry (workers).',
      'Workshops give +2 Production Income each.',
      'Farms give +1 Production Income each (plus +1 Capacity).',
      'Trait bonus: Industrious doubles Industry.',
      'Science unlocks: Irrigation (+2), Currency (+2), Engineering (+3).',
      'Cultural Stages (Imperial +50%, Modern +100%) scale Industry.',
      'Wonders: Pyramids grant +20 Production when built.',
    ],
    affects: ['Production Pool income each turn', 'Build Phase capacity', 'Wonder construction'],
  },
  houses: {
    title: 'Houses & Population',
    body: 'Every House on the map supports 1 Population (2 if the Advanced Agriculture tech is unlocked). Population is your civilization\'s people — and people DO things. Bigger population = stronger army, more production, more scholars and artists. This is why you want to Grow.',
    raise: [
      'Grow action builds up to 2 Houses per turn (limited by Fertility).',
      'Farms raise Capacity (+1) so Population can keep growing.',
      'Hanging Gardens wonder: +10 Capacity.',
      'Religion tenet Medicine: +5 Capacity, +1 Fertility.',
      'Science unlocks Pottery, Irrigation, Masonry, Engineering, Printing Press all add Capacity.',
      'Cultural Stages with positive Fertility multipliers (Barbarism, Modern) accelerate natural growth.',
    ],
    affects: [
      'Every 4 Population: +1 Martial (citizen militia join your army).',
      'Every 5 Population: +1 Industry / Production Income (workers produce more).',
      'Fills up each turn via natural growth until you hit Capacity, then stalls.',
      'Raids cost Population first — a healthy civ absorbs losses; a small civ feels them.',
      'If Population ever reaches 0 and Houses hit 0, your civilization falls and must respawn.',
    ],
  },
  fertility: {
    title: 'Fertility',
    body: 'How many Houses you can build per turn. Gates population growth. High Fertility lets your civilization expand quickly; low Fertility means slow organic growth even with open Capacity.',
    raise: [
      'Trait bonus: Health trait adds +2 Fertility.',
      'Science unlocks: Pottery (+1), Engineering (+3).',
      'Religion tenet: Medicine adds +1 Fertility.',
      'World events and timeline bonuses.',
    ],
    affects: ['Houses built per turn', 'Population growth rate'],
  },
};

// Shared Cultural Stage resolver. Returns the highest stage whose threshold
// the civ's culture clears, but never downgrades from Decline (which is set
// only by penalty events, not by culture drops).
const resolveCulturalStage = (
  currentStage: string | undefined,
  culture: number,
): 'Barbarism' | 'Classical' | 'Imperial' | 'Enlightenment' | 'Modern' | 'Decline' => {
  if (currentStage === 'Decline') return 'Decline';
  // Walk thresholds high-to-low; first match wins.
  const sorted = [...CULTURAL_STAGE_THRESHOLDS].sort((a, b) => b.minCulture - a.minCulture);
  for (const t of sorted) {
    if (culture >= t.minCulture) return t.stage;
  }
  return 'Barbarism';
};

const calculateStats = (
  tiles: TileData[],
  civData: any,
  activeBonuses: any,
  neighbors: NeighborCiv[],
  treaties?: Treaty[],
) => {
  // 1. Terrain Bonuses
  const terrainTypes = new Set(tiles.map((t) => t.terrain));
  let terrainDefense = 0;
  let terrainIndustry = 0;

  terrainTypes.forEach((t) => {
    const bonus = TERRAIN_BONUSES[t];
    if (bonus) {
      terrainDefense += bonus.defense;
      terrainIndustry += bonus.industry;
    }
  });

  // Island bonus reduced from +7 → +3 to keep total martial in line with
  // the rest of the balance pass (Sparta + Strength + island + Barbarism
  // multipliers used to push Martial above 100).
  if (civData.isIsland) terrainDefense += 3;

  // 2. Building Bonuses
  const buildings = tiles
    .map((t) => t.building)
    .filter((b) => b !== BuildingType.None);
  // Tile-based building bonus accumulators. ONLY structural fields (martial,
  // capacity, yield rates) are accumulated here. Faith Total and Culture
  // Total grants from Temple and Amphitheatre are one-shot increments
  // applied at placement time in handleTileClick so they enter the running
  // total once and aren't re-added every render.
  //
  //   Farm         +1 Capacity, +1 Production Income per tile
  //   Workshop     +2 Production Income per tile
  //   Library      +2 Science Yield per tile
  //   Barracks     +3 Martial per tile
  //   Temple       +1 Faith Yield per tile (one-time +2 Faith Total at place)
  //   Amphitheatre +2 Culture Yield per tile (one-time +3 Culture at place)
  //   Wall         +1 Capacity per tile (defense die rolled in actionSystem.ts)
  //   ArchTower    +10 Martial per tile (requires 30 Science to build)
  let buildingDefense = 0;
  let buildingMartial = 0;
  let buildingCapacity = 0;
  let buildingProductionIncome = 0;
  let buildingScienceYield = 0;
  let buildingCultureYield = 0;
  let buildingFaithYield = 0;

  buildings.forEach((b) => {
    if (b === BuildingType.Farm) {
      buildingCapacity += 1;
      buildingProductionIncome += 1;
    }
    if (b === BuildingType.Workshop) {
      buildingProductionIncome += 2;
    }
    if (b === BuildingType.Library) {
      buildingScienceYield += 2;
    }
    if (b === BuildingType.Barracks) {
      buildingMartial += 3;
    }
    if (b === BuildingType.Wall) {
      // Walls are PURELY defensive now: no flat Martial bonus. Each wall
      // tile adds +1d8 on defense rolls (raids + incoming attacks, up to 3)
      // and +1 Population Capacity (interior protected from raiders).
      // Barracks is the Martial-generating building (+3 each); Walls are the
      // turtle/defense-specialist building. Troy's flag doubles the wall-dice
      // count (handled in actionSystem.ts raid path).
      buildingCapacity += 1;
    }
    if (b === BuildingType.Temple) {
      buildingFaithYield += 1;
    }
    if (b === BuildingType.Amphitheatre) {
      buildingCultureYield += 2;
    }
    if (b === BuildingType.ArchimedesTower) {
      // Keep as a mid-tier rather than the old blow-out +20. Archimedes
      // Tower now gives +10 Martial (still substantial — a little less than
      // two Barracks at half the build footprint).
      buildingDefense += 10;
    }
  });

  // 3. Base + Multipliers
  // NOTE: Defense was collapsed into Martial so a single stat governs both
  // offensive and defensive combat. Every former Defense source (base
  // defense, terrain, walls, Archimedes Tower, cultural prestige, peace
  // treaties, Holy War, Masonry, etc.) now feeds Martial. The `defense`
  // return value is retained at 0 for backward compatibility with existing
  // types but is no longer consulted in combat or raid math.
  //
  // STAT DERIVATION CONTRACT
  //
  // Two distinct categories. Get this wrong and you double-count buildings
  // every recompute (Iteration 5 had this exact bug for Capacity).
  //
  // ACCUMULATING totals — built up by player actions (Worship, Develop,
  // Research, world events). The stored value IS the truth. calculateStats
  // must NOT add building bonuses to these or they compound each render
  // (e.g., 1 Amphitheatre on the map would add +3 Culture every turn
  // instead of the intended +3 once at placement time).
  //   - science  : reads stats.science, no building add.
  //   - culture  : reads stats.culture, no building add.
  //   - faith    : reads stats.faith,   no building add.
  //   - diplomacy: reads stats.diplomacy.
  //
  // STRUCTURAL stats — derived from the current map + civ definition.
  // Buildings ADD here because losing the building loses the bonus.
  //   - martial         : base + defense + terrain + buildings + traits + …
  //   - industry        : base + terrain.
  //   - capacity        : baseStats.capacity + buildings.
  //   - fertility       : baseStats.fertility (+ trait/event bumps).
  //   - productionIncome: base + buildings (Workshops/Farms).
  //   - scienceYield    : base + Library tile bonuses.
  //   - cultureYield    : base + Amphitheatre tile bonuses.
  //   - faithYield      : base + Temple tile bonuses.
  let martial = civData.baseStats.martial + civData.baseStats.defense + terrainDefense + buildingDefense + buildingMartial;
  let faith = civData.stats.faith ?? civData.baseStats.faith;        // ACCUMULATING
  let culture = civData.stats.culture || 0;                          // ACCUMULATING
  let science = civData.stats.science || 0;                          // ACCUMULATING
  // Diplomacy is fully DERIVED — every source (Beauty trait, religion
  // tenets, science unlocks, wonders, cultural prestige) re-applies each
  // render. It starts from 0 and accumulates only via in-render bonuses, so
  // we don't read stored stats.diplomacy here (that would compound).
  let diplomacy = 0;
  let fertility = civData.baseStats.fertility;
  let industry = civData.baseStats.industry + terrainIndustry;
  let populationCapacity = (civData.baseStats.capacity || 10) + buildingCapacity;
  // PERSISTENT CAPACITY BONUS — each Grow action adds +1 to stats.capacityBonus.
  // We re-apply it here because calculateStats rebuilds capacity from scratch
  // every render; without this re-apply, the +1 cap from Grow would vanish on
  // the next recompute.
  if (civData.stats.capacityBonus) populationCapacity += civData.stats.capacityBonus;
  let productionIncome = (civData.baseStats.productionIncome ?? civData.baseStats.industry) + buildingProductionIncome;
  let scienceYield = (civData.baseStats.scienceYield ?? Math.max(1, Math.floor(civData.baseStats.industry / 3))) + buildingScienceYield;
  let cultureYield = (civData.baseStats.cultureYield ?? Math.max(1, Math.floor(civData.baseStats.faith / 3))) + buildingCultureYield;
  let faithYield = (civData.baseStats.faithYield ?? Math.max(1, Math.floor(civData.baseStats.faith / 2))) + buildingFaithYield;

  // Wonder Bonuses — Defense wonder bonuses are folded into Martial.
  // WONDER bonuses
  // ACCUMULATING fields (faith, culture, science) get their wonder bonus
  // applied ONCE in handleActionSelect when the wonder is built (it sets
  // bonusChanges.faith etc.). Re-adding them here every render would double
  // them each turn — same bug as the building one-shot fix above.
  // STRUCTURAL fields (martial, capacity, productionIncome via 'production')
  // are derived each render so we DO add them here so they always reflect
  // the current built-wonder state.
  if (civData.builtWonderId) {
    const wonder = WONDERS_LIST.find((w) => w.id === civData.builtWonderId);
    if (wonder && wonder.bonus) {
      if (wonder.bonus.defense) martial += wonder.bonus.defense; // folds into Martial
      if (wonder.bonus.martial) martial += wonder.bonus.martial;
      if (wonder.bonus.diplomacy) diplomacy += wonder.bonus.diplomacy;
      if (wonder.bonus.populationCapacity)
        populationCapacity += wonder.bonus.populationCapacity;
      if (wonder.bonus.production) {
        industry += wonder.bonus.production;
        productionIncome += wonder.bonus.production;
      }
      // wonder.bonus.faith / culture / science are applied at build time,
      // NOT here, so they don't compound across renders.
    }
  }

  // Apply Religion Tenets
  if (
    civData.religion &&
    civData.religion.tenets &&
    civData.religion.tenets.length > 0
  ) {
    const tenets = civData.religion.tenets;

    // Each tenet has a real, proportionate effect. Multiple tenets stack.
    // IMPORTANT: tenets MAY adjust YIELDS (per-turn rates that recompute
    // each render) and STRUCTURAL stats (martial, capacity, fertility,
    // diplomacy). They MUST NOT add to ACCUMULATING stats (faith, culture,
    // science totals) — that compounds each render into exponential growth.
    if (tenets.includes("monotheism")) {
      // +2 Faith Yield/turn. Auto-spread handled in handleIncomeComplete.
      faithYield += 2;
    }
    if (tenets.includes("polytheism")) {
      // +1 Faith Yield per Temple, +1 baseline.
      const templeCount = tiles.filter(
        (t) => t.building === BuildingType.Temple,
      ).length;
      faithYield += templeCount + 1;
    }
    if (tenets.includes("holy_war")) {
      // +2 Martial per converted neighbor + 1 baseline (Martial is derived
      // each render so this is safe).
      const convertedCount = neighbors.filter(
        (n) => n.religion === civData.religion.name,
      ).length;
      martial += convertedCount * 2 + 1;
    }
    if (tenets.includes("scriptures")) {
      // Double Faith YIELD per turn + +1 Science Yield.
      faithYield = Math.max(2, faithYield * 2);
      scienceYield += 1;
    }
    if (tenets.includes("philosophy")) {
      // Faith powers science: convert ~25% of stored Faith Total into a
      // Science Yield bump per turn (capped so it can't blow up).
      const conversion = Math.min(8, Math.floor((civData.stats.faith || 0) * 0.25));
      scienceYield += conversion;
      cultureYield += 1;
    }
    if (tenets.includes("medicine")) {
      // +5 Capacity, +1 Fertility (both derived each render — safe).
      populationCapacity += 5;
      fertility += 1;
    }
    if (tenets.includes("asceticism")) {
      // Tighter pop cap, bigger faith yield per turn.
      populationCapacity -= 3;
      faithYield += 3;
    }
    if (tenets.includes("evangelism")) {
      // +1 Faith Yield baseline; conversion logic handled in spreadReligion.
      faithYield += 1;
    }
    if (tenets.includes("christianity")) {
      // Universal Faith: +1 Faith Yield, +1 Culture Yield, +1 Diplomacy,
      // +1 Martial per fellow-faith ally.
      faithYield += 1;
      cultureYield += 1;
      diplomacy += 1;
      const allyCount = neighbors.filter(
        (n) => n.relationship === 'Ally' && n.religion === civData.religion.name,
      ).length;
      martial += allyCount;
    }
  }

  // Apply Traits — multipliers attach to per-turn capability (Martial,
  // Industry, Yields), NOT accumulated totals. Multiplying totals on every
  // render makes them grow exponentially (Wisdom × Faith × every recompute).
  // Strength × Martial and Industrious × Industry are safe because those
  // stats are derived from base + buildings each render and never stored as
  // running totals.
  if (civData.traits.includes("Strength")) martial *= 2;
  if (civData.traits.includes("Industrious")) {
    industry *= 2;
    productionIncome *= 2;
  }
  if (civData.traits.includes("Intelligence")) {
    scienceYield = Math.max(2, scienceYield * 2);
  }
  if (civData.traits.includes("Wisdom")) {
    faithYield = Math.max(2, faithYield * 2);
  }
  if (civData.traits.includes("Creativity")) {
    cultureYield = Math.max(2, cultureYield * 2);
  }
  if (civData.traits.includes("Health")) {
    fertility += 3;        // growth specialists
    populationCapacity += 3; // healthier civs can house more
  }
  if (civData.traits.includes("Beauty")) {
    diplomacy += 2;
    cultureYield += 1;     // fashion/art radiate soft power per turn
  }

  // Apply Tech Tree Branch Picks — STRUCTURAL stats only.
  // Same pattern as cultural bonuses: structural fields are re-derived
  // every render so we re-apply them here; accumulating fields (science
  // total) are applied ONCE at pick-time in handleTechPick.
  if (civData.techChoices && civData.techChoices.length > 0) {
    civData.techChoices.forEach((choiceId: string) => {
      const choice = TECH_CHOICES.find((c) => c.id === choiceId);
      if (!choice || !choice.statBonus) return;
      const b = choice.statBonus;
      if (b.martial) martial += b.martial;
      if (b.defense) martial += b.defense;
      if (b.capacity) populationCapacity += b.capacity;
      if (b.productionIncome) productionIncome += b.productionIncome;
      if (b.scienceYield) scienceYield += b.scienceYield;
      if (b.cultureYield) cultureYield += b.cultureYield;
      if (b.faithYield) faithYield += b.faithYield;
      if (b.diplomacy) diplomacy += b.diplomacy;
    });
  }

  // Apply Cultural Tree Bonuses — STRUCTURAL stats only.
  // Structural stats (martial, defense, capacity, productionIncome,
  // scienceYield, cultureYield, faithYield, diplomacy) re-derive each
  // render from baseStats + buildings + traits, so any bonus must be
  // re-applied here every time or it evaporates.
  // ACCUMULATING totals (science, culture) are applied ONCE at pick-time
  // in handleCulturePick and stored in civData.stats.science/culture —
  // those are safe because calculateStats reads the stored value.
  if (civData.culturalBonuses && civData.culturalBonuses.length > 0) {
    civData.culturalBonuses.forEach((choiceId: string) => {
      const choice = CULTURE_CHOICES.find((c) => c.id === choiceId);
      if (!choice || !choice.statBonus) return;
      const b = choice.statBonus;
      if (b.martial) martial += b.martial;
      if (b.defense) martial += b.defense; // defense folded into martial
      if (b.capacity) populationCapacity += b.capacity;
      if (b.productionIncome) productionIncome += b.productionIncome;
      if (b.scienceYield) scienceYield += b.scienceYield;
      if (b.cultureYield) cultureYield += b.cultureYield;
      if (b.faithYield) faithYield += b.faithYield;
      if (b.diplomacy) diplomacy += b.diplomacy;
    });
  }

  // Apply Science Level Unlocks
  // ACCUMULATING bonuses (faith/culture/science) are routed to the per-turn
  // YIELDS so they don't compound each render. STRUCTURAL bonuses
  // (martial/industry/capacity/fertility/diplomacy) are added directly since
  // those stats are derived from baseStats each render anyway.
  SCIENCE_UNLOCKS.forEach((unlock) => {
    if (science >= unlock.level && unlock.statBonus) {
      Object.entries(unlock.statBonus).forEach(([key, val]) => {
        if (key === "martial")   martial += val;
        if (key === "industry")  industry += val;
        if (key === "defense")   martial += val; // Defense folded into Martial
        if (key === "capacity")  populationCapacity += val;
        if (key === "fertility") fertility += val;
        if (key === "diplomacy") diplomacy += val;
        // Accumulating stats route to yield so they're additive per-turn
        // instead of compounding each render.
        if (key === "faith")     faithYield += val;
        if (key === "culture")   cultureYield += val;
        if (key === "science")   scienceYield += val;
      });
    }
  });

  // NAVAL TECH BONUSES — coastal/island civs get extra benefits from
  // Shipbuilding (L13) and Navigation (L35).  A civ counts as "naval"
  // if it's an island OR its waterResource is Ocean / River / Lake /
  // LakeBrackish / Marsh (any body of water big enough to launch ships).
  // Mainland-inland civs (wells only) don't qualify — they can still
  // research the techs and get the baseline bonus, just not the marine
  // multipliers.
  const isNavalCiv = civData.isIsland
    || civData.waterResource === 'Ocean'
    || civData.waterResource === 'River'
    || civData.waterResource === 'Lake'
    || civData.waterResource === 'LakeBrackish'
    || civData.waterResource === 'Marsh';
  if (isNavalCiv) {
    if (science >= 13) {
      // Shipbuilding: +2 Martial (naval defense), +1 Industry (trade income)
      martial += 2;
      industry += 1;
    }
    if (science >= 35) {
      // Navigation: +5 Martial (triremes dominate coastal waters)
      martial += 5;
    }
  }

  // Apply Technology Bonuses
  if (civData.technologies) {
    civData.technologies.forEach((techId: string) => {
      const tech = TECHNOLOGIES.find((t) => t.id === techId);
      if (!tech) return;

      // STRUCTURAL tech effects (reapplied each render — safe because the
      // base values are re-derived from civData.baseStats every call).
      if (tech.effect === "martial_2x") martial *= 2;
      if (tech.effect === "martial_3x") martial *= 3;
      if (tech.effect === "industry_bonus_5") industry += 5;

      // ACCUMULATING tech effects (science_bonus_3, science_bonus_5,
      // faith_to_science) are intentionally NOT applied here. Mutating the
      // accumulating totals (science/faith) inside calculateStats causes
      // them to compound every render. These tech bonuses are applied
      // ONCE at the moment the tech is unlocked, inside processTimelineEvent.
      // See the STAT DERIVATION CONTRACT above.
    });
  }

  // Apply Cultural Stage Multipliers — these scale per-turn capability
  // (Martial in combat, Industry into Production Pool income, Fertility
  // into population growth, Faith Yield and Science Yield into per-turn
  // gains). They DO NOT touch the accumulated totals (Science and Faith
  // totals) — multiplying a running total each render would erase progress
  // on Barbarism (×0.5) every turn the player stays in that stage.
  const stageKey =
    (civData.culturalStage?.toLowerCase() as keyof typeof CULTURAL_STAGE_MULTIPLIERS) ||
    "barbarism";
  const stageMultipliers = CULTURAL_STAGE_MULTIPLIERS[stageKey];
  if (stageMultipliers) {
    martial = Math.floor(martial * stageMultipliers.martial);
    fertility = Math.floor(fertility * stageMultipliers.fertility);
    industry = Math.floor(industry * stageMultipliers.industry);
    // Yield multipliers (per-turn gains) instead of total multipliers.
    scienceYield = Math.max(1, Math.floor(scienceYield * stageMultipliers.science));
    faithYield = Math.max(1, Math.floor(faithYield * stageMultipliers.faith));
  }

  // Apply Turn Bonus (Cultural Choice)
  if (activeBonuses.martial) martial = Math.floor(martial * 1.5);
  if (activeBonuses.fertility) fertility = Math.floor(fertility * 1.5);
  if (activeBonuses.science) science = Math.floor(science * 1.5);
  if (activeBonuses.faith) faith = Math.floor(faith * 1.5);
  if (activeBonuses.industry) industry = Math.floor(industry * 1.5);

  // Apply Treaty Bonuses (Feature 1)
  if (treaties && treaties.length > 0) {
    const tradeTreatyCount = treaties.filter((t) => t.type === "trade").length;
    const culturalTreatyCount = treaties.filter((t) => t.type === "cultural").length;
    const militaryTreatyCount = treaties.filter((t) => t.type === "military").length;
    const peaceTreatyCount = treaties.filter((t) => t.type === "peace").length;
    // Alliance = mutual defense. +2 Martial per active alliance, stronger than
    // peace treaty's +1 because alliances commit both sides to mutual aid.
    const allianceTreatyCount = treaties.filter((t) => t.type === "alliance").length;

    industry += tradeTreatyCount * 2;
    culture += culturalTreatyCount * 2;
    martial += militaryTreatyCount * 3;
    martial += peaceTreatyCount * 1;
    martial += allianceTreatyCount * 2; // Defense folded in.
  }

  // Cultural Prestige — soft-power effects that scale with Culture total.
  // Every 10 Culture grants +1 Martial (prestige hardens you against both
  // attack and raid because rivals respect/admire you). Every 20 Culture
  // grants +1 Diplomacy (cultural cachet opens doors). This turns Culture
  // into a live, always-on stat.
  const culturalPrestigeMartial = Math.floor(culture / 10);
  const culturalPrestigeDiplomacy = Math.floor(culture / 20);
  martial += culturalPrestigeMartial;
  diplomacy += culturalPrestigeDiplomacy;

  // POPULATION BONUSES — the reason to build Houses and grow population. A
  // larger population means more citizens working the fields, defending the
  // city, producing art, and advancing knowledge. This makes Grow, Farms,
  // and Capacity investments pay off across combat and economy.
  //   - Every 4 Population: +1 Martial (citizen militia)
  //   - Every 5 Population: +1 Industry / Production Income (workers)
  // (Culture/Science/Faith yields aren't separately returned by this
  //  function — those are applied to stats.scienceYield / etc. directly in
  //  their own update paths. We keep this section focused on what
  //  calculateStats actually outputs.)
  const pop = civData.stats.population || 0;
  martial += Math.floor(pop / 4);
  industry += Math.floor(pop / 5);

  return {
    martial: Math.floor(martial),
    defense: 0, // Collapsed into Martial. Retained in type for compatibility.
    faith: Math.floor(faith),
    culture: Math.floor(culture),
    science: Math.floor(science),
    fertility: Math.floor(fertility),
    industry: Math.floor(industry),
    diplomacy: diplomacy,
    capacity: Math.floor(populationCapacity),
    // Yield rates are derived each render — never overwrite stored stats with
    // a stale value. Returning them lets callers spread these into civ.stats
    // and have building Yield bonuses always reflect the current map.
    productionIncome: Math.max(0, Math.floor(productionIncome)),
    scienceYield: Math.max(1, Math.floor(scienceYield)),
    cultureYield: Math.max(1, Math.floor(cultureYield)),
    faithYield: Math.max(1, Math.floor(faithYield)),
  };
};

const App: React.FC = () => {
  // --- ROUTER STATE ---
  const location = useLocation();
  const autoStarted = useRef(false);

  // --- STATE ---
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [activeTab, setActiveTab] = useState<
    "build" | "science" | "culture" | "world" | "wonders" | "religion" | "war" | "scoreboard" | "diplomacy"
  >("build");
  // Tracks which stat/block in the left sidebar is currently expanded for
  // its rich explanation. null = nothing expanded. Click again to collapse.
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
  // When a world event grants a FREE building placement (e.g. "Pray to the
  // Gods" in the Thera Eruption event gifts a Temple), we route the player
  // into idle placement mode first. This ref remembers which phase to resume
  // after they drop the building on a tile. Using a ref (not state) keeps
  // React from re-rendering just because the target changed mid-turn.
  const pendingPostFreePlacementPhase = useRef<TurnPhaseV2 | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    simulationId: "demo",
    year: -50000,
    timelineIndex: 0,
    hasStarted: false,
    civilization: null as any,
    selectedAction: null,
    placingWonder: false,
    messages: [],
    neighbors: [],
    pendingTurnChoice: false,
    currentEventPopup: null,
    gameFlags: { warUnlocked: true, religionUnlocked: true },
    warsWon: 0,
    combatLog: [],
    religionSpread: 0,
    wondersBuilt: [],
    gameEnded: false,
    treaties: [],
    tradedThisTurn: [],
    fogOfWar: true,
    pendingTreaty: null,
    // V2 turn flow fields
    turnPhase: 'idle' as TurnPhaseV2,
    currentWorldEvent: null,
    currentCivEvent: null,
    selectedWorldChoice: null,
    selectedPlayerAction: null,
    turnResolution: null,
    actionPlacements: 0,
    turnNumber: 0,
    conqueredTerritories: 0,
    pendingRespawn: false,
    respawnOptions: [],
    conquestReward: null,
  });

  // Temporary storage for the active turn bonus
  const [turnBonus, setTurnBonus] = useState<any>({});

  // Mobile responsive state
  const [showPanel, setShowPanel] = useState<"stats" | "actions" | null>(null);

  // --- SYNC HOOKS ---
  const { syncState, submitTurn } = useGameSync(
    gameState.hasStarted ? gameState.civilization?.presetId : null,
  );
  useAutoSave(
    gameState,
    gameState.hasStarted ? gameState.civilization?.presetId : null,
  );

  // Turn system state (must be after syncState is declared)
  const turnState = syncState?.turnState;
  const [pendingDecision, setPendingDecision] = useState<TurnDecision>({
    culturalFocus: null,
    buildActions: [],
    warDeclarations: [],
    allianceOffers: [],
    submitted: false,
    v2Action: null,
    v2ActionParams: null,
    finalStats: {},
  });

  // When teacher advances timeline, trigger local advance
  useEffect(() => {
    if (
      syncState.serverTimelineIndex !== null &&
      syncState.serverTimelineIndex > gameState.timelineIndex &&
      gameState.hasStarted
    ) {
      // Teacher has advanced - trigger local advance
      initiateAdvance();
    }
  }, [syncState.serverTimelineIndex]);

  // --- LOCAL SAVE/LOAD (Single Player) ---
  const SAVE_KEY = 'throughhistory_save';
  const isSinglePlayer = !syncState.isOnline;
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // NOTE: these useState hooks are declared here (earlier than their siblings
  // below) because the save/load useEffects reference them. Declaring them
  // later causes a TDZ ReferenceError during the initial render, or
  // re-renders with stale values if they aren't in the effect's dep array.
  const [takenRespawnIds, setTakenRespawnIds] = useState<string[]>([]);
  const [v2IncomeMessages, setV2IncomeMessages] = useState<string[]>([]);
  const [v2TurnResolution, setV2TurnResolution] = useState<TurnResolution | null>(null);
  const [v2StatsBefore, setV2StatsBefore] = useState<Record<string, number>>({});
  const [v2UnlockedActions, setV2UnlockedActions] = useState<typeof ACTION_DEFINITIONS>([]);
  const [showRespawnPanel, setShowRespawnPanel] = useState(false);

  // V2 DECISION MODALS — attack outcome, threshold popups, tree browsers.
  // These live at the top level so they can fire from anywhere in the
  // turn flow without having to thread callbacks through every phase.
  const [attackOutcome, setAttackOutcome] = useState<AttackOutcomePopup | null>(null);
  const [thresholdQueue, setThresholdQueue] = useState<ThresholdPopup[]>([]);
  const [thresholdsAwarded, setThresholdsAwarded] = useState<string[]>([]);
  const [showTechTree, setShowTechTree] = useState(false);
  const [showReligionTree, setShowReligionTree] = useState(false);
  const [showCultureTree, setShowCultureTree] = useState(false);
  const [chosenCultureIds, setChosenCultureIds] = useState<string[]>([]);

  // Shared threshold-check helper. Compares a set of current stats
  // against the full threshold table and queues any popups that aren't
  // already in thresholdsAwarded. Used by both turn-resolution recompute
  // and mid-turn stat jumps (tree picks, wonder builds).
  const checkThresholds = useCallback(
    (science: number, culture: number, faith: number, religionFounded: boolean) => {
      const newThresholds: ThresholdPopup[] = [];
      SCIENCE_UNLOCKS.forEach((u) => {
        const id = `sci-${u.level}`;
        if (science >= u.level && !thresholdsAwarded.includes(id)) {
          const bonuses: string[] = [];
          if (u.statBonus) Object.entries(u.statBonus).forEach(([k, v]) => bonuses.push(`+${v} ${k}`));
          if (u.unlocks) bonuses.push(`Ability: ${u.unlocks.replace(/_/g, ' ')}`);
          newThresholds.push({
            id, kind: 'science',
            title: u.effect.split(':')[0],
            subtitle: `Science ${u.level} reached`,
            description: u.effect,
            bonuses,
            cta: 'Press on with research',
          });
        }
      });
      [{ tier: 'Bronze', t: 10 }, { tier: 'Classical', t: 25 }, { tier: 'Renaissance', t: 50 }].forEach(({ tier, t }) => {
        const id = `tech-tier-${tier}`;
        if (science >= t && !thresholdsAwarded.includes(id)) {
          newThresholds.push({
            id, kind: 'science',
            title: `${tier} Tech Tier Unlocked`,
            subtitle: `Science ${t} reached — pick a branch`,
            description: 'The Tech Tree now offers a branching choice. Pick a path (War, Economy, or Knowledge) to specialize your civilization.',
            bonuses: [`Open the Tech Tree and claim your ${tier}-tier path.`],
            cta: 'Open Tech Tree',
          });
        }
      });
      CULTURAL_STAGE_THRESHOLDS.forEach((s) => {
        const id = `cul-${s.stage}`;
        if (culture >= s.minCulture && !thresholdsAwarded.includes(id)) {
          newThresholds.push({
            id, kind: 'culture',
            title: `Stage: ${s.stage}`,
            subtitle: `Culture ${s.minCulture} reached`,
            description: s.flavor,
            bonuses: ['Open the Culture Tree to claim your stage bonus.'],
            cta: 'Claim cultural bonus',
          });
        }
      });
      RELIGION_TENET_THRESHOLDS.forEach((t, i) => {
        const id = `faith-${t}`;
        if (faith >= t && !thresholdsAwarded.includes(id)) {
          newThresholds.push({
            id, kind: 'faith',
            title: i === 0 && !religionFounded ? 'Religion can be founded' : `Tenet slot ${i + 1} unlocked`,
            subtitle: `Faith ${t} reached`,
            description: i === 0 && !religionFounded
              ? 'Your people yearn for meaning. Use the Worship action to found a religion.'
              : 'Your faith has matured. Open the Religion Tree to adopt another tenet.',
            bonuses: [i === 0 && !religionFounded ? 'Worship → Found Religion option unlocked' : `Pick tenet #${i + 1}`],
            cta: i === 0 && !religionFounded ? 'Found a religion' : 'Open Religion Tree',
          });
        }
      });
      if (newThresholds.length > 0) {
        setThresholdQueue((q) => [...q, ...newThresholds]);
        setThresholdsAwarded((a) => [...a, ...newThresholds.map((t) => t.id)]);
      }
    },
    [thresholdsAwarded],
  );
  // Tracks whether the player has ever had a non-zero population. Without
  // this guard, the respawn effect would fire at game start (everyone begins
  // with houses:0 / population:0) — and again every time the player resets
  // (since refs persist across React state changes). Declared here so
  // resetGame below can clear it back to false for a fresh run.
  const hasEverHadPopulation = useRef(false);

  // Load saved game on mount (single player only).
  // Restores the full game state including turn-phase data so a player can
  // resume mid-turn (e.g., in the middle of a world event or build phase).
  useEffect(() => {
    if (!gameState.hasStarted && !autoStarted.current) {
      try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.gameState && parsed.tiles) {
            // Re-derive structural stats on load — diplomacy is now fully
            // derived (calc starts from 0), so the saved value would be
            // stale. Same for martial/industry/yields after our refactor.
            // Run calculateStats and merge the recomputed fields into the
            // restored stats so the player sees correct numbers immediately.
            try {
              const recomputed = calculateStats(
                parsed.tiles,
                parsed.gameState.civilization,
                {},
                parsed.gameState.neighbors || [],
                parsed.gameState.treaties || [],
              );
              parsed.gameState.civilization.stats = {
                ...parsed.gameState.civilization.stats,
                ...recomputed,
              };
            } catch (recErr) {
              // Defensive: if recompute fails, fall back to saved values.
              console.warn('Failed to re-derive stats on load:', recErr);
            }
            setGameState(parsed.gameState);
            setTiles(parsed.tiles);
            if (parsed.takenRespawnIds) setTakenRespawnIds(parsed.takenRespawnIds);
            if (parsed.v2IncomeMessages) setV2IncomeMessages(parsed.v2IncomeMessages);
            if (parsed.v2TurnResolution) setV2TurnResolution(parsed.v2TurnResolution);
            if (parsed.v2StatsBefore) setV2StatsBefore(parsed.v2StatsBefore);
            if (parsed.v2UnlockedActions) setV2UnlockedActions(parsed.v2UnlockedActions);
            if (parsed.thresholdsAwarded) setThresholdsAwarded(parsed.thresholdsAwarded);
            // Seed local mirror from civ.culturalBonuses (source of truth).
            // Fall back to legacy chosenCultureIds in older saves.
            const restored = parsed.gameState?.civilization?.culturalBonuses
              ?? parsed.chosenCultureIds ?? [];
            setChosenCultureIds(restored);
          }
        }
      } catch (e) {
        console.warn('Failed to load saved game:', e);
      }
    }
  }, []);

  // Auto-save to localStorage every 10 seconds and on beforeunload (single player).
  // Saves all turn-phase scratch state so a mid-turn reload restores correctly.
  useEffect(() => {
    if (!gameState.hasStarted || !isSinglePlayer) return;

    const saveToLocal = () => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          gameState,
          tiles,
          takenRespawnIds,
          v2IncomeMessages,
          v2TurnResolution,
          v2StatsBefore,
          v2UnlockedActions,
          chosenCultureIds,
          thresholdsAwarded,
          savedAt: Date.now(),
        }));
      } catch (e) {
        console.warn('Failed to save game locally:', e);
      }
    };

    const interval = setInterval(saveToLocal, 10000);

    const handleBeforeUnload = () => {
      saveToLocal();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Also save on visibility change (tab switch, minimize)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') saveToLocal();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [gameState, tiles, isSinglePlayer, takenRespawnIds, v2IncomeMessages, v2TurnResolution, v2StatsBefore, v2UnlockedActions, chosenCultureIds, thresholdsAwarded]);

  const resetGame = () => {
    localStorage.removeItem(SAVE_KEY);
    setTiles([]);
    setGameState({
      simulationId: "demo",
      year: -50000,
      timelineIndex: 0,
      hasStarted: false,
      civilization: null as any,
      selectedAction: null,
      placingWonder: false,
      messages: [],
      neighbors: [],
      pendingTurnChoice: false,
      currentEventPopup: null,
      gameFlags: { warUnlocked: true, religionUnlocked: true },
      warsWon: 0,
    combatLog: [],
      religionSpread: 0,
      wondersBuilt: [],
      gameEnded: false,
      treaties: [],
      tradedThisTurn: [],
      fogOfWar: true,
      pendingTreaty: null,
      turnPhase: 'idle' as TurnPhaseV2,
      currentWorldEvent: null,
      currentCivEvent: null,
      selectedWorldChoice: null,
      selectedPlayerAction: null,
      turnResolution: null,
      actionPlacements: 0,
      turnNumber: 0,
      conqueredTerritories: 0,
      pendingRespawn: false,
      respawnOptions: [],
      conquestReward: null,
    });
    // Clear every piece of ancillary state so a fresh game starts truly fresh.
    setTakenRespawnIds([]);
    setV2TurnResolution(null);
    setV2UnlockedActions([]);
    setV2IncomeMessages([]);
    setV2StatsBefore({});
    setAttackOutcome(null);
    setThresholdQueue([]);
    setThresholdsAwarded([]);
    setChosenCultureIds([]);
    setShowTechTree(false);
    setShowReligionTree(false);
    setShowCultureTree(false);
    setConquestMessages([]);
    setConquestTargetName('');
    setShowConquestReward(false);
    setShowRespawnPanel(false);
    setShowResetConfirm(false);
    // Refs survive React state changes — explicitly reset them so a fresh
    // game doesn't carry over respawn-trigger or pending-placement guards
    // from the previous run.
    hasEverHadPopulation.current = false;
    pendingPostFreePlacementPhase.current = null;
  };

  // --- ACTIONS ---

  const startGame = (preset: CivPreset) => {
    const newTiles = generateMap(preset);

    setTiles(newTiles);
    // V2: Calculate starting yields from preset
    const startingProductionIncome = preset.baseStats.productionIncome || preset.baseStats.industry;
    const startingScienceYield = preset.baseStats.scienceYield || Math.max(1, Math.floor(preset.baseStats.industry / 3));
    const startingCultureYield = preset.baseStats.cultureYield || Math.max(1, Math.floor(preset.baseStats.faith / 3));
    const startingFaithYield = preset.baseStats.faithYield || Math.max(1, Math.floor(preset.baseStats.faith / 2));
    const startingCapacity = preset.baseStats.capacity || WATER_CAPACITIES[preset.waterResource];

    setGameState({
      simulationId: "sim-1",
      year: -8500,
      timelineIndex: 0,
      hasStarted: true,
      selectedAction: BuildingType.House,
      placingWonder: false,
      isPlacingStarterHouses: true,
      pendingTurnChoice: false,
      currentEventPopup: null,
      messages: [
        `Place 2 founding houses on the map to settle ${preset.name}. Then click Turn 1 to begin.`,
        `Welcome to ${preset.name}. The year is 8500 BCE.`,
        `Grow your Population: every 4 Pop = +1 Martial, every 5 Pop = +1 Industry.`,
        `Turn flow: Events → pick 1 Action → Build Phase → End Turn.`,
      ],
      // Neighbors are now real adjacent civilizations pulled from the
      // adjacency map + civ presets. Attacking "Mesopotamia" means fighting
      // the actual Mesopotamia civ; a decisive victory removes it from the
      // map for the rest of the game. Fallback to legacy generics only if
      // this civ has no adjacency entry (defensive — every shipped civ does).
      neighbors: (() => {
        const real = buildCivNeighbors(preset.id, CIV_ADJACENCY, CIV_PRESETS);
        return real.length > 0 ? real : GENERATE_NEIGHBORS(-8500);
      })(),
      gameFlags: { warUnlocked: true, religionUnlocked: true },
      warsWon: 0,
    combatLog: [],
      religionSpread: 0,
      wondersBuilt: [],
      gameEnded: false,
      treaties: [],
      tradedThisTurn: [],
      fogOfWar: true,
      pendingTreaty: null,
      // V2 turn flow state
      turnPhase: 'idle' as TurnPhaseV2,
      currentWorldEvent: null,
      currentCivEvent: null,
      selectedWorldChoice: null,
      selectedPlayerAction: null,
      turnResolution: null,
      actionPlacements: 2,
      turnNumber: 0,
      conqueredTerritories: 0,
      pendingRespawn: false,
      respawnOptions: [],
      conquestReward: null,
      civilization: {
        presetId: preset.id,
        name: preset.name,
        regions: preset.regions,
        culturalStage: "Barbarism",
        traits: preset.traits,
        technologies: [],
        culturalBonuses: [],
        techChoices: [],
        baseStats: preset.baseStats,
        flags: {
          conquered: false,
          religionFound: false,
          housesSupportTwoPop: false,
          israelBonus: false,
          troyWallDouble: false,
          romanSplit: false,
          alexandrianBonus: false,
          chinaWallDiscount: false,
        },
        builtWonderId: null,
        religion: { name: null, tenets: [] },
        buildings: {
          farms: 0,
          workshops: 0,
          libraries: 0,
          barracks: 0,
          temples: 0,
          walls: 0,
          amphitheatres: 0,
          archimedes_towers: 0,
        },
        stats: {
          houses: 0,
          housesBuiltThisTurn: 0,
          population: 0,
          capacity: startingCapacity,
          fertility: preset.baseStats.fertility,
          industry: preset.baseStats.industry,
          industryLeft: preset.baseStats.industry,
          // Defense was folded into Martial — initialize the displayed value
          // accordingly so the stat sheet shows the correct combat strength
          // before calculateStats gets a chance to run.
          martial: preset.baseStats.martial + preset.baseStats.defense,
          defense: 0,
          science: 0,
          culture: 0,
          faith: preset.baseStats.faith,
          diplomacy: 0,
          // V2 yields and pool
          productionPool: startingProductionIncome * 3, // Start with 3 turns of income
          productionIncome: startingProductionIncome,
          scienceYield: startingScienceYield,
          cultureYield: startingCultureYield,
          faithYield: startingFaithYield,
          tempDefenseBonus: 0,
          fortifyDice: 0,
        },
      },
    });
  };

  // Auto-select civilization when navigating from student dashboard
  useEffect(() => {
    const state = location.state as { civId?: string } | null;
    if (state?.civId && !gameState.hasStarted && !autoStarted.current) {
      const preset = CIV_PRESETS.find((c) => c.id === state.civId);
      if (preset) {
        autoStarted.current = true;
        startGame(preset);
      }
    }
  }, [location.state, gameState.hasStarted]);

  const processTimelineEvent = (
    event: any,
    currentCiv: GameState["civilization"],
    gameFlags: any,
    currentNeighbors: NeighborCiv[],
  ) => {
    const messages: string[] = []; // Only specific outcomes here
    const changes: Partial<GameState["civilization"]["stats"]> = {};
    const newFlags = { ...currentCiv.flags };
    const newGameFlags = { ...gameFlags };
    const neighborsToAdd: NeighborCiv[] = [];
    let housesLost = 0;
    let newTechnologies = [...(currentCiv.technologies || [])];

    // Auto-unlock technologies based on timeline year
    TECHNOLOGIES.forEach((tech) => {
      if (event.year >= tech.year && !newTechnologies.includes(tech.id)) {
        // Check prerequisites
        if (tech.requires && !newTechnologies.includes(tech.requires)) {
          return; // Skip if prerequisite not met
        }
        newTechnologies.push(tech.id);
        // One-shot application of accumulating-stat tech bonuses. This runs
        // exactly once — at the moment the tech is discovered — so the
        // bonus doesn't compound each render inside calculateStats.
        if (tech.effect === "science_bonus_3") {
          const cur = (changes.science ?? currentCiv.stats.science ?? 0);
          changes.science = cur + 3;
        } else if (tech.effect === "science_bonus_5") {
          const cur = (changes.science ?? currentCiv.stats.science ?? 0);
          changes.science = cur + 5;
        } else if (tech.effect === "faith_to_science") {
          const curFaith = (changes.faith ?? currentCiv.stats.faith ?? 0);
          const conv = Math.floor(curFaith * 0.25);
          const curScience = (changes.science ?? currentCiv.stats.science ?? 0);
          changes.science = curScience + conv;
          // Intentionally do NOT drain faith — Philosophy represents the
          // synthesis of faith and reason, not the erosion of belief. The
          // old behavior silently ticked faith down every render.
        }
        messages.push(
          `Your civilization has discovered ${tech.name}! ${tech.description}`,
        );
      }
    });

    if (event.actions) {
      event.actions.forEach((action: TimelineEventAction) => {
        // Check if action applies to this civ (Region Match)
        const isTarget =
          !action.targetRegions ||
          action.targetRegions.some((r) => currentCiv.regions.includes(r));

        if (
          !isTarget &&
          action.type !== "SET_FLAG" &&
          action.type !== "SPECIAL" &&
          action.type !== "ADD_NEIGHBOR"
        )
          return;

        if (action.type === "MODIFY_STAT" && action.stat) {
          const currentVal = (currentCiv.stats as any)[action.stat] || 0;
          let newVal = currentVal;

          let modValue = action.value || 0;

          // Value Source: Dynamic from current stats (e.g. value = number of houses)
          if (action.valueSource === "houses") {
            modValue = currentCiv.stats.houses;
          }

          if (action.isPercent) {
            newVal += Math.floor(currentVal * (modValue / 100));
          } else {
            newVal += modValue;
          }
          (changes as any)[action.stat] = newVal;

          // Format message with actual value
          const valStr = action.isPercent ? `${modValue}%` : `${modValue}`;
          messages.push(action.message.replace("VAL", valStr));
        } else if (action.type === "DISASTER") {
          const saved = checkSavingThrow(
            currentCiv,
            action.saveTrait,
            action.saveStat,
            action.saveDC,
          );
          if (saved) {
            messages.push(
              `DISASTER AVERTED: ${action.message.split("(")[0]} (Saved!)`,
            );
          } else {
            messages.push(`DISASTER STRUCK: ${action.message}`);
            if (action.failEffect?.houseLossPercent) {
              housesLost = Math.floor(
                currentCiv.stats.houses *
                  (action.failEffect.houseLossPercent / 100),
              );
            }
            if (action.failEffect?.popSetTo !== undefined) {
              // handled in main return
              changes.population = action.failEffect.popSetTo;
              changes.houses = action.failEffect.popSetTo;
            }
          }
        } else if (action.type === "SET_FLAG" && action.flagName) {
          // Global flags vs Civ flags
          if (action.flagName === "warUnlocked")
            newGameFlags.warUnlocked = true;
          else if (action.flagName === "religionUnlocked")
            newGameFlags.religionUnlocked = true;
          else if (action.flagName === "housesSupportTwoPop")
            newFlags.housesSupportTwoPop = true;
          else if (isTarget) {
            (newFlags as any)[action.flagName] = true;
          }
          messages.push(action.message);
        } else if (action.type === "ADD_NEIGHBOR" && action.neighbor) {
          const newNeighbor: NeighborCiv = {
            id: `n-${event.year}`,
            name: action.neighbor.name || "Unknown",
            martial: action.neighbor.martial || 10,
            defense: action.neighbor.defense || 5,
            faith: action.neighbor.faith || 5,
            isConquered: false,
            relationship: "Neutral",
          };
          neighborsToAdd.push(newNeighbor);
          messages.push(action.message);
        }
      });
    }

    return {
      changes,
      newFlags,
      newGameFlags,
      messages,
      housesLost,
      neighborsToAdd,
      newTechnologies,
    };
  };

  // ============================================================
  // V2 TURN FLOW: Income → World Event → Civ Event → Action → Resolution
  // ============================================================

  // v2IncomeMessages, v2TurnResolution, v2StatsBefore, v2UnlockedActions are
  // declared earlier (near the save/load block) to avoid TDZ.
  const [conquestMessages, setConquestMessages] = useState<string[]>([]);
  const [conquestTargetName, setConquestTargetName] = useState<string>('');
  const [showConquestReward, setShowConquestReward] = useState(false);

  // --- REFLECTION TURN STATE ---
  // Decision log: each consequential choice the student makes is appended
  // here so the post-game Reflection screen can show them as turning-point
  // candidates. Stored per-game in localStorage so refresh doesn't lose it.
  const [decisionLog, setDecisionLog] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('aws_decision_log');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [reflectionDismissed, setReflectionDismissed] = useState(false);
  const appendDecision = (entry: string) => {
    setDecisionLog((prev) => {
      const next = [...prev, entry];
      try {
        window.localStorage.setItem('aws_decision_log', JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  };
  const handleReflectionComplete = (result: ReflectionResult) => {
    try {
      window.localStorage.setItem('aws_reflection_result', JSON.stringify(result));
    } catch { /* ignore */ }
  };
  // showRespawnPanel is declared earlier to keep respawn trigger useEffect valid.
  // takenRespawnIds is declared earlier (near the save/load block) to avoid TDZ.

  // hasEverHadPopulation is declared earlier so resetGame can clear it.
  useEffect(() => {
    const pop = gameState.civilization?.stats?.population ?? 0;
    if (pop > 0) hasEverHadPopulation.current = true;
  }, [gameState.civilization?.stats?.population]);

  // Auto-trigger the respawn panel when the player has been wiped out.
  // "Wiped out" = houses at 0 AND population at 0 AFTER they had at least one
  // turn with population. Without that second guard we'd show the defeat
  // screen during the pre-first-turn initial state.
  useEffect(() => {
    if (!gameState.hasStarted || !gameState.civilization) return;
    if (showRespawnPanel) return;
    if (!hasEverHadPopulation.current) return;
    const pop = gameState.civilization.stats?.population ?? 1;
    const houses = gameState.civilization.stats?.houses ?? 1;
    if (pop <= 0 && houses <= 0) {
      setShowRespawnPanel(true);
    }
  }, [gameState.civilization?.stats?.population, gameState.civilization?.stats?.houses, gameState.hasStarted, showRespawnPanel]);

  // Triggered by clicking "Advance Turn"
  const initiateAdvance = () => {
    // Snapshot stats before turn
    const before: Record<string, number> = {};
    Object.entries(gameState.civilization.stats).forEach(([k, v]) => {
      if (typeof v === 'number') before[k] = v;
    });
    setV2StatsBefore(before);

    // Calculate income (also rolls barbarian raids + NPC retaliation)
    const incomeResult = calculateIncome(gameState);
    setV2IncomeMessages(incomeResult.messages);

    // Apply income changes immediately; also append any incoming-attack log
    // entries from raids/retaliation so the War tab shows them, and apply
    // NPC relationship changes (retaliating civs flip to Enemy).
    setGameState((prev) => {
      let nextNeighbors = prev.neighbors;
      if (incomeResult.neighborRelationshipChanges && incomeResult.neighborRelationshipChanges.length > 0) {
        const relMap = new Map(incomeResult.neighborRelationshipChanges.map((c) => [c.id, c.relationship]));
        nextNeighbors = prev.neighbors.map((n) =>
          relMap.has(n.id) ? { ...n, relationship: relMap.get(n.id)! } : n,
        );
      }
      const nextLog = incomeResult.combatLogEntries && incomeResult.combatLogEntries.length > 0
        ? [...(prev.combatLog || []), ...incomeResult.combatLogEntries]
        : prev.combatLog || [];
      return {
        ...prev,
        turnPhase: 'income' as TurnPhaseV2,
        neighbors: nextNeighbors,
        combatLog: nextLog,
        civilization: {
          ...prev.civilization,
          stats: { ...prev.civilization.stats, ...incomeResult.statChanges },
        },
      };
    });
  };

  // After income phase, move to unlocks (if any) then world event
  const handleIncomeComplete = () => {
    const nextTurn = (gameState.turnNumber || 0) + 1;
    const worldEvent = WORLD_EVENTS.find(e => e.turn === nextTurn) || null;

    // Check for newly unlocked actions
    const newActions = getNewlyUnlockedActions(nextTurn);
    const unlockMessages = newActions.map(a => `NEW ACTION UNLOCKED: ${a.name} - ${a.unlockMessage}`);

    // RELIGION AUTO-SPREAD — if the civ has Monotheism or Evangelism tenet,
    // their religion attempts to spread to one unconverted neighbor each turn
    // (highest-faith neighbor still below threshold). This is the mechanic
    // the tenet descriptions promise; without it, the Religious victory path
    // is nearly impossible for classroom games.
    const religion = gameState.civilization.religion;
    const tenets = religion?.tenets || [];
    const hasMonotheism = tenets.includes('monotheism');
    const hasEvangelism = tenets.includes('evangelism');
    const autoSpreadMessages: string[] = [];
    let autoSpreadNeighbors = gameState.neighbors;
    let autoSpreadConversions = 0;
    if (religion?.name && (hasMonotheism || hasEvangelism)) {
      const myFaith = gameState.civilization.stats.faith;
      // Monotheism: any neighbor with lower OR equal Faith converts.
      // Evangelism: only lower-Faith neighbors convert, one per turn.
      const candidates = gameState.neighbors.filter((n) => {
        if (n.isConquered) return false;
        if (n.religion === religion.name) return false;
        return hasMonotheism ? myFaith >= n.faith : myFaith > n.faith;
      });
      // Sort: prefer the easiest conversion (lowest-Faith neighbor).
      candidates.sort((a, b) => a.faith - b.faith);
      // Monotheism converts up to 2 per turn; Evangelism converts 1.
      const maxConversions = hasMonotheism ? 2 : 1;
      const targets = candidates.slice(0, maxConversions);
      if (targets.length > 0) {
        const targetIds = new Set(targets.map((t) => t.id));
        autoSpreadNeighbors = gameState.neighbors.map((n) =>
          targetIds.has(n.id) ? { ...n, religion: religion.name } : n,
        );
        autoSpreadConversions = targets.length;
        targets.forEach((t) => {
          autoSpreadMessages.push(`${religion.name} spread to ${t.name} (Faith ${myFaith} vs ${t.faith}).`);
        });
      }
    }

    // If there are new unlocks, show the unlock notification phase first
    if (newActions.length > 0) {
      setV2UnlockedActions(newActions);
      setGameState((prev) => ({
        ...prev,
        turnNumber: nextTurn,
        turnPhase: 'unlocks' as TurnPhaseV2,
        currentWorldEvent: worldEvent,
        neighbors: autoSpreadNeighbors,
        religionSpread: (prev.religionSpread || 0) + autoSpreadConversions,
        messages: [...autoSpreadMessages, ...unlockMessages, ...prev.messages],
      }));
    } else {
      setV2UnlockedActions([]);
      setGameState((prev) => ({
        ...prev,
        turnNumber: nextTurn,
        // TURN FLOW: Events (this phase) -> Action (one strategic pick) ->
        // Build Phase (continuous, exit via End Turn). Build happens AFTER
        // action so the player knows their action's production grant before
        // spending.
        turnPhase: worldEvent ? 'world_event' as TurnPhaseV2 : 'action' as TurnPhaseV2,
        currentWorldEvent: worldEvent,
        neighbors: autoSpreadNeighbors,
        religionSpread: (prev.religionSpread || 0) + autoSpreadConversions,
        messages: [...autoSpreadMessages, ...unlockMessages, ...prev.messages],
      }));
    }
  };

  // After viewing unlocked actions, proceed to world event
  const handleUnlocksAcknowledge = () => {
    const worldEvent = gameState.currentWorldEvent;
    setV2UnlockedActions([]);
    setGameState((prev) => ({
      ...prev,
      turnPhase: worldEvent ? 'world_event' as TurnPhaseV2 : 'action' as TurnPhaseV2,
    }));
  };

  // Handle world event A/B/C choice
  const handleWorldEventChoice = (choice: 'A' | 'B' | 'C') => {
    const event = gameState.currentWorldEvent;
    if (!event) return;

    const selectedChoice = event.choices.find(c => c.id === choice);
    if (!selectedChoice) return;

    // Record this decision so the Reflection Turn can surface it as a
    // turning-point candidate later.
    appendDecision(
      `Turn ${event.turn} (${event.yearLabel}) — ${event.name}: chose ${choice} (${selectedChoice.label})`
    );

    // Apply global effects
    const globalMessages: string[] = [];
    const globalChanges: Partial<GameState['civilization']['stats']> = {};

    event.globalEffects.forEach(effect => {
      if (effect.message) globalMessages.push(effect.message);
      if (effect.type === 'modify_stat' && effect.stat && effect.value) {
        // Accumulate across multiple effects hitting the same stat — read
        // from the running globalChanges first, then fall back to the
        // stored stat. Previously this only read the stored value, so the
        // second of two same-stat effects overwrote the first.
        const current = ((globalChanges as any)[effect.stat])
          ?? ((gameState.civilization.stats as any)[effect.stat] ?? 0);
        (globalChanges as any)[effect.stat] = current + effect.value;
      }
      if (effect.type === 'modify_yield' && effect.stat && effect.value) {
        const yieldKey = effect.stat === 'industry' ? 'productionIncome' :
          effect.stat === 'science' ? 'scienceYield' :
          effect.stat === 'culture' ? 'cultureYield' :
          effect.stat === 'faith' ? 'faithYield' : effect.stat;
        const current = ((globalChanges as any)[yieldKey])
          ?? ((gameState.civilization.stats as any)[yieldKey] ?? 0);
        (globalChanges as any)[yieldKey] = current + effect.value;
      }
      if (effect.type === 'lose_population' && effect.value) {
        const pop = gameState.civilization.stats.population;
        globalChanges.population = Math.max(0, pop - effect.value);
        globalChanges.houses = Math.max(0, (gameState.civilization.stats.houses) - effect.value);
        globalMessages.push(`-${effect.value} Population.`);
      }
    });

    // Apply choice effects
    const choiceMessages: string[] = [];
    const choiceChanges: Partial<GameState['civilization']['stats']> = {};

    // Track any free building grants from the choice so we can force the
    // player into placement mode immediately after the modal closes.
    let pendingFreeBuilding: BuildingType | null = null;

    // Event condition check: effects can be gated by flavor conditions like
    // 'river_civ' (has a River water resource) or 'island_civ' (isIsland
    // flag). An effect whose condition fails is skipped so non-river civs
    // don't get the "+1 Prod from Nile flooding" bonus, etc.
    const civPreset = CIV_PRESETS.find((p) => p.id === gameState.civilization.presetId);
    const civHasBuilding = (bt: BuildingType) =>
      tiles.some((t) => t.building === bt);
    const meetsCondition = (condition?: string): boolean => {
      if (!condition) return true;
      switch (condition) {
        case 'river_civ':   return civPreset?.waterResource === 'River';
        case 'island_civ':  return !!civPreset?.isIsland;
        case 'has_temple':  return civHasBuilding(BuildingType.Temple);
        case 'has_wall':    return civHasBuilding(BuildingType.Wall);
        case 'has_library': return civHasBuilding(BuildingType.Library);
        case 'has_barracks':return civHasBuilding(BuildingType.Barracks);
        case 'has_farm':    return civHasBuilding(BuildingType.Farm);
        default: return true; // Unknown condition — allow by default.
      }
    };

    selectedChoice.effects.forEach(effect => {
      if (!meetsCondition(effect.condition)) return;
      if (effect.message) choiceMessages.push(effect.message);
      if (effect.type === 'modify_stat' && effect.stat && effect.value) {
        // Priority: already-applied choiceChanges > globalChanges > stored.
        // Without reading choiceChanges first, two same-stat effects in the
        // same choice would see each other overwrite instead of stacking.
        const currentBase = (gameState.civilization.stats as any)[effect.stat] ?? 0;
        const globalMod = (globalChanges as any)[effect.stat];
        const choiceMod = (choiceChanges as any)[effect.stat];
        const current = choiceMod !== undefined ? choiceMod
          : (globalMod !== undefined ? globalMod : currentBase);
        (choiceChanges as any)[effect.stat] = current + effect.value;
      }
      if (effect.type === 'modify_yield' && effect.stat && effect.value) {
        const yieldKey = effect.stat === 'industry' ? 'productionIncome' :
          effect.stat === 'science' ? 'scienceYield' :
          effect.stat === 'culture' ? 'cultureYield' :
          effect.stat === 'faith' ? 'faithYield' : effect.stat;
        const currentBase = (gameState.civilization.stats as any)[yieldKey] ?? 0;
        const globalMod = (globalChanges as any)[yieldKey];
        const choiceMod = (choiceChanges as any)[yieldKey];
        const current = choiceMod !== undefined ? choiceMod
          : (globalMod !== undefined ? globalMod : currentBase);
        (choiceChanges as any)[yieldKey] = current + effect.value;
      }
      if (effect.type === 'lose_population' && effect.value) {
        const pop = choiceChanges.population ?? globalChanges.population ?? gameState.civilization.stats.population;
        choiceChanges.population = Math.max(0, pop - effect.value);
        choiceChanges.houses = Math.max(0, (choiceChanges.houses ?? globalChanges.houses ?? gameState.civilization.stats.houses) - effect.value);
      }
      // Free building grant — the player has to actually place the gifted
      // building on the map before the turn continues. Currently the only
      // event that fires this is "Pray to the Gods" granting a Temple.
      if (effect.type === 'gain_building' && !pendingFreeBuilding) {
        const msg = (effect.message || '').toLowerCase();
        if (msg.includes('temple')) pendingFreeBuilding = BuildingType.Temple;
        else if (msg.includes('wall')) pendingFreeBuilding = BuildingType.Wall;
        else if (msg.includes('farm')) pendingFreeBuilding = BuildingType.Farm;
        else if (msg.includes('workshop')) pendingFreeBuilding = BuildingType.Workshop;
        else if (msg.includes('library')) pendingFreeBuilding = BuildingType.Library;
        else if (msg.includes('barracks')) pendingFreeBuilding = BuildingType.Barracks;
        else if (msg.includes('amphitheatre') || msg.includes('amphitheater')) pendingFreeBuilding = BuildingType.Amphitheatre;
        else pendingFreeBuilding = BuildingType.Temple; // sensible default
      }
    });

    // Check for civ-specific event
    const civEvent = event.civSpecificEvents.find(
      ce => ce.civId === gameState.civilization.presetId
    ) || null;

    // Update game flags from event unlocks
    const newGameFlags = { ...gameState.gameFlags };
    if (event.unlocks) {
      if (event.unlocks.includes('religion')) newGameFlags.religionUnlocked = true;
      if (event.unlocks.includes('warfare')) newGameFlags.warUnlocked = true;
    }

    // If a free building was granted, detour into placement mode now. We'll
    // resume the normal next phase (civ_event or action) after the player
    // drops the building on a tile. The queued phase is parked on the ref.
    const intendedNextPhase: TurnPhaseV2 = civEvent ? 'civ_event' : 'action';
    const nextPhase: TurnPhaseV2 = pendingFreeBuilding ? 'idle' : intendedNextPhase;
    if (pendingFreeBuilding) {
      pendingPostFreePlacementPhase.current = intendedNextPhase;
    }

    setGameState((prev) => ({
      ...prev,
      selectedWorldChoice: choice,
      turnPhase: nextPhase,
      currentCivEvent: civEvent,
      gameFlags: newGameFlags,
      selectedAction: pendingFreeBuilding ?? prev.selectedAction,
      selectedPlayerAction: pendingFreeBuilding ? ('build' as PlayerActionType) : prev.selectedPlayerAction,
      actionPlacements: pendingFreeBuilding ? 1 : prev.actionPlacements,
      civilization: {
        ...prev.civilization,
        stats: {
          ...prev.civilization.stats,
          ...globalChanges,
          ...choiceChanges,
        },
      },
      messages: [
        `WORLD EVENT: ${event.name} - Choice ${choice}`,
        ...(pendingFreeBuilding ? [`Select a tile to place your free ${pendingFreeBuilding}.`] : []),
        ...choiceMessages,
        ...globalMessages,
        ...prev.messages,
      ],
    }));
  };

  // Handle civ-specific event acknowledgment
  const handleCivEventAck = () => {
    const civEvent = gameState.currentCivEvent;
    if (!civEvent) {
      // If called from income complete (no civ event), go to world event phase
      handleIncomeComplete();
      return;
    }

    // Apply civ event effects
    const civMessages: string[] = [];
    const civChanges: Partial<GameState['civilization']['stats']> = {};

    civEvent.effects.forEach(effect => {
      if (effect.message) civMessages.push(effect.message);
      if (effect.type === 'modify_stat' && effect.stat && effect.value) {
        // Accumulate same-stat effects (e.g., Gaul's two martial bonuses
        // should stack to +5, not be overwritten to the last one).
        const current = ((civChanges as any)[effect.stat])
          ?? ((gameState.civilization.stats as any)[effect.stat] ?? 0);
        (civChanges as any)[effect.stat] = current + effect.value;
      }
      if (effect.type === 'modify_yield' && effect.stat && effect.value) {
        const yieldKey = effect.stat === 'industry' ? 'productionIncome' :
          effect.stat === 'science' ? 'scienceYield' :
          effect.stat === 'culture' ? 'cultureYield' :
          effect.stat === 'faith' ? 'faithYield' : effect.stat;
        const current = ((civChanges as any)[yieldKey])
          ?? ((gameState.civilization.stats as any)[yieldKey] ?? 0);
        (civChanges as any)[yieldKey] = current + effect.value;
      }
      if (effect.type === 'lose_population' && effect.value) {
        const pop = gameState.civilization.stats.population;
        civChanges.population = Math.max(0, pop - effect.value);
        civChanges.houses = Math.max(0, gameState.civilization.stats.houses - effect.value);
      }
    });

    setGameState((prev) => ({
      ...prev,
      turnPhase: 'action' as TurnPhaseV2,
      currentCivEvent: null,
      civilization: {
        ...prev.civilization,
        stats: { ...prev.civilization.stats, ...civChanges },
      },
      messages: [...civMessages, ...prev.messages],
    }));
  };

  // BUILD PHASE: handle a building selection from the build phase modal.
  // Deducts cost and enters idle mode so the user can click a tile to place.
  // After placement, handleTileClick routes the turn back to the 'action' phase.
  const handleBuildPhaseSelect = (buildingTypeStr: string) => {
    const buildingTypeEnum = (BuildingType as any)[buildingTypeStr] as BuildingType;
    if (!buildingTypeEnum || !(buildingTypeEnum in BUILDING_COSTS)) {
      addMessage(`Unknown building type: ${buildingTypeStr}`);
      return;
    }
    const cost = BUILDING_COSTS[buildingTypeEnum] || 0;

    if (gameState.civilization.stats.productionPool < cost) {
      addMessage(`Not enough Production Pool. Need ${cost}.`);
      return;
    }

    setGameState((prev) => ({
      ...prev,
      selectedPlayerAction: 'build',
      selectedAction: buildingTypeEnum,
      actionPlacements: 1,
      turnPhase: 'idle' as TurnPhaseV2,
      civilization: {
        ...prev.civilization,
        stats: {
          ...prev.civilization.stats,
          productionPool: prev.civilization.stats.productionPool - cost,
        },
      },
      messages: [`Select a tile to place your ${buildingTypeStr} (${cost} Production).`, ...prev.messages],
    }));
  };

  // BUILD PHASE: End Turn — finalize the turn. If an action was taken this
  // turn, a turnResolution was already stashed by handleActionSelect. If the
  // player ended without taking an action (just built), synthesize a minimal
  // resolution so the ResolutionPanel still shows.
  const handleBuildPhaseSkip = () => {
    setGameState((prev) => {
      let res = prev.turnResolution;
      if (!res) {
        res = {
          turn: prev.turnNumber || 1,
          incomeGained: prev.civilization.stats.productionIncome || prev.civilization.stats.industry,
          populationChange: 0,
          worldEventName: prev.currentWorldEvent?.name || 'None',
          choiceMade: prev.selectedWorldChoice || 'A',
          choiceEffects: [],
          civEventName: prev.currentCivEvent?.name,
          civEventEffects: prev.currentCivEvent?.effects.map((e) => e.message || '') || [],
          actionTaken: (prev.selectedPlayerAction as any) || ('build' as any),
          actionEffects: ['Turn ended.'],
          statsBefore: v2StatsBefore,
          statsAfter: prev.civilization.stats as any,
        };
        setV2TurnResolution(res);
      }
      return {
        ...prev,
        turnPhase: 'resolution' as TurnPhaseV2,
        turnResolution: res,
      };
    });
  };

  // Handle action selection and execution
  const handleActionSelect = (actionId: PlayerActionType, params?: any) => {
    // For worship with foundReligion: use the existing foundReligion logic
    if (actionId === 'worship' && params?.foundReligion) {
      foundReligion(params.tenetId, params.religionName);
      // Go to resolution after founding
      const turnRes: TurnResolution = {
        turn: gameState.turnNumber || 1,
        incomeGained: gameState.civilization.stats.productionIncome || gameState.civilization.stats.industry,
        populationChange: 0,
        worldEventName: gameState.currentWorldEvent?.name || 'None',
        choiceMade: gameState.selectedWorldChoice || 'A',
        choiceEffects: [],
        actionTaken: actionId,
        actionEffects: [`Founded religion: ${params.religionName}`],
        statsBefore: v2StatsBefore,
        statsAfter: { ...gameState.civilization.stats } as any,
      };
      setV2TurnResolution(turnRes);
      setGameState((prev) => ({
        ...prev,
        turnPhase: 'resolution' as TurnPhaseV2,
        selectedPlayerAction: actionId,
        turnResolution: turnRes,
      }));
      return;
    }

    // For wonder action: handle investment with wonderId
    if (actionId === 'wonder' && params?.wonderId && params?.amount) {
      const wonder = WONDERS_LIST.find(w => w.id === params.wonderId);
      if (!wonder) { addMessage('Invalid wonder.'); return; }

      const investment = Math.min(params.amount, gameState.civilization.stats.productionPool);
      if (investment >= wonder.cost) {
        // Full wonder completion: apply bonuses and enable placement
        const bonusChanges: any = {};
        if (wonder.bonus.production) bonusChanges.productionIncome = (gameState.civilization.stats.productionIncome || 0) + wonder.bonus.production;
        if (wonder.bonus.science) bonusChanges.science = (gameState.civilization.stats.science || 0) + wonder.bonus.science;
        if (wonder.bonus.culture) bonusChanges.culture = (gameState.civilization.stats.culture || 0) + wonder.bonus.culture;
        if (wonder.bonus.faith) bonusChanges.faith = (gameState.civilization.stats.faith || 0) + wonder.bonus.faith;
        if (wonder.bonus.martial) bonusChanges.martial = (gameState.civilization.stats.martial || 0) + wonder.bonus.martial;
        if (wonder.bonus.defense) bonusChanges.defense = (gameState.civilization.stats.defense || 0) + wonder.bonus.defense;
        if (wonder.bonus.populationCapacity) bonusChanges.capacity = (gameState.civilization.stats.capacity || 0) + wonder.bonus.populationCapacity;

        setGameState((prev) => ({
          ...prev,
          placingWonder: true,
          selectedPlayerAction: actionId,
          turnPhase: 'idle' as TurnPhaseV2,
          civilization: {
            ...prev.civilization,
            builtWonderId: wonder.id,
            stats: {
              ...prev.civilization.stats,
              ...bonusChanges,
              productionPool: prev.civilization.stats.productionPool - investment,
            },
          },
          wondersBuilt: [...prev.wondersBuilt, wonder],
          messages: [`Built Wonder: ${wonder.name}! Place it on the map.`, ...prev.messages],
        }));
        return;
      }
    }

    // Recompute structural stats (especially yields) so an action like
    // Research/Develop/Worship reads the freshest scienceYield/cultureYield/
    // faithYield. Without this, a Library built mid-turn wouldn't apply its
    // +2 Science Yield to a Research action picked the same turn.
    const freshDerived = calculateStats(
      tiles,
      gameState.civilization,
      {},
      gameState.neighbors,
      gameState.treaties,
    );
    const civWithFreshYields = {
      ...gameState.civilization,
      stats: { ...gameState.civilization.stats, ...freshDerived },
    };
    const stateForAction = { ...gameState, civilization: civWithFreshYields };
    const result = executeAction(actionId, stateForAction, params);

    // If the action enables map placement (grow/build), go to a special state
    if (result.enableMapPlacement) {
      setGameState((prev) => ({
        ...prev,
        selectedPlayerAction: actionId,
        selectedAction: result.enableMapPlacement === 'house' ? BuildingType.House :
          result.enableMapPlacement === 'wall' ? BuildingType.Wall : null,
        actionPlacements: result.maxPlacements || 0,
        turnPhase: 'idle' as TurnPhaseV2, // Let them interact with the map
        civilization: {
          ...prev.civilization,
          stats: { ...prev.civilization.stats, ...result.statChanges },
        },
        messages: [...result.messages, ...prev.messages],
      }));
      return;
    }

    // For non-map actions, record the result but advance to BUILD PHASE (not
    // resolution). The build phase is continuous and ends only when the
    // player clicks End Turn, at which point we'll show resolution using the
    // v2TurnResolution we're stashing here.
    const turnRes: TurnResolution = {
      turn: gameState.turnNumber || 1,
      incomeGained: gameState.civilization.stats.productionIncome || gameState.civilization.stats.industry,
      populationChange: (gameState.civilization.stats.population + (result.statChanges.population || 0)) - (v2StatsBefore.population || 0),
      worldEventName: gameState.currentWorldEvent?.name || 'None',
      choiceMade: gameState.selectedWorldChoice || 'A',
      choiceEffects: [],
      civEventName: gameState.currentCivEvent?.name,
      civEventEffects: gameState.currentCivEvent?.effects.map(e => e.message || '') || [],
      actionTaken: actionId,
      actionEffects: result.messages,
      statsBefore: v2StatsBefore,
      statsAfter: { ...gameState.civilization.stats, ...result.statChanges } as any,
    };

    setV2TurnResolution(turnRes);

    // Apply treaty if created, and expire any treaties that the 'attack'
    // action broke (peace/alliance/military pact with the target).
    let newTreaties = result.newTreaty
      ? [...gameState.treaties, result.newTreaty]
      : gameState.treaties;
    if (result.brokenTreatiesWithNeighbors && result.brokenTreatiesWithNeighbors.length > 0) {
      const brokenSet = new Set(result.brokenTreatiesWithNeighbors);
      newTreaties = newTreaties.filter((t) => !brokenSet.has(t.neighborId));
    }

    // CONQUEST: when the Attack action yields a victory, actually record it.
    let updatedNeighbors = gameState.neighbors;
    let additionalWarsWon = 0;
    let additionalConquered = 0;
    let lootTiles: TileData[] = [];
    let combatLogEntry: CombatLogEntry | null = null;
    if (actionId === 'attack' && result.combatResult) {
      const cr = result.combatResult;
      const decisive = cr.won && (cr.margin ?? 0) >= 6;
      if (cr.won) additionalWarsWon = 1;
      // VICTIM'S RALLY — any attacked neighbor (not conquered) gets a
      // defensive buff for their next turn. rallyUntilTurn is absolute,
      // so expiration handles itself as turns advance.
      const rallyNeighborId = result.attackedNeighborId;
      if (rallyNeighborId && !decisive) {
        const rallyThroughTurn = (gameState.turnNumber || 1) + 1;
        updatedNeighbors = gameState.neighbors.map((n) =>
          n.id === rallyNeighborId ? { ...n, rallyUntilTurn: rallyThroughTurn } : n,
        );
      }
      if (decisive && params?.targetId) {
        const target = gameState.neighbors.find((n) => n.id === params.targetId);
        if (target && !target.isConquered) {
          additionalConquered = 1;
          updatedNeighbors = gameState.neighbors.map((n) =>
            n.id === params.targetId ? { ...n, isConquered: true, relationship: 'Neutral' as const } : n,
          );
          try {
            lootTiles = generateConquestTiles(tiles, 2);
          } catch (e) {
            lootTiles = [];
          }
        }
      }
      // Build a war-tab log entry describing this attack.
      const outcome: CombatLogEntry['outcome'] = decisive
        ? 'decisive_victory'
        : cr.won
          ? 'victory'
          : (cr.margin === 0 ? 'stalemate' : 'defeat');
      // Surface a prominent battle-report modal so the outcome isn't
      // buried in the lower-right tab. The modal uses the rollDetail we
      // now pipe through from executeAction.
      const rollDetail = cr.rolls;
      if (rollDetail) {
        const popupEffects: string[] = [];
        // Treaty-break headline — goes first so the student SEES the diplomatic
        // fallout before the mechanical loot/loss breakdown.
        if ((rollDetail.treatyPenalty ?? 0) > 0) {
          popupEffects.push(`BROKEN TREATY! -${rollDetail.treatyPenalty} attack, -${rollDetail.treatyCulturalCost ?? 0} Culture`);
        }
        if (outcome === 'decisive_victory') {
          popupEffects.push('+3 Production Pool (loot)', '+1 conquered territory', `${cr.target} rallies next turn (+2 Martial, +1d8)`);
        } else if (outcome === 'victory') {
          popupEffects.push('+2 Production Pool (loot)', `${cr.target} rallies next turn (+2 Martial, +1d8)`);
        } else if (outcome === 'stalemate') {
          popupEffects.push('Both forces hold. No losses.', `${cr.target} rallies next turn (+2 Martial, +1d8)`);
        } else {
          popupEffects.push('-2 Population', '-1 Martial', `${cr.target} rallies next turn (+2 Martial, +1d8)`);
        }
        setAttackOutcome({
          turn: gameState.turnNumber || 1,
          targetName: cr.target,
          attackerName: gameState.civilization.name,
          attackTotal: rollDetail.attackTotal,
          defendTotal: rollDetail.defendTotal,
          margin: cr.margin ?? 0,
          outcome,
          rolls: {
            attackerMartial: rollDetail.attackerMartial,
            attackerBaseRoll: rollDetail.attackerBaseRoll,
            defenderMartial: rollDetail.defenderMartial,
            defenderBaseRoll: rollDetail.defenderBaseRoll,
            wallDice: rollDetail.wallDice,
            fortifyDice: rollDetail.fortifyDice,
            bypassedWalls: rollDetail.bypassedWalls,
            treatyPenalty: rollDetail.treatyPenalty,
            treatyCulturalCost: rollDetail.treatyCulturalCost,
          },
          effects: popupEffects,
        });
      }
      combatLogEntry = {
        turn: gameState.turnNumber || 1,
        target: cr.target,
        attackTotal: cr.rolls?.attackTotal ?? 0,
        defendTotal: cr.rolls?.defendTotal ?? 0,
        margin: cr.margin ?? 0,
        outcome,
        conquered: decisive,
        popLost: (result.statChanges as any)?.population !== undefined
          ? Math.max(0, (gameState.civilization.stats.population || 0) - ((result.statChanges as any).population || 0))
          : 0,
        martialLost: (result.statChanges as any)?.martial !== undefined
          ? Math.max(0, (gameState.civilization.stats.martial || 0) - ((result.statChanges as any).martial || 0))
          : 0,
        loot: outcome === 'decisive_victory'
          ? { culture: 0, production: 3 }
          : outcome === 'victory'
            ? { culture: 0, production: 2 }
            : undefined,
        rolls: cr.rolls
          ? {
              attackerMartial: cr.rolls.attackerMartial,
              attackerBaseRoll: cr.rolls.attackerBaseRoll,
              defenderMartial: cr.rolls.defenderMartial,
              defenderBaseRoll: cr.rolls.defenderBaseRoll,
              wallDice: cr.rolls.wallDice,
              fortifyDice: cr.rolls.fortifyDice,
              bypassedWalls: cr.rolls.bypassedWalls,
              treatyPenalty: cr.rolls.treatyPenalty,
              treatyCulturalCost: cr.rolls.treatyCulturalCost,
            }
          : undefined,
      };
    }
    if (lootTiles.length > 0) {
      setTiles((prev) => [...prev, ...lootTiles]);
    }

    // DIPLOMATIC BLOWBACK — apply the erosions returned from executeAction.
    // Preserves any rally / conquest updates already applied above.
    if (result.relationshipErosions && result.relationshipErosions.length > 0) {
      const erosionMap = new Map(
        result.relationshipErosions.map((e) => [e.neighborId, e.to]),
      );
      updatedNeighbors = updatedNeighbors.map((n) =>
        erosionMap.has(n.id) ? { ...n, relationship: erosionMap.get(n.id)! } : n,
      );
    }
    // AGGRESSOR COUNTER — every attack (any outcome) increments the counter.
    const attackIncrement = actionId === 'attack' && result.combatResult ? 1 : 0;
    setGameState((prev) => ({
      ...prev,
      turnPhase: 'build_phase' as TurnPhaseV2,
      selectedPlayerAction: actionId,
      turnResolution: turnRes,
      treaties: newTreaties,
      neighbors: updatedNeighbors,
      warsWon: (prev.warsWon || 0) + additionalWarsWon,
      totalAttacksInitiated: (prev.totalAttacksInitiated || 0) + attackIncrement,
      conqueredTerritories: (prev.conqueredTerritories || 0) + additionalConquered,
      combatLog: combatLogEntry
        ? [...(prev.combatLog || []), combatLogEntry]
        : (prev.combatLog || []),
      civilization: {
        ...prev.civilization,
        stats: { ...prev.civilization.stats, ...result.statChanges },
      },
      messages: [...result.messages, ...prev.messages],
    }));

    // Track the V2 action in the multiplayer turn decision so the teacher's
    // dashboard can see what each student did this turn (research/attack/etc.).
    // The buildActions list is populated separately by handleTileClick as
    // students place buildings during the continuous Build Phase.
    if (syncState.isOnline) {
      setPendingDecision((prev) => ({
        ...prev,
        v2Action: actionId,
        v2ActionParams: params || null,
        warDeclarations:
          actionId === 'attack' && params?.targetId
            ? [...prev.warDeclarations, params.targetId]
            : prev.warDeclarations,
        allianceOffers:
          actionId === 'diplomacy' && params?.allyId
            ? [...prev.allianceOffers, params.allyId]
            : prev.allianceOffers,
      }));
    }
  };

  // Handle resolution dismissal - end of turn
  const handleResolutionDismiss = () => {
    // MULTIPLAYER SYNC — send this turn's full decision (V2 action + any
    // queued building placements + treaties + final stat snapshot) to the
    // server before advancing locally. Fire-and-forget: if the request fails
    // we still progress the game so a flaky network doesn't strand a student.
    if (syncState.isOnline) {
      const finalStats: Record<string, number> = {
        martial: gameState.civilization.stats.martial || 0,
        faith: gameState.civilization.stats.faith || 0,
        industry: gameState.civilization.stats.industry || 0,
        science: gameState.civilization.stats.science || 0,
        culture: gameState.civilization.stats.culture || 0,
        population: gameState.civilization.stats.population || 0,
        houses: gameState.civilization.stats.houses || 0,
        productionPool: gameState.civilization.stats.productionPool || 0,
      };
      const decisionToSubmit: TurnDecision = {
        ...pendingDecision,
        finalStats,
        submitted: true,
      };
      // Don't await — continue local advance immediately.
      submitTurn(decisionToSubmit).catch((e) =>
        console.warn('submitTurn failed:', e),
      );
      // Reset for the next turn.
      setPendingDecision({
        culturalFocus: null,
        buildActions: [],
        warDeclarations: [],
        allianceOffers: [],
        submitted: false,
        v2Action: null,
        v2ActionParams: null,
        finalStats: {},
      });
    }

    // Also run the legacy timeline event processing for compatibility
    const nextIndex = gameState.timelineIndex + 1;
    if (nextIndex < TIMELINE_EVENTS.length) {
      const event = TIMELINE_EVENTS[nextIndex];

      // Process legacy events for tech unlocks, flags, etc.
      const eventResult = processTimelineEvent(
        event,
        gameState.civilization,
        gameState.gameFlags,
        gameState.neighbors,
      );

      // Update cultural stage using the shared threshold table so Barbarism
      // -> Classical -> Imperial -> Enlightenment -> Modern progression stays
      // consistent with the UI and victory scoring.
      const stage = resolveCulturalStage(
        gameState.civilization.culturalStage,
        gameState.civilization.stats.culture,
      );

      // Decrement treaty timers
      const updatedTreaties = gameState.treaties
        .map(t => ({ ...t, turnsRemaining: t.turnsRemaining - 1 }))
        .filter(t => t.turnsRemaining > 0);

      // V2 STAT RECOMPUTE — calculateStats applies traits, building bonuses,
      // science unlocks, religion tenets, cultural stage multipliers, and
      // treaty bonuses. Without this call, all of those derived bonuses
      // would never reach the displayed stats. We pass the up-to-date civ
      // (with current stage) so stage multipliers fire correctly.
      const recomputed = calculateStats(
        tiles,
        { ...gameState.civilization, culturalStage: stage },
        {},
        gameState.neighbors,
        updatedTreaties,
      );

      // THRESHOLD POPUPS — compare new recomputed totals against a table of
      // milestones and queue a popup for each one crossed. thresholdsAwarded
      // prevents the same milestone from firing twice.
      const newThresholds: ThresholdPopup[] = [];
      const ackBucket = thresholdsAwarded;
      const newScience = recomputed.science ?? gameState.civilization.stats.science ?? 0;
      const newCulture = recomputed.culture ?? gameState.civilization.stats.culture ?? 0;
      const newFaith = recomputed.faith ?? gameState.civilization.stats.faith ?? 0;

      SCIENCE_UNLOCKS.forEach((u) => {
        const id = `sci-${u.level}`;
        if (newScience >= u.level && !ackBucket.includes(id)) {
          const bonuses: string[] = [];
          if (u.statBonus) {
            Object.entries(u.statBonus).forEach(([k, v]) => bonuses.push(`+${v} ${k}`));
          }
          if (u.unlocks) bonuses.push(`Ability: ${u.unlocks.replace(/_/g, ' ')}`);
          newThresholds.push({
            id,
            kind: 'science',
            title: u.effect.split(':')[0],
            subtitle: `Science ${u.level} reached`,
            description: u.effect,
            bonuses,
            cta: 'Press on with research',
          });
        }
      });

      // Tech Tree tier unlocks — pops a "branch path available" notice
      // the first time the student crosses each tier threshold.
      [{ tier: 'Bronze', threshold: 10 }, { tier: 'Classical', threshold: 25 }, { tier: 'Renaissance', threshold: 50 }].forEach((t) => {
        const id = `tech-tier-${t.tier}`;
        if (newScience >= t.threshold && !ackBucket.includes(id)) {
          newThresholds.push({
            id,
            kind: 'science',
            title: `${t.tier} Tech Tier Unlocked`,
            subtitle: `Science ${t.threshold} reached — pick a branch`,
            description: 'The Tech Tree now offers a branching choice. Pick a path (War, Economy, or Knowledge) to specialize your civilization.',
            bonuses: [`Open the Tech Tree from the Science tab and claim your ${t.tier}-tier path.`],
            cta: 'Open Tech Tree',
          });
        }
      });

      CULTURAL_STAGE_THRESHOLDS.forEach((s) => {
        const id = `cul-${s.stage}`;
        if (newCulture >= s.minCulture && !ackBucket.includes(id)) {
          newThresholds.push({
            id,
            kind: 'culture',
            title: `Stage: ${s.stage}`,
            subtitle: `Culture ${s.minCulture} reached`,
            description: s.flavor,
            bonuses: [
              'Pick a Cultural Bonus from the Culture Tree (amber button on the sidebar).',
              `Stage multipliers now apply: Martial ×${CULTURAL_STAGE_MULTIPLIERS[s.stage.toLowerCase() as keyof typeof CULTURAL_STAGE_MULTIPLIERS].martial}, Science ×${CULTURAL_STAGE_MULTIPLIERS[s.stage.toLowerCase() as keyof typeof CULTURAL_STAGE_MULTIPLIERS].science}.`,
            ],
            cta: 'Claim cultural bonus',
          });
        }
      });

      RELIGION_TENET_THRESHOLDS.forEach((t, i) => {
        const id = `faith-${t}`;
        if (newFaith >= t && !ackBucket.includes(id)) {
          const alreadyFounded = !!gameState.civilization.religion?.name;
          newThresholds.push({
            id,
            kind: 'faith',
            title:
              i === 0
                ? alreadyFounded
                  ? 'Faith milestone: 10'
                  : 'Religion can be founded'
                : `Tenet slot ${i + 1} unlocked`,
            subtitle: `Faith ${t} reached`,
            description:
              i === 0 && !alreadyFounded
                ? 'Your people yearn for meaning. Use the Worship action (needs one Temple) to found a religion.'
                : 'Your faith has matured. Open the Religion Tree to adopt another tenet.',
            bonuses: [
              i === 0 && !alreadyFounded
                ? 'Worship → Found Religion option unlocked'
                : `Pick tenet #${i + 1} in the Religion Tree`,
            ],
            cta: i === 0 && !alreadyFounded ? 'Found a religion' : 'Open Religion Tree',
          });
        }
      });

      if (newThresholds.length > 0) {
        setThresholdQueue((q) => [...q, ...newThresholds]);
        setThresholdsAwarded((a) => [...a, ...newThresholds.map((t) => t.id)]);
      }

      setGameState((prev) => ({
        ...prev,
        year: event.year,
        timelineIndex: nextIndex,
        turnPhase: 'idle' as TurnPhaseV2,
        currentWorldEvent: null,
        currentCivEvent: null,
        selectedWorldChoice: null,
        selectedPlayerAction: null,
        turnResolution: null,
        pendingTurnChoice: false,
        currentEventPopup: null,
        actionPlacements: 0,
        treaties: updatedTreaties,
        tradedThisTurn: [],
        gameFlags: { ...prev.gameFlags, ...eventResult.newGameFlags },
        neighbors: [
          ...prev.neighbors,
          ...eventResult.neighborsToAdd,
        ],
        civilization: {
          ...prev.civilization,
          culturalStage: stage,
          technologies: eventResult.newTechnologies,
          flags: { ...prev.civilization.flags, ...eventResult.newFlags },
          stats: {
            ...prev.civilization.stats,
            ...recomputed,                 // overwrite derived stats
            housesBuiltThisTurn: 0,
            industryLeft: recomputed.industry,
          },
        },
      }));
    } else {
      // Game ended
      setGameState((prev) => ({
        ...prev,
        turnPhase: 'idle' as TurnPhaseV2,
        gameEnded: true,
      }));
    }

    setV2TurnResolution(null);
  };

  // Legacy compatibility
  const closeEventPopup = () => {
    setGameState((prev) => ({ ...prev, currentEventPopup: null }));
  };

  // Triggered by making a choice in the modal
  const finalizeAdvance = (choice: string) => {
    const bonus = { [choice]: true };
    setTurnBonus(bonus);

    const nextIndex = gameState.timelineIndex + 1;
    if (nextIndex >= TIMELINE_EVENTS.length) return;

    const event = TIMELINE_EVENTS[nextIndex];

    // 1. Calculate Base Stats for this Turn
    const currentStats = calculateStats(
      tiles,
      gameState.civilization,
      bonus,
      gameState.neighbors,
      gameState.treaties,
    );

    // 2. Apply Event Logic
    const eventResult = processTimelineEvent(
      event,
      {
        ...gameState.civilization,
        stats: { ...gameState.civilization.stats, ...currentStats },
      },
      gameState.gameFlags,
      gameState.neighbors,
    );

    // 3. Update House Count (Disasters only, Growth is Manual)
    let newHouses = gameState.civilization.stats.houses;

    // Apply disaster losses
    newHouses = Math.max(0, newHouses - eventResult.housesLost);

    // Pop Calculation
    const popMultiplier = eventResult.newFlags.housesSupportTwoPop ? 2 : 1;
    let newPop = newHouses * popMultiplier;

    // Handle explicit pop set (e.g. Thera)
    if (eventResult.changes.houses !== undefined)
      newHouses = eventResult.changes.houses;
    if (eventResult.changes.population !== undefined)
      newPop = eventResult.changes.population;

    // 4. Stat merging (Event mods + Calculated mods)
    const mergedStats = {
      ...currentStats,
      ...eventResult.changes,
      houses: newHouses,
      housesBuiltThisTurn: 0, // Reset construction limit for new turn
      population: newPop,
      industryLeft: currentStats.industry, // Reset industry
    };

    // Assyrian Decline Special Logic (Halve All Stats) - applied after merge if needed
    if (
      event.year === -560 &&
      gameState.civilization.name.includes("Assyria")
    ) {
      const statsToHalve: StatKey[] = [
        "martial",
        "defense",
        "faith",
        "industry",
        "science",
        "culture",
        "capacity",
      ];
      statsToHalve.forEach((key) => {
        if (key === "capacity")
          mergedStats.capacity = Math.floor(mergedStats.capacity / 2);
        else
          (mergedStats as any)[key] = Math.floor(
            ((mergedStats as any)[key] || 0) / 2,
          );
      });
    }

    // Unlock Cultural Stages using shared threshold resolver.
    const stage = resolveCulturalStage(
      gameState.civilization.culturalStage,
      mergedStats.culture,
    );

    // Decrement treaty timers and remove expired ones (Feature 1)
    const updatedTreaties = gameState.treaties
      .map((t) => ({ ...t, turnsRemaining: t.turnsRemaining - 1 }))
      .filter((t) => t.turnsRemaining > 0);

    // Reset expiring treaties' neighbors back to Neutral
    const expiredTreatyNeighborIds = gameState.treaties
      .filter((t) => t.turnsRemaining <= 1)
      .map((t) => t.neighborId);

    setGameState((prev) => ({
      ...prev,
      year: event.year,
      timelineIndex: nextIndex,
      pendingTurnChoice: false,
      currentEventPopup: {
        year: event.year,
        name: event.name,
        description: event.desc,
        effects: eventResult.messages,
      },
      neighbors: [
        ...prev.neighbors.map((n) =>
          expiredTreatyNeighborIds.includes(n.id)
            ? { ...n, relationship: "Neutral" as const }
            : n,
        ),
        ...eventResult.neighborsToAdd,
      ] as NeighborCiv[],
      messages: [
        `Focus: ${choice.toUpperCase()}.`,
        ...eventResult.messages,
        `TIMELINE ADVANCED: ${event.name}`,
        ...prev.messages,
      ],
      gameFlags: eventResult.newGameFlags,
      treaties: updatedTreaties,
      tradedThisTurn: [], // Reset trade counter on advance
      civilization: {
        ...prev.civilization,
        culturalStage: stage,
        technologies: eventResult.newTechnologies,
        flags: eventResult.newFlags,
        stats: {
          ...prev.civilization.stats,
          ...mergedStats,
        },
      },
    }));
  };

  const handleTileClick = (tileId: string) => {
    const { selectedAction, civilization, placingWonder } = gameState;

    // Handle Wonder Placement
    if (placingWonder && civilization.builtWonderId) {
      const tileIndex = tiles.findIndex((t) => t.id === tileId);
      if (tileIndex === -1) return;
      const tile = tiles[tileIndex];

      if (
        tile.building !== BuildingType.None ||
        [
          TerrainType.Ocean,
          TerrainType.Mountain,
          TerrainType.HighMountain,
        ].includes(tile.terrain)
      ) {
        addMessage("Cannot place Wonder here.");
        return;
      }

      // In multiplayer turn system, queue the decision
      if (syncState.isOnline && turnState && turnState.phase === "decision") {
        setPendingDecision((prev) => ({
          ...prev,
          buildActions: [
            ...prev.buildActions,
            { tileIndex, building: BuildingType.Wonder },
          ],
        }));
        addMessage("Wonder placement queued for submission.");
        setGameState((prev) => ({ ...prev, placingWonder: false }));
        return;
      }

      // In single-player, apply immediately. Return to build_phase so the
      // player can continue building or click End Turn to resolve.
      const newTiles = [...tiles];
      newTiles[tileIndex] = { ...tile, building: BuildingType.Wonder };
      setTiles(newTiles);
      setGameState((prev) => {
        // Stash a resolution snapshot for when End Turn fires.
        const wonder = WONDERS_LIST.find((w) => w.id === prev.civilization.builtWonderId);
        const turnRes: TurnResolution = {
          turn: prev.turnNumber || 1,
          incomeGained: prev.civilization.stats.productionIncome || prev.civilization.stats.industry,
          populationChange: 0,
          worldEventName: prev.currentWorldEvent?.name || 'None',
          choiceMade: prev.selectedWorldChoice || 'A',
          choiceEffects: [],
          civEventName: prev.currentCivEvent?.name,
          civEventEffects: prev.currentCivEvent?.effects.map((e) => e.message || '') || [],
          actionTaken: 'wonder',
          actionEffects: [`Built Wonder: ${wonder?.name || 'Unknown'} and placed it on the map.`],
          statsBefore: v2StatsBefore,
          statsAfter: prev.civilization.stats as any,
        };
        setV2TurnResolution(turnRes);
        return {
          ...prev,
          placingWonder: false,
          selectedPlayerAction: 'wonder' as PlayerActionType,
          selectedAction: null,
          actionPlacements: 0,
          turnPhase: 'build_phase' as TurnPhaseV2,
          turnResolution: turnRes,
          messages: ['Wonder placed successfully!', ...prev.messages],
        };
      });
      return;
    }

    if (!selectedAction) return;

    // PHASE GUARD: Placements must happen during the Build Phase, during an
    // active action with placements remaining (Grow, Fortify free placement),
    // or during Wonder placement. Without this guard, players could click a
    // building in the sidebar and drop it on a tile during turnPhase='idle'
    // (before the first Advance Turn click, or between turns after dismissing
    // the resolution screen). The fertility cap would count the placement,
    // but calculateIncome resets housesBuiltThisTurn to 0 at the next turn's
    // income phase — so the pre-turn house was effectively free. Troy
    // (fertility 2) could end Turn 1 with 4 houses instead of the intended 3.
    const hasActivePlacements = (gameState.actionPlacements || 0) > 0;
    const isBuildPhase = gameState.turnPhase === 'build_phase';
    const isStarterPlacement = gameState.isPlacingStarterHouses === true;
    const placementAllowed = isBuildPhase || hasActivePlacements || placingWonder || isStarterPlacement;
    if (!placementAllowed) {
      addMessage(
        'You can only place buildings during the Build Phase or an active action. Click Advance Turn to begin the turn first.'
      );
      return;
    }

    const tileIndex = tiles.findIndex((t) => t.id === tileId);
    if (tileIndex === -1) return;
    const tile = tiles[tileIndex];

    if (tile.building !== BuildingType.None) {
      addMessage("Tile is occupied.");
      return;
    }

    const restrictedForBuildings = [
      TerrainType.Mountain,
      TerrainType.HighMountain,
      TerrainType.Ocean,
      TerrainType.River,
      TerrainType.Marsh,
    ];

    if (selectedAction === BuildingType.House) {
      // --- HOUSE PLACEMENT LOGIC ---

      // 1. Check Terrain
      if (restrictedForBuildings.includes(tile.terrain)) {
        addMessage("Cannot build houses on this terrain.");
        return;
      }

      // 2. Check Population Capacity
      if (civilization.stats.houses >= civilization.stats.capacity) {
        addMessage("Population capacity reached.");
        return;
      }

      // 3. Check Fertility Limit (Growth per Turn)
      // EXCEPTION 1: starter placements (pre-Turn-1 freebies).
      // EXCEPTION 2: Grow places ON TOP of the fertility cap - fertility is the
      // passive per-turn rate; Grow is an active surge that bypasses it.
      if (
        !gameState.isPlacingStarterHouses &&
        gameState.selectedPlayerAction !== 'grow' &&
        civilization.stats.housesBuiltThisTurn >= civilization.stats.fertility
      ) {
        addMessage(
          `Growth Limit Reached! (Fertility: ${civilization.stats.fertility})`,
        );
        return;
      }
    } else {
      // --- OTHER STRUCTURE LOGIC ---
      const cost = BUILDING_COSTS[selectedAction];
      // V2 BUILD PHASE: cost is already deducted from productionPool in
      // handleBuildPhaseSelect, so we must NOT check against industryLeft
      // (which is a legacy V1 stat and will usually be too low to pass).
      // V1 legacy paths still check industryLeft.
      const isV2BuildPhaseFlow = gameState.selectedPlayerAction === 'build';

      // China Great Wall Discount
      if (
        selectedAction === BuildingType.Wonder &&
        civilization.flags.chinaWallDiscount &&
        civilization.builtWonderId === "wall"
      ) {
        // Handled in buildWonder usually, but just in case of direct costs
      }

      if (!isV2BuildPhaseFlow && civilization.stats.industryLeft < cost) {
        addMessage(`Not enough Industry. Need ${cost}.`);
        return;
      }
      if (
        selectedAction === BuildingType.ArchimedesTower &&
        civilization.stats.science < 30
      ) {
        addMessage("Requires 30 Science.");
        return;
      }
      if (restrictedForBuildings.includes(tile.terrain)) {
        addMessage("Cannot build structure here.");
        return;
      }
    }

    // In multiplayer turn system, queue the decision instead of applying immediately
    if (syncState.isOnline && turnState && turnState.phase === "decision") {
      setPendingDecision((prev) => ({
        ...prev,
        buildActions: [
          ...prev.buildActions,
          { tileIndex, building: selectedAction },
        ],
      }));
      addMessage(
        `Building action queued (${selectedAction}). Submit when ready.`,
      );
      return;
    }

    // Apply Changes (single-player mode)
    const newTiles = [...tiles];
    newTiles[tileIndex] = { ...tile, building: selectedAction };
    setTiles(newTiles);

    setGameState((prev) => {
      const civ = prev.civilization;
      const cost = BUILDING_COSTS[selectedAction];
      // V2 build-phase deducted cost from productionPool earlier in
      // handleBuildPhaseSelect. V1 legacy paths still deduct from industryLeft.
      const isV2BuildPhaseFlow = prev.selectedPlayerAction === 'build';

      let newHouses = civ.stats.houses;
      let newIndustry = civ.stats.industryLeft;
      let newHousesBuilt = civ.stats.housesBuiltThisTurn;
      const newBuildings = { ...civ.buildings };
      const statBonus: Partial<typeof civ.stats> = {};

      if (selectedAction === BuildingType.House) {
        newHouses += 1;
        // Grow placements AND starter placements don't count toward the
        // fertility cap. They're their own budget (Grow = surge; starter = founder).
        const isBypassPlacement =
          prev.isPlacingStarterHouses || prev.selectedPlayerAction === 'grow';
        if (!isBypassPlacement) newHousesBuilt += 1;
      } else {
        if (!isV2BuildPhaseFlow) newIndustry -= cost;
        // STRUCTURAL building bonuses (martial, capacity, yield rates) are
        // re-derived in calculateStats from tile counts on every recompute.
        // ACCUMULATING bonuses (faith, culture totals) need a one-time bump
        // here at placement so they enter the running total without then
        // being added again every recompute (which would be exponential).
        if (selectedAction === BuildingType.Farm) newBuildings.farms++;
        if (selectedAction === BuildingType.Workshop) newBuildings.workshops++;
        if (selectedAction === BuildingType.Library) newBuildings.libraries++;
        if (selectedAction === BuildingType.Barracks) newBuildings.barracks++;
        if (selectedAction === BuildingType.Temple) {
          newBuildings.temples++;
          // One-time +2 Faith Total grant (per Temple). Yield grows via calc.
          statBonus.faith = (civ.stats.faith || 0) + 2;
        }
        if (selectedAction === BuildingType.Wall) newBuildings.walls++;
        if (selectedAction === BuildingType.Amphitheatre) {
          newBuildings.amphitheatres++;
          // One-time +3 Culture Total grant (per Amphitheatre).
          statBonus.culture = (civ.stats.culture || 0) + 3;
        }
        if (selectedAction === BuildingType.ArchimedesTower) newBuildings.archimedes_towers++;
      }

      // Decrement placement counter for v2 flow
      const remainingPlacements = (prev.actionPlacements || 1) - 1;

      // NEW TURN FLOW: after any tile placement (build or action-required),
      // the player returns to the Build Phase for continuous building. The
      // turn ends only when the player clicks End Turn on the Build Phase
      // panel. No more auto-advance to resolution from tile clicks.
      const isV2Action = prev.selectedPlayerAction !== null;
      const placementsDone = isV2Action && remainingPlacements <= 0;
      const shouldReturnToBuild = placementsDone;
      const starterPlacementDone = prev.isPlacingStarterHouses === true && remainingPlacements <= 0;
      // If this placement was a FREE grant from a world event, resume the
      // deferred phase (civ_event or action) the ref stashed earlier. That
      // overrides the default "return to build phase" behaviour so the turn
      // flow continues where the event left off.
      const deferredPhase = pendingPostFreePlacementPhase.current;
      const consumeFreePlacement = shouldReturnToBuild && deferredPhase !== null;
      if (consumeFreePlacement) {
        pendingPostFreePlacementPhase.current = null;
      }

      const nextSelectedPlayerAction = shouldReturnToBuild && prev.selectedPlayerAction === 'build'
        ? null
        : prev.selectedPlayerAction;
      const nextTurnPhase = consumeFreePlacement
        ? (deferredPhase as TurnPhaseV2)
        : shouldReturnToBuild
          ? ('build_phase' as TurnPhaseV2)
          : prev.turnPhase;

      return {
        ...prev,
        selectedPlayerAction: nextSelectedPlayerAction,
        selectedAction: (shouldReturnToBuild || starterPlacementDone) ? null : prev.selectedAction,
        actionPlacements: remainingPlacements,
        turnPhase: nextTurnPhase,
        isPlacingStarterHouses: starterPlacementDone ? false : prev.isPlacingStarterHouses,
        turnResolution: prev.turnResolution,
        civilization: {
          ...civ,
          buildings: newBuildings,
          stats: {
            ...civ.stats,
            ...statBonus,
            houses: newHouses,
            housesBuiltThisTurn: newHousesBuilt,
            industryLeft: newIndustry,
          },
        },
        messages: [`Constructed ${selectedAction}`, ...prev.messages],
      };
    });
  };

  const buildWonder = (wonder: WonderDefinition) => {
    const { civilization } = gameState;

    let cost = wonder.cost;
    // China Discount
    if (wonder.id === "wall" && civilization.flags.chinaWallDiscount) {
      cost = Math.floor(cost / 2);
    }

    if (civilization.builtWonderId) {
      addMessage("You can only build one Wonder.");
      return;
    }
    if ((civilization.stats.productionPool || 0) < cost) {
      addMessage("Not enough Production Pool.");
      return;
    }
    if (gameState.year < wonder.minYear) {
      addMessage("Not available in this era.");
      return;
    }

    setGameState((prev) => ({
      ...prev,
      placingWonder: true,
      civilization: {
        ...prev.civilization,
        builtWonderId: wonder.id,
        stats: {
          ...prev.civilization.stats,
          productionPool: Math.max(0, (prev.civilization.stats.productionPool || 0) - cost),
        },
      },
      messages: [
        `Built Wonder: ${wonder.name}! Now PLACE it on the map.`,
        ...prev.messages,
      ],
    }));
  };

  const foundReligion = (tenetId: string, name: string) => {
    const { civilization, gameFlags } = gameState;

    if (civilization.flags.religionFound) return;
    // Religion is unlocked from the start (no year gate). The Worship action
    // requires a Temple and Faith ≥ 10 to actually found, which gives the
    // pacing without the historical-year guesswork.
    void gameFlags;
    if (civilization.buildings.temples < 1) {
      addMessage("Must build a Temple first.");
      return;
    }
    if (civilization.stats.faith < 10) {
      addMessage("Need 10 Faith.");
      return;
    }

    setGameState((prev) => {
      const newTenets = [...prev.civilization.religion.tenets, tenetId];
      const isIsrael =
        prev.civilization.flags.israelBonus ||
        prev.civilization.presetId === "israel";
      const doneFounding = !isIsrael || newTenets.length >= 3; // Israel gets 3

      const msgs = [`Picked Tenet: ${tenetId}`];
      if (doneFounding) msgs.unshift(`Religion Established: ${name}!`);
      else msgs.unshift("Israel Bonus: Pick another tenet.");

      return {
        ...prev,
        civilization: {
          ...prev.civilization,
          flags: { ...prev.civilization.flags, religionFound: doneFounding },
          religion: { name, tenets: newTenets },
          stats: {
            ...prev.civilization.stats,
            faith: prev.civilization.stats.faith + 5,
          },
        },
        messages: [...msgs, ...prev.messages],
      };
    });
  };

  const spreadReligion = (neighborId: string) => {
    const neighbor = gameState.neighbors.find((n) => n.id === neighborId);
    if (!neighbor) return;

    // Evangelism lowers the required faith margin. Monotheism removes the
    // margin entirely (only need to match/exceed neighbor faith).
    const tenets = gameState.civilization.religion?.tenets || [];
    const margin = tenets.includes('monotheism')
      ? 0
      : tenets.includes('evangelism')
        ? 0
        : 2;

    if (gameState.civilization.stats.faith >= neighbor.faith + margin) {
      setGameState((prev) => ({
        ...prev,
        neighbors: prev.neighbors.map((n) =>
          n.id === neighborId
            ? { ...n, religion: prev.civilization.religion.name || "Our Faith" }
            : n,
        ),
        religionSpread: (prev.religionSpread || 0) + 1,
        messages: [
          `Spread religion to ${neighbor.name}! They now follow your faith.`,
          ...prev.messages,
        ],
      }));
    } else {
      addMessage(
        `Failed to convert ${neighbor.name} (Their Faith: ${neighbor.faith} vs Your Faith: ${gameState.civilization.stats.faith}${margin > 0 ? `, need +${margin}` : ''})`,
      );
    }
  };

  const formAlliance = (neighborId: string) => {
    const { civilization } = gameState;
    if (civilization.stats.diplomacy < 1) {
      addMessage("Need at least 1 Diplomacy to form alliances.");
      return;
    }

    const neighbor = gameState.neighbors.find((n) => n.id === neighborId);
    if (!neighbor) return;

    // Show treaty selection modal (Feature 1)
    setGameState((prev) => ({
      ...prev,
      pendingTreaty: neighborId,
    }));
  };

  const completeTreaty = (treatyType: TreatyType) => {
    if (!gameState.pendingTreaty) return;

    const neighborId = gameState.pendingTreaty;
    const neighbor = gameState.neighbors.find((n) => n.id === neighborId);
    if (!neighbor) return;

    setGameState((prev) => ({
      ...prev,
      pendingTreaty: null,
      neighbors: prev.neighbors.map((n) =>
        n.id === neighborId ? { ...n, relationship: "Ally" } : n,
      ),
      treaties: [
        ...prev.treaties,
        {
          neighborId,
          type: treatyType,
          turnsRemaining: 3,
        },
      ],
      messages: [
        `Formed ${treatyType} treaty with ${neighbor.name}!`,
        ...prev.messages,
      ],
    }));
  };

  const tradeWithNeighbor = (neighborId: string) => {
    const { civilization } = gameState;

    // Check if already traded this turn (Feature 2)
    if (gameState.tradedThisTurn.includes(neighborId)) {
      addMessage("You can only trade with this neighbor once per timeline advance.");
      return;
    }

    // Cost check
    if (civilization.stats.industry < 2) {
      addMessage("Trading costs 2 Industry.");
      return;
    }

    const neighbor = gameState.neighbors.find((n) => n.id === neighborId);
    if (!neighbor) return;

    // Random stat bonus: faith, science, culture, or martial
    const statOptions: Array<"faith" | "science" | "culture" | "martial"> = [
      "faith",
      "science",
      "culture",
      "martial",
    ];
    const randomStat = statOptions[Math.floor(Math.random() * statOptions.length)];

    setGameState((prev) => ({
      ...prev,
      tradedThisTurn: [...prev.tradedThisTurn, neighborId],
      civilization: {
        ...prev.civilization,
        stats: {
          ...prev.civilization.stats,
          industry: prev.civilization.stats.industry - 2,
          industryLeft: prev.civilization.stats.industryLeft - 2,
          [randomStat]: (prev.civilization.stats as any)[randomStat] + 3,
        },
      },
      messages: [
        `Traded with ${neighbor.name}! Gained +3 ${randomStat}.`,
        ...prev.messages,
      ],
    }));
  };

  // Handle respawn: player picks a new civ and bonus
  const handleRespawn = (civId: string, bonusId: string) => {
    const respawnCiv = RESPAWN_CIVS.find(c => c.id === civId);
    const bonus = RESPAWN_BONUSES.find(b => b.id === bonusId);
    if (!respawnCiv || !bonus) return;

    // Generate fresh map for the respawn civ
    const respawnPreset: CivPreset = {
      id: respawnCiv.id,
      name: respawnCiv.name,
      regions: [respawnCiv.region],
      traits: [respawnCiv.trait],
      baseStats: { ...respawnCiv.baseStats },
      waterResource: respawnCiv.waterResource,
      isIsland: false,
      colors: respawnCiv.colors,
      centerBiomes: respawnCiv.centerBiomes,
      edgeBiomes: respawnCiv.edgeBiomes,
    };

    const newTiles = generateMap(respawnPreset);
    setTiles(newTiles);
    setTakenRespawnIds(prev => [...prev, civId]);

    // Apply respawn stats with bonus
    setGameState((prev) => ({
      ...prev,
      pendingRespawn: false,
      respawnOptions: [],
      civilization: {
        ...prev.civilization,
        presetId: respawnCiv.id,
        name: respawnCiv.name,
        regions: [respawnCiv.region],
        traits: [respawnCiv.trait],
        culturalStage: 'Barbarism' as const,
        builtWonderId: null,
        religion: { name: null, tenets: [] },
        buildings: { farms: 0, workshops: 0, libraries: 0, barracks: 0, temples: 0, amphitheatres: 0, walls: 0, archimedes_towers: 0 },
        flags: { ...prev.civilization.flags, conquered: false },
        baseStats: {
          martial: respawnCiv.baseStats.martial,
          defense: respawnCiv.baseStats.defense,
          faith: respawnCiv.baseStats.faith,
          industry: respawnCiv.baseStats.industry,
          fertility: respawnCiv.baseStats.fertility,
        },
        stats: {
          ...prev.civilization.stats,
          houses: 2,
          housesBuiltThisTurn: 0,
          population: 2,
          capacity: respawnCiv.baseStats.capacity + (bonus.effects.capacity || 0),
          fertility: respawnCiv.baseStats.fertility,
          industry: respawnCiv.baseStats.industry,
          industryLeft: respawnCiv.baseStats.industry,
          martial: respawnCiv.baseStats.martial + (bonus.effects.martial || 0),
          defense: respawnCiv.baseStats.defense + (bonus.effects.defense || 0),
          science: bonus.effects.science || 0,
          culture: bonus.effects.culture || 0,
          faith: respawnCiv.baseStats.faith + (bonus.effects.faith || 0),
          diplomacy: 0,
          productionPool: (respawnCiv.baseStats.productionIncome * 3) + (bonus.effects.productionPool || 0),
          productionIncome: respawnCiv.baseStats.productionIncome + (bonus.effects.productionIncome || 0),
          scienceYield: respawnCiv.baseStats.scienceYield,
          cultureYield: respawnCiv.baseStats.cultureYield,
          faithYield: respawnCiv.baseStats.faithYield,
          tempDefenseBonus: 0,
          fortifyDice: 0,
        },
      },
      messages: [`Respawned as ${respawnCiv.name}! ${bonus.description}. Rise again!`, ...prev.messages],
    }));

    setShowRespawnPanel(false);
  };

  const addMessage = (msg: string) => {
    setGameState((prev) => ({
      ...prev,
      messages: [msg, ...prev.messages.slice(0, 4)],
    }));
  };

  // Memoized climate for the 3D map. Recomputes only when the civ preset
  // changes, not on every GameApp re-render. This lets MapScene and its
  // memoized children skip work when only unrelated state updates.
  // MUST be declared before any early return — React hooks rule.
  const mapClimate = useMemo(() => {
    const id = gameState.civilization?.presetId;
    const preset = CIV_PRESETS.find((c) => c.id === id);
    if (preset?.climate) return preset.climate;
    const respawn = RESPAWN_CIVS.find((c) => c.id === id);
    return respawn?.climate || 'temperate';
  }, [gameState.civilization?.presetId]);

  // --- RENDER HELPERS ---

  if (!gameState.hasStarted) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-10 font-sans">
        <div className="max-w-5xl w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 flex flex-col max-h-full overflow-hidden">
          <h1 className="text-4xl font-bold text-orange-500 mb-2 flex items-center gap-3">
            <History size={40} /> Ancient World Simulation
          </h1>
          <p className="text-slate-400 mb-8">
            Choose a civilization to lead from the first settlements through the Fall of Rome.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {CIV_PRESETS.map((civ) => (
              <button
                key={civ.id}
                onClick={() => startGame(civ)}
                className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-orange-500/50 rounded-xl text-left transition-all overflow-hidden flex flex-col"
              >
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: civ.colors.base }}
                />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-100">
                      {civ.name}
                    </h3>
                    {civ.isIsland && (
                      <span className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded">
                        Island
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {civ.traits.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-mono bg-slate-800 text-orange-300 px-2 py-1 rounded border border-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 text-sm text-slate-400 mb-4">
                    <span>
                      Martial:{" "}
                      <b className="text-slate-200">{civ.baseStats.martial}</b>
                    </span>
                    <span>
                      Industry:{" "}
                      <b className="text-slate-200">{civ.baseStats.industry}</b>
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 mt-auto">
                    <span>{civ.waterResource} water</span>
                    <span>|</span>
                    <span>
                      {getAdjacentCivs(civ.id).length} neighbor
                      {getAdjacentCivs(civ.id).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { civilization: civ } = gameState;

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden font-sans text-slate-200 relative">
      {/* V2 TURN PHASE UI */}
      <TurnPhaseUI
        phase={gameState.turnPhase || 'idle'}
        gameState={gameState}
        worldEvent={gameState.currentWorldEvent || null}
        civEvent={gameState.currentCivEvent || null}
        incomeMessages={v2IncomeMessages}
        unlockedActions={v2UnlockedActions}
        onUnlocksAcknowledge={handleUnlocksAcknowledge}
        onWorldEventChoice={handleWorldEventChoice}
        onCivEventAcknowledge={handleCivEventAck}
        onBuildPhaseSelect={handleBuildPhaseSelect}
        onBuildPhaseSkip={handleBuildPhaseSkip}
        onActionSelect={handleActionSelect}
        onResolutionDismiss={handleResolutionDismiss}
        turnResolution={v2TurnResolution}
        onPhaseRecovery={() => {
          setGameState((prev) => ({
            ...prev,
            turnPhase: 'idle' as TurnPhaseV2,
            currentWorldEvent: null,
            currentCivEvent: null,
          }));
          setV2TurnResolution(null);
          setV2UnlockedActions([]);
        }}
      />

      {/* CONQUEST REWARD PANEL */}
      {showConquestReward && (
        <ConquestRewardPanel
          messages={conquestMessages}
          conqueredName={conquestTargetName}
          onDismiss={() => setShowConquestReward(false)}
        />
      )}

      {/* REFLECTION TURN — appears once after Turn 24 finishes. The
          student can dismiss it (X button on the screen wraps onComplete) so
          they aren't forced to redo it on every refresh. */}
      {gameState.gameEnded && !reflectionDismissed && (
        <ReflectionTurn
          gameState={gameState}
          decisionHistory={decisionLog}
          onComplete={(result) => {
            handleReflectionComplete(result);
            setReflectionDismissed(true);
          }}
        />
      )}

      {/* RESPAWN PANEL */}
      {showRespawnPanel && (
        <RespawnPanel
          availableCivs={getAvailableRespawnCivs(gameState.turnNumber || 1, takenRespawnIds)}
          bonuses={getRespawnBonuses()}
          onSelect={handleRespawn}
        />
      )}

      {/* ATTACK OUTCOME MODAL — shown right after any Attack action so the
          student sees the full dice breakdown and effects in one place. */}
      {attackOutcome && (
        <AttackOutcomeModal
          popup={attackOutcome}
          onClose={() => setAttackOutcome(null)}
        />
      )}

      {/* THRESHOLD MODAL — science/culture/faith/etc milestones. Shown one
          at a time from the front of the queue until empty. */}
      {thresholdQueue.length > 0 && (
        <ThresholdModal
          popup={thresholdQueue[0]}
          onClose={() => setThresholdQueue((q) => q.slice(1))}
        />
      )}

      {/* TECH / RELIGION / CULTURE TREES — opened from the sidebar buttons. */}
      {showTechTree && (
        <TechTreeModal
          gameState={gameState}
          onPickTech={(choiceId) => {
            const choice = TECH_CHOICES.find((c) => c.id === choiceId);
            if (!choice) return;
            const current = gameState.civilization.techChoices || [];
            const tierPicks = current
              .map((id) => TECH_CHOICES.find((c) => c.id === id))
              .filter((c) => c && c.tier === choice.tier);
            if (tierPicks.length > 0) return; // one pick per tier
            if (current.includes(choiceId)) return;
            setGameState((prev) => {
              const techChoices = [...(prev.civilization.techChoices || []), choiceId];
              const stats = { ...prev.civilization.stats };
              if (choice.statBonus?.science) {
                stats.science = (stats.science || 0) + choice.statBonus.science;
              }
              const nextCiv = { ...prev.civilization, stats, techChoices };
              const recomputed = calculateStats(tiles, nextCiv, {}, prev.neighbors, prev.treaties);
              const finalStats = { ...nextCiv.stats, ...recomputed };
              setTimeout(
                () =>
                  checkThresholds(
                    finalStats.science || 0,
                    finalStats.culture || 0,
                    finalStats.faith || 0,
                    !!nextCiv.religion?.name,
                  ),
                0,
              );
              return {
                ...prev,
                civilization: { ...nextCiv, stats: finalStats },
                messages: [`Tech path chosen: ${choice.label} — ${choice.grants}.`, ...prev.messages],
              };
            });
          }}
          onClose={() => setShowTechTree(false)}
        />
      )}
      {showReligionTree && (
        <ReligionTreeModal
          gameState={gameState}
          onPickTenet={(tenetId) => {
            // Only allow picking if we have an unlocked slot.
            const faith = gameState.civilization?.stats?.faith || 0;
            const chosen = gameState.civilization?.religion?.tenets || [];
            const slotsUnlocked = RELIGION_TENET_THRESHOLDS.filter((t) => faith >= t).length;
            if (slotsUnlocked <= chosen.length) return;
            if (chosen.includes(tenetId)) return;
            setGameState((prev) => {
              const nextCiv = {
                ...prev.civilization,
                religion: {
                  name: prev.civilization.religion?.name ?? 'Faith of the People',
                  tenets: [...(prev.civilization.religion?.tenets || []), tenetId],
                },
              };
              const recomputed = calculateStats(tiles, nextCiv, {}, prev.neighbors, prev.treaties);
              const finalStats = { ...nextCiv.stats, ...recomputed };
              // Mid-turn threshold check — if this tenet pushed a stat
              // across a milestone, the popup fires right away.
              setTimeout(
                () =>
                  checkThresholds(
                    finalStats.science || 0,
                    finalStats.culture || 0,
                    finalStats.faith || 0,
                    !!nextCiv.religion.name,
                  ),
                0,
              );
              return {
                ...prev,
                civilization: { ...nextCiv, stats: finalStats },
                messages: [`Adopted tenet: ${tenetId.replace(/_/g, ' ')}.`, ...prev.messages],
              };
            });
          }}
          onClose={() => setShowReligionTree(false)}
        />
      )}
      {showCultureTree && (
        <CultureTreeModal
          gameState={gameState}
          chosenCultureIds={chosenCultureIds}
          onPickCulture={(choiceId) => {
            const choice = CULTURE_CHOICES.find((c) => c.id === choiceId);
            if (!choice) return;
            // Enforce one-per-stage (reads from source of truth now).
            const currentBonuses = gameState.civilization.culturalBonuses || [];
            const stagePicks = currentBonuses
              .map((id) => CULTURE_CHOICES.find((c) => c.id === id))
              .filter((c) => c && c.stage === choice.stage);
            if (stagePicks.length > 0) return;
            if (currentBonuses.includes(choiceId)) return;

            setGameState((prev) => {
              const culturalBonuses = [...(prev.civilization.culturalBonuses || []), choiceId];
              const stats = { ...prev.civilization.stats };
              if (choice.statBonus?.science) {
                stats.science = (stats.science || 0) + choice.statBonus.science;
              }
              const nextCiv = { ...prev.civilization, stats, culturalBonuses };
              const recomputed = calculateStats(tiles, nextCiv, {}, prev.neighbors, prev.treaties);
              const finalStats = { ...nextCiv.stats, ...recomputed };
              setTimeout(
                () =>
                  checkThresholds(
                    finalStats.science || 0,
                    finalStats.culture || 0,
                    finalStats.faith || 0,
                    !!nextCiv.religion?.name,
                  ),
                0,
              );
              return {
                ...prev,
                civilization: { ...nextCiv, stats: finalStats },
                messages: [`Cultural bonus claimed: ${choice.label} — ${choice.grants}.`, ...prev.messages],
              };
            });
            // Keep the local mirror in sync so the UI updates immediately.
            setChosenCultureIds((p) => (p.includes(choiceId) ? p : [...p, choiceId]));
          }}
          onClose={() => setShowCultureTree(false)}
        />
      )}

      {/* LEGACY EVENT POPUP MODAL */}
      {gameState.currentEventPopup && (
        <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col gap-6 relative">
            <button
              onClick={closeEventPopup}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center space-y-2">
              <div className="text-amber-500 font-bold tracking-widest uppercase text-sm">
                Historical Event • {Math.abs(gameState.currentEventPopup.year)}{" "}
                {gameState.currentEventPopup.year < 0 ? "BCE" : "CE"}
              </div>
              <h2 className="text-4xl font-bold text-white font-serif">
                {gameState.currentEventPopup.name}
              </h2>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 text-lg text-slate-300 leading-relaxed text-center italic font-serif">
              "{gameState.currentEventPopup.description}"
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Outcomes
              </h3>
              {gameState.currentEventPopup.effects.length > 0 ? (
                <ul className="space-y-2">
                  {gameState.currentEventPopup.effects.map((effect, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-slate-200 bg-slate-700/50 p-3 rounded-lg border border-slate-600 text-sm"
                    >
                      <div className="mt-1.5 min-w-[6px] h-[6px] rounded-full bg-amber-500"></div>
                      <span>{effect}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-slate-500 italic text-center p-4 bg-slate-900/30 rounded-lg border border-dashed border-slate-700">
                  No immediate effects on your civilization.
                </div>
              )}
            </div>

            <button
              onClick={closeEventPopup}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 text-lg transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              Continue History <Play size={20} fill="currentColor" />
            </button>
          </div>
        </div>
      )}

      {/* GROWTH CHOICE MODAL */}
      {gameState.pendingTurnChoice && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              New Era: {civ.culturalStage}
            </h2>
            <p className="text-slate-400 mb-6">
              Choose your civilization's focus for this growth phase.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {civ.culturalStage === "Barbarism" && (
                <>
                  <button
                    onClick={() => finalizeAdvance("martial")}
                    className="p-4 bg-red-900/40 border border-red-500 hover:bg-red-900/60 rounded-xl flex items-center gap-4 text-left"
                  >
                    <div className="bg-red-500 p-3 rounded-full">
                      <Sword className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">Warpath</div>
                      <div className="text-sm text-slate-300">
                        +50% Martial Strength
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => finalizeAdvance("fertility")}
                    className="p-4 bg-green-900/40 border border-green-500 hover:bg-green-900/60 rounded-xl flex items-center gap-4 text-left"
                  >
                    <div className="bg-green-500 p-3 rounded-full">
                      <Sprout className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">Growth</div>
                      <div className="text-sm text-slate-300">
                        +50% Fertility
                      </div>
                    </div>
                  </button>
                </>
              )}
              {civ.culturalStage === "Classical" && (
                <>
                  <button
                    onClick={() => finalizeAdvance("science")}
                    className="p-4 bg-blue-900/40 border border-blue-500 hover:bg-blue-900/60 rounded-xl flex items-center gap-4 text-left"
                  >
                    <div className="bg-blue-500 p-3 rounded-full">
                      <FlaskConical className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">Innovation</div>
                      <div className="text-sm text-slate-300">+50% Science</div>
                    </div>
                  </button>
                  <button
                    onClick={() => finalizeAdvance("faith")}
                    className="p-4 bg-yellow-900/40 border border-yellow-500 hover:bg-yellow-900/60 rounded-xl flex items-center gap-4 text-left"
                  >
                    <div className="bg-yellow-500 p-3 rounded-full">
                      <Star className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">Piety</div>
                      <div className="text-sm text-slate-300">+50% Faith</div>
                    </div>
                  </button>
                </>
              )}
              {(civ.culturalStage === "Imperial" ||
                civ.culturalStage === "Decline") && (
                <>
                  <button
                    onClick={() => finalizeAdvance("industry")}
                    className="p-4 bg-amber-900/40 border border-amber-500 hover:bg-amber-900/60 rounded-xl flex items-center gap-4 text-left"
                  >
                    <div className="bg-amber-500 p-3 rounded-full">
                      <Hammer className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">Industry</div>
                      <div className="text-sm text-slate-300">
                        +50% Production
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => finalizeAdvance("martial")}
                    className="p-4 bg-red-900/40 border border-red-500 hover:bg-red-900/60 rounded-xl flex items-center gap-4 text-left"
                  >
                    <div className="bg-red-500 p-3 rounded-full">
                      <Sword className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">Conquest</div>
                      <div className="text-sm text-slate-300">+50% Martial</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TREATY SELECTION MODAL (Feature 1) */}
      {gameState.pendingTreaty && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">
              Choose Treaty Type
            </h2>
            <p className="text-slate-400 mb-6">
              Select which type of treaty to form with{" "}
              {gameState.neighbors.find((n) => n.id === gameState.pendingTreaty)
                ?.name || "this neighbor"}
              .
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => completeTreaty("peace")}
                className="p-4 bg-cyan-900/40 border border-cyan-500 hover:bg-cyan-900/60 rounded-xl flex items-center gap-4 text-left"
              >
                <div className="bg-cyan-500 p-3 rounded-full">
                  <Scroll className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">Peace Treaty</div>
                  <div className="text-sm text-slate-300">
                    Cannot attack for 3 turns. +1 Martial.
                  </div>
                </div>
              </button>
              <button
                onClick={() => completeTreaty("trade")}
                className="p-4 bg-amber-900/40 border border-amber-500 hover:bg-amber-900/60 rounded-xl flex items-center gap-4 text-left"
              >
                <div className="bg-amber-500 p-3 rounded-full">
                  <Warehouse className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">Trade Pact</div>
                  <div className="text-sm text-slate-300">
                    +2 Industry per turn while active.
                  </div>
                </div>
              </button>
              <button
                onClick={() => completeTreaty("military")}
                className="p-4 bg-red-900/40 border border-red-500 hover:bg-red-900/60 rounded-xl flex items-center gap-4 text-left"
              >
                <div className="bg-red-500 p-3 rounded-full">
                  <Sword className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">Military Alliance</div>
                  <div className="text-sm text-slate-300">
                    +3 Martial when fighting their enemies.
                  </div>
                </div>
              </button>
              <button
                onClick={() => completeTreaty("cultural")}
                className="p-4 bg-pink-900/40 border border-pink-500 hover:bg-pink-900/60 rounded-xl flex items-center gap-4 text-left"
              >
                <div className="bg-pink-500 p-3 rounded-full">
                  <Palette className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">Cultural Exchange</div>
                  <div className="text-sm text-slate-300">
                    +2 Culture per turn while active.
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setGameState((prev) => ({ ...prev, pendingTreaty: null }))}
              className="mt-4 w-full p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 md:px-6 shrink-0 shadow-md z-20">
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className="text-lg md:text-xl font-bold text-orange-500 truncate">
            {civ.name}
          </h1>
          <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${gameState.year >= 0 ? "bg-blue-500" : "bg-amber-500"}`}
            ></span>
            {Math.abs(gameState.year)} {gameState.year >= 0 ? "CE" : "BCE"}
          </div>
          <div className="text-xs text-slate-500 border-l border-slate-700 pl-4 hidden md:block">
            {TIMELINE_EVENTS[gameState.timelineIndex]?.name}
          </div>
          {syncState.isOnline && (
            <div className="flex items-center gap-1 text-xs text-green-400 border-l border-slate-700 pl-4">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Synced
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGameState((prev) => ({ ...prev, fogOfWar: !prev.fogOfWar }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm min-h-[40px] md:min-h-[44px] transition-colors ${gameState.fogOfWar ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20" : "bg-slate-700 hover:bg-slate-600 text-slate-300"}`}
            title={gameState.fogOfWar ? "Fog of War ON" : "Fog of War OFF"}
          >
            <MapPin size={16} />
            <span className="hidden sm:inline">Fog</span>
          </button>
          {isSinglePlayer && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-sm min-h-[40px] md:min-h-[44px] bg-slate-700 hover:bg-red-700 text-slate-300 hover:text-white transition-colors"
              title="Reset Game"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          {!isSinglePlayer && (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-sm min-h-[40px] md:min-h-[44px] bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              title="Refresh Page"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          <button
            onClick={initiateAdvance}
            disabled={(gameState.turnPhase !== 'idle' && gameState.turnPhase !== undefined) || gameState.isPlacingStarterHouses === true}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg min-h-[40px] md:min-h-[44px] text-sm md:text-base whitespace-nowrap transition-colors ${
              (gameState.turnPhase === 'idle' || !gameState.turnPhase) && !gameState.isPlacingStarterHouses
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Play size={16} fill="currentColor" />
            <span className="hidden sm:inline">Turn</span>{" "}
            {(gameState.turnNumber || 0) + 1}/24
          </button>
        </div>
      </header>

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-red-500/50 max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h2 className="text-xl font-bold text-red-400">Reset Game?</h2>
            </div>
            <p className="text-sm text-slate-300 mb-6">
              This will erase all progress for your current civilization and return you to the civilization selection screen. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resetGame}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors"
              >
                Reset Game
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden pb-[56px] md:pb-0">
        {/* LEFT STATS - Hidden on mobile */}
        <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col z-10 shadow-xl">
          <div className="p-4 border-b border-slate-800 space-y-4">
            <div>
              <button
                onClick={() => setExpandedInfo(expandedInfo === 'houses' ? null : 'houses')}
                title={STAT_EXPLANATIONS.houses.body}
                className={`w-full text-left rounded transition-colors ${expandedInfo === 'houses' ? 'bg-orange-900/20 p-2 -m-1' : 'hover:bg-slate-800/40 p-2 -m-1'}`}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-orange-400 flex items-center gap-2">
                    <Home size={14} /> Houses (
                    {civ.flags.housesSupportTwoPop ? "2x" : "1x"} Pop)
                    <span className="text-[9px] text-slate-500">{expandedInfo === 'houses' ? '▼' : 'ⓘ'}</span>
                  </span>
                  <span>
                    {civ.stats.houses}/{civ.stats.capacity}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-500 h-full"
                    style={{
                      width: `${(civ.stats.houses / Math.max(1, civ.stats.capacity)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-slate-500 mt-1 text-right">
                  Built this turn: {civ.stats.housesBuiltThisTurn}/
                  {civ.stats.fertility}
                </div>
                {/* ALWAYS-VISIBLE population bonus line so students see at a
                    glance that growing their civ translates into Martial and
                    Industry gains. Tap the block for the full breakdown. */}
                <div className="mt-1.5 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/60 text-[10px] text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400">Pop {civ.stats.population || 0} gives:</span>
                  <span>
                    <span className="text-red-300 font-bold">+{Math.floor((civ.stats.population || 0) / 4)} Martial</span>
                    <span className="mx-1 text-slate-600">·</span>
                    <span className="text-amber-300 font-bold">+{Math.floor((civ.stats.population || 0) / 5)} Industry</span>
                  </span>
                </div>
              </button>
              {expandedInfo === 'houses' && (() => {
                const info = STAT_EXPLANATIONS.houses;
                const pop = civ.stats.population || 0;
                return (
                  <div className="bg-slate-800/70 rounded-md p-2.5 mt-1 border border-slate-700 text-xs leading-relaxed space-y-2">
                    <div className="text-slate-200">{info.body}</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-900/60 rounded px-2 py-1.5">
                        <div className="text-slate-500">Population</div>
                        <div className="text-orange-300 font-bold">{pop}</div>
                      </div>
                      <div className="bg-slate-900/60 rounded px-2 py-1.5">
                        <div className="text-slate-500">Capacity</div>
                        <div className="text-orange-300 font-bold">{civ.stats.capacity}</div>
                      </div>
                      <div className="bg-slate-900/60 rounded px-2 py-1.5">
                        <div className="text-slate-500">Martial from Pop</div>
                        <div className="text-red-300 font-bold">+{Math.floor(pop / 4)}</div>
                      </div>
                      <div className="bg-slate-900/60 rounded px-2 py-1.5">
                        <div className="text-slate-500">Industry from Pop</div>
                        <div className="text-amber-300 font-bold">+{Math.floor(pop / 5)}</div>
                      </div>
                    </div>
                    {info.raise && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">How to grow</div>
                        <ul className="text-slate-300 space-y-0.5 list-disc list-inside ml-1">
                          {info.raise.map((r, i) => <li key={i} className="text-[11px]">{r}</li>)}
                        </ul>
                      </div>
                    )}
                    {info.affects && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">What it does</div>
                        <ul className="text-slate-300 space-y-0.5 list-disc list-inside ml-1">
                          {info.affects.map((a, i) => <li key={i} className="text-[11px]">{a}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            {/* INDUSTRY + FERTILITY — click-to-expand. Same pattern as the
                stat rows below. */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'industry',   label: 'Industry',  color: 'text-amber-400', value: civ.stats.industryLeft },
                { key: 'fertility',  label: 'Fertility', color: 'text-green-400', value: civ.stats.fertility },
              ] as const).map((s) => {
                const isOpen = expandedInfo === s.key;
                const info = STAT_EXPLANATIONS[s.key];
                return (
                  <button
                    key={s.key}
                    onClick={() => setExpandedInfo(isOpen ? null : s.key)}
                    title={info.body}
                    className={`bg-slate-800 p-2 rounded border text-left transition-colors ${isOpen ? 'border-slate-500 bg-slate-700' : 'border-slate-700 hover:border-slate-600'}`}
                  >
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>{s.label}</span>
                      <span className="text-[9px] text-slate-500">{isOpen ? '▼' : 'ⓘ'}</span>
                    </div>
                    <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  </button>
                );
              })}
            </div>
            {(expandedInfo === 'industry' || expandedInfo === 'fertility') && (() => {
              const info = STAT_EXPLANATIONS[expandedInfo];
              return (
                <div className="bg-slate-800/70 rounded-md p-2.5 mt-1 border border-slate-700 text-xs leading-relaxed space-y-2">
                  <div className="text-slate-200">{info.body}</div>
                  {info.raise && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">How to raise</div>
                      <ul className="text-slate-300 space-y-0.5 list-disc list-inside ml-1">
                        {info.raise.map((r, i) => <li key={i} className="text-[11px]">{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {info.affects && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Affects</div>
                      <ul className="text-slate-300 space-y-0.5 list-disc list-inside ml-1">
                        {info.affects.map((a, i) => <li key={i} className="text-[11px]">{a}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* STAT ROWS — each row is click-to-expand. Click a stat to see a
                detailed explanation of what it does, how to raise it, and what
                it affects. Hovering also shows a short native tooltip as a
                fallback for power users. Click again (or click a different
                stat) to toggle. */}
            <div className="space-y-1 text-sm">
              {([
                { key: 'martial',    label: 'Martial',    color: 'text-red-400',    value: civ.stats.martial },
                { key: 'faith',      label: 'Faith',      color: 'text-yellow-400', value: civ.stats.faith },
                { key: 'culture',    label: 'Culture',    color: 'text-pink-400',   value: civ.stats.culture },
                { key: 'science',    label: 'Science',    color: 'text-purple-400', value: civ.stats.science },
                { key: 'diplomacy',  label: 'Diplomacy',  color: 'text-cyan-400',   value: civ.stats.diplomacy },
              ] as const).map((s) => {
                const isOpen = expandedInfo === s.key;
                const info = STAT_EXPLANATIONS[s.key];
                return (
                  <div key={s.key}>
                    <button
                      onClick={() => setExpandedInfo(isOpen ? null : s.key)}
                      title={info.body}
                      className={`w-full flex justify-between items-center border-b border-slate-800 pb-1 hover:bg-slate-800/50 rounded px-1 transition-colors text-left ${isOpen ? 'bg-slate-800/70' : ''}`}
                    >
                      <span className={`${s.color} flex items-center gap-1.5`}>
                        {s.label}
                        <span className={`text-[9px] ${isOpen ? 'text-white' : 'text-slate-500'}`}>{isOpen ? '▼' : 'ⓘ'}</span>
                      </span>
                      <b>{s.value}</b>
                    </button>
                    {isOpen && (
                      <div className="bg-slate-800/70 rounded-md p-2.5 mt-1 mb-1 border border-slate-700 text-xs leading-relaxed space-y-2">
                        <div className="text-slate-200">{info.body}</div>
                        {info.raise && (
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">How to raise</div>
                            <ul className="text-slate-300 space-y-0.5 list-disc list-inside ml-1">
                              {info.raise.map((r, i) => <li key={i} className="text-[11px]">{r}</li>)}
                            </ul>
                          </div>
                        )}
                        {info.affects && (
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Affects</div>
                            <ul className="text-slate-300 space-y-0.5 list-disc list-inside ml-1">
                              {info.affects.map((a, i) => <li key={i} className="text-[11px]">{a}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {civ.religion.name && (
            <div className="p-4 bg-yellow-900/20 m-2 rounded border border-yellow-700/30">
              <div className="text-xs text-yellow-500 uppercase font-bold">
                State Religion
              </div>
              <div className="text-sm font-bold text-yellow-100">
                {civ.religion.name}
              </div>
            </div>
          )}
          <div className="m-2">
            <button
              onClick={() => setExpandedInfo(expandedInfo === 'cultural_stage' ? null : 'cultural_stage')}
              title={STAT_EXPLANATIONS.cultural_stage.body}
              className={`w-full text-left p-4 rounded border transition-colors ${
                expandedInfo === 'cultural_stage'
                  ? 'bg-indigo-900/40 border-indigo-500/60'
                  : 'bg-indigo-900/20 border-indigo-700/30 hover:bg-indigo-900/30'
              }`}
            >
              <div className="text-xs text-indigo-400 uppercase font-bold mb-2 flex items-center justify-between">
                <span>Cultural Stage</span>
                <span className="text-[9px] text-slate-400">{expandedInfo === 'cultural_stage' ? '▼' : 'ⓘ'}</span>
              </div>
              <div className="text-sm font-bold text-indigo-100">
                {civ.culturalStage}
              </div>
            </button>
            {expandedInfo === 'cultural_stage' && (
              <div className="bg-slate-800/70 rounded-md p-2.5 mt-1 border border-slate-700 text-xs leading-relaxed space-y-2">
                <div className="text-slate-200">{STAT_EXPLANATIONS.cultural_stage.body}</div>
                {STAT_EXPLANATIONS.cultural_stage.raise && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stage ladder</div>
                    <ul className="text-slate-300 space-y-0.5 list-disc list-inside ml-1">
                      {STAT_EXPLANATIONS.cultural_stage.raise.map((r, i) => <li key={i} className="text-[11px]">{r}</li>)}
                    </ul>
                  </div>
                )}
                <div className="text-[11px] text-indigo-300 pt-1 border-t border-slate-700">Tip: Open the Culture tab on the right for a full stage breakdown with live progress.</div>
              </div>
            )}
          </div>
          {civ.technologies && civ.technologies.length > 0 && (
            <div className="m-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedInfo(expandedInfo === 'technologies' ? null : 'technologies')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedInfo(expandedInfo === 'technologies' ? null : 'technologies'); } }}
                title={STAT_EXPLANATIONS.technologies.body}
                className={`w-full text-left p-4 rounded border transition-colors cursor-pointer ${
                  expandedInfo === 'technologies'
                    ? 'bg-purple-900/40 border-purple-500/60'
                    : 'bg-purple-900/20 border-purple-700/30 hover:bg-purple-900/30'
                }`}
              >
                <div className="text-xs text-purple-400 uppercase font-bold mb-2 flex items-center justify-between">
                  <span>Technologies ({civ.technologies.length})</span>
                  <span className="text-[9px] text-slate-400">{expandedInfo === 'technologies' ? '▼' : 'ⓘ'}</span>
                </div>
                <div className="space-y-1">
                  {civ.technologies.map((techId) => {
                    const tech = TECHNOLOGIES.find((t) => t.id === techId);
                    return tech ? (
                      <div
                        key={techId}
                        title={tech.description}
                        className="text-xs text-purple-200 bg-purple-900/30 px-2 py-1 rounded cursor-help"
                      >
                        {tech.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              {expandedInfo === 'technologies' && (
                <div className="bg-slate-800/70 rounded-md p-2.5 mt-1 border border-slate-700 text-xs leading-relaxed space-y-2">
                  <div className="text-slate-200">{STAT_EXPLANATIONS.technologies.body}</div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your technologies</div>
                    <ul className="space-y-1">
                      {civ.technologies.map((techId) => {
                        const tech = TECHNOLOGIES.find((t) => t.id === techId);
                        return tech ? (
                          <li key={techId} className="bg-slate-900/60 rounded px-2 py-1.5 border border-slate-700">
                            <div className="text-[11px] font-bold text-purple-200">{tech.name}</div>
                            <div className="text-[10px] text-slate-400 leading-relaxed">{tech.description}</div>
                            {tech.effect && (
                              <div className="text-[10px] text-emerald-300 mt-0.5">Effect: {tech.effect}</div>
                            )}
                          </li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                  <div className="text-[11px] text-purple-300 pt-1 border-t border-slate-700">Tip: Technologies unlock automatically as your civ reaches historical years, provided any prerequisites are met.</div>
                </div>
              )}
            </div>
          )}
          <div className="p-4 bg-cyan-900/20 m-2 rounded border border-cyan-700/30">
            <div className="text-xs text-cyan-400 uppercase font-bold mb-2">
              Science Unlocks
            </div>
            <div className="space-y-1.5">
              {(() => {
                const unlockedUnlocks = SCIENCE_UNLOCKS.filter(
                  (u) => u.level <= civ.stats.science,
                );
                const nextUnlock = SCIENCE_UNLOCKS.find(
                  (u) => u.level > civ.stats.science,
                );

                if (unlockedUnlocks.length === 0) {
                  return (
                    <div className="text-xs text-slate-400 italic">
                      Build science to unlock abilities
                    </div>
                  );
                }

                return (
                  <>
                    {unlockedUnlocks.map((unlock, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-cyan-200 bg-cyan-900/40 px-2 py-1.5 rounded border border-cyan-700/50"
                      >
                        {unlock.effect}
                      </div>
                    ))}
                    {nextUnlock && (
                      <div className="text-xs text-slate-400 bg-slate-800/40 px-2 py-1.5 rounded border border-slate-700/50 italic">
                        Next: {nextUnlock.effect} (need{" "}
                        {nextUnlock.level - civ.stats.science} more sci)
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </aside>

        {/* MAP */}
        <section className="flex-1 relative bg-slate-950">
          <MapScene
            tiles={tiles}
            onTileClick={handleTileClick}
            climate={mapClimate}
          />
          {gameState.fogOfWar && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, transparent 30%, rgba(15,23,42,0.7) 70%, rgba(15,23,42,0.95) 100%)",
              }}
            />
          )}
          {gameState.placingWonder && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-6 py-3 rounded-full font-bold shadow-xl z-20 animate-bounce">
              CLICK A TILE TO PLACE YOUR WONDER
            </div>
          )}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-slate-900/90 backdrop-blur border border-slate-700 px-6 py-2 rounded-full shadow-2xl z-10">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-[#166534] rounded-sm"></div> Forest
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-[#78716c] rounded-sm"></div> Mountain
            </div>
          </div>
        </section>

        {/* RIGHT TABBED PANEL - Hidden on mobile */}
        <aside className="hidden md:flex w-80 bg-slate-900 border-l border-slate-800 flex-col z-10 shadow-xl">
          <div className="flex border-b border-slate-800">
            {["build", "science", "culture", "world", "wonders", "religion", "war", "diplomacy", "scoreboard"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 min-h-[48px] py-4 flex justify-center items-center text-slate-400 hover:bg-slate-800 transition-colors ${activeTab === tab ? "border-b-2 border-orange-500 text-orange-500 bg-slate-800" : ""}`}
                title={tab.charAt(0).toUpperCase() + tab.slice(1)}
              >
                {tab === "build" && <Hammer size={18} />}
                {tab === "science" && <FlaskConical size={18} />}
                {tab === "culture" && <Palette size={18} />}
                {tab === "world" && <Globe size={18} />}
                {tab === "wonders" && <Crown size={18} />}
                {tab === "religion" && <Star size={18} />}
                {tab === "war" && <Sword size={18} />}
                {tab === "diplomacy" && <Handshake size={18} />}
                {tab === "scoreboard" && <Trophy size={18} />}
              </button>
            ))}
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            {/* BUILD TAB */}
            {activeTab === "build" && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Structures
                </h2>
                <button
                  onClick={() =>
                    setGameState((p) => ({
                      ...p,
                      selectedAction: BuildingType.House,
                    }))
                  }
                  className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 min-h-[48px] ${gameState.selectedAction === BuildingType.House ? "bg-orange-900/30 border-orange-500" : "bg-slate-800 border-slate-700"}`}
                >
                  <div className="p-2 bg-orange-600 rounded text-white">
                    <Home size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">House</div>
                    <div className="text-xs text-slate-400">
                      Cost: Fertility (
                      {civ.stats.fertility - civ.stats.housesBuiltThisTurn}{" "}
                      left)
                    </div>
                  </div>
                </button>
{/* PRODUCTION-COST BUILDINGS — clicking any of these is a shortcut
                    for picking from the Build Phase modal. Works outside the
                    Build Phase too (e.g. from the build sidebar at any time) as
                    long as the Production Pool covers the cost. Cost is
                    deducted via handleBuildPhaseSelect which also toggles
                    idle-for-placement mode. */}
                {(() => {
                  const pool = civ.stats.productionPool || 0;
                  const entries = [
                    { type: BuildingType.Farm,        name: 'Farm',        cost: 5,  icon: Sprout,       color: 'green',   effect: '+1 Capacity, +1 Prod Income' },
                    { type: BuildingType.Workshop,    name: 'Workshop',    cost: 8,  icon: Hammer,       color: 'yellow',  effect: '+2 Production Income' },
                    { type: BuildingType.Library,     name: 'Library',     cost: 10, icon: FlaskConical, color: 'cyan',    effect: '+2 Sci Yield' },
                    { type: BuildingType.Barracks,    name: 'Barracks',    cost: 10, icon: Sword,        color: 'red',     effect: '+3 Martial' },
                    { type: BuildingType.Temple,      name: 'Temple',      cost: 10, icon: Landmark,     color: 'blue',    effect: '+2 Faith, +1 Faith Yield' },
                    { type: BuildingType.Wall,        name: 'Wall',        cost: 10, icon: BrickWall,    color: 'slate',   effect: '+1 Cap, +1d8 on defense (max 3 dice)' },
                    { type: BuildingType.Amphitheatre, name: 'Amphitheatre', cost: 10, icon: Users,      color: 'pink',    effect: '+2 Culture Yield, +3 Culture' },
                    { type: BuildingType.ArchimedesTower, name: 'Archimedes Tower', cost: 20, icon: TowerControl, color: 'purple', effect: '+20 Martial (needs 30 Sci)' },
                  ];
                  return entries.map((e) => {
                    const sciGate = e.type === BuildingType.ArchimedesTower && civ.stats.science < 30;
                    const canAfford = pool >= e.cost && !sciGate;
                    const isSelected = gameState.selectedAction === e.type;
                    const IconC = e.icon;
                    const colorMap: Record<string, { iconBg: string; selBg: string; selBorder: string }> = {
                      green:  { iconBg: 'bg-green-600',  selBg: 'bg-green-900/30',  selBorder: 'border-green-500' },
                      yellow: { iconBg: 'bg-yellow-600', selBg: 'bg-yellow-900/30', selBorder: 'border-yellow-500' },
                      cyan:   { iconBg: 'bg-cyan-600',   selBg: 'bg-cyan-900/30',   selBorder: 'border-cyan-500' },
                      red:    { iconBg: 'bg-red-600',    selBg: 'bg-red-900/30',    selBorder: 'border-red-500' },
                      blue:   { iconBg: 'bg-blue-600',   selBg: 'bg-blue-900/30',   selBorder: 'border-blue-500' },
                      slate:  { iconBg: 'bg-slate-500',  selBg: 'bg-slate-700',     selBorder: 'border-slate-400' },
                      pink:   { iconBg: 'bg-pink-600',   selBg: 'bg-pink-900/30',   selBorder: 'border-pink-500' },
                      purple: { iconBg: 'bg-purple-600', selBg: 'bg-purple-900/30', selBorder: 'border-purple-500' },
                    };
                    const c = colorMap[e.color];
                    return (
                      <button
                        key={e.type}
                        disabled={!canAfford}
                        onClick={() => handleBuildPhaseSelect(e.type)}
                        className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 min-h-[48px] ${
                          isSelected ? `${c.selBg} ${c.selBorder}` : 'bg-slate-800 border-slate-700'
                        } ${!canAfford ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-500'}`}
                      >
                        <div className={`p-2 ${c.iconBg} rounded text-white`}>
                          <IconC size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{e.name}</div>
                          <div className="text-xs text-slate-400">
                            Cost: {e.cost} Prod{sciGate ? ' · needs 30 Sci' : ''} · {e.effect}
                          </div>
                        </div>
                      </button>
                    );
                  });
                })()}

                <div className="mt-2 text-[11px] text-slate-500 leading-relaxed italic border-t border-slate-800 pt-2">
                  Clicking any building above selects it for placement. You can also use the <b className="text-yellow-400">Build Phase</b> modal during the main turn flow, or the <b className="text-purple-400">Wonders</b> tab for era-defining projects.
                </div>
              </div>
            )}

            {/* SCIENCE TAB */}
            {activeTab === "science" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Science &amp; Technology
                  </h2>
                  <button
                    onClick={() => setShowTechTree(true)}
                    className="text-xs px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 rounded text-cyan-200 font-semibold"
                  >
                    Open Tech Tree
                  </button>
                </div>

                {/* Current Stats */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-500">Science Total</div>
                      <div className="text-lg font-bold text-cyan-400">{civ.stats.science}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Science Yield</div>
                      <div className="text-lg font-bold text-cyan-300">{civ.stats.scienceYield}/action</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Libraries Built</span>
                      <span className="text-cyan-400 font-bold">{civ.buildings.libraries}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-slate-400">Library Bonus on Research</span>
                      <span className="text-cyan-300">+{(civ.buildings.libraries || 0) * 2} Science</span>
                    </div>
                  </div>
                </div>

                {/* Next Unlock Progress */}
                {(() => {
                  const nextUnlock = SCIENCE_UNLOCKS.find(u => u.level > civ.stats.science);
                  const prevLevel = SCIENCE_UNLOCKS.filter(u => u.level <= civ.stats.science).pop();
                  const prevThreshold = prevLevel ? prevLevel.level : 0;
                  const nextThreshold = nextUnlock ? nextUnlock.level : (prevLevel ? prevLevel.level : 100);
                  const range = nextThreshold - prevThreshold;
                  const progress = nextUnlock && range > 0
                    ? Math.min(100, ((civ.stats.science - prevThreshold) / range) * 100)
                    : 100;
                  return nextUnlock ? (
                    <div className="bg-slate-800 rounded-lg p-3 border border-cyan-900/50">
                      <div className="text-xs text-slate-400 mb-1">Next Unlock at Level {nextUnlock.level}</div>
                      <div className="text-sm font-medium text-cyan-200 mb-2">{nextUnlock.effect}</div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1 text-right">
                        {civ.stats.science} / {nextUnlock.level}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-cyan-900/20 rounded-lg p-3 border border-cyan-700/50 text-center">
                      <div className="text-sm font-bold text-cyan-300">All Technologies Unlocked!</div>
                      <div className="text-xs text-cyan-500 mt-1">Your civilization has reached peak scientific knowledge.</div>
                    </div>
                  );
                })()}

                {/* Unlock Tree */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                    Technology Tree
                  </h3>
                  {SCIENCE_UNLOCKS.map((unlock, i) => {
                    const isUnlocked = civ.stats.science >= unlock.level;
                    const isNext = !isUnlocked && (i === 0 || civ.stats.science >= SCIENCE_UNLOCKS[i - 1].level);
                    return (
                      <div
                        key={unlock.level}
                        className={`p-2.5 rounded-lg border transition-all ${
                          isUnlocked
                            ? "bg-cyan-900/30 border-cyan-700/60"
                            : isNext
                              ? "bg-slate-800 border-cyan-500/40 ring-1 ring-cyan-500/20"
                              : "bg-slate-800/50 border-slate-700/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isUnlocked ? (
                              <div className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center">
                                <Check size={12} className="text-white" />
                              </div>
                            ) : (
                              <div className={`w-5 h-5 rounded-full border-2 ${isNext ? "border-cyan-500" : "border-slate-600"}`} />
                            )}
                            <span className={`text-xs font-medium ${isUnlocked ? "text-cyan-200" : isNext ? "text-slate-200" : "text-slate-500"}`}>
                              {unlock.effect}
                            </span>
                          </div>
                          <span className={`text-xs font-bold ${isUnlocked ? "text-cyan-400" : "text-slate-600"}`}>
                            Lv.{unlock.level}
                          </span>
                        </div>
                        {unlock.statBonus && isUnlocked && (
                          <div className="mt-1 ml-7 text-xs text-cyan-400/80">
                            {Object.entries(unlock.statBonus).map(([stat, val]) => `+${val} ${stat}`).join(", ")}
                          </div>
                        )}
                        {unlock.unlocks && isUnlocked && (
                          <div className="mt-1 ml-7 text-xs text-emerald-400/80">
                            Unlocked: {unlock.unlocks.replace(/_/g, ' ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CULTURE TAB — explains what Culture unlocks and how to earn it. */}
            {activeTab === "culture" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Culture &amp; Legacy
                  </h2>
                  <button
                    onClick={() => setShowCultureTree(true)}
                    className="text-xs px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 rounded text-amber-200 font-semibold"
                  >
                    Open Culture Tree
                  </button>
                </div>

                {/* Current Stats Summary */}
                <div className="bg-slate-800 rounded-lg p-3 border border-pink-900/40">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-500">Culture Total</div>
                      <div className="text-lg font-bold text-pink-400">{civ.stats.culture}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Culture Yield</div>
                      <div className="text-lg font-bold text-pink-300">{civ.stats.cultureYield}/action</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Amphitheatres Built</span>
                      <span className="text-pink-400 font-bold">{civ.buildings.amphitheatres}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-slate-400">Bonus on Develop</span>
                      <span className="text-pink-300">+{(civ.buildings.amphitheatres || 0) * 2} Culture</span>
                    </div>
                  </div>
                </div>

                {/* Current Stage + next threshold */}
                {(() => {
                  const sorted = [...CULTURAL_STAGE_THRESHOLDS].sort((a, b) => a.minCulture - b.minCulture);
                  const current = sorted.filter(t => civ.stats.culture >= t.minCulture).pop();
                  const next = sorted.find(t => t.minCulture > civ.stats.culture);
                  const prevThreshold = current ? current.minCulture : 0;
                  const nextThreshold = next ? next.minCulture : prevThreshold;
                  const range = nextThreshold - prevThreshold;
                  const progress = next && range > 0
                    ? Math.min(100, ((civ.stats.culture - prevThreshold) / range) * 100)
                    : 100;
                  return (
                    <div className="bg-slate-800 rounded-lg p-3 border border-pink-900/40">
                      <div className="text-xs text-slate-400 mb-1">Current Stage</div>
                      <div className="text-base font-bold text-pink-300">{civ.culturalStage}</div>
                      {next ? (
                        <>
                          <div className="text-xs text-slate-500 mt-2 mb-1">Next: {next.stage} at {next.minCulture}</div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-pink-600 to-pink-400 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-slate-500 mt-1 text-right">
                            {civ.stats.culture} / {next.minCulture}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-pink-400 mt-2">Peak cultural stage reached.</div>
                      )}
                    </div>
                  );
                })()}

                {/* CULTURAL BONUSES CLAIMED — each stage offers a one-time
                    bonus choice via the Culture Tree modal. This block
                    shows which slots are filled and which are waiting. */}
                <div className="bg-slate-800 rounded-lg p-3 border border-amber-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest">Cultural Bonuses</h3>
                    <span className="text-xs text-slate-400">{chosenCultureIds.length} / 4 claimed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Classical', 'Imperial', 'Enlightenment', 'Modern'] as const).map((stage) => {
                      const threshold = CULTURAL_STAGE_THRESHOLDS.find((s) => s.stage === stage);
                      const reached = (civ.stats.culture || 0) >= (threshold?.minCulture || 0);
                      const claimed = chosenCultureIds
                        .map((id) => CULTURE_CHOICES.find((c) => c.id === id))
                        .find((c) => c && c.stage === stage);
                      return (
                        <div
                          key={stage}
                          className={`rounded border p-1.5 ${
                            claimed
                              ? 'bg-amber-500/15 border-amber-500/50'
                              : reached
                                ? 'bg-amber-500/5 border-amber-500/30'
                                : 'bg-slate-900/40 border-slate-700'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400 uppercase">{stage}</div>
                          <div className={`text-xs font-bold ${claimed ? 'text-amber-200' : reached ? 'text-amber-300' : 'text-slate-500'}`}>
                            {claimed ? claimed.label : reached ? 'Ready to claim' : `Locked (${threshold?.minCulture})`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(['Classical', 'Imperial', 'Enlightenment', 'Modern'] as const).some((stage) => {
                    const threshold = CULTURAL_STAGE_THRESHOLDS.find((s) => s.stage === stage);
                    const reached = (civ.stats.culture || 0) >= (threshold?.minCulture || 0);
                    const claimed = chosenCultureIds
                      .map((id) => CULTURE_CHOICES.find((c) => c.id === id))
                      .find((c) => c && c.stage === stage);
                    return reached && !claimed;
                  }) && (
                    <button
                      onClick={() => setShowCultureTree(true)}
                      className="w-full mt-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-900 text-xs font-bold rounded"
                    >
                      Claim pending bonus
                    </button>
                  )}
                </div>

                {/* Active Cultural Prestige (soft-power) */}
                <div className="bg-slate-800 rounded-lg p-3 border border-pink-900/40">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cultural Prestige</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                    A celebrated culture intimidates rivals and opens diplomatic doors.
                    Every <b className="text-pink-300">10 Culture</b> grants <b className="text-red-300">+1 Martial</b>,
                    and every <b className="text-pink-300">20 Culture</b> grants <b className="text-sky-300">+1 Diplomacy</b>.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/60 rounded px-2 py-1.5">
                      <div className="text-slate-500">Martial from Culture</div>
                      <div className="text-red-300 font-bold">+{Math.floor((civ.stats.culture || 0) / 10)}</div>
                    </div>
                    <div className="bg-slate-900/60 rounded px-2 py-1.5">
                      <div className="text-slate-500">Diplomacy from Culture</div>
                      <div className="text-sky-300 font-bold">+{Math.floor((civ.stats.culture || 0) / 20)}</div>
                    </div>
                  </div>
                </div>

                {/* Stage Ladder — all stages + their effects */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                    Stage Ladder
                  </h3>
                  {(() => {
                    const ladder: { stage: string; minCulture: number; flavor: string }[] = [
                      { stage: 'Barbarism', minCulture: 0, flavor: 'The starting stage. +50% Martial, +30% Fertility — but science, faith, and industry are reduced.' },
                      ...CULTURAL_STAGE_THRESHOLDS,
                    ];
                    return ladder.map((entry) => {
                      const stageKey = entry.stage.toLowerCase() as keyof typeof CULTURAL_STAGE_MULTIPLIERS;
                      const mults = CULTURAL_STAGE_MULTIPLIERS[stageKey];
                      const isReached = (civ.stats.culture || 0) >= entry.minCulture;
                      const isCurrent = civ.culturalStage === entry.stage;
                      return (
                        <div
                          key={entry.stage}
                          className={`p-2.5 rounded-lg border transition-all ${
                            isCurrent
                              ? 'bg-pink-900/30 border-pink-500/60 ring-1 ring-pink-500/20'
                              : isReached
                                ? 'bg-pink-900/10 border-pink-800/40'
                                : 'bg-slate-800/50 border-slate-700/50 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isCurrent ? 'text-pink-300' : isReached ? 'text-pink-200/80' : 'text-slate-400'}`}>
                              {entry.stage}
                            </span>
                            <span className={`text-xs font-bold ${isReached ? 'text-pink-400' : 'text-slate-600'}`}>
                              {entry.minCulture === 0 ? 'start' : `${entry.minCulture}+`}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400 leading-relaxed">{entry.flavor}</div>
                          {mults && (
                            <div className="mt-1 text-[11px] text-pink-300/80">
                              {Object.entries(mults)
                                .filter(([, v]) => v !== 1.0)
                                .map(([k, v]) => `${(v as number) >= 1 ? '+' : ''}${Math.round(((v as number) - 1) * 100)}% ${k}`)
                                .join(' · ')}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* How to earn culture */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">How to Earn Culture</h3>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li><b className="text-pink-300">Develop</b> action — adds your Culture Yield + 2 per Amphitheatre.</li>
                    <li><b className="text-pink-300">Amphitheatres</b> — each gives +3 base Culture and +2 yield on Develop.</li>
                    <li><b className="text-pink-300">Wonders</b> — most grant flat Culture bonuses (Oracle +10, Pyramids +5, etc.).</li>
                    <li><b className="text-pink-300">Religion tenets</b> — Philosophy, Universal Faith, Scriptures.</li>
                    <li><b className="text-pink-300">Science unlocks</b> — Writing, Philosophy, Printing Press.</li>
                    <li><b className="text-pink-300">Cultural treaties</b> — +2 Culture per active treaty.</li>
                    <li><b className="text-pink-300">Creativity trait</b> — doubles Culture output.</li>
                  </ul>
                </div>

                <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-700/40">
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">Scoring Contribution</h3>
                  <p className="text-[11px] text-amber-100/80 leading-relaxed">
                    Culture feeds the <b>Legacy</b> score track: your Culture Total, +8 per Wonder, stage bonuses (Classical 10 · Imperial 20 · Enlightenment 35 · Modern 50), and +2 per Amphitheatre.
                  </p>
                </div>
              </div>
            )}

            {/* WORLD / ADJACENCY TAB */}
            {activeTab === "world" && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Adjacent Civilizations
                </h2>
                <p className="text-xs text-slate-500 mb-3">
                  These civilizations border your territory. You can trade,
                  declare war, or spread religion to them.
                </p>
                {getAdjacentCivs(civ.presetId).map((adjCivId) => {
                  const adjPreset = CIV_PRESETS.find((c) => c.id === adjCivId);
                  if (!adjPreset) return null;
                  const neighbor = gameState.neighbors.find(
                    (n) => n.id === adjCivId || n.name === adjPreset.name,
                  );
                  const relationship = neighbor?.relationship || "Neutral";
                  const isConquered = neighbor?.isConquered || false;
                  return (
                    <div
                      key={adjCivId}
                      className={`p-3 rounded-lg border transition-all ${
                        isConquered
                          ? "bg-slate-900 border-slate-800 opacity-50"
                          : relationship === "Ally"
                            ? "bg-emerald-900/20 border-emerald-700/50"
                            : relationship === "Enemy"
                              ? "bg-red-900/20 border-red-700/50"
                              : "bg-slate-800 border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-4 h-4 rounded-full border-2"
                          style={{
                            backgroundColor: adjPreset.colors.base,
                            borderColor: adjPreset.colors.accent,
                          }}
                        />
                        <span className="font-bold text-sm flex-1">
                          {adjPreset.name}
                        </span>
                        {relationship === "Ally" && (
                          <span className="text-xs bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full">
                            Ally
                          </span>
                        )}
                        {relationship === "Enemy" && (
                          <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded-full">
                            At War
                          </span>
                        )}
                        {isConquered && (
                          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                            Fallen
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mb-2">
                        Regions: {adjPreset.regions.join(", ")}
                      </div>
                      {neighbor && (
                        <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                          <span className="text-red-400">
                            Martial: {neighbor.martial + (neighbor.defense || 0)}
                          </span>
                          <span className="text-purple-400">
                            Faith: {neighbor.faith}
                          </span>
                        </div>
                      )}
                      {!isConquered && (
                        <div className="flex flex-col gap-2 mt-2">
                          {/* Attack is ONLY available through the Action phase
                              modal so combat flows through the V2 resolution
                              system. The side panel shows a hint instead of a
                              button to avoid the old V1 fire-and-forget flow
                              that bypassed turn resolution. */}
                          {gameState.gameFlags.warUnlocked &&
                            relationship !== "Ally" &&
                            neighbor && (
                              <div className="text-[11px] text-red-300/70 italic px-1">
                                To attack {adjPreset.name}, pick <b>Attack</b> during the Action phase of your next turn.
                              </div>
                            )}
                          <div className="flex gap-2">
                            {relationship !== "Ally" && neighbor && (
                              <button
                                onClick={() => formAlliance(neighbor.id)}
                                disabled={civ.stats.diplomacy < 1}
                                className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                <Handshake size={12} /> Ally
                              </button>
                            )}
                            {civ.religion.name && neighbor && (
                              <button
                                onClick={() => spreadReligion(neighbor.id)}
                                disabled={neighbor.religion === civ.religion.name}
                                className="flex-1 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                <Star size={12} /> Convert
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {getAdjacentCivs(civ.presetId).length === 0 && (
                  <div className="p-4 bg-slate-800/50 text-center text-sm text-slate-500 italic border border-slate-700 rounded">
                    No adjacent civilizations defined.
                  </div>
                )}
              </div>
            )}

            {/* WONDERS TAB */}
            {activeTab === "wonders" && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Great Wonders
                </h2>
                {WONDERS_LIST.map((w) => {
                  const locked = gameState.year < w.minYear;
                  const built = civ.builtWonderId === w.id;
                  const affordable = (civ.stats.productionPool || 0) >= w.cost;
                  return (
                    <div
                      key={w.id}
                      className={`p-3 rounded-lg border bg-slate-800 ${built ? "border-amber-500" : "border-slate-700"} relative overflow-hidden`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm">{w.name}</span>
                        <span className="text-xs font-mono text-amber-400">
                          {w.cost} Prod
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mb-2">
                        {w.effects}
                      </div>
                      {built ? (
                        <div className="text-xs text-amber-500 font-bold flex items-center gap-1">
                          <Check size={12} /> Constructed
                        </div>
                      ) : (
                        <button
                          disabled={
                            locked || !affordable || !!civ.builtWonderId
                          }
                          onClick={() => buildWonder(w)}
                          className="w-full py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {locked
                            ? `Unlocks ${Math.abs(w.minYear)} BCE`
                            : !affordable
                              ? "Need Production"
                              : civ.builtWonderId
                                ? "Max 1 Wonder"
                                : "Build"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* RELIGION TAB */}
            {activeTab === "religion" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Theology
                  </h2>
                  <button
                    onClick={() => setShowReligionTree(true)}
                    className="text-xs px-2 py-1 bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/50 rounded text-violet-200 font-semibold"
                  >
                    Open Religion Tree
                  </button>
                </div>
                {!civ.flags.religionFound ? (
                  <div className="p-4 bg-slate-800 rounded border border-slate-700 text-center">
                    <p className="text-sm text-slate-300 mb-3">
                      Found a religion to guide your people.
                    </p>
                    {civ.flags.israelBonus && (
                      <p className="text-xs text-amber-400 mb-2">
                        Israel Bonus: Pick 3 Tenets
                      </p>
                    )}
                    <div className="space-y-1 text-xs text-slate-500 mb-4">
                      <div
                        className={
                          gameState.year >= -1000 ||
                          gameState.gameFlags.religionUnlocked
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        • Year 1000 BCE
                      </div>
                      <div
                        className={
                          civ.stats.faith >= 10
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        • 10 Faith
                      </div>
                      <div
                        className={
                          civ.buildings.temples >= 1
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        • 1 Temple
                      </div>
                    </div>
                    {RELIGION_TENETS.map(
                      (t) =>
                        !civ.religion.tenets.includes(t.id) && (
                          <button
                            key={t.id}
                            onClick={() => foundReligion(t.id, "My Religion")}
                            className="w-full mb-2 p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-left"
                          >
                            <div className="font-bold text-amber-400">
                              {t.name}
                            </div>
                            <div className="text-slate-400">
                              {t.description}
                            </div>
                          </button>
                        ),
                    )}
                    {civ.religion.tenets.length > 0 && (
                      <div className="text-xs text-white mt-2">
                        Selected: {civ.religion.tenets.length}/
                        {civ.flags.israelBonus ? 3 : 1}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800 rounded border border-slate-700">
                    <div className="text-center mb-4">
                      <Star className="mx-auto text-amber-500 mb-2" />
                      <h3 className="font-bold text-lg">{civ.religion.name}</h3>
                      <div className="text-xs text-slate-400">
                        Founded {Math.abs(gameState.year)} {gameState.year < 0 ? "BCE" : "CE"}
                      </div>
                    </div>

                    {/* TENET SLOT PROGRESSION — shows the three faith
                        thresholds (10, 25, 50) so students see when the
                        next tenet unlocks. This matches the Religion Tree
                        modal's pick-as-you-grow design. */}
                    {(() => {
                      const slots = RELIGION_TENET_THRESHOLDS;
                      const faith = civ.stats.faith || 0;
                      const picked = civ.religion.tenets.length;
                      return (
                        <div className="mb-4 bg-slate-900/60 rounded p-2 border border-violet-900/40">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-slate-400">Tenets Adopted</span>
                            <span className="text-violet-300 font-bold">{picked} / {slots.length}</span>
                          </div>
                          <div className="flex gap-1">
                            {slots.map((t, i) => {
                              const unlocked = faith >= t;
                              const adopted = i < picked;
                              return (
                                <div
                                  key={t}
                                  className={`flex-1 text-center rounded px-1 py-1 text-[10px] border ${
                                    adopted
                                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                                      : unlocked
                                        ? 'bg-violet-500/10 border-violet-500/50 text-violet-300'
                                        : 'bg-slate-800 border-slate-700 text-slate-500'
                                  }`}
                                >
                                  <div>Slot {i + 1}</div>
                                  <div className="opacity-80">Faith {t}{adopted ? ' ✓' : unlocked ? ' open' : ''}</div>
                                </div>
                              );
                            })}
                          </div>
                          {faith >= slots[picked] && picked < slots.length && (
                            <button
                              onClick={() => setShowReligionTree(true)}
                              className="w-full mt-2 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded"
                            >
                              Pick tenet #{picked + 1}
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    <div className="space-y-2">
                      {civ.religion.tenets.map((tid) => (
                        <div
                          key={tid}
                          className="text-sm p-2 bg-slate-900 rounded border border-slate-700"
                        >
                          <span className="text-amber-500 font-bold">
                            {RELIGION_TENETS.find((t) => t.id === tid)?.name}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">
                            {
                              RELIGION_TENETS.find((t) => t.id === tid)
                                ?.description
                            }
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <h3 className="text-xs font-bold text-slate-500 mb-2">
                        Spread Faith
                      </h3>
                      {gameState.neighbors.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => spreadReligion(n.id)}
                          disabled={n.religion === civ.religion.name}
                          className="w-full p-2 mb-1 bg-slate-700 hover:bg-slate-600 text-xs rounded flex justify-between disabled:opacity-50"
                        >
                          <span>{n.name}</span>
                          {n.religion === civ.religion.name ? (
                            <span className="text-green-400 flex items-center gap-1">
                              <Check size={12} /> Converted
                            </span>
                          ) : (
                            <span className="text-amber-300">
                              {n.faith} Faith
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WAR TAB */}
            {activeTab === "war" && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  War Room
                </h2>

                {/* Conquest progress summary */}
                <div className="bg-slate-800 rounded-lg p-3 border border-red-900/40">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Conquered</div>
                      <div className="text-xl font-bold text-red-400">
                        {gameState.conqueredTerritories || 0}<span className="text-sm text-slate-500"> / 5</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Battles Won</div>
                      <div className="text-xl font-bold text-orange-300">
                        {gameState.warsWon || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Martial</div>
                      <div className="text-xl font-bold text-red-300">
                        {civ.stats.martial}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-600 to-red-400 h-2 transition-all"
                      style={{ width: `${Math.min(100, ((gameState.conqueredTerritories || 0) / 6) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 italic">
                    Each <b className="text-red-300">decisive conquest</b> (margin ≥ 6) is worth <b className="text-red-300">+8 Conquest points</b> toward your Final Score. Non-decisive wins still score +2 each.
                  </p>
                </div>

                {/* DEFENSE POSTURE — shows the dice pool the civ actually
                    rolls on raids and incoming attacks. Walls (up to 3d8)
                    + Fortify stacks (up to 3d8) stack on top of base
                    Martial + d6. Students need this live. */}
                <div className="bg-slate-800 rounded-lg p-3 border border-sky-900/40">
                  <h3 className="text-xs font-bold text-sky-300 uppercase tracking-widest mb-2">Defense Posture</h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                    <div className="bg-slate-900/60 rounded px-2 py-1.5">
                      <div className="text-slate-500">Base</div>
                      <div className="text-red-300 font-bold">Martial + d6</div>
                    </div>
                    <div className="bg-slate-900/60 rounded px-2 py-1.5">
                      <div className="text-slate-500">Walls</div>
                      <div className="text-stone-300 font-bold">
                        {Math.min(3, civ.buildings.walls || 0)}d8 <span className="text-slate-500 text-[10px]">/ 3</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 rounded px-2 py-1.5">
                      <div className="text-slate-500">Fortify</div>
                      <div className="text-emerald-300 font-bold">
                        {civ.stats.fortifyDice || 0}d8 <span className="text-slate-500 text-[10px]">/ 3</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Fortify Dice decay by 1 each turn. Keep fortifying to hold your posture. Siege Engineering (Science 30) lets attackers bypass Wall dice but not Fortify.
                  </p>
                </div>

                {/* Neighbors roster */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Adjacent Civs</h3>
                  <div className="space-y-2">
                    {gameState.neighbors.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded border text-xs ${n.isConquered ? "bg-slate-900 border-slate-800 opacity-60" : n.relationship === "Ally" ? "bg-slate-800 border-blue-500" : "bg-slate-800 border-red-900/50"}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-slate-200">{n.name}</span>
                          <div className="flex gap-1">
                            {n.isConquered && <span className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded">CONQUERED</span>}
                            {n.relationship === "Ally" && <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded">ALLY</span>}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-400">
                          <span>
                            Strength <b className="text-red-300">{n.martial + n.defense}</b>
                            <span className="mx-1 text-slate-600">·</span>
                            Faith <b className="text-amber-300">{n.faith}</b>
                          </span>
                          {!n.isConquered && n.relationship !== "Ally" && (
                            <button
                              onClick={() => formAlliance(n.id)}
                              disabled={civ.stats.diplomacy < 1}
                              className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1 disabled:opacity-40 disabled:no-underline"
                            >
                              <Handshake size={10} /> Ally
                            </button>
                          )}
                        </div>
                        {!n.isConquered && n.relationship !== "Ally" && (
                          <div className="mt-1.5 text-[10px] text-red-300/70 italic">
                            To attack, use the Action phase · vs your Martial {civ.stats.martial} (need margin +6 for Decisive)
                          </div>
                        )}
                        {!n.isConquered && n.relationship === "Ally" && (
                          <button
                            onClick={() => tradeWithNeighbor(n.id)}
                            disabled={civ.stats.industry < 2 || gameState.tradedThisTurn.includes(n.id)}
                            className="w-full mt-1.5 py-1.5 bg-green-700 hover:bg-green-600 text-white text-[11px] font-bold rounded disabled:opacity-50"
                          >
                            {gameState.tradedThisTurn.includes(n.id) ? "TRADED THIS TURN" : "TRADE"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Combat log */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Battle History</h3>
                  {(gameState.combatLog && gameState.combatLog.length > 0) ? (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {[...gameState.combatLog].reverse().map((entry, i) => {
                        const colorMap: Record<CombatLogEntry['outcome'], { bg: string; text: string; label: string }> = {
                          decisive_victory: { bg: 'bg-emerald-900/30 border-emerald-600/40', text: 'text-emerald-300', label: 'DECISIVE' },
                          victory:          { bg: 'bg-green-900/20 border-green-700/40',     text: 'text-green-300',   label: 'VICTORY' },
                          stalemate:        { bg: 'bg-slate-800 border-slate-700',           text: 'text-slate-300',   label: 'STALEMATE' },
                          defeat:           { bg: 'bg-red-900/30 border-red-700/40',        text: 'text-red-300',     label: 'DEFEAT' },
                        };
                        const c = colorMap[entry.outcome];
                        return (
                          <div key={i} className={`rounded border px-2 py-1.5 ${c.bg}`}>
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-bold">Turn {entry.turn} vs {entry.target}</span>
                              <span className={`text-[9px] font-bold ${c.text}`}>{c.label}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Margin {entry.margin > 0 ? '+' : ''}{entry.margin}
                              {entry.conquered && <span className="ml-2 text-emerald-300 font-bold">· conquered</span>}
                              {entry.loot?.culture ? <span className="ml-2">· +{entry.loot.culture} Culture</span> : ''}
                              {entry.loot?.production ? <span className="ml-2">· +{entry.loot.production} Prod</span> : ''}
                              {(entry.popLost ?? 0) > 0 ? <span className="ml-2 text-red-300">· -{entry.popLost} Pop</span> : ''}
                              {(entry.martialLost ?? 0) > 0 ? <span className="ml-2 text-red-300">· -{entry.martialLost} Martial</span> : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic bg-slate-800/50 border border-slate-700 rounded p-3 text-center">
                      No battles yet. Launch your first Attack via the Action phase.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DIPLOMACY TAB — student-to-student trading and relations.
                Students can propose resource trades, accept/reject incoming
                offers, cancel their own outstanding offers, and declare
                relation state (neutral/treaty/alliance/hostile) with each
                classmate. Teachers see the full period overview. Solo/offline
                mode renders a compact placeholder. */}
            {activeTab === "diplomacy" && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Diplomacy &amp; Trade
                </h2>
                <p className="text-[11px] text-slate-400 leading-relaxed -mt-1">
                  Negotiate with other civilizations in your period. Propose trades of production, science, culture, or faith. Declare alliances, treaties, or hostilities.
                </p>
                <DiplomacyPanel
                  periodId={syncState.periodId}
                  currentTurn={gameState.turnNumber || 1}
                  onAttackResolved={(r) => {
                    // Apply PvP combat deltas to local civ state.
                    // Effects shape: { warsWon?, culture?, science?, martial?, populationPct? }
                    // Negative values subtract. populationPct is a fraction like -0.06.
                    setGameState((prev) => {
                      const stats = { ...prev.civilization.stats };
                      const eff = r.effects || {};
                      if (typeof eff.culture === 'number') {
                        stats.culture = Math.max(0, (stats.culture || 0) + eff.culture);
                      }
                      if (typeof eff.science === 'number') {
                        stats.science = Math.max(0, (stats.science || 0) + eff.science);
                      }
                      if (typeof eff.populationPct === 'number') {
                        stats.population = Math.max(1, Math.floor((stats.population || 0) * (1 + eff.populationPct)));
                      }
                      // Build a human-readable combat log entry so the player
                      // sees the PvP result next to the NPC combat history.
                      const logLine = `${r.isAttacker ? 'You attacked' : 'Attacked by'} ${r.opponentName} — ${r.outcome.replace('_',' ')} (Atk ${r.rolls.attackTotal} vs Def ${r.rolls.defendTotal})`;
                      return {
                        ...prev,
                        warsWon: (prev.warsWon || 0) + (eff.warsWon || 0),
                        civilization: { ...prev.civilization, stats },
                        messages: [logLine, ...prev.messages].slice(0, 50),
                      };
                    });
                  }}
                />
              </div>
            )}

            {/* SCOREBOARD TAB — live scoring across all four thematic tracks.
                Highest total at turn 24 wins overall; highest per-track
                wins Track Champion. No threshold victory: every civ plays
                the full 24 turns, so scores are cumulative points, not
                targets to race toward. */}
            {activeTab === "scoreboard" && (() => {
              // Build a state shape that matches what the recipe callbacks expect.
              const vState = {
                tiles,
                warsWon: gameState.warsWon,
                conqueredTerritories: gameState.conqueredTerritories,
                religionSpread: gameState.religionSpread,
                wondersBuilt: gameState.wondersBuilt,
                civilization: gameState.civilization,
              };
              const trackKeys = ['conquest', 'innovation', 'legacy', 'faith'] as const;
              const scores = trackKeys.map((key) => {
                const track = SCORING_TRACKS[key];
                const score = track.calculate(vState);
                return { key, track, score };
              });
              // Highest-scoring track is this civ's "strongest lane"; we
              // highlight it so students can see where their strategy is paying off.
              const leader = scores.reduce((a, b) => b.score > a.score ? b : a);
              const finalScore = calculateFinalScore(vState);
              return (
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Scoreboard
                  </h2>
                  <p className="text-[11px] text-slate-400 leading-relaxed -mt-1">
                    Four scoring tracks. The highest total at the end of turn 24 wins overall. The highest score in each track earns a <b className="text-yellow-300">Track Champion</b> award. Specialize, diversify, or do both.
                  </p>

                  {/* TOTAL SCORE HEADER — the big number students check first */}
                  <div className="bg-gradient-to-br from-yellow-900/30 via-slate-800 to-slate-800 rounded-lg p-3 border border-yellow-700/40">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Final Score</div>
                        <div className="text-[10px] text-slate-500">Strongest lane: <span className="text-slate-300">{leader.track.name}</span></div>
                      </div>
                      <div className="text-3xl font-bold text-yellow-300">{finalScore.total}</div>
                    </div>
                    {finalScore.milestones > 0 && (
                      <div className="mt-2 pt-2 border-t border-yellow-900/30 flex justify-between text-[10px]">
                        <span className="text-slate-400">Milestone bonuses</span>
                        <span className="text-yellow-300 font-bold">+{finalScore.milestones}</span>
                      </div>
                    )}
                  </div>

                  {/* LIVE LEADERBOARD — polls the server every 10s for all
                      civs in this period and shows rank + total + top lane.
                      Offline/solo mode renders a compact placeholder so the
                      layout stays consistent. */}
                  <LiveLeaderboard periodId={syncState.periodId} />

                  {scores.map(({ key, track, score }) => {
                    const pct = Math.min(100, Math.round((score / track.benchmark) * 100));
                    const isLeader = leader.key === key;
                    const atBenchmark = score >= track.benchmark;
                    const recipe = track.recipe(vState);
                    const barColor = track.color === 'red'   ? 'from-red-600 to-red-400'
                                  : track.color === 'cyan'   ? 'from-cyan-600 to-cyan-400'
                                  : track.color === 'pink'   ? 'from-pink-600 to-pink-400'
                                  : 'from-amber-600 to-amber-400';
                    const borderColor = isLeader
                      ? 'border-yellow-500/50 ring-1 ring-yellow-500/20'
                      : atBenchmark
                        ? 'border-emerald-500/40'
                        : 'border-slate-700';
                    return (
                      <div key={key} className={`bg-slate-800 rounded-lg p-3 border ${borderColor}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {key === 'conquest'   && <Sword size={16} className="text-red-400" />}
                            {key === 'innovation' && <FlaskConical size={16} className="text-cyan-400" />}
                            {key === 'legacy'     && <Landmark size={16} className="text-pink-400" />}
                            {key === 'faith'      && <Scroll size={16} className="text-amber-400" />}
                            <span className="text-sm font-bold text-slate-100">{track.name}</span>
                            {isLeader && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/60 text-yellow-300 border border-yellow-700/50">YOUR LANE</span>}
                            {atBenchmark && !isLeader && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/40">ON PACE</span>}
                          </div>
                          <span className="text-xs font-bold text-slate-300">{score} <span className="text-slate-500 font-normal">pts</span></span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{track.description}</p>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div className={`bg-gradient-to-r ${barColor} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 text-right">Benchmark: {track.benchmark} pts · {pct}%</div>
                        <div className="mt-2 pt-2 border-t border-slate-700 space-y-0.5">
                          {recipe.map((r, i) => (
                            <div key={i} className="flex justify-between items-baseline text-[11px]">
                              <span className="text-slate-300">
                                {r.label}
                                <span className="text-slate-500 ml-1">× {r.value}</span>
                              </span>
                              <span className={`font-bold ${r.points > 0 ? 'text-slate-200' : 'text-slate-600'}`}>
                                +{r.points}
                              </span>
                            </div>
                          ))}
                          <div className="text-[9px] text-slate-500 italic pt-1">
                            {recipe.map(r => r.formula).join(' · ')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700 text-[11px] text-slate-400 leading-relaxed">
                    <b className="text-slate-200">How scoring works:</b> the game runs all 24 turns. Your Final Score is the sum of all four tracks plus milestone bonuses (first wonder, deep research, reaching Modern, etc.). The highest total wins overall. The civ with the most points in any single track earns that lane's Track Champion award — so specialists stay honored even if they lose the grand total.
                  </div>
                </div>
              );
            })()}
          </div>

          {/* MESSAGE LOG (Fixed at bottom of panel) */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 h-32 overflow-y-auto">
            {gameState.messages.map((msg, i) => (
              <div
                key={i}
                className="mb-1 pb-1 border-b border-slate-900 last:border-0"
              >
                <span className="text-slate-600 mr-2">{">"}</span>
                {msg}
              </div>
            ))}
          </div>
        </aside>

        {/* MOBILE BOTTOM BAR - visible only on small screens */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-700 flex">
          <button
            onClick={() => setShowPanel(showPanel === "stats" ? null : "stats")}
            className={`flex-1 py-4 text-center text-sm font-bold transition-colors ${showPanel === "stats" ? "text-amber-400 bg-slate-800" : "text-slate-400"}`}
          >
            Stats
          </button>
          <button
            onClick={() =>
              setShowPanel(showPanel === "actions" ? null : "actions")
            }
            className={`flex-1 py-4 text-center text-sm font-bold transition-colors ${showPanel === "actions" ? "text-amber-400 bg-slate-800" : "text-slate-400"}`}
          >
            Actions
          </button>
        </div>

        {/* MOBILE PANEL OVERLAY - visible on small screens when showPanel is set */}
        {showPanel && (
          <div className="md:hidden fixed inset-x-0 bottom-[52px] z-30 bg-slate-900 border-t border-slate-700 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {showPanel === "stats" && (
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-orange-400 flex items-center gap-2">
                      <Home size={14} /> Houses (
                      {civ.flags.housesSupportTwoPop ? "2x" : "1x"} Pop)
                    </span>
                    <span>
                      {civ.stats.houses}/{civ.stats.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full"
                      style={{
                        width: `${(civ.stats.houses / civ.stats.capacity) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 text-right">
                    Built this turn: {civ.stats.housesBuiltThisTurn}/
                    {civ.stats.fertility}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <div className="text-xs text-slate-400">Industry</div>
                    <div className="text-lg font-bold text-amber-400">
                      {civ.stats.industryLeft}
                    </div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <div className="text-xs text-slate-400">Fertility</div>
                    <div className="text-lg font-bold text-green-400">
                      {civ.stats.fertility}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span
                      className="text-red-400"
                      title="Your offensive fighting power. Used to attack other civilizations."
                    >
                      Martial
                    </span>
                    <b>{civ.stats.martial}</b>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span
                      className="text-yellow-400"
                      title="Spiritual power. Build temples and found religions."
                    >
                      Faith
                    </span>
                    <b>{civ.stats.faith}</b>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span
                      className="text-pink-400"
                      title="Arts and customs. Determines your cultural stage."
                    >
                      Culture
                    </span>
                    <b>{civ.stats.culture}</b>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span
                      className="text-purple-400"
                      title="Technological advancement. Unlocks new abilities at higher levels."
                    >
                      Science
                    </span>
                    <b>{civ.stats.science}</b>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span
                      className="text-cyan-400"
                      title="Ability to form alliances and conduct trade."
                    >
                      Diplomacy
                    </span>
                    <b>{civ.stats.diplomacy}</b>
                  </div>
                  {/* DEFENSE DICE — always visible so students know their
                      current posture at a glance. Format: "1d8 walls +
                      2d8 fortify" rolled on each defense check. */}
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span
                      className="text-sky-300"
                      title="Extra d8 dice rolled on every defense (raids + incoming attacks). Walls grant up to 3d8 passively; Fortify action stacks up to 3d8 and decays 1/turn."
                    >
                      Defense Dice
                    </span>
                    <b className="text-sky-200">
                      {Math.min(3, civ.buildings.walls || 0) + (civ.stats.fortifyDice || 0)}d8
                      <span className="text-[10px] text-slate-500 ml-1">
                        ({Math.min(3, civ.buildings.walls || 0)}W+{civ.stats.fortifyDice || 0}F)
                      </span>
                    </b>
                  </div>
                </div>
                {civ.religion.name && (
                  <div className="p-4 bg-yellow-900/20 rounded border border-yellow-700/30">
                    <div className="text-xs text-yellow-500 uppercase font-bold">
                      State Religion
                    </div>
                    <div className="text-sm font-bold text-yellow-100">
                      {civ.religion.name}
                    </div>
                  </div>
                )}
              </div>
            )}
            {showPanel === "actions" && (
              <div className="p-4 flex-1 overflow-y-auto">
                {/* BUILD TAB CONTENT */}
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Structures
                  </h2>
                  <button
                    onClick={() =>
                      setGameState((p) => ({
                        ...p,
                        selectedAction: BuildingType.House,
                      }))
                    }
                    className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 min-h-[48px] ${gameState.selectedAction === BuildingType.House ? "bg-orange-900/30 border-orange-500" : "bg-slate-800 border-slate-700"}`}
                  >
                    <div className="p-2 bg-orange-600 rounded text-white">
                      <Home size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">House</div>
                      <div className="text-xs text-slate-400">
                        Cost: Fertility (
                        {civ.stats.fertility - civ.stats.housesBuiltThisTurn}{" "}
                        left)
                      </div>
                    </div>
                  </button>
                  <button
                    disabled={civ.stats.industryLeft < 10}
                    onClick={() =>
                      setGameState((p) => ({
                        ...p,
                        selectedAction: BuildingType.Temple,
                      }))
                    }
                    className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 min-h-[48px] ${gameState.selectedAction === BuildingType.Temple ? "bg-blue-900/30 border-blue-500" : "bg-slate-800 border-slate-700"} ${civ.stats.industryLeft < 10 ? "opacity-50" : ""}`}
                  >
                    <div className="p-2 bg-blue-600 rounded text-white">
                      <Landmark size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Temple</div>
                      <div className="text-xs text-slate-400">Cost: 10 Prod</div>
                    </div>
                  </button>
                  <button
                    disabled={civ.stats.industryLeft < 10}
                    onClick={() =>
                      setGameState((p) => ({
                        ...p,
                        selectedAction: BuildingType.Wall,
                      }))
                    }
                    className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 min-h-[48px] ${gameState.selectedAction === BuildingType.Wall ? "bg-slate-700 border-slate-400" : "bg-slate-800 border-slate-700"} ${civ.stats.industryLeft < 10 ? "opacity-50" : ""}`}
                  >
                    <div className="p-2 bg-slate-500 rounded text-white">
                      <BrickWall size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Wall</div>
                      <div className="text-xs text-slate-400">Cost: 10 Prod</div>
                    </div>
                  </button>
                  <button
                    disabled={civ.stats.industryLeft < 10}
                    onClick={() =>
                      setGameState((p) => ({
                        ...p,
                        selectedAction: BuildingType.Amphitheatre,
                      }))
                    }
                    className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 min-h-[48px] ${gameState.selectedAction === BuildingType.Amphitheatre ? "bg-pink-900/30 border-pink-500" : "bg-slate-800 border-slate-700"} ${civ.stats.industryLeft < 10 ? "opacity-50" : ""}`}
                  >
                    <div className="p-2 bg-pink-600 rounded text-white">
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Amphitheatre</div>
                      <div className="text-xs text-slate-400">Cost: 10 Prod</div>
                    </div>
                  </button>
                  <button
                    disabled={
                      civ.stats.industryLeft < 20 || civ.stats.science < 30
                    }
                    onClick={() =>
                      setGameState((p) => ({
                        ...p,
                        selectedAction: BuildingType.ArchimedesTower,
                      }))
                    }
                    className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 min-h-[48px] ${gameState.selectedAction === BuildingType.ArchimedesTower ? "bg-purple-900/30 border-purple-500" : "bg-slate-800 border-slate-700"} ${civ.stats.industryLeft < 20 || civ.stats.science < 30 ? "opacity-50" : ""}`}
                  >
                    <div className="p-2 bg-purple-600 rounded text-white">
                      <TowerControl size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Archimedes Tower</div>
                      <div className="text-xs text-slate-400">
                        Cost: 20 Prod, 30 Sci
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
              