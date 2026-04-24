import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BarChart3,
  Map,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';

/**
 * OnboardingOverlay
 *
 * First-time-player tutorial. Self-contained: reads and writes a
 * localStorage flag so it only shows once per browser, unless the user
 * explicitly replays it.
 *
 * Mounted high in GameApp so the backdrop dims the entire game UI. If
 * the flag is already set, this component returns null with ~zero
 * render cost, so it's safe to keep mounted in every session.
 *
 * Design choices:
 * - 4 steps, each self-contained — reading level ~8th grade, no jargon
 *   the student hasn't seen in the accompanying callout.
 * - Skip button on every step so a veteran kid can bail in one click.
 * - Progress dots show where they are. No forced sequence — back/next
 *   both work.
 * - On finish OR skip, we set the flag to 'done' (not 'skipped') so
 *   replay logic is a single-key check.
 */

const STORAGE_KEY = 'whsim_onboarding_v1';

type Step = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: React.ReactNode;
  accent: string; // tailwind color class for the icon ring
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to your civilization',
    accent: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
    body: (
      <>
        <p>
          You are leading a civilization from its earliest days to the edge of
          the modern world. Every turn you'll make one big decision that
          shapes how your civ grows.
        </p>
        <p className="mt-3">
          There is no single "right" path. Some civs thrive on trade, others
          on armies, others on faith or science. Your job is to read the
          world and choose wisely.
        </p>
      </>
    ),
  },
  {
    icon: BarChart3,
    title: 'Your stats, at a glance',
    accent: 'text-sky-400 bg-sky-500/20 border-sky-500/40',
    body: (
      <>
        <p>
          Six stats describe your civilization:
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li><span className="text-amber-300 font-semibold">Martial</span> — your armies and defenses.</li>
          <li><span className="text-purple-300 font-semibold">Faith</span> — shared belief and cultural cohesion.</li>
          <li><span className="text-orange-300 font-semibold">Industry</span> — how fast you produce buildings.</li>
          <li><span className="text-cyan-300 font-semibold">Science</span> — technology and unlocks.</li>
          <li><span className="text-pink-300 font-semibold">Culture</span> — prestige and soft power.</li>
          <li><span className="text-green-300 font-semibold">Population</span> — your people.</li>
        </ul>
        <p className="mt-3 text-sm text-slate-400">
          Tap the info icon next to any stat (coming soon) for a deeper
          explanation and how to raise it.
        </p>
      </>
    ),
  },
  {
    icon: Map,
    title: 'The map and your neighbors',
    accent: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
    body: (
      <>
        <p>
          Your civilization lives on a hex grid. You'll place buildings
          (houses, farms, walls, workshops) on tiles near your capital.
          Each building is both a stat boost and a commitment.
        </p>
        <p className="mt-3">
          You also have <span className="text-white font-semibold">neighbors</span> —
          other civilizations (your classmates, or computer-controlled tribes).
          You can trade with them, ally with them, or go to war. What you do
          to them affects how <em>everyone</em> sees you.
        </p>
      </>
    ),
  },
  {
    icon: Zap,
    title: 'Each turn, you choose one action',
    accent: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/40',
    body: (
      <>
        <p>
          When it's time to act, you'll see a panel of actions like
          <em> Grow, Research, Develop, Worship, Attack, Trade, </em>
          and more. Pick <span className="text-white font-semibold">one</span>
          {' '}per turn. Some unlock later; some need specific conditions.
        </p>
        <p className="mt-3">
          Before you commit, the panel shows a preview of what will change.
          Read it carefully — there are no undos.
        </p>
        <p className="mt-3 text-sm text-slate-400">
          When the teacher ends the turn, the world reacts to every
          student's choice at once. Then a new turn begins.
        </p>
      </>
    ),
  },
];

export const OnboardingOverlay: React.FC<{
  /** Force-show (used by a "Replay tutorial" button). Bypasses the storage flag. */
  forceOpen?: boolean;
  /** Called when the user completes or skips the overlay. */
  onClose?: () => void;
}> = ({ forceOpen = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  // Only check the storage flag once on mount. A later update to the
  // flag in another tab won't re-close us mid-tutorial.
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        setIsOpen(true);
      }
    } catch {
      // private-browsing or storage disabled — just don't show.
    }
  }, [forceOpen]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'done');
    } catch {
      // tolerant of storage errors
    }
    setIsOpen(false);
    setStepIdx(0);
    onClose?.();
  };

  if (!isOpen) return null;

  const step = STEPS[stepIdx];
  const IconComponent = step.icon;
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Skip button */}
        <button
          onClick={finish}
          className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
          aria-label="Skip tutorial"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon + title */}
        <div className="px-8 pt-8 pb-4">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-full border-2 mb-4 ${step.accent}`}
          >
            <IconComponent className="h-7 w-7" />
          </div>
          <h2
            id="onboarding-title"
            className="text-2xl font-bold text-white"
          >
            {step.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-8 text-slate-200 space-y-1 min-h-[160px]">
          {step.body}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStepIdx(i)}
              className={`h-2 rounded-full transition-all ${
                i === stepIdx
                  ? 'w-6 bg-amber-400'
                  : 'w-2 bg-slate-600 hover:bg-slate-500'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between border-t border-slate-700 px-6 py-4">
          <button
            onClick={finish}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Skip tutorial
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={isFirst}
              className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {isLast ? (
              <button
                onClick={finish}
                className="flex items-center gap-1 rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
              >
                <Check className="h-4 w-4" />
                Start playing
              </button>
            ) : (
              <button
                onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
                className="flex items-center gap-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-400 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingOverlay;

/** Programmatic reset, e.g. for a "Replay tutorial" settings button. */
export function resetOnboarding() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
