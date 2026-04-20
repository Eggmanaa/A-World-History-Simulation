/**
 * ReflectionTurn - Post-game educational screen.
 *
 * Renders after Turn 24 completes. Three sections:
 *   1. Civ outcome vs. real history — compares student's simulation to the
 *      historical record using CIV_HISTORICAL_OUTCOMES.
 *   2. Turning-point picker — student selects up to 3 of their most
 *      consequential decisions across the game.
 *   3. Reflection prompts — three short-answer questions stored locally so
 *      teachers can collect them later (or export to PDF).
 *
 * Designed as a unit-assessment artifact: this is what students should be
 * graded on, not just the final score.
 */

import React, { useState } from 'react';
import {
  BookOpen, Scroll, Award, ChevronRight, Star,
  Quote, Lightbulb, Sparkles,
} from 'lucide-react';
import type { GameState } from '../types';
import { getCivHistoricalOutcome } from '../civHistoricalOutcomes';
import { calculateFinalScore } from '../constants';
import { exportEndgameSummaryPdf } from '../endgamePdf';

interface ReflectionTurnProps {
  gameState: GameState;
  /** A short list of the player's major decisions across the game so they
   *  can mark turning points. Each entry is one human-readable line. */
  decisionHistory?: string[];
  /** Called when the student finishes the reflection. The parent can persist
   *  the reflection (to localStorage and / or export to PDF). */
  onComplete: (reflection: ReflectionResult) => void;
}

export interface ReflectionResult {
  civId: string;
  civName: string;
  finalScore: number;
  scoreBreakdown: { key: string; name: string; score: number; benchmark: number }[];
  turningPoints: string[];
  responses: {
    surprised: string;
    wouldChange: string;
    comparison: string;
  };
  completedAt: string; // ISO date
}

