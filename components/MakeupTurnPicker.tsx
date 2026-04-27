import React, { useState } from 'react';
import { X, Check, Sprout, FlaskConical, Shield, Palette, Scroll } from 'lucide-react';

/**
 * MakeupTurnPicker
 *
 * Lightweight retroactive action picker shown when a student clicks
 * "Make it up" in the MissedTurnBanner. Restricted to the 5 non-target
 * actions (Grow / Research / Fortify / Develop / Worship) since picking
 * a target-required action (Trade / Attack / Diplomacy / Wonder) for a
 * turn that's already in the past is awkward — neighbor states have
 * moved on.
 *
 * Submission flow is handled by the parent via onSubmit; this component
 * only collects the choice and signals dismissal.
 */

type SimpleAction = 'grow' | 'research' | 'fortify' | 'develop' | 'worship';

const OPTIONS: Array<{
  id: SimpleAction;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  color: string;
}> = [
  { id: 'grow',     name: 'Grow',     icon: Sprout,        desc: '+2 Population, +1 Capacity',         color: 'text-green-400' },
  { id: 'research', name: 'Research', icon: FlaskConical,  desc: '+Science Yield (+ Library bonus)',   color: 'text-cyan-400' },
  { id: 'fortify',  name: 'Fortify',  icon: Shield,        desc: '+1 Defense Die (stacks)',            color: 'text-amber-400' },
  { id: 'develop',  name: 'Develop',  icon: Palette,       desc: '+Culture Yield (+ Amphitheatre)',    color: 'text-pink-400' },
  { id: 'worship',  name: 'Worship',  icon: Scroll,        desc: '+Faith Yield (+ Temple bonus)',      color: 'text-purple-400' },
];

export const MakeupTurnPicker: React.FC<{
  turnNumber: number;
  onSubmit: (action: SimpleAction) => Promise<void> | void;
  onClose: () => void;
}> = ({ turnNumber, onSubmit, onClose }) => {
  const [selected, setSelected] = useState<SimpleAction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(selected);
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="makeup-picker-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/50 bg-slate-900 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
          aria-label="Close make-up picker"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pt-6 pb-3">
          <p className="text-xs text-amber-400 uppercase font-bold tracking-widest mb-1">Make-up turn</p>
          <h2 id="makeup-picker-title" className="text-xl font-bold text-white">
            Catch up on Turn {turnNumber}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Pick one action to log retroactively. Target-based actions
            (Attack, Trade, Diplomacy, Wonder) aren't available for make-ups
            since neighbors have moved on.
          </p>
        </div>

        <div className="px-6 pb-3 space-y-2">
          {OPTIONS.map(({ id, name, icon: Icon, desc, color }) => {
            const isSelected = selected === id;
            return (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${isSelected ? 'text-amber-200' : 'text-white'}`}>
                    {name}
                  </p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-700 px-6 py-4">
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-white transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className={`flex items-center gap-1 rounded-lg px-5 py-2 text-sm font-bold transition-colors ${
              selected && !submitting
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Make-up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MakeupTurnPicker;
