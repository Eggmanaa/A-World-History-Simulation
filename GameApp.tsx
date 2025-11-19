
import React, { useState, useEffect } from 'react';
import { 
    Home, Users, Warehouse, Sprout, Hammer, Sword, Shield, 
    FlaskConical, Palette, Scroll, History, Play, BrickWall, Landmark, Star, Crown, X, Check, Handshake, TowerControl
} from 'lucide-react';
import MapScene from './components/MapScene';
import { generateMap, CIV_PRESETS, TIMELINE_EVENTS, WONDERS_LIST, RELIGION_TENETS, GENERATE_NEIGHBORS } from './constants';
import { TileData, TerrainType, BuildingType, BUILDING_COSTS, TERRAIN_BONUSES, GameState, CivPreset, WATER_CAPACITIES, WonderDefinition, TimelineEventAction, StatKey, NeighborCiv } from './types';

// --- HELPER LOGIC ---

const checkSavingThrow = (civ: GameState['civilization'], trait?: string, stat?: StatKey, dc?: number): boolean => {
    if (!trait && !stat) return true; // No check required
    
    // 1. Trait Check (Auto-pass)
    if (trait) {
        const normalizedTrait = trait.toLowerCase();
        if (civ.traits.some(t => t.toLowerCase() === normalizedTrait)) {
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

const calculateStats = (tiles: TileData[], civData: any, activeBonuses: any, neighbors: NeighborCiv[]) => {
    // 1. Terrain Bonuses
    const terrainTypes = new Set(tiles.map(t => t.terrain));
    let terrainDefense = 0;
    let terrainIndustry = 0;
    
    terrainTypes.forEach(t => {
        const bonus = TERRAIN_BONUSES[t];
        if (bonus) {
            terrainDefense += bonus.defense;
            terrainIndustry += bonus.industry;
        }
    });
    
    if (civData.isIsland) terrainDefense += 7;

    // 2. Building Bonuses
    const buildings = tiles.map(t => t.building).filter(b => b !== BuildingType.None);
    let buildingDefense = 0;
    let buildingFaith = 0;
    let buildingCulture = 0;

    buildings.forEach(b => {
        if (b === BuildingType.Wall) {
            // Troy Bonus: Double wall effectiveness
            buildingDefense += (civData.flags.troyWallDouble ? 2 : 1);
        }
        if (b === BuildingType.Temple) buildingFaith += 2;
        if (b === BuildingType.Amphitheatre) {
            buildingCulture += 3;
            buildingFaith = Math.max(0, buildingFaith - 1);
        }
        if (b === BuildingType.ArchimedesTower) {
            buildingDefense += 20;
        }
    });

    // Wonder Bonuses
    if (civData.builtWonderId) {
        const wonder = WONDERS_LIST.find(w => w.id === civData.builtWonderId);
        if (wonder && wonder.bonus) {
            if (wonder.bonus.defense) buildingDefense += wonder.bonus.defense;
            if (wonder.bonus.faith) buildingFaith += wonder.bonus.faith;
            if (wonder.bonus.culture) buildingCulture += wonder.bonus.culture;
        }
    }

    // 3. Base + Multipliers
    let martial = civData.baseStats.martial;
    let defense = civData.baseStats.defense + terrainDefense + buildingDefense;
    let faith = civData.baseStats.faith + buildingFaith;
    let culture = civData.stats.culture + buildingCulture;
    let science = civData.stats.science;
    let fertility = civData.baseStats.fertility;
    let industry = civData.baseStats.industry + terrainIndustry;
    let diplomacy = civData.stats.diplomacy || 0;

    // Apply Religion Tenets
    if (civData.religion && civData.religion.tenets && civData.religion.tenets.length > 0) {
        const tenets = civData.religion.tenets;
        
        if (tenets.includes('monotheism')) {
            faith += 5;
        }
        if (tenets.includes('polytheism')) {
            // +2 Faith per temple
            const templeCount = tiles.filter(t => t.building === BuildingType.Temple).length;
            faith += (templeCount * 2);
        }
        if (tenets.includes('holy_war')) {
            // +2 Martial per converted neighbor
            const convertedCount = neighbors.filter(n => n.religion === civData.religion.name).length;
            martial += (convertedCount * 2);
        }
        if (tenets.includes('christianity')) {
            faith += 1;
            culture += 1;
        }
    }

    // Apply Traits
    if (civData.traits.includes('Strength')) martial *= 2;
    if (civData.traits.includes('Industrious')) industry *= 2;
    if (civData.traits.includes('Intelligence')) science = Math.max(1, science * 2);
    if (civData.traits.includes('Wisdom')) faith *= 2;
    if (civData.traits.includes('Health')) fertility += 2;
    if (civData.traits.includes('Beauty')) diplomacy += 1;
    if (civData.traits.includes('Creativity')) culture *= 2;

    // Apply Turn Bonus (Cultural Choice)
    if (activeBonuses.martial) martial = Math.floor(martial * 1.5);
    if (activeBonuses.fertility) fertility = Math.floor(fertility * 1.5);
    if (activeBonuses.science) science = Math.floor(science * 1.5);
    if (activeBonuses.faith) faith = Math.floor(faith * 1.5);
    if (activeBonuses.industry) industry = Math.floor(industry * 1.5);

    return {
        martial: Math.floor(martial), 
        defense: Math.floor(defense), 
        faith: Math.floor(faith), 
        culture: Math.floor(culture), 
        science: Math.floor(science), 
        fertility: Math.floor(fertility), 
        industry: Math.floor(industry),
        diplomacy: diplomacy
    };
};

const App: React.FC = () => {
  // --- STATE ---
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [activeTab, setActiveTab] = useState<'build' | 'wonders' | 'religion' | 'war'>('build');
  const [gameState, setGameState] = useState<GameState>({
      simulationId: 'demo',
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
      gameFlags: { warUnlocked: false, religionUnlocked: false }
  });

  // Temporary storage for the active turn bonus
  const [turnBonus, setTurnBonus] = useState<any>({});

  // --- ACTIONS ---

  const startGame = (preset: CivPreset) => {
      const newTiles = generateMap(preset);
      
      setTiles(newTiles);
      setGameState({
          simulationId: 'sim-1',
          year: -50000,
          timelineIndex: 0,
          hasStarted: true,
          selectedAction: null,
          placingWonder: false,
          pendingTurnChoice: false,
          currentEventPopup: null,
          messages: [`Welcome to ${preset.name}. The year is 50,000 BCE.`],
          neighbors: GENERATE_NEIGHBORS(-50000),
          gameFlags: { warUnlocked: false, religionUnlocked: false },
          civilization: {
              presetId: preset.id,
              name: preset.name,
              regions: preset.regions,
              culturalStage: 'Barbarism',
              traits: preset.traits,
              baseStats: preset.baseStats,
              flags: { 
                  conquered: false, 
                  religionFound: false, 
                  housesSupportTwoPop: false, 
                  israelBonus: false, 
                  troyWallDouble: false, 
                  romanSplit: false, 
                  alexandrianBonus: false,
                  chinaWallDiscount: false 
              },
              builtWonderId: null,
              religion: { name: null, tenets: [] },
              buildings: { temples: 0, walls: 0, amphitheatres: 0, archimedes_towers: 0 },
              stats: {
                  houses: 0,
                  housesBuiltThisTurn: 0,
                  population: 0,
                  capacity: WATER_CAPACITIES[preset.waterResource],
                  fertility: preset.baseStats.fertility,
                  industry: preset.baseStats.industry,
                  industryLeft: preset.baseStats.industry,
                  martial: preset.baseStats.martial,
                  defense: preset.baseStats.defense,
                  science: 0,
                  culture: 0,
                  faith: preset.baseStats.faith,
                  diplomacy: 0
              }
          }
      });
  };

  const processTimelineEvent = (event: any, currentCiv: GameState['civilization'], gameFlags: any, currentNeighbors: NeighborCiv[]) => {
      const messages: string[] = []; // Only specific outcomes here
      const changes: Partial<GameState['civilization']['stats']> = {};
      const newFlags = { ...currentCiv.flags };
      const newGameFlags = { ...gameFlags };
      const neighborsToAdd: NeighborCiv[] = [];
      let housesLost = 0;

      if (event.actions) {
          event.actions.forEach((action: TimelineEventAction) => {
              // Check if action applies to this civ (Region Match)
              const isTarget = !action.targetRegions || action.targetRegions.some(r => currentCiv.regions.includes(r));
              
              if (!isTarget && action.type !== 'SET_FLAG' && action.type !== 'SPECIAL' && action.type !== 'ADD_NEIGHBOR') return;
              
              if (action.type === 'MODIFY_STAT' && action.stat) {
                  const currentVal = (currentCiv.stats as any)[action.stat] || 0;
                  let newVal = currentVal;
                  
                  let modValue = action.value || 0;
                  
                  // Value Source: Dynamic from current stats (e.g. value = number of houses)
                  if (action.valueSource === 'houses') {
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
                  messages.push(action.message.replace('VAL', valStr));
              }

              else if (action.type === 'DISASTER') {
                   const saved = checkSavingThrow(currentCiv, action.saveTrait, action.saveStat, action.saveDC);
                   if (saved) {
                       messages.push(`DISASTER AVERTED: ${action.message.split('(')[0]} (Saved!)`);
                   } else {
                       messages.push(`DISASTER STRUCK: ${action.message}`);
                       if (action.failEffect?.houseLossPercent) {
                           housesLost = Math.floor(currentCiv.stats.houses * (action.failEffect.houseLossPercent / 100));
                       }
                       if (action.failEffect?.popSetTo !== undefined) {
                           // handled in main return
                           changes.population = action.failEffect.popSetTo;
                           changes.houses = action.failEffect.popSetTo;
                       }
                   }
              }

              else if (action.type === 'SET_FLAG' && action.flagName) {
                  // Global flags vs Civ flags
                  if (action.flagName === 'warUnlocked') newGameFlags.warUnlocked = true;
                  else if (action.flagName === 'religionUnlocked') newGameFlags.religionUnlocked = true;
                  else if (action.flagName === 'housesSupportTwoPop') newFlags.housesSupportTwoPop = true;
                  else if (isTarget) {
                      (newFlags as any)[action.flagName] = true;
                  }
                  messages.push(action.message);
              }

              else if (action.type === 'ADD_NEIGHBOR' && action.neighbor) {
                  const newNeighbor: NeighborCiv = {
                      id: `n-${event.year}`,
                      name: action.neighbor.name || 'Unknown',
                      martial: action.neighbor.martial || 10,
                      defense: action.neighbor.defense || 5,
                      faith: action.neighbor.faith || 5,
                      isConquered: false,
                      relationship: 'Neutral'
                  };
                  neighborsToAdd.push(newNeighbor);
                  messages.push(action.message);
              }
          });
      }

      return { changes, newFlags, newGameFlags, messages, housesLost, neighborsToAdd };
  };

  // Triggered by clicking "Advance Timeline"
  const initiateAdvance = () => {
      setGameState(prev => ({ ...prev, pendingTurnChoice: true }));
  };

  const closeEventPopup = () => {
      setGameState(prev => ({ ...prev, currentEventPopup: null }));
  };

  // Triggered by making a choice in the modal
  const finalizeAdvance = (choice: string) => {
      const bonus = { [choice]: true };
      setTurnBonus(bonus);

      const nextIndex = gameState.timelineIndex + 1;
      if (nextIndex >= TIMELINE_EVENTS.length) return;

      const event = TIMELINE_EVENTS[nextIndex];
      
      // 1. Calculate Base Stats for this Turn
      const currentStats = calculateStats(tiles, gameState.civilization, bonus, gameState.neighbors);
      
      // 2. Apply Event Logic
      const eventResult = processTimelineEvent(event, { ...gameState.civilization, stats: { ...gameState.civilization.stats, ...currentStats } }, gameState.gameFlags, gameState.neighbors);
      
      // 3. Update House Count (Disasters only, Growth is Manual)
      let newHouses = gameState.civilization.stats.houses;
      
      // Apply disaster losses
      newHouses = Math.max(0, newHouses - eventResult.housesLost);
      
      // Pop Calculation
      const popMultiplier = (eventResult.newFlags.housesSupportTwoPop || event.year >= -480) ? 2 : 1;
      let newPop = newHouses * popMultiplier;
      
      // Handle explicit pop set (e.g. Thera)
      if (eventResult.changes.houses !== undefined) newHouses = eventResult.changes.houses;
      if (eventResult.changes.population !== undefined) newPop = eventResult.changes.population;

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
      if (event.year === -560 && gameState.civilization.name.includes('Assyria')) {
          const statsToHalve: StatKey[] = ['martial', 'defense', 'faith', 'industry', 'science', 'culture', 'capacity'];
          statsToHalve.forEach(key => {
              if (key === 'capacity') mergedStats.capacity = Math.floor(mergedStats.capacity / 2);
              else (mergedStats as any)[key] = Math.floor(((mergedStats as any)[key] || 0) / 2);
          });
      }

      // Unlock Cultural Stages
      let stage = gameState.civilization.culturalStage;
      if (mergedStats.culture > 20 && stage === 'Barbarism') stage = 'Classical';
      if (mergedStats.culture > 50 && stage === 'Classical') stage = 'Imperial';

      setGameState(prev => ({
          ...prev,
          year: event.year,
          timelineIndex: nextIndex,
          pendingTurnChoice: false,
          currentEventPopup: {
              year: event.year,
              name: event.name,
              description: event.desc,
              effects: eventResult.messages
          },
          neighbors: [...prev.neighbors, ...eventResult.neighborsToAdd], 
          messages: [`Focus: ${choice.toUpperCase()}.`, ...eventResult.messages, `TIMELINE ADVANCED: ${event.name}`, ...prev.messages],
          gameFlags: eventResult.newGameFlags,
          civilization: {
              ...prev.civilization,
              culturalStage: stage,
              flags: eventResult.newFlags,
              stats: {
                  ...prev.civilization.stats,
                  ...mergedStats
              }
          }
      }));
  };

  const handleTileClick = (tileId: string) => {
      const { selectedAction, civilization, placingWonder } = gameState;
      
      // Handle Wonder Placement
      if (placingWonder && civilization.builtWonderId) {
          const tileIndex = tiles.findIndex(t => t.id === tileId);
          if (tileIndex === -1) return;
          const tile = tiles[tileIndex];
          
          if (tile.building !== BuildingType.None || [TerrainType.Ocean, TerrainType.Mountain, TerrainType.HighMountain].includes(tile.terrain)) {
              addMessage("Cannot place Wonder here.");
              return;
          }

          const newTiles = [...tiles];
          newTiles[tileIndex] = { ...tile, building: BuildingType.Wonder };
          setTiles(newTiles);
          setGameState(prev => ({ ...prev, placingWonder: false, messages: ["Wonder placed successfully!", ...prev.messages] }));
          return;
      }

      if (!selectedAction) return;

      const tileIndex = tiles.findIndex(t => t.id === tileId);
      if (tileIndex === -1) return;
      const tile = tiles[tileIndex];

      if (tile.building !== BuildingType.None) {
          addMessage("Tile is occupied.");
          return;
      }
      
      const restrictedForBuildings = [TerrainType.Mountain, TerrainType.HighMountain, TerrainType.Ocean, TerrainType.River, TerrainType.Marsh];
      
      if (selectedAction === BuildingType.House) {
          // --- HOUSE PLACEMENT LOGIC ---
          
          // 1. Check Terrain
          if (restrictedForBuildings.includes(tile.terrain) && tile.terrain !== TerrainType.Plains && tile.terrain !== TerrainType.Grassland) {
              addMessage("Cannot build houses on this terrain.");
              return;
          }
          
          // 2. Check Population Capacity
          if (civilization.stats.houses >= civilization.stats.capacity) {
              addMessage("Population capacity reached.");
              return;
          }

          // 3. Check Fertility Limit (Growth per Turn)
          if (civilization.stats.housesBuiltThisTurn >= civilization.stats.fertility) {
              addMessage(`Growth Limit Reached! (Fertility: ${civilization.stats.fertility})`);
              return;
          }

      } else {
          // --- OTHER STRUCTURE LOGIC ---
          let cost = BUILDING_COSTS[selectedAction];
          
          // China Great Wall Discount
          if (selectedAction === BuildingType.Wonder && civilization.flags.chinaWallDiscount && civilization.builtWonderId === 'wall') {
              // Handled in buildWonder usually, but just in case of direct costs
          }

          if (civilization.stats.industryLeft < cost) {
              addMessage(`Not enough Industry. Need ${cost}.`);
              return;
          }
          if (selectedAction === BuildingType.ArchimedesTower && civilization.stats.science < 30) {
               addMessage("Requires 30 Science.");
               return;
          }
          if (restrictedForBuildings.includes(tile.terrain)) {
               addMessage("Cannot build structure here.");
               return;
          }
      }

      // Apply Changes
      const newTiles = [...tiles];
      newTiles[tileIndex] = { ...tile, building: selectedAction };
      setTiles(newTiles);

      setGameState(prev => {
          const civ = prev.civilization;
          const cost = BUILDING_COSTS[selectedAction];
          
          let newHouses = civ.stats.houses;
          let newIndustry = civ.stats.industryLeft;
          let newHousesBuilt = civ.stats.housesBuiltThisTurn;
          const newBuildings = { ...civ.buildings };
          
          if (selectedAction === BuildingType.House) {
              newHouses += 1;
              newHousesBuilt += 1;
          } else {
              newIndustry -= cost;
              if (selectedAction === BuildingType.Temple) newBuildings.temples++;
              if (selectedAction === BuildingType.Wall) newBuildings.walls++;
              if (selectedAction === BuildingType.Amphitheatre) newBuildings.amphitheatres++;
              if (selectedAction === BuildingType.ArchimedesTower) newBuildings.archimedes_towers++;
          }

          return {
              ...prev,
              selectedAction: null,
              civilization: {
                  ...civ,
                  buildings: newBuildings,
                  stats: {
                      ...civ.stats,
                      houses: newHouses,
                      housesBuiltThisTurn: newHousesBuilt,
                      industryLeft: newIndustry
                  }
              },
              messages: [`Constructed ${selectedAction}`, ...prev.messages]
          }
      });
  };

  const buildWonder = (wonder: WonderDefinition) => {
      const { civilization } = gameState;
      
      let cost = wonder.cost;
      // China Discount
      if (wonder.id === 'wall' && civilization.flags.chinaWallDiscount) {
          cost = Math.floor(cost / 2);
      }

      if (civilization.builtWonderId) {
          addMessage("You can only build one Wonder.");
          return;
      }
      if (civilization.stats.industryLeft < cost) {
          addMessage("Not enough Industry.");
          return;
      }
      if (gameState.year < wonder.minYear) {
          addMessage("Not available in this era.");
          return;
      }

      setGameState(prev => ({
          ...prev,
          placingWonder: true,
          civilization: {
              ...prev.civilization,
              builtWonderId: wonder.id,
              stats: {
                  ...prev.civilization.stats,
                  industryLeft: prev.civilization.stats.industryLeft - cost
              }
          },
          messages: [`Built Wonder: ${wonder.name}! Now PLACE it on the map.`, ...prev.messages]
      }));
  };

  const foundReligion = (tenetId: string, name: string) => {
      const { civilization, gameFlags } = gameState;
      
      if (civilization.flags.religionFound) return;
      if (!gameFlags.religionUnlocked && gameState.year < -1000) { addMessage("Too early for organized religion (Wait for 1000 BCE)."); return; }
      if (civilization.buildings.temples < 1) { addMessage("Must build a Temple first."); return; }
      if (civilization.stats.faith < 10) { addMessage("Need 10 Faith."); return; }

      setGameState(prev => {
          const newTenets = [...prev.civilization.religion.tenets, tenetId];
          const isIsrael = prev.civilization.flags.israelBonus;
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
                  stats: { ...prev.civilization.stats, faith: prev.civilization.stats.faith + 5 } 
              },
              messages: [...msgs, ...prev.messages]
          }
      });
  };

  const spreadReligion = (neighborId: string) => {
      const neighbor = gameState.neighbors.find(n => n.id === neighborId);
      if (!neighbor) return;
      
      if (gameState.civilization.stats.faith > neighbor.faith + 2) {
          setGameState(prev => ({
            ...prev,
            neighbors: prev.neighbors.map(n => n.id === neighborId ? { ...n, religion: prev.civilization.religion.name || 'Our Faith' } : n),
            messages: [`Spread religion to ${neighbor.name}! They now follow your faith.`, ...prev.messages]
          }));
      } else {
          addMessage(`Failed to convert ${neighbor.name} (Their Faith: ${neighbor.faith} vs Your Faith: ${gameState.civilization.stats.faith})`);
      }
  };

  const formAlliance = (neighborId: string) => {
      const { civilization } = gameState;
      if (civilization.stats.diplomacy < 1) {
          addMessage("Need at least 1 Diplomacy to form alliances.");
          return;
      }
      
      setGameState(prev => ({
          ...prev,
          neighbors: prev.neighbors.map(n => n.id === neighborId ? { ...n, relationship: 'Ally' } : n),
          messages: [`Formed alliance with ${prev.neighbors.find(n => n.id === neighborId)?.name}!`, ...prev.messages]
      }));
  };

  const attackNeighbor = (neighborId: string) => {
      const { gameFlags } = gameState;
      if (!gameFlags.warUnlocked && gameState.year < -670) { addMessage("Warfare not unlocked until 670 BCE or Event."); return; }

      const neighbor = gameState.neighbors.find(n => n.id === neighborId);
      if (!neighbor || neighbor.isConquered) return;
      if (neighbor.relationship === 'Ally') { addMessage("Cannot attack an ally!"); return; }
      
      const myMartial = gameState.civilization.stats.martial;
      const enemyStr = neighbor.martial + neighbor.defense;

      if (myMartial < 1) { addMessage("You have no martial strength."); return; }

      const win = myMartial > enemyStr;
      
      if (win) {
          setGameState(prev => ({
              ...prev,
              neighbors: prev.neighbors.map(n => n.id === neighborId ? { ...n, isConquered: true } : n),
              messages: [`Victory against ${neighbor.name}!`, ...prev.messages],
              civilization: {
                  ...prev.civilization,
                  stats: { ...prev.civilization.stats, martial: prev.civilization.stats.martial + 5 }
              }
          }));
      } else {
          addMessage(`Defeat! ${neighbor.name} (Str: ${enemyStr}) was too strong.`);
      }
  };

  const addMessage = (msg: string) => {
      setGameState(prev => ({
          ...prev,
          messages: [msg, ...prev.messages.slice(0, 4)]
      }));
  };

  // --- RENDER HELPERS ---

  if (!gameState.hasStarted) {
      return (
          <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-10 font-sans">
              <div className="max-w-5xl w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 flex flex-col max-h-full overflow-hidden">
                  <h1 className="text-4xl font-bold text-orange-500 mb-2 flex items-center gap-3">
                      <History size={40} /> Through History
                  </h1>
                  <p className="text-slate-400 mb-8">Select a Civilization to begin the simulation.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                      {CIV_PRESETS.map(civ => (
                          <button key={civ.id} onClick={() => startGame(civ)} className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-orange-500/50 p-5 rounded-xl text-left transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-slate-100">{civ.name}</h3>
                                {civ.isIsland && <span className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded">Island</span>}
                              </div>
                              <div className="flex flex-wrap gap-2 mb-4">
                                  {civ.traits.map(t => <span key={t} className="text-xs font-mono bg-slate-800 text-orange-300 px-2 py-1 rounded border border-slate-600">{t}</span>)}
                              </div>
                              <div className="grid grid-cols-2 gap-y-1 text-sm text-slate-400">
                                  <span>Martial: <b className="text-slate-200">{civ.baseStats.martial}</b></span>
                                  <span>Industry: <b className="text-slate-200">{civ.baseStats.industry}</b></span>
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
      
      {/* EVENT POPUP MODAL */}
      {gameState.currentEventPopup && (
          <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
              <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col gap-6 relative">
                   <button onClick={closeEventPopup} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                      <X size={24} />
                  </button>

                  <div className="text-center space-y-2">
                      <div className="text-amber-500 font-bold tracking-widest uppercase text-sm">Historical Event • {Math.abs(gameState.currentEventPopup.year)} {gameState.currentEventPopup.year < 0 ? 'BCE' : 'CE'}</div>
                      <h2 className="text-4xl font-bold text-white font-serif">{gameState.currentEventPopup.name}</h2>
                  </div>

                  <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 text-lg text-slate-300 leading-relaxed text-center italic font-serif">
                      "{gameState.currentEventPopup.description}"
                  </div>

                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Outcomes</h3>
                      {gameState.currentEventPopup.effects.length > 0 ? (
                           <ul className="space-y-2">
                              {gameState.currentEventPopup.effects.map((effect, i) => (
                                  <li key={i} className="flex items-start gap-3 text-slate-200 bg-slate-700/50 p-3 rounded-lg border border-slate-600 text-sm">
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

                  <button onClick={closeEventPopup} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 text-lg transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2">
                      Continue History <Play size={20} fill="currentColor" />
                  </button>
              </div>
          </div>
      )}

      {/* GROWTH CHOICE MODAL */}
      {gameState.pendingTurnChoice && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl max-w-lg w-full shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-2">New Era: {civ.culturalStage}</h2>
                  <p className="text-slate-400 mb-6">Choose your civilization's focus for this growth phase.</p>
                  
                  <div className="grid grid-cols-1 gap-3">
                      {civ.culturalStage === 'Barbarism' && (
                          <>
                              <button onClick={() => finalizeAdvance('martial')} className="p-4 bg-red-900/40 border border-red-500 hover:bg-red-900/60 rounded-xl flex items-center gap-4 text-left">
                                  <div className="bg-red-500 p-3 rounded-full"><Sword className="text-white"/></div>
                                  <div><div className="font-bold text-lg">Warpath</div><div className="text-sm text-slate-300">+50% Martial Strength</div></div>
                              </button>
                              <button onClick={() => finalizeAdvance('fertility')} className="p-4 bg-green-900/40 border border-green-500 hover:bg-green-900/60 rounded-xl flex items-center gap-4 text-left">
                                  <div className="bg-green-500 p-3 rounded-full"><Sprout className="text-white"/></div>
                                  <div><div className="font-bold text-lg">Growth</div><div className="text-sm text-slate-300">+50% Fertility</div></div>
                              </button>
                          </>
                      )}
                      {civ.culturalStage === 'Classical' && (
                          <>
                              <button onClick={() => finalizeAdvance('science')} className="p-4 bg-blue-900/40 border border-blue-500 hover:bg-blue-900/60 rounded-xl flex items-center gap-4 text-left">
                                  <div className="bg-blue-500 p-3 rounded-full"><FlaskConical className="text-white"/></div>
                                  <div><div className="font-bold text-lg">Innovation</div><div className="text-sm text-slate-300">+50% Science</div></div>
                              </button>
                              <button onClick={() => finalizeAdvance('faith')} className="p-4 bg-yellow-900/40 border border-yellow-500 hover:bg-yellow-900/60 rounded-xl flex items-center gap-4 text-left">
                                  <div className="bg-yellow-500 p-3 rounded-full"><Star className="text-white"/></div>
                                  <div><div className="font-bold text-lg">Piety</div><div className="text-sm text-slate-300">+50% Faith</div></div>
                              </button>
                          </>
                      )}
                      {(civ.culturalStage === 'Imperial' || civ.culturalStage === 'Decline') && (
                           <>
                              <button onClick={() => finalizeAdvance('industry')} className="p-4 bg-amber-900/40 border border-amber-500 hover:bg-amber-900/60 rounded-xl flex items-center gap-4 text-left">
                                  <div className="bg-amber-500 p-3 rounded-full"><Hammer className="text-white"/></div>
                                  <div><div className="font-bold text-lg">Industry</div><div className="text-sm text-slate-300">+50% Production</div></div>
                              </button>
                              <button onClick={() => finalizeAdvance('martial')} className="p-4 bg-red-900/40 border border-red-500 hover:bg-red-900/60 rounded-xl flex items-center gap-4 text-left">
                                  <div className="bg-red-500 p-3 rounded-full"><Sword className="text-white"/></div>
                                  <div><div className="font-bold text-lg">Conquest</div><div className="text-sm text-slate-300">+50% Martial</div></div>
                              </button>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* TOP BAR */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-md z-20">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-orange-500">{civ.name}</h1>
            <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${gameState.year >= 0 ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                {Math.abs(gameState.year)} {gameState.year >= 0 ? 'CE' : 'BCE'}
            </div>
            <div className="text-xs text-slate-500 border-l border-slate-700 pl-4 hidden md:block">
                {TIMELINE_EVENTS[gameState.timelineIndex]?.name}
            </div>
        </div>
        <button onClick={initiateAdvance} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-900/20">
            <Play size={16} fill="currentColor" /> Advance Turn
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
          {/* LEFT STATS */}
          <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-xl">
              <div className="p-4 border-b border-slate-800 space-y-4">
                  <div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-orange-400 flex items-center gap-2"><Home size={14}/> Houses ({civ.flags.housesSupportTwoPop ? '2x' : '1x'} Pop)</span><span>{civ.stats.houses}/{civ.stats.capacity}</span></div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-orange-500 h-full" style={{ width: `${(civ.stats.houses / civ.stats.capacity) * 100}%` }}></div></div>
                      <div className="text-xs text-slate-500 mt-1 text-right">Built this turn: {civ.stats.housesBuiltThisTurn}/{civ.stats.fertility}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-800 p-2 rounded border border-slate-700"><div className="text-xs text-slate-400">Industry</div><div className="text-lg font-bold text-amber-400">{civ.stats.industryLeft}</div></div>
                      <div className="bg-slate-800 p-2 rounded border border-slate-700"><div className="text-xs text-slate-400">Fertility</div><div className="text-lg font-bold text-green-400">{civ.stats.fertility}</div></div>
                  </div>
                  <div className="space-y-1 text-sm">
                      <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-red-400">Martial</span><b>{civ.stats.martial}</b></div>
                      <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-blue-400">Defense</span><b>{civ.stats.defense}</b></div>
                      <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-yellow-400">Faith</span><b>{civ.stats.faith}</b></div>
                      <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-pink-400">Culture</span><b>{civ.stats.culture}</b></div>
                      <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-purple-400">Science</span><b>{civ.stats.science}</b></div>
                      <div className="flex justify-between border-b border-slate-800 pb-1"><span className="text-cyan-400">Diplomacy</span><b>{civ.stats.diplomacy}</b></div>
                  </div>
              </div>
              {civ.religion.name && (
                  <div className="p-4 bg-yellow-900/20 m-2 rounded border border-yellow-700/30">
                      <div className="text-xs text-yellow-500 uppercase font-bold">State Religion</div>
                      <div className="text-sm font-bold text-yellow-100">{civ.religion.name}</div>
                  </div>
              )}
          </aside>

          {/* MAP */}
          <section className="flex-1 relative bg-slate-950">
              <MapScene tiles={tiles} onTileClick={handleTileClick} />
              {gameState.placingWonder && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-6 py-3 rounded-full font-bold shadow-xl z-20 animate-bounce">
                      CLICK A TILE TO PLACE YOUR WONDER
                  </div>
              )}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-slate-900/90 backdrop-blur border border-slate-700 px-6 py-2 rounded-full shadow-2xl z-10">
                   <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-[#166534] rounded-sm"></div> Forest</div>
                   <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-[#78716c] rounded-sm"></div> Mountain</div>
              </div>
          </section>

          {/* RIGHT TABBED PANEL */}
          <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-10 shadow-xl">
               <div className="flex border-b border-slate-800">
                   {['build', 'wonders', 'religion', 'war'].map(tab => (
                       <button 
                           key={tab}
                           onClick={() => setActiveTab(tab as any)}
                           className={`flex-1 py-3 flex justify-center items-center text-slate-400 hover:bg-slate-800 transition-colors ${activeTab === tab ? 'border-b-2 border-orange-500 text-orange-500 bg-slate-800' : ''}`}
                       >
                           {tab === 'build' && <Hammer size={18} />}
                           {tab === 'wonders' && <Crown size={18} />}
                           {tab === 'religion' && <Star size={18} />}
                           {tab === 'war' && <Sword size={18} />}
                       </button>
                   ))}
               </div>

               <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                   {/* BUILD TAB */}
                   {activeTab === 'build' && (
                       <div className="space-y-3">
                           <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Structures</h2>
                           <button onClick={() => setGameState(p => ({ ...p, selectedAction: BuildingType.House }))} className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 ${gameState.selectedAction === BuildingType.House ? 'bg-orange-900/30 border-orange-500' : 'bg-slate-800 border-slate-700'}`}>
                               <div className="p-2 bg-orange-600 rounded text-white"><Home size={18}/></div>
                               <div><div className="font-bold text-sm">House</div><div className="text-xs text-slate-400">Cost: Fertility ({civ.stats.fertility - civ.stats.housesBuiltThisTurn} left)</div></div>
                           </button>
                           <button disabled={civ.stats.industryLeft < 10} onClick={() => setGameState(p => ({ ...p, selectedAction: BuildingType.Temple }))} className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 ${gameState.selectedAction === BuildingType.Temple ? 'bg-blue-900/30 border-blue-500' : 'bg-slate-800 border-slate-700'} ${civ.stats.industryLeft < 10 ? 'opacity-50' : ''}`}>
                               <div className="p-2 bg-blue-600 rounded text-white"><Landmark size={18}/></div>
                               <div><div className="font-bold text-sm">Temple</div><div className="text-xs text-slate-400">Cost: 10 Ind</div></div>
                           </button>
                           <button disabled={civ.stats.industryLeft < 10} onClick={() => setGameState(p => ({ ...p, selectedAction: BuildingType.Wall }))} className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 ${gameState.selectedAction === BuildingType.Wall ? 'bg-slate-700 border-slate-400' : 'bg-slate-800 border-slate-700'} ${civ.stats.industryLeft < 10 ? 'opacity-50' : ''}`}>
                               <div className="p-2 bg-slate-500 rounded text-white"><BrickWall size={18}/></div>
                               <div><div className="font-bold text-sm">Wall</div><div className="text-xs text-slate-400">Cost: 10 Ind</div></div>
                           </button>
                           <button disabled={civ.stats.industryLeft < 10} onClick={() => setGameState(p => ({ ...p, selectedAction: BuildingType.Amphitheatre }))} className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 ${gameState.selectedAction === BuildingType.Amphitheatre ? 'bg-pink-900/30 border-pink-500' : 'bg-slate-800 border-slate-700'} ${civ.stats.industryLeft < 10 ? 'opacity-50' : ''}`}>
                               <div className="p-2 bg-pink-600 rounded text-white"><Users size={18}/></div>
                               <div><div className="font-bold text-sm">Amphitheatre</div><div className="text-xs text-slate-400">Cost: 10 Ind</div></div>
                           </button>
                            <button disabled={civ.stats.industryLeft < 20 || civ.stats.science < 30} onClick={() => setGameState(p => ({ ...p, selectedAction: BuildingType.ArchimedesTower }))} className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 ${gameState.selectedAction === BuildingType.ArchimedesTower ? 'bg-purple-900/30 border-purple-500' : 'bg-slate-800 border-slate-700'} ${(civ.stats.industryLeft < 20 || civ.stats.science < 30) ? 'opacity-50' : ''}`}>
                               <div className="p-2 bg-purple-600 rounded text-white"><TowerControl size={18}/></div>
                               <div><div className="font-bold text-sm">Archimedes Tower</div><div className="text-xs text-slate-400">Cost: 20 Ind, 30 Sci</div></div>
                           </button>
                       </div>
                   )}

                   {/* WONDERS TAB */}
                   {activeTab === 'wonders' && (
                       <div className="space-y-3">
                           <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Great Wonders</h2>
                           {WONDERS_LIST.map(w => {
                               const locked = gameState.year < w.minYear;
                               const built = civ.builtWonderId === w.id;
                               const affordable = civ.stats.industryLeft >= w.cost;
                               return (
                                   <div key={w.id} className={`p-3 rounded-lg border bg-slate-800 ${built ? 'border-amber-500' : 'border-slate-700'} relative overflow-hidden`}>
                                       <div className="flex justify-between items-start mb-1">
                                           <span className="font-bold text-sm">{w.name}</span>
                                           <span className="text-xs font-mono text-amber-400">{w.cost} Ind</span>
                                       </div>
                                       <div className="text-xs text-slate-400 mb-2">{w.effects}</div>
                                       {built ? (
                                           <div className="text-xs text-amber-500 font-bold flex items-center gap-1"><Check size={12}/> Constructed</div>
                                       ) : (
                                           <button 
                                               disabled={locked || !affordable || !!civ.builtWonderId}
                                               onClick={() => buildWonder(w)}
                                               className="w-full py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                           >
                                               {locked ? `Unlocks ${Math.abs(w.minYear)} BCE` : (!affordable ? 'Need Industry' : (civ.builtWonderId ? 'Max 1 Wonder' : 'Build'))}
                                           </button>
                                       )}
                                   </div>
                               );
                           })}
                       </div>
                   )}

                   {/* RELIGION TAB */}
                   {activeTab === 'religion' && (
                       <div className="space-y-4">
                           <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Theology</h2>
                           {!civ.flags.religionFound ? (
                               <div className="p-4 bg-slate-800 rounded border border-slate-700 text-center">
                                   <p className="text-sm text-slate-300 mb-3">Found a religion to guide your people.</p>
                                   {civ.flags.israelBonus && <p className="text-xs text-amber-400 mb-2">Israel Bonus: Pick 3 Tenets</p>}
                                   <div className="space-y-1 text-xs text-slate-500 mb-4">
                                       <div className={gameState.year >= -1000 || gameState.gameFlags.religionUnlocked ? 'text-green-400' : 'text-red-400'}>• Year 1000 BCE</div>
                                       <div className={civ.stats.faith >= 10 ? 'text-green-400' : 'text-red-400'}>• 10 Faith</div>
                                       <div className={civ.buildings.temples >= 1 ? 'text-green-400' : 'text-red-400'}>• 1 Temple</div>
                                   </div>
                                   {RELIGION_TENETS.map(t => (
                                       !civ.religion.tenets.includes(t.id) && (
                                           <button key={t.id} onClick={() => foundReligion(t.id, 'My Religion')} className="w-full mb-2 p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-left">
                                               <div className="font-bold text-amber-400">{t.name}</div>
                                               <div className="text-slate-400">{t.description}</div>
                                           </button>
                                       )
                                   ))}
                                   {civ.religion.tenets.length > 0 && (
                                       <div className="text-xs text-white mt-2">Selected: {civ.religion.tenets.length}/{civ.flags.israelBonus ? 3 : 1}</div>
                                   )}
                               </div>
                           ) : (
                               <div className="p-4 bg-slate-800 rounded border border-slate-700">
                                   <div className="text-center mb-4">
                                       <Star className="mx-auto text-amber-500 mb-2" />
                                       <h3 className="font-bold text-lg">{civ.religion.name}</h3>
                                       <div className="text-xs text-slate-400">Founded {Math.abs(gameState.year)} BCE</div>
                                   </div>
                                   <div className="space-y-2">
                                       {civ.religion.tenets.map(tid => (
                                           <div key={tid} className="text-sm p-2 bg-slate-900 rounded border border-slate-700">
                                               <span className="text-amber-500 font-bold">{RELIGION_TENETS.find(t => t.id === tid)?.name}</span>
                                               <p className="text-xs text-slate-400 mt-1">{RELIGION_TENETS.find(t => t.id === tid)?.description}</p>
                                           </div>
                                       ))}
                                   </div>
                                   
                                   <div className="mt-4 pt-4 border-t border-slate-700">
                                        <h3 className="text-xs font-bold text-slate-500 mb-2">Spread Faith</h3>
                                        {gameState.neighbors.map(n => (
                                            <button 
                                                key={n.id} 
                                                onClick={() => spreadReligion(n.id)}
                                                disabled={n.religion === civ.religion.name}
                                                className="w-full p-2 mb-1 bg-slate-700 hover:bg-slate-600 text-xs rounded flex justify-between disabled:opacity-50"
                                            >
                                                <span>{n.name}</span>
                                                {n.religion === civ.religion.name ? (
                                                    <span className="text-green-400 flex items-center gap-1"><Check size={12}/> Converted</span>
                                                ) : (
                                                    <span className="text-amber-300">{n.faith} Faith</span>
                                                )}
                                            </button>
                                        ))}
                                   </div>
                               </div>
                           )}
                       </div>
                   )}

                   {/* WAR TAB */}
                   {activeTab === 'war' && (
                       <div className="space-y-3">
                           <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">War Room</h2>
                           {(!gameState.gameFlags.warUnlocked && gameState.year < -670) ? (
                               <div className="p-4 bg-slate-800/50 text-center text-sm text-slate-500 italic border border-slate-700 rounded">
                                   Warfare unlocks in 670 BCE
                               </div>
                           ) : (
                               gameState.neighbors.map(n => (
                                   <div key={n.id} className={`p-3 rounded border ${n.isConquered ? 'bg-slate-900 border-slate-800 opacity-50' : n.relationship === 'Ally' ? 'bg-slate-800 border-blue-500' : 'bg-slate-800 border-red-900/50'}`}>
                                       <div className="flex justify-between items-center mb-2">
                                           <span className="font-bold text-sm text-slate-200">{n.name}</span>
                                           {n.isConquered && <span className="text-xs bg-red-900 text-red-200 px-2 rounded">Conquered</span>}
                                           {n.relationship === 'Ally' && <span className="text-xs bg-blue-900 text-blue-200 px-2 rounded">Ally</span>}
                                       </div>
                                       <div className="flex justify-between text-xs text-slate-400 mb-3">
                                           <span>Strength: <b className="text-red-400">{n.martial + n.defense}</b></span>
                                           {n.relationship !== 'Ally' && !n.isConquered && (
                                                <button 
                                                    onClick={() => formAlliance(n.id)}
                                                    disabled={civ.stats.diplomacy < 1}
                                                    className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                                                >
                                                    <Handshake size={12}/> Ally
                                                </button>
                                           )}
                                       </div>
                                       {!n.isConquered && n.relationship !== 'Ally' && (
                                           <button 
                                                onClick={() => attackNeighbor(n.id)}
                                                disabled={civ.stats.martial < 1}
                                                className="w-full py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded shadow-lg shadow-red-900/20"
                                           >
                                               ATTACK
                                           </button>
                                       )}
                                   </div>
                               ))
                           )}
                       </div>
                   )}
               </div>

               {/* MESSAGE LOG (Fixed at bottom of panel) */}
               <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 h-32 overflow-y-auto">
                   {gameState.messages.map((msg, i) => (
                       <div key={i} className="mb-1 pb-1 border-b border-slate-900 last:border-0">
                           <span className="text-slate-600 mr-2">{'>'}</span>{msg}
                       </div>
                   ))}
               </div>
          </aside>
      </main>
    </div>
  );
};

export default App;
