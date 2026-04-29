import React, { useState } from 'react';
import { Swords, Handshake, BookOpen, Shield, ChevronDown, ChevronUp } from 'lucide-react';

interface AdjacentCivsProps {
  currentCivId: string;
  activeCivs: { id: string; name: string; studentName: string; colors: { base: string; accent: string } }[];
  relationships: Record<string, 'Neutral' | 'Ally' | 'Enemy'>;
  warUnlocked: boolean;
  religionFounded: boolean;
  onDeclareWar: (targetCivId: string) => void;
  onProposeTrade: (targetCivId: string) => void;
  onSpreadReligion: (targetCivId: string) => void;
}

interface ExpandedCiv {
  [key: string]: boolean;
}

export const AdjacentCivs: React.FC<AdjacentCivsProps> = ({
  currentCivId,
  activeCivs,
  relationships,
  warUnlocked,
  religionFounded,
  onDeclareWar,
  onProposeTrade,
  onSpreadReligion,
}) => {
  const [expanded, setExpanded] = useState<ExpandedCiv>({});

  const toggleExpanded = (civId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [civId]: !prev[civId],
    }));
  };

  const getRelationshipColor = (relationship: 'Neutral' | 'Ally' | 'Enemy'): string => {
    switch (relationship) {
      case 'Ally':
        return 'text-green-400 bg-green-500/10';
      case 'Enemy':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-slate-400 bg-slate-700/30';
    }
  };

  const getRelationshipBg = (relationship: 'Neutral' | 'Ally' | 'Enemy'): string => {
    switch (relationship) {
      case 'Ally':
        return 'border-green-500/30';
      case 'Enemy':
        return 'border-red-500/30';
      default:
        return 'border-slate-700';
    }
  };

  if (activeCivs.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-slate-300 text-sm font-semibold mb-2">Adjacent Civilizations</h3>
        <p className="text-slate-500 text-xs">No adjacent civilizations available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-2 max-h-96 overflow-y-auto">
      <h3 className="text-slate-300 text-sm font-semibold sticky top-0 bg-slate-800 py-2">
        Adjacent Civilizations ({activeCivs.length})
      </h3>

      {activeCivs.map((civ) => {
        const relationship = relationships[civ.id] || 'Neutral';
        const isExpanded = expanded[civ.id] || false;

        return (
          <div
            key={civ.id}
            className={`border rounded-lg overflow-hidden transition-all ${getRelationshipBg(
              relationship
            )}`}
          >
            {/* Header */}
            <button
              onClick={() => toggleExpanded(civ.id)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: civ.colors.base }}
                />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">{civ.name}</p>
                  <p className="text-xs text-slate-400 truncate">{civ.studentName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${getRelationshipColor(relationship)}`}>
                  {relationship}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-3 py-3 bg-slate-900/50 border-t border-slate-700 space-y-3">
                {/* Martial Indicator */}
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium">Relative Martial</p>
                  <div className="w-full bg-slate-700 rounded h-2">
                    <div
                      className="bg-slate-500 h-2 rounded"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Trade */}
                  <button
                    onClick={() => onProposeTrade(civ.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors text-slate-200 text-xs font-medium"
                  >
                    <Handshake className="w-4 h-4" />
                    Propose Trade
                  </button>

                  {/* War */}
                  {warUnlocked && (
                    <button
                      onClick={() => onDeclareWar(civ.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
                        relationship === 'Enemy'
                          ? 'bg-red-900/50 hover:bg-red-900 text-red-200'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      <Swords className="w-4 h-4" />
                      Declare War
                    </button>
                  )}

                  {/* Religion */}
                  {religionFounded && (
                    <button
                      onClick={() => onSpreadReligion(civ.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors text-slate-200 text-xs font-medium"
                    >
                      <BookOpen className="w-4 h-4" />
                      Spread Religion
                    </button>
                  )}

                  {/* Locked Actions Info */}
                  {!warUnlocked && !religionFounded && (
                    <p className="text-xs text-slate-500 text-center py-2">
                      More actions unlock as history progresses.
                    </p>
                  )}
                </div>

                {/* Military Martial */}
                <div className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800/50 border border-slate-700">
                  <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-400">
                    Martial: <span className="text-slate-200 font-semibold">12</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdjacentCivs;