const ReflectionTurn: React.FC<ReflectionTurnProps> = ({
  gameState,
  decisionHistory = [],
  onComplete,
}) => {
  const civId = gameState.civilization?.presetId || '';
  const civName = gameState.civilization?.name || 'Your Civilization';
  const outcome = getCivHistoricalOutcome(civId);
  const finalScore = calculateFinalScore(gameState);

  const [step, setStep] = useState<'history' | 'turning' | 'reflect' | 'done'>('history');
  const [turningPoints, setTurningPoints] = useState<string[]>([]);
  const [surprised, setSurprised] = useState('');
  const [wouldChange, setWouldChange] = useState('');
  const [comparison, setComparison] = useState('');

  const toggleTurningPoint = (decision: string) => {
    setTurningPoints((prev) => {
      if (prev.includes(decision)) return prev.filter((d) => d !== decision);
      if (prev.length >= 3) return prev; // cap at 3
      return [...prev, decision];
    });
  };

  const handleFinish = () => {
    const result: ReflectionResult = {
      civId,
      civName,
      finalScore: finalScore.total + finalScore.milestones,
      scoreBreakdown: finalScore.breakdown,
      turningPoints,
      responses: { surprised, wouldChange, comparison },
      completedAt: new Date().toISOString(),
    };
    onComplete(result);
    setStep('done');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl border-2 border-amber-700/50 max-w-3xl w-full shadow-2xl my-4 overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-orange-900/40 p-6 border-b border-amber-700/30">
          <div className="flex items-center gap-3 mb-2">
            <Scroll className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl font-bold text-amber-300">The Game Is Done. Now the Real Work Begins.</h1>
          </div>
          <p className="text-amber-100/80 text-sm">
            History didn't end when {civName} did. Take a few minutes to compare your civilization's path to what really happened — and to think about the choices that shaped your world.
          </p>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4 text-xs">
            {(['history', 'turning', 'reflect', 'done'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <span className={`px-2 py-1 rounded-full font-semibold uppercase tracking-wider ${
                  step === s ? 'bg-amber-500 text-slate-900' :
                  ['history', 'turning', 'reflect', 'done'].indexOf(step) > i
                    ? 'bg-amber-700/50 text-amber-200'
                    : 'bg-slate-700/50 text-slate-400'
                }`}>
                  {s === 'history' && 'Compare'}
                  {s === 'turning' && 'Decide'}
                  {s === 'reflect' && 'Reflect'}
                  {s === 'done' && 'Complete'}
                </span>
                {i < 3 && <ChevronRight className="w-3 h-3 text-slate-600" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* CONTENT — STEP 1: COMPARE TO REAL HISTORY */}
        {step === 'history' && (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Your {civName} vs. the Real {outcome?.realName || civName}
            </h2>

            {outcome ? (
              <div className="space-y-3">
                {/* Final score panel */}
                <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Your Final Score</p>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-3xl font-bold text-amber-300">
                      {finalScore.total + finalScore.milestones}
                    </span>
                    <span className="text-xs text-slate-400">
                      {finalScore.total} from tracks + {finalScore.milestones} milestones
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {finalScore.breakdown.map((t) => (
                      <div key={t.key} className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{t.name}</span>
                        <span className={`font-semibold ${t.score >= t.benchmark ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {t.score} / {t.benchmark}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real history panel */}
                <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-700/40">
                  <div className="flex items-start gap-2 mb-2">
                    <Quote className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold mb-1">
                        Historical Peak
                      </p>
                      <p className="text-sm text-amber-100">{outcome.peakYear}</p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold mb-1">By 476 CE</p>
                    <p className="text-sm text-amber-100/90">{outcome.endState}</p>
                  </div>
                  <div className="mb-2">
                    <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold mb-1">What Really Happened</p>
                    <p className="text-sm text-amber-100/90 leading-relaxed">{outcome.narrative}</p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold mb-1">Lasting Legacy</p>
                    <p className="text-sm text-amber-100/90 leading-relaxed">{outcome.primaryLegacy}</p>
                  </div>
                </div>

                {/* Comparison prompt */}
                <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700/40">
                  <p className="text-xs text-blue-300 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Think About It
                  </p>
                  <p className="text-sm text-blue-100">{outcome.comparisonPrompt}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No historical record available for this civilization.</p>
            )}

            <button
              onClick={() => setStep('turning')}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Mark My Turning Points <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CONTENT — STEP 2: TURNING POINTS */}
        {step === 'turning' && (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Pick Your Turning Points
            </h2>
            <p className="text-sm text-slate-300">
              Select up to <strong>three</strong> decisions that you think most shaped your civilization's outcome — for better or worse.
            </p>

            {decisionHistory.length === 0 ? (
              <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 text-center">
                <p className="text-sm text-slate-400 italic">
                  No decision log available. Skip to the reflection questions.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {decisionHistory.map((decision, i) => {
                  const isPicked = turningPoints.includes(decision);
                  const isAtCap = !isPicked && turningPoints.length >= 3;
                  return (
                    <button
                      key={i}
                      onClick={() => toggleTurningPoint(decision)}
                      disabled={isAtCap}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isPicked
                          ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/30'
                          : isAtCap
                          ? 'border-slate-700 bg-slate-800/30 text-slate-500 cursor-not-allowed'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Star className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isPicked ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                        <span className="text-sm text-slate-200">{decision}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-amber-400/80 text-center">
              {turningPoints.length} / 3 selected
            </p>

            <button
              onClick={() => setStep('reflect')}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Reflect on My Civilization <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CONTENT — STEP 3: REFLECTION QUESTIONS */}
        {step === 'reflect' && (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Reflection Questions
            </h2>
            <p className="text-sm text-slate-300">
              Answer these in 2-4 sentences each. Your responses are saved with your game so you can share them with your teacher.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-amber-300 mb-2">
                  1. What surprised you about this period of history?
                </label>
                <textarea
                  value={surprised}
                  onChange={(e) => setSurprised(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded-lg p-3 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Maybe the speed civilizations rose and fell, the role of one specific decision, a connection you hadn't seen before..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-amber-300 mb-2">
                  2. Which decision do you wish you could change, and why?
                </label>
                <textarea
                  value={wouldChange}
                  onChange={(e) => setWouldChange(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded-lg p-3 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Pick one specific choice. What would you do differently? What do you think would have changed?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-amber-300 mb-2">
                  3. How did your simulated civilization compare to the real {outcome?.realName || civName}?
                </label>
                <textarea
                  value={comparison}
                  onChange={(e) => setComparison(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded-lg p-3 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Where did your civ match the historical record? Where did it diverge? Which version do you find more interesting?"
                />
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={!surprised.trim() || !wouldChange.trim() || !comparison.trim()}
              className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                surprised.trim() && wouldChange.trim() && comparison.trim()
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Submit Reflection <Award className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CONTENT — STEP 4: DONE */}
        {step === 'done' && (
          <div className="p-8 text-center space-y-4">
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Reflection Complete</h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Your responses have been saved. Export your end-of-game summary as a PDF to turn in or keep as a record.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  // Pull decision log from localStorage (set by GameApp during play).
                  let decisionLog: string[] = [];
                  try {
                    const raw = window.localStorage.getItem('aws_decision_log');
                    decisionLog = raw ? JSON.parse(raw) : [];
                  } catch { /* empty */ }
                  let studentName = '';
                  try {
                    studentName = window.localStorage.getItem('studentName') || '';
                  } catch { /* empty */ }
                  const result: ReflectionResult = {
                    civId, civName,
                    finalScore: finalScore.total + finalScore.milestones,
                    scoreBreakdown: finalScore.breakdown,
                    turningPoints,
                    responses: { surprised, wouldChange, comparison },
                    completedAt: new Date().toISOString(),
                  };
                  const ok = exportEndgameSummaryPdf({ studentName, reflection: result, decisionLog });
                  if (!ok) {
                    alert('Pop-up blocked. Allow pop-ups for this site, then try again.');
                  }
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg"
              >
                <BookOpen className="w-4 h-4" />
                Download PDF Summary
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReflectionTurn;
