
import React, { useState, useEffect, useCallback } from 'react';
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
    RefreshCw,
    LogOut,
    Landmark,
    BrickWall
} from 'lucide-react';
import MapScene from './components/MapScene';
import { generateMap, INITIAL_GAME_STATE } from './constants';
import { TileData, TerrainType, BuildingType, BUILDING_COSTS } from './types';

const App: React.FC = () => {
  // State
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  
  // Initialize Map
  useEffect(() => {
    setTiles(generateMap());
  }, []);

  // --- Game Logic Helpers ---

  const canBuild = (tile: TileData, type: BuildingType): boolean => {
    if (tile.building !== BuildingType.None) return false; // Already occupied
    
    // Terrain Constraints
    if (tile.terrain === TerrainType.Mountain || 
        tile.terrain === TerrainType.River || 
        tile.terrain === TerrainType.Ocean) {
        return false;
    }

    // Resource Constraints
    const cost = BUILDING_COSTS[type];
    if (gameState.stats.industry < cost) return false;

    // Capacity Constraints for Houses
    if (type === BuildingType.House) {
        if (gameState.stats.population >= gameState.stats.capacity) return false;
    }

    return true;
  };

  const handleTileClick = (tileId: string) => {
    const { selectedAction } = gameState;
    
    if (!selectedAction) {
        addMessage("Select a building from the Actions panel first.");
        return;
    }

    const tileIndex = tiles.findIndex(t => t.id === tileId);
    if (tileIndex === -1) return;
    const tile = tiles[tileIndex];

    if (canBuild(tile, selectedAction)) {
        // Execute Build
        const newTiles = [...tiles];
        newTiles[tileIndex] = { ...tile, building: selectedAction };
        setTiles(newTiles);

        // Deduct Resources & Update Stats
        const cost = BUILDING_COSTS[selectedAction];
        const newStats = { ...gameState.stats };
        
        newStats.industry -= cost;

        if (selectedAction === BuildingType.House) {
            newStats.houses += 1;
            newStats.population += 1;
        }
        
        if (selectedAction === BuildingType.Temple) {
            newStats.faith += 3;
        }
        
        if (selectedAction === BuildingType.Wall) {
            newStats.defense += 5; // Basic bonus
        }

        if (selectedAction === BuildingType.Amphitheatre) {
            newStats.culture += 10; // Basic bonus
        }

        setGameState(prev => ({
            ...prev,
            stats: newStats,
            selectedAction: null, // Reset action after build
            messages: [`Built ${selectedAction} on ${tile.terrain}`, ...prev.messages]
        }));
    } else {
        addMessage(`Cannot build ${selectedAction} here. Check terrain or resources.`);
    }
  };

  const addMessage = (msg: string) => {
    setGameState(prev => ({
        ...prev,
        messages: [msg, ...prev.messages.slice(0, 4)]
    }));
  };

  const nextTurn = () => {
    // Simple Turn Logic
    setGameState(prev => ({
        ...prev,
        year: prev.year + 100,
        stats: {
            ...prev.stats,
            // Auto-growth logic roughly based on fertility
            industry: Math.min(prev.stats.maxIndustry, prev.stats.industry + 5), 
        },
        messages: [`Year ${Math.abs(prev.year + 100)} BCE. Growth cycle complete.`, ...prev.messages]
    }));
  };

  const selectAction = (action: BuildingType) => {
      setGameState(prev => ({ ...prev, selectedAction: action }));
  };

  // --- Components for UI ---

  const StatRow = ({ icon: Icon, label, value, subValue, color }: any) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded bg-slate-800 ${color}`}>
          <Icon size={16} />
        </div>
        <span className="text-slate-300 text-sm font-medium">{label}</span>
      </div>
      <div className="text-slate-100 font-bold text-sm">
        {value}{subValue && <span className="text-slate-500 text-xs ml-1">/ {subValue}</span>}
      </div>
    </div>
  );

  const ActionButton = ({ type, label, cost, desc, colorClass, icon: Icon }: any) => {
      const isSelected = gameState.selectedAction === type;
      const canAfford = gameState.stats.industry >= cost;
      
      return (
        <button 
            onClick={() => selectAction(type)}
            disabled={!canAfford}
            className={`w-full p-4 rounded-lg mb-3 text-left transition-all duration-200 border-2 group
                ${isSelected 
                    ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-[1.02] bg-slate-800' 
                    : 'border-transparent hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800'
                }
                ${!canAfford ? 'opacity-50 cursor-not-allowed grayscale' : ''}
            `}
        >
            <div className="flex items-center gap-3 mb-1">
                <div className={`p-2 rounded-md ${colorClass} text-white shadow-md`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-100 group-hover:text-white">{label}</h3>
                    <p className="text-xs text-slate-400">Cost: {cost} Industry</p>
                </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 pl-1">{desc}</p>
        </button>
      );
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden font-sans selection:bg-orange-500/30">
      {/* Top Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-md">
        <div>
            <h1 className="text-xl font-bold text-orange-500 flex items-center gap-2">
                <History /> Ancient World
            </h1>
            <p className="text-xs text-slate-400">Civilization Builder</p>
        </div>
        <div className="flex items-center gap-6">
            <div className="text-right">
                <div className="text-2xl font-bold text-blue-400 font-mono tracking-wider">
                    {Math.abs(gameState.year)} BCE
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Current Era</div>
            </div>
            <div className="flex gap-2">
                <button onClick={nextTurn} className="p-2 bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 border border-blue-800 rounded-md transition-all hover:scale-105" title="Next Turn">
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Stats */}
        <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto custom-scrollbar z-10 p-4 gap-5 shadow-xl">
            {/* Resource Stats */}
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                <h2 className="text-slate-200 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Users size={16} className="text-blue-400" /> Demographics
                </h2>
                <StatRow icon={Home} label="Houses" value={gameState.stats.houses} color="text-orange-400" />
                <StatRow icon={Users} label="Population" value={gameState.stats.population} color="text-blue-400" />
                <StatRow icon={Warehouse} label="Capacity" value={gameState.stats.capacity} color="text-slate-400" />
                <StatRow icon={Sprout} label="Fertility" value={gameState.stats.fertility} color="text-green-400" />
                <StatRow icon={Hammer} label="Industry" value={gameState.stats.industry} subValue={gameState.stats.maxIndustry} color="text-amber-400" />
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                 <h2 className="text-slate-200 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Sword size={16} className="text-red-400" /> Empire
                </h2>
                 <StatRow icon={Sword} label="Martial" value={gameState.stats.martial} color="text-red-400" />
                 <StatRow icon={Shield} label="Defense" value={gameState.stats.defense} color="text-blue-500" />
                 <StatRow icon={FlaskConical} label="Science" value={gameState.stats.science} color="text-purple-400" />
                 <StatRow icon={Palette} label="Culture" value={gameState.stats.culture} color="text-pink-400" />
                 <StatRow icon={Scroll} label="Faith" value={gameState.stats.faith} color="text-yellow-400" />
            </div>

            <div className="bg-gradient-to-r from-purple-900/40 to-slate-800 border border-purple-500/30 rounded-xl p-4">
                <div className="text-xs text-purple-300 uppercase tracking-widest mb-1">Cultural Era</div>
                <div className="text-xl font-bold text-purple-100">{gameState.culturalStage}</div>
            </div>
        </aside>

        {/* Center: 3D Map */}
        <section className="flex-1 relative bg-slate-950 p-0 flex flex-col">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                 <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-slate-200 text-sm font-bold">Active Region</span>
                </div>
            </div>
            
            {/* The 3D Canvas Wrapper */}
            <div className="w-full h-full shadow-inner">
                <MapScene tiles={tiles} onTileClick={handleTileClick} />
            </div>

            {/* Terrain Legend overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md rounded-full px-6 py-2 border border-slate-700 flex gap-6 text-xs shadow-2xl z-10">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#57534e] rotate-45 border border-slate-600"></div>
                    <span className="text-slate-300 font-medium">Mountains</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#14532d] rotate-45 border border-green-900"></div>
                    <span className="text-slate-300 font-medium">Forest</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#fbbf24] rotate-45 border border-yellow-700"></div>
                    <span className="text-slate-300 font-medium">Desert</span>
                 </div>
            </div>
        </section>

        {/* Right Sidebar: Actions */}
        <aside className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 z-10 shadow-xl">
            <div>
                <h2 className="text-amber-500 font-bold mb-5 flex items-center gap-2 text-sm uppercase tracking-widest">
                    <Hammer size={16} /> Construction
                </h2>
                
                <ActionButton 
                    type={BuildingType.House}
                    label="House"
                    cost={0}
                    desc="Increases population capacity. Uses Fertility."
                    colorClass="bg-orange-600"
                    icon={Home}
                />

                <ActionButton 
                    type={BuildingType.Wall}
                    label="Fortification"
                    cost={10}
                    desc="Defensive structure. +5 Defense."
                    colorClass="bg-slate-600"
                    icon={BrickWall}
                />

                <ActionButton 
                    type={BuildingType.Temple}
                    label="Temple"
                    cost={30}
                    desc="Religious center. Generates Faith."
                    colorClass="bg-blue-600"
                    icon={Landmark} // Better icon for temple
                />

                <ActionButton 
                    type={BuildingType.Amphitheatre}
                    label="Amphitheatre"
                    cost={100}
                    desc="Cultural wonder. Generates Culture."
                    colorClass="bg-pink-600"
                    icon={Users} // Representing audience
                />
            </div>

            {/* Message Log */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mt-auto">
                <h4 className="text-slate-500 text-xs font-bold mb-3 uppercase tracking-wider">Chronicle</h4>
                <div className="space-y-2">
                    {gameState.messages.map((msg, idx) => (
                        <div key={idx} className="text-xs text-slate-400 flex gap-2">
                            <span className="text-slate-600">•</span>
                            {msg}
                        </div>
                    ))}
                </div>
            </div>
        </aside>

      </main>
    </div>
  );
};

export default App;
