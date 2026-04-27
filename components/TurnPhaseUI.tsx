/**
 * TurnPhaseUI - Manages the visual flow through each turn's phases:
 * INCOME -> WORLD_EVENT -> CIV_EVENT -> ACTION -> RESOLUTION
 *
 * Each phase renders a distinct modal/panel that guides the student
 * through their turn decisions.
 */

import React, { useState, useMemo } from 'react';
import {
  Coins, Globe, MapPin, Zap, ChevronRight, Check, X, Sword, Shield,
  ShieldPlus, FlaskConical, Palette, Scroll, Sprout, Hammer, Handshake,
  Landmark, Clock, Star, Crown, TrendingUp, AlertTriangle, BookOpen, Quote,
} from 'lucide-react';
import type {
  GameState, WorldEvent, CivSpecificEvent, PlayerActionType,
  TurnPhaseV2, TurnResolution, BuildingType,
} from '../types';
import { BUILDING_COSTS } from '../types';
import {
  ACTION_DEFINITIONS, checkActionAvailability, previewAction,
  type ActionDefinition,
} from '../actionSystem';
import { WONDERS_LIST, RELIGION_TENETS } from '../constants';
import { getPrimarySourceForTurn } from '../primarySources';

// Icon mapping
const ICON_MAP: Record<string, React.FC<any>> = {
  Sword, Shield, ShieldPlus, FlaskConical, Palette, Scroll, Sprout, Hammer,
  Handshake, Landmark, Globe, Star, Crown, Zap,
};

interface TurnPhaseUIProps {
  phase: TurnPhaseV2;
  gameState: GameState;
  worldEvent: WorldEvent | null;
  civEvent: CivSpecificEvent | null;
  incomeMessages: string[];
  unlockedActions: ActionDefinition[];
  onUnlocksAcknowledge: () => void;
  onWorldEventChoice: (choice: 'A' | 'B' | 'C') => void;
  onCivEventAcknowledge: () => void;
  onBuildPhaseSelect: (buildingType: string) => void;
  onBuildPhaseSkip: () => void;
  onActionSelect: (action: PlayerActionType, params?: any) => void;
  onResolutionDismiss: () => void;
  turnResolution: TurnResolution | null;
  onPhaseRecovery?: () => void;
}

