/**
 * DECISION MODALS
 *
 * A single file that exposes every "prominent popup" the student sees
 * outside of the normal turn phases:
 *
 *   - AttackOutcomeModal  — Battle report after each Attack action.
 *   - ThresholdModal      — Milestone reached (Science, Culture, Faith).
 *   - TechTreeModal       — Browse technologies + lock/unlock state.
 *   - ReligionTreeModal   — Pick a tenet (sequential growth).
 *   - CultureTreeModal    — Pick a cultural bonus per stage.
 *
 * Every modal uses the same visual shell: a dark overlay with a slate
 * panel, amber accents, and a primary "acknowledge" action at the bottom.
 * Share helpers are kept at the top of the file so individual modals are
 * easy to diff.
 */

import React, { useMemo } from 'react';
import type {
  GameState,
  AttackOutcomePopup,
  ThresholdPopup,
  ReligionTenet,
  ScienceUnlock,
} from '../types';
import {
  SCIENCE_UNLOCKS,
  RELIGION_TENETS,
  CULTURAL_STAGE_THRESHOLDS,
  CULTURAL_STAGE_MULTIPLIERS,
} from '../constants';

// Sound-free dice rendering. A simple inline pip layout so the numbers feel
// physical — students remember dice, not numbers.
const Dice: React.FC<{ value: number; tone?: 'attacker' | 'defender' | 'wall' | 'fortify' }> = ({
  value,
  tone = 'attacker',
}) => {
  const toneColors: Record<string, string> = {
    attacker: 'bg-red-500/20 border-red-400/50 text-red-200',
    defender: 'bg-sky-500/20 border-sky-400/50 text-sky-200',
    wall: 'bg-stone-500/20 border-stone-400/50 text-stone-200',
    fortify: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded border font-bold text-sm ${toneColors[tone]}`}
    >
      {value}
    </span>
  );
};

// ============================================================
// ATTACK OUTCOME MODAL
// ============================================================
export const AttackOutcomeModal: React.FC<{
  popup: AttackOutcomePopup;
  onClose: () => void;
}> = ({ popup, onClose }) => {
  const outcomeColor =
    popup.outcome === 'decisive_victory'
      ? 'text-amber-400 border-amber-500/50 bg-amber-500/10'
      : popup.outcome === 'victory'
        ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10'
        : popup.outcome === 'stalemate'
          ? 'text-slate-300 border-slate-500/50 bg-slate-500/10'
          : 'text-red-400 border-red-500/50 bg-red-500/10';

  const outcomeLabel: Record<AttackOutcomePopup['outcome'], string> = {
    decisive_victory: 'DECISIVE VICTORY',
    victory: 'VICTORY',
    stalemate: 'STALEMATE',
    defeat: 'DEFEAT',
  };

  const rolls = popup.rolls;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-800 rounded-xl border border-red-500/50 max-w-2xl w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Turn {popup.turn} · {popup.attackerName} vs {popup.targetName}
            </p>
            <h2 className={`text-3xl font-black mt-1 ${outcomeColor.split(' ')[0]}`}>
              {outcomeLabel[popup.outcome]}
            </h2>
          </div>
          <div className={`px-4 py-2 rounded-lg border text-right ${outcomeColor}`}>
            <p className="text-[10px] uppercase tracking-wider">Margin</p>
            <p className="text-2xl font-black">{popup.margin >= 0 ? `+${popup.margin}` : popup.margin}</p>
          </div>
        </div>

        {/* Battle report */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-3">
            <p className="text-xs font-bold text-red-300 mb-2">
              Attacker · {popup.attackerName}
            </p>
            {rolls ? (
              <>
                <p className="text-sm text-slate-300">
                  Martial <span className="font-bold text-white">{rolls.attackerMartial}</span>
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-slate-400">+d6 →</span>
                  <Dice value={rolls.attackerBaseRoll} tone="attacker" />
                </div>
              </>
            ) : null}
            <div className="mt-3 pt-2 border-t border-red-500/20">
              <p className="text-[10px] text-slate-400 uppercase">Total</p>
              <p className="text-2xl font-black text-red-300">{popup.attackTotal}</p>
            </div>
          </div>

          <div className="bg-sky-500/5 border border-sky-500/30 rounded-lg p-3">
            <p className="text-xs font-bold text-sky-300 mb-2">
              Defender · {popup.targetName}
            </p>
            {rolls ? (
              <>
                <p className="text-sm text-slate-300">
                  Martial <span className="font-bold text-white">{rolls.defenderMartial}</span>
                </p>
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <span className="text-xs text-slate-400">+d6 →</span>
                  <Dice value={rolls.defenderBaseRoll} tone="defender" />
                </div>
                {rolls.wallDice.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <span className="text-xs text-stone-300">Walls →</span>
                    {rolls.wallDice.map((v, i) => (
                      <Dice key={`w${i}`} value={v} tone="wall" />
                    ))}
                  </div>
                )}
                {rolls.bypassedWalls && (
                  <p className="text-[10px] text-amber-300 mt-1">
                    ⚡ Siege Engineering bypassed wall dice.
                  </p>
                )}
                {rolls.fortifyDice.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <span className="text-xs text-emerald-300">Fortify →</span>
                    {rolls.fortifyDice.map((v, i) => (
                      <Dice key={`f${i}`} value={v} tone="fortify" />
                    ))}
                  </div>
                )}
              </>
            ) : null}
            <div className="mt-3 pt-2 border-t border-sky-500/20">
              <p className="text-[10px] text-slate-400 uppercase">Total</p>
              <p className="text-2xl font-black text-sky-300">{popup.defendTotal}</p>
            </div>
          </div>
        </div>

        {/* Effects */}
        {popup.effects.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-600/50 rounded-lg p-3 mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Effects</p>
            <ul className="space-y-1">
              {popup.effects.map((e, i) => (
                <li key={i} className="text-sm text-slate-200">• {e}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// ============================================================
// THRESHOLD MODAL
// ============================================================
export const ThresholdModal: React.FC<{
  popup: ThresholdPopup;
  onClose: () => void;
}> = ({ popup, onClose }) => {
  const tintByKind: Record<ThresholdPopup['kind'], string> = {
    science: 'from-cyan-900/40 to-cyan-950/40 border-cyan-500/50',
    culture: 'from-purple-900/40 to-purple-950/40 border-purple-500/50',
    faith: 'from-violet-900/40 to-violet-950/40 border-violet-500/50',
    population: 'from-emerald-900/40 to-emerald-950/40 border-emerald-500/50',
    martial: 'from-red-900/40 to-red-950/40 border-red-500/50',
    wonder: 'from-amber-900/40 to-amber-950/40 border-amber-500/50',
  };
  const headerColor: Record<ThresholdPopup['kind'], string> = {
    science: 'text-cyan-300',
    culture: 'text-purple-300',
    faith: 'text-violet-300',
    population: 'text-emerald-300',
    martial: 'text-red-300',
    wonder: 'text-amber-300',
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div
        className={`bg-gradient-to-b ${tintByKind[popup.kind]} rounded-xl border max-w-xl w-full p-6 shadow-2xl`}
      >
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Milestone Reached</p>
        <h2 className={`text-2xl font-black mb-1 ${headerColor[popup.kind]}`}>{popup.title}</h2>
        <p className="text-sm text-slate-300 italic mb-3">{popup.subtitle}</p>
        <p className="text-sm text-slate-200 leading-relaxed mb-4">{popup.description}</p>

        {popup.bonuses.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-600/50 rounded-lg p-3 mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">What you gain</p>
            <ul className="space-y-1">
              {popup.bonuses.map((b, i) => (
                <li key={i} className="text-sm text-slate-100">• {b}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-100 hover:bg-white text-slate-900 font-bold rounded-lg transition-colors"
        >
          {popup.cta || 'Acknowledge'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// TECH TREE MODAL
// ============================================================
export const TechTreeModal: React.FC<{
  gameState: GameState;
  onClose: () => void;
}> = ({ gameState, onClose }) => {
  const science = gameState.civilization?.stats?.science || 0;
  const nextUnlock = useMemo(
    () => SCIENCE_UNLOCKS.find((u) => u.level > science),
    [science],
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[55] p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl border border-cyan-500/50 max-w-3xl w-full p-6 shadow-2xl my-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Technology Tree</p>
            <h2 className="text-2xl font-black text-cyan-300">Science {science}</h2>
          </div>
          {nextUnlock && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Next unlock</p>
              <p className="text-sm font-bold text-cyan-200">Level {nextUnlock.level}</p>
              <div className="w-40 h-2 bg-slate-700 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${Math.min(100, (science / nextUnlock.level) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {SCIENCE_UNLOCKS.map((u: ScienceUnlock) => {
            const unlocked = science >= u.level;
            return (
              <div
                key={u.level}
                className={`rounded-lg border p-3 ${
                  unlocked
                    ? 'border-cyan-500/40 bg-cyan-500/5'
                    : 'border-slate-700 bg-slate-900/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-bold ${unlocked ? 'text-cyan-200' : 'text-slate-400'}`}>
                    Level {u.level} · {u.effect.split(':')[0]}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded ${
                      unlocked ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {unlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{u.effect.split(':').slice(1).join(':').trim() || u.effect}</p>
                {u.statBonus && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Grants:{' '}
                    {Object.entries(u.statBonus)
                      .map(([k, v]) => `+${v} ${k}`)
                      .join(', ')}
                  </p>
                )}
                {u.unlocks && (
                  <p className="text-[11px] text-amber-300 mt-1">
                    Unlocks ability: <span className="italic">{u.unlocks}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ============================================================
// RELIGION TREE MODAL
// ============================================================
// Players pick tenets as their faith grows. Thresholds:
//   Faith >= 10 → found religion + pick first tenet
//   Faith >= 25 → pick second tenet
//   Faith >= 50 → pick third tenet
export const RELIGION_TENET_THRESHOLDS = [10, 25, 50];

export const ReligionTreeModal: React.FC<{
  gameState: GameState;
  onPickTenet: (tenetId: string) => void;
  onClose: () => void;
}> = ({ gameState, onPickTenet, onClose }) => {
  const civ = gameState.civilization;
  const faith = civ?.stats?.faith || 0;
  const chosen = civ?.religion?.tenets || [];
  const slotsUnlocked = RELIGION_TENET_THRESHOLDS.filter((t) => faith >= t).length;
  const canPick = slotsUnlocked > chosen.length;

  // Group tenets by playstyle so the tree structure is visible.
  const branches: { title: string; color: string; tenets: ReligionTenet[] }[] = [
    {
      title: 'War Branch',
      color: 'border-red-500/50 text-red-300',
      tenets: RELIGION_TENETS.filter((t) => ['holy_war', 'monotheism'].includes(t.id)),
    },
    {
      title: 'Knowledge Branch',
      color: 'border-cyan-500/50 text-cyan-300',
      tenets: RELIGION_TENETS.filter((t) => ['philosophy', 'scriptures'].includes(t.id)),
    },
    {
      title: 'Spirit Branch',
      color: 'border-violet-500/50 text-violet-300',
      tenets: RELIGION_TENETS.filter((t) => ['polytheism', 'asceticism', 'evangelism'].includes(t.id)),
    },
    {
      title: 'Life Branch',
      color: 'border-emerald-500/50 text-emerald-300',
      tenets: RELIGION_TENETS.filter((t) => ['medicine', 'christianity'].includes(t.id)),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[55] p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl border border-violet-500/50 max-w-4xl w-full p-6 shadow-2xl my-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Religion Tree</p>
            <h2 className="text-2xl font-black text-violet-300">
              {civ?.religion?.name || 'No religion founded yet'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Faith {faith} · Tenets chosen {chosen.length}/{RELIGION_TENET_THRESHOLDS.length}
              {' · '}
              Next tenet at Faith{' '}
              {RELIGION_TENET_THRESHOLDS[chosen.length] ?? '—'}
            </p>
          </div>
        </div>

        {!civ?.religion?.name && (
          <div className="bg-slate-900/60 border border-slate-600/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-slate-300">
              You can preview the tree, but tenets unlock as your Faith grows. Found a
              religion through the Worship action (Faith ≥ 10 + one Temple).
            </p>
          </div>
        )}

        {canPick && (
          <div className="bg-violet-500/10 border border-violet-500/50 rounded-lg p-3 mb-4">
            <p className="text-sm font-bold text-violet-200">
              You have {slotsUnlocked - chosen.length} tenet{slotsUnlocked - chosen.length === 1 ? '' : 's'}{' '}
              to choose.
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Tap any tenet below to adopt it. Tenets stack — you can branch across
              playstyles.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {branches.map((b) => (
            <div key={b.title} className={`rounded-lg border bg-slate-900/40 p-3 ${b.color}`}>
              <p className="text-xs font-bold uppercase mb-2">{b.title}</p>
              <div className="space-y-2">
                {b.tenets.map((t) => {
                  const isChosen = chosen.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      disabled={isChosen || !canPick}
                      onClick={() => onPickTenet(t.id)}
                      className={`w-full text-left rounded-md border p-2 transition-colors ${
                        isChosen
                          ? 'border-amber-500/70 bg-amber-500/10 text-amber-200'
                          : canPick
                            ? 'border-slate-600 bg-slate-800 text-slate-200 hover:border-violet-400 hover:bg-violet-500/10'
                            : 'border-slate-700 bg-slate-900/40 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{t.name}</span>
                        {isChosen && <span className="text-[10px] uppercase">Adopted</span>}
                      </div>
                      <p className="text-[11px] opacity-80 mt-0.5">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ============================================================
// CULTURE TREE MODAL
// ============================================================
// Each cultural stage offers a distinct bonus. Students pick one per
// stage. We offer three options at each stage so the tree genuinely
// branches rather than being a linear upgrade.
export interface CultureChoice {
  id: string;
  stage: 'Classical' | 'Imperial' | 'Enlightenment' | 'Modern';
  label: string;
  description: string;
  grants: string; // human-readable summary
  statBonus?: Partial<{
    martial: number;
    defense: number;
    science: number;
    scienceYield: number;
    cultureYield: number;
    faithYield: number;
    productionIncome: number;
    capacity: number;
    diplomacy: number;
  }>;
}

export const CULTURE_CHOICES: CultureChoice[] = [
  // CLASSICAL
  { id: 'cl_military',  stage: 'Classical',     label: 'Military Tradition', description: 'Citizen-soldier ethos.', grants: '+2 Martial, +1 Production Income', statBonus: { martial: 2, productionIncome: 1 } },
  { id: 'cl_scholarly', stage: 'Classical',     label: 'Scholarly Tradition', description: 'Academies & scribes.', grants: '+1 Science Yield, +2 Science Total', statBonus: { scienceYield: 1, science: 2 } },
  { id: 'cl_civic',     stage: 'Classical',     label: 'Civic Tradition',    description: 'Public forums & voting.', grants: '+1 Culture Yield, +2 Diplomacy', statBonus: { cultureYield: 1, diplomacy: 2 } },

  // IMPERIAL
  { id: 'im_legions',   stage: 'Imperial',      label: 'Imperial Legions',  description: 'Standing armies.', grants: '+3 Martial, +1 Defense', statBonus: { martial: 3, defense: 1 } },
  { id: 'im_roads',     stage: 'Imperial',      label: 'Roads & Aqueducts', description: 'Infrastructure network.', grants: '+2 Production Income, +2 Capacity', statBonus: { productionIncome: 2, capacity: 2 } },
  { id: 'im_art',       stage: 'Imperial',      label: 'Imperial Patronage', description: 'State-sponsored arts.', grants: '+2 Culture Yield, +1 Faith Yield', statBonus: { cultureYield: 2, faithYield: 1 } },

  // ENLIGHTENMENT
  { id: 'en_academy',   stage: 'Enlightenment', label: 'Academy of Science', description: 'Method, not superstition.', grants: '+2 Science Yield, +3 Science Total', statBonus: { scienceYield: 2, science: 3 } },
  { id: 'en_salons',    stage: 'Enlightenment', label: 'Philosophical Salons', description: 'Ideas travel as goods do.', grants: '+2 Diplomacy, +1 Culture Yield', statBonus: { diplomacy: 2, cultureYield: 1 } },
  { id: 'en_discipline', stage: 'Enlightenment', label: 'Professional Discipline', description: 'Drilled standing forces.', grants: '+4 Martial, +2 Defense', statBonus: { martial: 4, defense: 2 } },

  // MODERN
  { id: 'mo_industrial', stage: 'Modern',        label: 'Industrial Base',    description: 'Factories at scale.', grants: '+3 Production Income, +3 Capacity', statBonus: { productionIncome: 3, capacity: 3 } },
  { id: 'mo_enlightened', stage: 'Modern',        label: 'Modern Research',    description: 'Universities & labs.', grants: '+3 Science Yield, +5 Science Total', statBonus: { scienceYield: 3, science: 5 } },
  { id: 'mo_cultural',   stage: 'Modern',        label: 'Cultural Zenith',    description: 'Global cultural soft power.', grants: '+3 Culture Yield, +3 Diplomacy', statBonus: { cultureYield: 3, diplomacy: 3 } },
];

export const CultureTreeModal: React.FC<{
  gameState: GameState;
  chosenCultureIds: string[];
  onPickCulture: (choiceId: string) => void;
  onClose: () => void;
}> = ({ gameState, chosenCultureIds, onPickCulture, onClose }) => {
  const culture = gameState.civilization?.stats?.culture || 0;
  const currentStage = gameState.civilization?.culturalStage || 'Barbarism';

  const stageReached = (stage: 'Classical' | 'Imperial' | 'Enlightenment' | 'Modern') => {
    const t = CULTURAL_STAGE_THRESHOLDS.find((s) => s.stage === stage);
    return t ? culture >= t.minCulture : false;
  };

  const stageColor: Record<string, string> = {
    Classical: 'border-amber-500/50 text-amber-300',
    Imperial: 'border-rose-500/50 text-rose-300',
    Enlightenment: 'border-cyan-500/50 text-cyan-300',
    Modern: 'border-emerald-500/50 text-emerald-300',
  };

  const stageOrder: CultureChoice['stage'][] = ['Classical', 'Imperial', 'Enlightenment', 'Modern'];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[55] p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl border border-amber-500/50 max-w-4xl w-full p-6 shadow-2xl my-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Culture Tree</p>
            <h2 className="text-2xl font-black text-amber-300">Stage · {currentStage}</h2>
            <p className="text-xs text-slate-400 mt-1">Culture {culture}</p>
          </div>
        </div>

        <div className="space-y-4">
          {stageOrder.map((stage) => {
            const reached = stageReached(stage);
            const choices = CULTURE_CHOICES.filter((c) => c.stage === stage);
            const alreadyPicked = choices.some((c) => chosenCultureIds.includes(c.id));
            const threshold = CULTURAL_STAGE_THRESHOLDS.find((s) => s.stage === stage);
            const multipliers = CULTURAL_STAGE_MULTIPLIERS[stage.toLowerCase() as keyof typeof CULTURAL_STAGE_MULTIPLIERS];

            return (
              <div
                key={stage}
                className={`rounded-lg border bg-slate-900/40 p-3 ${stageColor[stage]} ${reached ? '' : 'opacity-60'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold uppercase">{stage} · {threshold?.minCulture ?? '—'} Culture</p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                    {reached ? (alreadyPicked ? 'BONUS CLAIMED' : 'CHOOSE ONE') : 'LOCKED'}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mb-2">{threshold?.flavor}</p>
                {multipliers && (
                  <p className="text-[10px] text-slate-400 mb-2">
                    Stage multipliers: Martial ×{multipliers.martial}, Science ×{multipliers.science},
                    Industry ×{multipliers.industry}, Faith ×{multipliers.faith}
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {choices.map((c) => {
                    const isChosen = chosenCultureIds.includes(c.id);
                    const canPick = reached && !alreadyPicked;
                    return (
                      <button
                        key={c.id}
                        disabled={!canPick || isChosen}
                        onClick={() => onPickCulture(c.id)}
                        className={`text-left rounded-md border p-2 transition-colors ${
                          isChosen
                            ? 'border-amber-500/70 bg-amber-500/10 text-amber-200'
                            : canPick
                              ? 'border-slate-600 bg-slate-800 text-slate-200 hover:border-amber-400 hover:bg-amber-500/10'
                              : 'border-slate-700 bg-slate-900/40 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{c.label}</span>
                          {isChosen && <span className="text-[10px] uppercase">Claimed</span>}
                        </div>
                        <p className="text-[11px] opacity-80 mt-0.5">{c.description}</p>
                        <p className="text-[11px] font-semibold mt-1">{c.grants}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