// ============================================================
// INCOME PHASE
// ============================================================
const IncomePhasePanel: React.FC<{
  messages: string[];
  gameState: GameState;
  onContinue: () => void;
}> = ({ messages, gameState, onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-amber-500/50 max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-400">Income Phase</h2>
            <p className="text-sm text-slate-400">Turn {gameState.turnNumber || 1} - {gameState.year > 0 ? `${gameState.year} AD` : `${Math.abs(gameState.year)} BC`}</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {messages.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-200">{msg}</span>
            </div>
          ))}
        </div>

        {/* Quick stat summary */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-xs">
          <div className="bg-slate-700/50 rounded p-2 text-center">
            <span className="text-amber-400 font-bold">{gameState.civilization.stats.productionPool}</span>
            <p className="text-slate-400">Prod Pool</p>
          </div>
          <div className="bg-slate-700/50 rounded p-2 text-center">
            <span className="text-green-400 font-bold">{gameState.civilization.stats.population}</span>
            <p className="text-slate-400">Population</p>
          </div>
          <div className="bg-slate-700/50 rounded p-2 text-center">
            <span className="text-blue-400 font-bold">{gameState.civilization.stats.capacity}</span>
            <p className="text-slate-400">Capacity</p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          Continue to Event <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// WORLD EVENT PHASE
// ============================================================
const WorldEventPanel: React.FC<{
  event: WorldEvent;
  gameState: GameState;
  onChoice: (choice: 'A' | 'B' | 'C') => void;
}> = ({ event, gameState, onChoice }) => {
  const [hoveredChoice, setHoveredChoice] = useState<'A' | 'B' | 'C' | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | 'C' | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sourceExpanded, setSourceExpanded] = useState(false);

  const eraColors: Record<string, string> = {
    Ancient: 'border-amber-500 bg-amber-500/10',
    Bronze: 'border-orange-500 bg-orange-500/10',
    Iron: 'border-slate-400 bg-slate-400/10',
    Classical: 'border-blue-500 bg-blue-500/10',
    Imperial: 'border-purple-500 bg-purple-500/10',
    Late: 'border-red-500 bg-red-500/10',
  };

  const eraTextColors: Record<string, string> = {
    Ancient: 'text-amber-400',
    Bronze: 'text-orange-400',
    Iron: 'text-slate-300',
    Classical: 'text-blue-400',
    Imperial: 'text-purple-400',
    Late: 'text-red-400',
  };

  const selectedChoiceData = selectedChoice ? event.choices.find(c => c.id === selectedChoice) : null;
  const primarySource = getPrimarySourceForTurn(event.turn);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-slate-800 rounded-xl border-2 max-w-2xl w-full p-6 shadow-2xl my-4 ${eraColors[event.era] || 'border-slate-600'}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${eraTextColors[event.era]} bg-slate-700`}>
                {event.era} Era
              </span>
              <span className="text-xs text-slate-500">Turn {event.turn}</span>
            </div>
            <h2 className="text-2xl font-bold text-white">{event.name}</h2>
            <p className="text-sm text-slate-400 mt-1">{event.yearLabel}</p>
          </div>
          <Globe className={`w-8 h-8 ${eraTextColors[event.era]}`} />
        </div>

        {/* Description */}
        <p className="text-slate-300 text-sm leading-relaxed mb-4">{event.description}</p>

        {/* Primary Source — Reading Like a Historian */}
        {primarySource && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-4 mb-4">
            <button
              type="button"
              onClick={() => setSourceExpanded(!sourceExpanded)}
              className="w-full flex items-center justify-between gap-2 mb-2 hover:text-amber-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Primary Source
                </span>
                <span className="text-[10px] text-amber-500/70 uppercase">
                  {primarySource.sourceType}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform ${sourceExpanded ? 'rotate-90' : ''}`} />
            </button>
            <div className="flex gap-2 items-start">
              <Quote className="w-4 h-4 text-amber-500/60 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-100 italic leading-relaxed">
                {primarySource.excerpt}
              </p>
            </div>
            <p className="text-xs text-amber-400/80 mt-2 text-right">
              — {primarySource.attribution}
            </p>

            {sourceExpanded && (
              <div className="mt-3 pt-3 border-t border-amber-700/40 space-y-2 text-xs text-amber-100/90">
                <div>
                  <p className="font-semibold text-amber-400 text-[10px] uppercase tracking-wider mb-0.5">
                    Sourcing
                  </p>
                  <p>{primarySource.sourcingQuestion}</p>
                </div>
                <div>
                  <p className="font-semibold text-amber-400 text-[10px] uppercase tracking-wider mb-0.5">
                    Context
                  </p>
                  <p>{primarySource.contextQuestion}</p>
                </div>
                <div>
                  <p className="font-semibold text-amber-400 text-[10px] uppercase tracking-wider mb-0.5">
                    Analysis
                  </p>
                  <p>{primarySource.analysisPrompt}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Effects */}
        {event.globalEffects.length > 0 && (
          <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
            <p className="text-xs font-semibold text-slate-400 mb-2">GLOBAL EFFECTS (all players):</p>
            {event.globalEffects.map((effect, i) => (
              <p key={i} className="text-sm text-slate-200 flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-400" /> {effect.message}
              </p>
            ))}
          </div>
        )}

        {/* REVEAL STATE: After confirming, show what happened */}
        {revealed && selectedChoiceData ? (
          <div>
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4 border border-green-500/30">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
                Your Choice: {selectedChoiceData.label}
              </p>
              <p className="text-xs text-slate-400 mb-3">{selectedChoiceData.description}</p>
              <div className="space-y-2">
                {selectedChoiceData.effects.map((effect, i) => {
                  const isNegative = effect.message && (effect.message.includes('-') || effect.message.toLowerCase().includes('lose'));
                  return (
                    <p key={i} className={`text-sm flex items-center gap-2 ${isNegative ? 'text-red-300' : 'text-green-300'}`}>
                      {isNegative
                        ? <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        : <Zap className="w-3 h-3 text-green-400 flex-shrink-0" />
                      }
                      {effect.message}
                    </p>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => selectedChoice && onChoice(selectedChoice)}
              className="w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* CHOICE STATE: Show only titles and descriptions, no effects */
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-3">Choose your response:</p>
            <div className="space-y-3 mb-4">
              {event.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => setSelectedChoice(choice.id)}
                  onMouseEnter={() => setHoveredChoice(choice.id)}
                  onMouseLeave={() => setHoveredChoice(null)}
                  className={`w-full text-left rounded-lg p-4 border-2 transition-all ${
                    selectedChoice === choice.id
                      ? 'border-green-500 bg-green-500/10'
                      : hoveredChoice === choice.id
                        ? 'border-slate-400 bg-slate-700/50'
                        : 'border-slate-600 bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-lg font-bold ${
                      selectedChoice === choice.id ? 'text-green-400' : 'text-slate-400'
                    }`}>{choice.id}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{choice.label}</h3>
                      <p className="text-xs text-slate-400 mt-1">{choice.description}</p>
                    </div>
                    {selectedChoice === choice.id && (
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => selectedChoice && setRevealed(true)}
              disabled={!selectedChoice}
              className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                selectedChoice
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Confirm Choice {selectedChoice && `(${selectedChoice})`} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// CIV-SPECIFIC EVENT PHASE
// ============================================================
const CivEventPanel: React.FC<{
  event: CivSpecificEvent;
  civName: string;
  onAcknowledge: () => void;
}> = ({ event, civName, onAcknowledge }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-cyan-500/50 max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-cyan-400 font-semibold">{civName} Special Event</p>
            <h2 className="text-xl font-bold text-white">{event.name}</h2>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-4">{event.description}</p>

        <div className="bg-slate-700/50 rounded-lg p-3 mb-6">
          {event.effects.map((effect, i) => (
            <p key={i} className="text-sm text-slate-200 flex items-center gap-2">
              <Star className="w-3 h-3 text-cyan-400" /> {effect.message}
            </p>
          ))}
        </div>

        <button
          onClick={onAcknowledge}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          Continue to Build <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// UNLOCK NOTIFICATION PHASE
// ============================================================
const UnlocksPanel: React.FC<{
  unlockedActions: ActionDefinition[];
  gameState: GameState;
  onContinue: () => void;
}> = ({ unlockedActions, gameState, onContinue }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = unlockedActions[currentIndex];
  if (!current) return null;

  const IconComponent = ICON_MAP[current.icon] || Zap;
  const isLast = currentIndex >= unlockedActions.length - 1;

  const categoryColors: Record<string, string> = {
    growth: 'from-green-600/30 to-green-900/30 border-green-500',
    military: 'from-red-600/30 to-red-900/30 border-red-500',
    economy: 'from-yellow-600/30 to-yellow-900/30 border-yellow-500',
    knowledge: 'from-cyan-600/30 to-cyan-900/30 border-cyan-500',
    diplomacy: 'from-teal-600/30 to-teal-900/30 border-teal-500',
  };

  const bgClass = categoryColors[current.category] || 'from-slate-600/30 to-slate-900/30 border-slate-500';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-b ${bgClass} border-2 rounded-xl max-w-lg w-full p-6 shadow-2xl backdrop-blur-sm`}>
        {/* Header with icon */}
        <div className="flex items-center gap-4 mb-5">
          <div className={`w-14 h-14 rounded-full bg-black/40 flex items-center justify-center border-2 ${bgClass.split(' ')[2]}`}>
            <IconComponent className={`w-7 h-7 ${current.color}`} />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              New Action Unlocked!
              {unlockedActions.length > 1 && ` (${currentIndex + 1}/${unlockedActions.length})`}
            </p>
            <h2 className="text-2xl font-bold text-white">{current.name}</h2>
          </div>
        </div>

        {/* Historical date badge */}
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-300">{current.unlockYear}</span>
        </div>

        {/* Historical context */}
        <div className="bg-black/30 rounded-lg p-4 mb-4 border border-white/10">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Historical Discovery</p>
          <p className="text-sm text-slate-200 leading-relaxed">{current.unlockHistoricalContext}</p>
        </div>

        {/* What this action does */}
        <div className="bg-black/20 rounded-lg p-3 mb-5 border border-white/5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">What You Can Now Do</p>
          <p className="text-sm text-white font-medium">{current.shortDesc}</p>
          <p className="text-xs text-slate-300 mt-1">{current.fullDesc}</p>
        </div>

        {/* Progress dots for multiple unlocks */}
        {unlockedActions.length > 1 && (
          <div className="flex justify-center gap-2 mb-4">
            {unlockedActions.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-amber-400' : i < currentIndex ? 'bg-amber-600' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => {
            if (isLast) {
              onContinue();
            } else {
              setCurrentIndex(currentIndex + 1);
            }
          }}
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isLast ? 'Continue to Event' : 'Next Unlock'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// ACTION SELECTION PHASE
// ============================================================
// BUILD PHASE - Separate from actions, happens every turn
// ============================================================
const BuildPhasePanel: React.FC<{
  gameState: GameState;
  onBuildSelect: (buildingType: string) => void;
  onSkip: () => void;
}> = ({ gameState, onBuildSelect, onSkip }) => {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const pool = gameState.civilization.stats.productionPool || 0;

  const buildings = [
    { type: 'Farm', cost: 5, effect: '+1 Capacity, +1 Production Income', icon: Sprout, color: 'text-green-400' },
    { type: 'Workshop', cost: 8, effect: '+2 Production Income', icon: Hammer, color: 'text-yellow-400' },
    { type: 'Library', cost: 10, effect: '+2 Science Yield', icon: FlaskConical, color: 'text-cyan-400' },
    { type: 'Temple', cost: 10, effect: '+2 Faith, +1 Faith Yield', icon: Landmark, color: 'text-purple-400' },
    { type: 'Amphitheatre', cost: 10, effect: '+2 Culture Yield, +3 Culture', icon: Crown, color: 'text-pink-400' },
    { type: 'Barracks', cost: 10, effect: '+3 Martial', icon: Sword, color: 'text-red-400' },
    { type: 'Wall', cost: 10, effect: '+1 Cap, +1d8 on defense (max 3 dice)', icon: Shield, color: 'text-red-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl border border-yellow-500/50 max-w-2xl w-full p-6 shadow-2xl my-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Hammer className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-yellow-400">Build Phase</h2>
            <p className="text-sm text-slate-400">Build as many structures as your Production Pool allows. Ally/convert with neighbors anytime. Click <b className="text-green-400">End Turn</b> when done.</p>
          </div>
          <div className="bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600">
            <span className="text-xs text-slate-400">Production Pool</span>
            <span className="text-lg font-bold text-yellow-400 ml-2">{pool}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {buildings.map(b => {
            const canAfford = pool >= b.cost;
            const isSelected = selectedBuilding === b.type;
            const IconComp = b.icon;
            return (
              <button
                key={b.type}
                onClick={() => canAfford && setSelectedBuilding(b.type)}
                disabled={!canAfford}
                className={`text-left rounded-lg p-3 border-2 transition-all ${
                  isSelected
                    ? 'border-yellow-500 bg-yellow-500/15 ring-2 ring-yellow-500/30'
                    : canAfford
                      ? 'border-slate-600 bg-slate-700/30 hover:border-slate-400 hover:bg-slate-700/50'
                      : 'border-slate-700 bg-slate-800/50 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <IconComp className={`w-5 h-5 ${isSelected ? 'text-yellow-400' : b.color}`} />
                  <span className={`text-sm font-bold ${isSelected ? 'text-yellow-300' : 'text-white'}`}>{b.type}</span>
                </div>
                <p className="text-[10px] text-slate-400">{b.effect}</p>
                <p className={`text-xs font-bold mt-1 ${canAfford ? 'text-yellow-400' : 'text-slate-600'}`}>{b.cost} Prod</p>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors text-sm flex items-center justify-center gap-2"
          >
            End Turn <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => selectedBuilding && onBuildSelect(selectedBuilding)}
            disabled={!selectedBuilding}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
              selectedBuilding
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            Build {selectedBuilding || '...'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ACTION SELECTION PHASE
// ============================================================
const ActionSelectionPanel: React.FC<{
  gameState: GameState;
  onActionSelect: (action: PlayerActionType, params?: any) => void;
}> = ({ gameState, onActionSelect }) => {
  const [selectedAction, setSelectedAction] = useState<PlayerActionType | null>(null);
  const [actionParams, setActionParams] = useState<any>({});

  // Check availability for each action (filter out 'build' - now its own phase)
  const actionStates = useMemo(() => {
    return ACTION_DEFINITIONS.filter(def => def.id !== 'build').map(def => ({
      def,
      availability: checkActionAvailability(def.id, gameState),
      preview: previewAction(def.id, gameState),
    }));
  }, [gameState]);

  const selectedDef = selectedAction
    ? actionStates.find(a => a.def.id === selectedAction)
    : null;

  // For trade/attack/diplomacy: target selection
  const needsTarget = selectedAction === 'trade' || selectedAction === 'attack' || selectedAction === 'diplomacy';
  const availableTargets = gameState.neighbors.filter(n => !n.isConquered);

  // For trade: stat selection
  const tradeStats = ['productionPool', 'science', 'culture', 'faith'];

  return (
    // Two-column layout: dimmed backdrop (game stays visible underneath)
    // on the left, right-anchored scrolling side panel on the right.
    // The backdrop is not click-dismissable because picking an action is
    // mandatory — there is no “dismiss without choosing” path here.
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-[1px]" aria-hidden="true" />
      <div className="w-full sm:w-[28rem] lg:w-[34rem] h-full bg-slate-800 border-l border-indigo-500/50 shadow-2xl overflow-y-auto">
        <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-indigo-400">Choose Your Action</h2>
            <p className="text-sm text-slate-400">Select ONE action for this turn. Choose wisely!</p>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {actionStates.map(({ def, availability }) => {
            const IconComponent = ICON_MAP[def.icon] || Zap;
            const isSelected = selectedAction === def.id;
            const isAvailable = availability.available;

            return (
              <button
                key={def.id}
                onClick={() => isAvailable && setSelectedAction(def.id)}
                disabled={!isAvailable}
                className={`relative text-center rounded-lg p-3 border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/15 ring-2 ring-indigo-500/30'
                    : isAvailable
                      ? 'border-slate-600 bg-slate-700/30 hover:border-slate-400 hover:bg-slate-700/50'
                      : 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
                }`}
              >
                <IconComponent className={`w-6 h-6 mx-auto mb-1 ${isSelected ? 'text-indigo-400' : def.color}`} />
                <p className={`text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-white'}`}>{def.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{def.shortDesc}</p>
                {!isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                    {def.unlockedAtTurn > (gameState.turnNumber || 1) ? (
                      <div className="text-center px-1">
                        <Clock className="w-4 h-4 text-slate-500 mx-auto mb-0.5" />
                        <p className="text-[9px] text-slate-500">Turn {def.unlockedAtTurn}</p>
                      </div>
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Action Detail */}
        {selectedDef && (
          <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-white mb-2">{selectedDef.def.name}</h3>
            <p className="text-sm text-slate-300 mb-3">{selectedDef.def.fullDesc}</p>

            {/* Preview */}
            <div className="space-y-1 mb-3">
              {selectedDef.preview.effects.map((effect, i) => (
                <p key={i} className="text-xs text-slate-200">{effect}</p>
              ))}
              {selectedDef.preview.warnings?.map((warning, i) => (
                <p key={i} className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {warning}
                </p>
              ))}
            </div>

            {/* Target Selection (for trade/attack/diplomacy) */}
            {needsTarget && availableTargets.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-400 mb-2">Select target:</p>
                <div className="flex flex-wrap gap-2">
                  {availableTargets.map(target => (
                    <button
                      key={target.id}
                      onClick={() => setActionParams((p: any) => ({ ...p, targetId: target.id }))}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                        actionParams.targetId === target.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {target.name} (Strength: {target.martial + target.defense})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trade stat selection */}
            {selectedAction === 'trade' && actionParams.targetId && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-400 mb-2">Trade for:</p>
                <div className="flex flex-wrap gap-2">
                  {tradeStats.map(stat => (
                    <button
                      key={stat}
                      onClick={() => setActionParams((p: any) => ({ ...p, stat, mutual: true }))}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                        actionParams.stat === stat
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      +2 {stat === 'productionPool' ? 'Production' : stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* WONDER: Wonder selection + investment */}
            {selectedAction === 'wonder' && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-400 mb-2">
                  Select Wonder to invest in ({gameState.civilization.stats.productionPool} Production available):
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {WONDERS_LIST.filter(w => {
                    if (gameState.civilization.builtWonderId === w.id) return false;
                    if (gameState.year < w.minYear) return false;
                    return true;
                  }).map(w => {
                    const isSelected = actionParams.wonderId === w.id;
                    const wip = gameState.civilization.wonderInProgress;
                    const inProgress = wip && wip.wonderId === w.id;
                    const invested = inProgress ? wip!.invested : 0;
                    const remaining = Math.max(0, w.cost - invested);
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          const defaultAmt = Math.max(1, Math.min(gameState.civilization.stats.productionPool, remaining));
                          setActionParams((p: any) => ({ ...p, wonderId: w.id, amount: defaultAmt }));
                        }}
                        className={`w-full text-left text-xs p-2 rounded border transition-colors ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                            : inProgress
                              ? 'border-amber-500/60 bg-amber-500/10 text-amber-100 hover:border-amber-400'
                              : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold">{w.name}</span>
                          {inProgress ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/30 border border-amber-500/60 text-amber-200 px-2 py-0.5 rounded shrink-0">
                              {invested}/{w.cost}
                            </span>
                          ) : (
                            <span className="text-slate-400">Cost: {w.cost} | Era: {w.era}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{w.effects}</p>
                        {inProgress && (
                          <p className="text-[10px] text-amber-300 mt-1">
                            In progress — {remaining} Production to complete.
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
                {actionParams.wonderId && (() => {
                  const w = WONDERS_LIST.find(x => x.id === actionParams.wonderId);
                  if (!w) return null;
                  const wip = gameState.civilization.wonderInProgress;
                  const invested = wip && wip.wonderId === w.id ? wip.invested : 0;
                  const remaining = Math.max(0, w.cost - invested);
                  // Slider max is bounded by player's productionPool. We don't
                  // cap by remaining/1.5 because over-investing the last turn
                  // is fine (excess is forgiven by the >= cost completion check).
                  const sliderMax = Math.max(1, gameState.civilization.stats.productionPool);
                  const amt = Math.min(actionParams.amount || 1, sliderMax);
                  // Project Leadership bonus: 1.5x contribution.
                  const contribution = Math.floor(amt * 1.5);
                  const bonus = contribution - amt;
                  const projectedTotal = invested + contribution;
                  return (
                    <div className="mt-2">
                      <p className="text-xs text-slate-400 mb-1">
                        Investment amount{invested > 0 ? ` (${invested} already invested)` : ''}:
                      </p>
                      <input
                        type="range"
                        min={1}
                        max={sliderMax}
                        value={amt}
                        onChange={(e) => setActionParams((p: any) => ({ ...p, amount: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <p className="text-xs text-center text-indigo-300 font-bold">
                        {amt} Production Pool → {contribution} wonder progress (+{bonus} from Project Leadership)
                      </p>
                      <p className="text-[10px] text-center text-amber-300 mt-0.5">
                        After this: {Math.min(projectedTotal, w.cost)}/{w.cost}
                        {projectedTotal >= w.cost ? ' — completes the Wonder!' : ` (${Math.max(0, w.cost - projectedTotal)} progress to go)`}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* WORSHIP: Religion founding option */}
            {selectedAction === 'worship' && (() => {
              const canFound = gameState.civilization.stats.faith >= 10 &&
                gameState.civilization.buildings.temples > 0 &&
                gameState.gameFlags.religionUnlocked &&
                !gameState.civilization.religion.name;
              return canFound ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-400 mb-2">You can found a religion!</p>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setActionParams((p: any) => ({ ...p, foundReligion: false }))}
                      className={`flex-1 text-xs py-2 rounded border transition-colors ${
                        !actionParams.foundReligion
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      Worship (+Faith)
                    </button>
                    <button
                      onClick={() => setActionParams((p: any) => ({ ...p, foundReligion: true }))}
                      className={`flex-1 text-xs py-2 rounded border transition-colors ${
                        actionParams.foundReligion
                          ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                          : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      Found Religion
                    </button>
                  </div>
                  {actionParams.foundReligion && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Name your religion..."
                        value={actionParams.religionName || ''}
                        onChange={(e) => setActionParams((p: any) => ({ ...p, religionName: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500"
                      />
                      <p className="text-xs text-slate-400">Choose a tenet:</p>
                      <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto">
                        {RELIGION_TENETS.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setActionParams((p: any) => ({ ...p, tenetId: t.id }))}
                            className={`text-left text-[10px] p-1.5 rounded border transition-colors ${
                              actionParams.tenetId === t.id
                                ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                                : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-400'
                            }`}
                          >
                            <span className="font-bold block">{t.name}</span>
                            <span className="text-slate-400">{t.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null;
            })()}
          </div>
        )}

        <button
          onClick={() => {
            if (!selectedAction) return;
            // Validate params for actions that need them
            if (selectedAction === 'wonder' && (!actionParams.wonderId || !actionParams.amount)) return;
            if (selectedAction === 'worship' && actionParams.foundReligion && (!actionParams.religionName || !actionParams.tenetId)) return;
            if (needsTarget && !actionParams.targetId) return;
            onActionSelect(selectedAction, actionParams);
          }}
          disabled={!selectedAction ||
            (needsTarget && !actionParams.targetId) ||
            (selectedAction === 'wonder' && (!actionParams.wonderId || !actionParams.amount)) ||
            (selectedAction === 'worship' && actionParams.foundReligion && (!actionParams.religionName || !actionParams.tenetId))
          }
          className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
            selectedAction &&
            (!needsTarget || actionParams.targetId) &&
            (selectedAction !== 'wonder' || (actionParams.wonderId && actionParams.amount)) &&
            (selectedAction !== 'worship' || !actionParams.foundReligion || (actionParams.religionName && actionParams.tenetId))
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Execute Action <ChevronRight className="w-4 h-4" />
        </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// RESOLUTION PHASE
// ============================================================
const ResolutionPanel: React.FC<{
  resolution: TurnResolution;
  gameState: GameState;
  onDismiss: () => void;
}> = ({ resolution, gameState, onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl border border-green-500/50 max-w-lg w-full p-6 shadow-2xl my-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-400">Turn {resolution.turn} Complete</h2>
            <p className="text-sm text-slate-400">{gameState.year > 0 ? `${gameState.year} AD` : `${Math.abs(gameState.year)} BC`}</p>
          </div>
        </div>

        {/* Summary sections */}
        <div className="space-y-3 mb-6">
          {/* Income */}
          <div className="bg-amber-500/10 rounded p-3 border border-amber-500/30">
            <p className="text-xs font-semibold text-amber-400 mb-1">INCOME</p>
            <p className="text-sm text-slate-200">+{resolution.incomeGained} Production Pool</p>
          </div>

          {/* World Event */}
          <div className="bg-blue-500/10 rounded p-3 border border-blue-500/30">
            <p className="text-xs font-semibold text-blue-400 mb-1">WORLD EVENT: {resolution.worldEventName}</p>
            <p className="text-xs text-slate-300 mb-1">Choice: {resolution.choiceMade}</p>
            {resolution.choiceEffects.map((effect, i) => (
              <p key={i} className="text-xs text-slate-200">{effect}</p>
            ))}
          </div>

          {/* Civ Event */}
          {resolution.civEventName && (
            <div className="bg-cyan-500/10 rounded p-3 border border-cyan-500/30">
              <p className="text-xs font-semibold text-cyan-400 mb-1">CIV EVENT: {resolution.civEventName}</p>
              {resolution.civEventEffects?.map((effect, i) => (
                <p key={i} className="text-xs text-slate-200">{effect}</p>
              ))}
            </div>
          )}

          {/* Action */}
          <div className="bg-indigo-500/10 rounded p-3 border border-indigo-500/30">
            <p className="text-xs font-semibold text-indigo-400 mb-1">ACTION: {resolution.actionTaken.toUpperCase()}</p>
            {resolution.actionEffects.map((effect, i) => (
              <p key={i} className="text-xs text-slate-200">{effect}</p>
            ))}
          </div>
        </div>

        {/* Stat changes */}
        <div className="bg-slate-700/50 rounded-lg p-3 mb-6">
          <p className="text-xs font-semibold text-slate-400 mb-2">STAT CHANGES:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {Object.entries(resolution.statsAfter).map(([key, after]) => {
              const before = (resolution.statsBefore as any)[key] ?? 0;
              const diff = (after as number) - before;
              if (diff === 0) return null;
              return (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-slate-400 capitalize">{key}:</span>
                  <span className={diff > 0 ? 'text-green-400' : 'text-red-400'}>
                    {diff > 0 ? '+' : ''}{diff}
                  </span>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
        >
          End Turn
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const TurnPhaseUI: React.FC<TurnPhaseUIProps> = ({
  phase,
  gameState,
  worldEvent,
  civEvent,
  incomeMessages,
  unlockedActions,
  onUnlocksAcknowledge,
  onWorldEventChoice,
  onCivEventAcknowledge,
  onBuildPhaseSelect,
  onBuildPhaseSkip,
  onActionSelect,
  onResolutionDismiss,
  turnResolution,
  onPhaseRecovery,
}) => {
  if (phase === 'idle') return null;

  // Recovery modal for stuck states - shown when phase data is missing
  const RecoveryModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-orange-500/50 max-w-sm w-full p-6 shadow-2xl text-center">
        <AlertTriangle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-orange-400 mb-2">Phase Error</h2>
        <p className="text-sm text-slate-400 mb-4">
          The turn got into an unexpected state. Click below to recover.
        </p>
        <button
          onClick={() => onPhaseRecovery?.()}
          className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-colors"
        >
          Recover &amp; Continue
        </button>
      </div>
    </div>
  );

  switch (phase) {
    case 'income':
      return (
        <IncomePhasePanel
          messages={incomeMessages}
          gameState={gameState}
          onContinue={() => onCivEventAcknowledge()} // Advance to next phase (handled by parent)
        />
      );

    case 'unlocks':
      if (!unlockedActions || unlockedActions.length === 0) return <RecoveryModal />;
      return (
        <UnlocksPanel
          unlockedActions={unlockedActions}
          gameState={gameState}
          onContinue={onUnlocksAcknowledge}
        />
      );

    case 'world_event':
      if (!worldEvent) return <RecoveryModal />;
      return (
        <WorldEventPanel
          event={worldEvent}
          gameState={gameState}
          onChoice={onWorldEventChoice}
        />
      );

    case 'civ_event':
      if (!civEvent) return <RecoveryModal />;
      return (
        <CivEventPanel
          event={civEvent}
          civName={gameState.civilization.name}
          onAcknowledge={onCivEventAcknowledge}
        />
      );

    case 'build_phase':
      return (
        <BuildPhasePanel
          gameState={gameState}
          onBuildSelect={onBuildPhaseSelect}
          onSkip={onBuildPhaseSkip}
        />
      );

    case 'action':
      return (
        <ActionSelectionPanel
          gameState={gameState}
          onActionSelect={onActionSelect}
        />
      );

    case 'resolution':
      if (!turnResolution) return <RecoveryModal />;
      return (
        <ResolutionPanel
          resolution={turnResolution}
          gameState={gameState}
          onDismiss={onResolutionDismiss}
        />
      );

    default:
      return <RecoveryModal />;
  }
};

// ============================================================
// CONQUEST REWARD PANEL
// Shows what the victor gained from conquering
// ============================================================
export const ConquestRewardPanel: React.FC<{
  messages: string[];
  conqueredName: string;
  onDismiss: () => void;
}> = ({ messages, conqueredName, onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-amber-500/50 max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-400">Conquest: {conqueredName} Falls!</h2>
            <p className="text-sm text-slate-400">Your empire expands. New territories and buildings are yours.</p>
          </div>
        </div>

        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`text-sm px-3 py-2 rounded ${
              msg.includes('+') ? 'bg-green-900/30 text-green-300 border border-green-700/30' :
              'bg-slate-700/50 text-slate-200'
            }`}>
              {msg}
            </div>
          ))}
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
        >
          Claim Territory
        </button>
      </div>
    </div>
  );
};

// ============================================================
// RESPAWN SELECTION PANEL
// Shown to conquered players to pick their new civ + bonus
// ============================================================
export const RespawnPanel: React.FC<{
  availableCivs: Array<{ id: string; name: string; trait: string; traitDescription: string; region: string; baseStats: any }>;
  bonuses: Array<{ id: string; name: string; description: string }>;
  onSelect: (civId: string, bonusId: string) => void;
}> = ({ availableCivs, bonuses, onSelect }) => {
  const [selectedCiv, setSelectedCiv] = useState<string | null>(null);
  const [selectedBonus, setSelectedBonus] = useState<string | null>(null);

  const selectedCivData = availableCivs.find(c => c.id === selectedCiv);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl border border-red-500/50 max-w-3xl w-full p-6 shadow-2xl my-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Sword className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-400">Your Civilization Has Fallen!</h2>
            <p className="text-sm text-slate-400">But history doesn't end. Choose a successor civilization to rise from the ashes.</p>
          </div>
        </div>

        {/* Civ Selection */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Choose Your New Civilization</h3>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {availableCivs.map(civ => (
              <button
                key={civ.id}
                onClick={() => setSelectedCiv(civ.id)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selectedCiv === civ.id
                    ? 'border-red-500 bg-red-500/15 ring-1 ring-red-500/30'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-400'
                }`}
              >
                <p className="font-bold text-sm text-white">{civ.name}</p>
                <p className="text-[10px] text-slate-400">{civ.region}</p>
                <p className="text-[10px] text-amber-400 mt-1">{civ.trait}</p>
                <div className="flex gap-2 mt-1 text-[10px] text-slate-500">
                  <span>M:{civ.baseStats.martial + (civ.baseStats.defense || 0)}</span>
                  <span>PI:{civ.baseStats.productionIncome}</span>
                  <span>SY:{civ.baseStats.scienceYield}</span>
                  <span>CY:{civ.baseStats.cultureYield}</span>
                  <span>FY:{civ.baseStats.faithYield}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected civ detail */}
        {selectedCivData && (
          <div className="bg-slate-700/50 rounded-lg p-3 mb-4 border border-slate-600">
            <p className="text-sm font-bold text-white">{selectedCivData.name}: {selectedCivData.trait}</p>
            <p className="text-xs text-slate-300 mt-1">{selectedCivData.traitDescription}</p>
          </div>
        )}

        {/* Bonus Selection */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Choose One Respawn Bonus</h3>
          <div className="grid grid-cols-4 gap-2">
            {bonuses.map(bonus => (
              <button
                key={bonus.id}
                onClick={() => setSelectedBonus(bonus.id)}
                className={`text-center p-2 rounded border transition-all ${
                  selectedBonus === bonus.id
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-400'
                }`}
              >
                <p className="text-xs font-bold">{bonus.name}</p>
                <p className="text-[10px] text-slate-400">{bonus.description}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => selectedCiv && selectedBonus && onSelect(selectedCiv, selectedBonus)}
          disabled={!selectedCiv || !selectedBonus}
          className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
            selectedCiv && selectedBonus
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Rise as {selectedCivData?.name || '...'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TurnPhaseUI;
