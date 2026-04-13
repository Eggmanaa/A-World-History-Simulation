import React, { useState, useEffect } from 'react';
import {
  Plus,
  Play,
  Zap,
  Users,
  Swords,
  TrendingUp,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Dice6,
} from 'lucide-react';
import { CIV_PRESETS, TIMELINE_EVENTS } from '../constants';
import type { CivPreset, TimelineEvent } from '../types';

interface GamePeriod {
  id: string;
  name: string;
  inviteCode: string;
  joinedStudents: Array<{
    id: string;
    name: string;
    civId: string;
  }>;
  currentYear: number;
  timelineIndex: number;
  isActive: boolean;
}

interface WarAction {
  id: string;
  attackerId: string;
  attackerName: string;
  defenderId: string;
  defenderName: string;
  attackerStats: Record<string, number>;
  defenderStats: Record<string, number>;
  status: 'pending' | 'resolved';
  result?: 'decisive_attacker' | 'narrow_attacker' | 'stalemate' | 'narrow_defender' | 'decisive_defender';
  message?: string;
}

interface CivStats {
  martial: number;
  defense: number;
  faith: number;
  industry: number;
  science: number;
  culture: number;
  population: number;
}

interface StudentCiv {
  id: string;
  studentId: string;
  studentName: string;
  civId: string;
  civName: string;
  civColor: string;
  stats: CivStats;
}

const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'setup' | 'timeline' | 'civs' | 'war' | 'scoreboard'>('setup');
  const [authToken] = useState<string | null>(localStorage.getItem('teacherToken'));
  const [periods, setPeriods] = useState<GamePeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<GamePeriod | null>(null);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warActions, setWarActions] = useState<WarAction[]>([]);
  const [studentCivs, setStudentCivs] = useState<StudentCiv[]>([]);
  const [selectedCivs, setSelectedCivs] = useState<string[]>([]);
  const [eventHistory, setEventHistory] = useState<TimelineEvent[]>([]);
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [diceRolls, setDiceRolls] = useState<Record<string, number>>({});
  const [scorboardView, setScorboardView] = useState<'composite' | 'military' | 'culture' | 'population' | 'wonders'>('composite');

  // Load periods on mount
  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/periods', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch periods');
      const data = await response.json();
      setPeriods(data);
      // Set first active period if exists
      const active = data.find((p: GamePeriod) => p.isActive);
      if (active) setActivePeriod(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createNewGame = async () => {
    if (!newPeriodName.trim()) {
      setError('Period name is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: newPeriodName }),
      });
      if (!response.ok) throw new Error('Failed to create period');
      const newPeriod = await response.json();
      setPeriods([...periods, newPeriod]);
      setActivePeriod(newPeriod);
      setNewPeriodName('');
      setActiveTab('timeline');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async () => {
    if (!activePeriod) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/periods/${activePeriod.id}/invite-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to generate code');
      const data = await response.json();
      const updated = { ...activePeriod, inviteCode: data.code };
      setActivePeriod(updated);
      setPeriods(periods.map((p) => (p.id === activePeriod.id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (activePeriod?.inviteCode) {
      navigator.clipboard.writeText(activePeriod.inviteCode);
      setInviteCodeCopied(true);
      setTimeout(() => setInviteCodeCopied(false), 2000);
    }
  };

  const startGame = async () => {
    if (!activePeriod || activePeriod.joinedStudents.length < 2) {
      setError('At least 2 students must have joined');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/periods/${activePeriod.id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to start game');
      const updated = await response.json();
      setActivePeriod(updated);
      setActiveTab('timeline');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const nextEvent = async () => {
    if (!activePeriod) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/periods/${activePeriod.id}/next-event`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to advance event');
      const updated = await response.json();
      setActivePeriod(updated);
      // Log event to history
      if (updated.timelineIndex < TIMELINE_EVENTS.length) {
        const event = TIMELINE_EVENTS[updated.timelineIndex - 1];
        setEventHistory([event, ...eventHistory]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const skipEvent = async () => {
    if (!activePeriod) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/periods/${activePeriod.id}/skip-event`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to skip event');
      const updated = await response.json();
      setActivePeriod(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentCivs = async () => {
    if (!activePeriod) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/periods/${activePeriod.id}/civilizations`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch civilizations');
      setStudentCivs(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarActions = async () => {
    if (!activePeriod) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/periods/${activePeriod.id}/wars`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch wars');
      setWarActions(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when switching tabs or period changes
  useEffect(() => {
    if (activeTab === 'civs') fetchStudentCivs();
    if (activeTab === 'war') fetchWarActions();
  }, [activeTab, activePeriod]);

  const rollDice = (warId: string, side: 'attacker' | 'defender') => {
    const roll = Math.floor(Math.random() * 20) + 1;
    setDiceRolls({ ...diceRolls, [`${warId}-${side}`]: roll });
  };

  const resolveWar = async (warId: string) => {
    if (!activePeriod) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/periods/${activePeriod.id}/wars/${warId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ diceRolls }),
      });
      if (!response.ok) throw new Error('Failed to resolve war');
      const updated = await response.json();
      setWarActions(updated);
      setDiceRolls({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getCivPreset = (civId: string): CivPreset | undefined => {
    return CIV_PRESETS.find((p) => p.id === civId);
  };

  const getCurrentEvent = (): TimelineEvent | undefined => {
    if (!activePeriod || activePeriod.timelineIndex >= TIMELINE_EVENTS.length) return undefined;
    return TIMELINE_EVENTS[activePeriod.timelineIndex];
  };

  const calculateCompositeScore = (civ: StudentCiv): number => {
    return (
      civ.stats.martial * 2 +
      civ.stats.defense * 2 +
      civ.stats.faith +
      civ.stats.industry +
      civ.stats.science +
      civ.stats.culture +
      civ.stats.population
    );
  };

  const getScoreboardRankings = () => {
    const sorted = [...studentCivs].sort((a, b) => {
      switch (scorboardView) {
        case 'military':
          return b.stats.martial - a.stats.martial;
        case 'culture':
          return b.stats.culture - a.stats.culture;
        case 'population':
          return b.stats.population - a.stats.population;
        case 'composite':
        default:
          return calculateCompositeScore(b) - calculateCompositeScore(a);
      }
    });
    return sorted;
  };

  if (!authToken) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Teacher Dashboard</h1>
          <p className="text-slate-400">Please log in to access the dashboard</p>
        </div>
      </div>
    );
  }

  const currentEvent = getCurrentEvent();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-amber-400">Teacher Dashboard</h1>
            {activePeriod && (
              <p className="text-slate-400 mt-2">
                {activePeriod.name} {activePeriod.isActive && '(Active)'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {periods.length > 0 && (
              <select
                value={activePeriod?.id || ''}
                onChange={(e) => {
                  const period = periods.find((p) => p.id === e.target.value);
                  setActivePeriod(period || null);
                }}
                className="bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
              >
                <option value="">Select Period</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-8 py-4 m-4 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="px-8 flex gap-4">
          {(!activePeriod || !activePeriod.isActive) ? (
            <button
              onClick={() => setActiveTab('setup')}
              className={`py-4 px-6 border-b-2 font-semibold transition-colors ${
                activeTab === 'setup'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Game Setup
            </button>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-4 px-6 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'timeline'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4" /> Timeline Control
              </button>
              <button
                onClick={() => setActiveTab('civs')}
                className={`py-4 px-6 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'civs'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" /> Civilizations
              </button>
              <button
                onClick={() => setActiveTab('war')}
                className={`py-4 px-6 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'war'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Swords className="w-4 h-4" /> War Resolution
              </button>
              <button
                onClick={() => setActiveTab('scoreboard')}
                className={`py-4 px-6 border-b-2 font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'scoreboard'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Scoreboard
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8">
        {/* Panel 1: Game Setup */}
        {activeTab === 'setup' && (
          <div className="space-y-8">
            {/* Create New Game */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-3">
                <Plus className="w-6 h-6" /> Create New Game
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="e.g., Period 3 - World History"
                  value={newPeriodName}
                  onChange={(e) => setNewPeriodName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-white placeholder-slate-400"
                />
                <button
                  onClick={createNewGame}
                  disabled={loading || !newPeriodName.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 disabled:text-slate-400 text-black font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Period'}
                </button>
              </div>
            </div>

            {/* Active Period Setup */}
            {activePeriod && !activePeriod.isActive && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-amber-400 mb-6">Period: {activePeriod.name}</h2>

                {/* Invite Code */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Invite Code</h3>
                  {!activePeriod.inviteCode ? (
                    <button
                      onClick={generateInviteCode}
                      disabled={loading}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-black font-bold py-3 px-6 rounded-lg"
                    >
                      Generate Invite Code
                    </button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-700 border-2 border-amber-400 rounded-lg p-6 min-w-max">
                        <p className="text-4xl font-bold text-amber-400 tracking-widest">
                          {activePeriod.inviteCode}
                        </p>
                      </div>
                      <button
                        onClick={copyInviteCode}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg p-3 transition-colors"
                      >
                        {inviteCodeCopied ? (
                          <Check className="w-6 h-6 text-green-400" />
                        ) : (
                          <Copy className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Joined Students */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Joined Students ({activePeriod.joinedStudents.length})</h3>
                  {activePeriod.joinedStudents.length === 0 ? (
                    <p className="text-slate-400">No students have joined yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {activePeriod.joinedStudents.map((student) => {
                        const civ = getCivPreset(student.civId);
                        return (
                          <div
                            key={student.id}
                            className="bg-slate-700 border border-slate-600 rounded p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              {civ && (
                                <div
                                  className="w-6 h-6 rounded-full border-2"
                                  style={{ backgroundColor: civ.colors.base }}
                                />
                              )}
                              <div>
                                <p className="font-semibold">{student.name}</p>
                                <p className="text-sm text-slate-400">{civ?.name}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Start Game Button */}
                <button
                  onClick={startGame}
                  disabled={loading || activePeriod.joinedStudents.length < 2}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:text-slate-400 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
                >
                  {loading ? 'Starting...' : `Start Game (${activePeriod.joinedStudents.length}/2+ Students)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Panel 2: Timeline Control */}
        {activeTab === 'timeline' && activePeriod && (
          <div className="space-y-8">
            {/* Year Display */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
              <div className="text-center">
                <p className="text-slate-400 mb-2">Current Year</p>
                <p className="text-7xl font-bold text-amber-400">
                  {activePeriod.currentYear < 0
                    ? `${Math.abs(activePeriod.currentYear).toLocaleString()} BCE`
                    : `${activePeriod.currentYear.toLocaleString()} CE`}
                </p>
              </div>
            </div>

            {/* Current Event */}
            {currentEvent && (
              <div className="bg-slate-800 border-2 border-amber-400 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-amber-400 mb-2">{currentEvent.name}</h2>
                <p className="text-slate-300 mb-6">{currentEvent.desc}</p>

                {currentEvent.actions && currentEvent.actions.length > 0 && (
                  <div className="bg-slate-700 rounded p-4 mb-6 max-h-48 overflow-y-auto">
                    <p className="text-sm font-semibold text-slate-300 mb-3">Event Effects:</p>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {currentEvent.actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-400 mt-1">•</span>
                          <span>{action.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={nextEvent}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" /> Execute Event
                  </button>
                  <button
                    onClick={skipEvent}
                    disabled={loading}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Skip Event
                  </button>
                </div>
              </div>
            )}

            {!currentEvent && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400 text-lg">Timeline simulation complete</p>
              </div>
            )}

            {/* Event History */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
              <button
                onClick={() => setExpandedHistory(!expandedHistory)}
                className="w-full flex items-center justify-between font-bold text-amber-400 mb-4 hover:text-amber-300"
              >
                <span>Event History</span>
                {expandedHistory ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedHistory && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {eventHistory.length === 0 ? (
                    <p className="text-slate-400">No events processed yet</p>
                  ) : (
                    eventHistory.map((event, idx) => (
                      <div key={idx} className="bg-slate-700 rounded p-3 border-l-4 border-amber-400">
                        <p className="font-semibold text-sm">{event.name}</p>
                        <p className="text-xs text-slate-400">
                          {event.year < 0 ? `${Math.abs(event.year)} BCE` : `${event.year} CE`}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel 3: Civilization Overview */}
        {activeTab === 'civs' && activePeriod && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-amber-400">Active Civilizations</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCivs([])}
                  disabled={selectedCivs.length === 0}
                  className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 border border-slate-600 rounded px-4 py-2 text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {studentCivs.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400">No civilizations active yet</p>
              </div>
            ) : (
              <>
                {selectedCivs.length < 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studentCivs
                      .filter((civ) => !selectedCivs.includes(civ.id) || selectedCivs.length < 2)
                      .map((civ) => (
                        <div
                          key={civ.id}
                          onClick={() => {
                            if (selectedCivs.includes(civ.id)) {
                              setSelectedCivs(selectedCivs.filter((id) => id !== civ.id));
                            } else if (selectedCivs.length < 2) {
                              setSelectedCivs([...selectedCivs, civ.id]);
                            }
                          }}
                          className={`rounded-lg p-6 border-2 cursor-pointer transition-all ${
                            selectedCivs.includes(civ.id)
                              ? 'border-amber-400 bg-slate-700'
                              : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                          }`}
                          style={{ borderTopColor: civ.civColor }}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className="w-8 h-8 rounded-full border-2"
                              style={{ backgroundColor: civ.civColor }}
                            />
                            <div>
                              <p className="font-bold text-white">{civ.civName}</p>
                              <p className="text-xs text-slate-400">{civ.studentName}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-700 rounded p-2">
                              <p className="text-slate-400">Martial</p>
                              <p className="font-bold text-amber-300">{civ.stats.martial}</p>
                            </div>
                            <div className="bg-slate-700 rounded p-2">
                              <p className="text-slate-400">Defense</p>
                              <p className="font-bold text-blue-300">{civ.stats.defense}</p>
                            </div>
                            <div className="bg-slate-700 rounded p-2">
                              <p className="text-slate-400">Faith</p>
                              <p className="font-bold text-purple-300">{civ.stats.faith}</p>
                            </div>
                            <div className="bg-slate-700 rounded p-2">
                              <p className="text-slate-400">Industry</p>
                              <p className="font-bold text-orange-300">{civ.stats.industry}</p>
                            </div>
                            <div className="bg-slate-700 rounded p-2">
                              <p className="text-slate-400">Science</p>
                              <p className="font-bold text-cyan-300">{civ.stats.science}</p>
                            </div>
                            <div className="bg-slate-700 rounded p-2">
                              <p className="text-slate-400">Culture</p>
                              <p className="font-bold text-pink-300">{civ.stats.culture}</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <p className="text-xs text-slate-400">Population</p>
                            <p className="font-bold text-green-400">{civ.stats.population}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {selectedCivs.length === 2 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                    <h3 className="text-xl font-bold text-amber-400 mb-6">Civilization Comparison</h3>
                    <div className="grid grid-cols-2 gap-8">
                      {selectedCivs.map((civId) => {
                        const civ = studentCivs.find((c) => c.id === civId);
                        if (!civ) return null;
                        return (
                          <div
                            key={civId}
                            className="border border-slate-700 rounded p-6"
                            style={{ borderTopColor: civ.civColor, borderTopWidth: '4px' }}
                          >
                            <h4 className="text-lg font-bold mb-6">{civ.civName}</h4>
                            <div className="space-y-4">
                              {Object.entries(civ.stats).map(([key, value]) => (
                                <div key={key}>
                                  <div className="flex justify-between mb-1">
                                    <p className="text-sm text-slate-400 capitalize">{key}</p>
                                    <p className="font-bold text-amber-400">{value}</p>
                                  </div>
                                  <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full"
                                      style={{ width: `${Math.min((value / 100) * 100, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Panel 4: War Resolution */}
        {activeTab === 'war' && activePeriod && (
          <div className="space-y-6">
            {warActions.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400">No pending wars at the moment</p>
              </div>
            ) : (
              warActions.map((war) => (
                <div
                  key={war.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-8"
                >
                  <h3 className="text-xl font-bold text-amber-400 mb-6">
                    {war.attackerName} vs {war.defenderName}
                  </h3>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Attacker */}
                    <div className="border border-slate-700 rounded p-6">
                      <h4 className="font-bold text-lg mb-4">{war.attackerName} (Attacker)</h4>
                      <div className="space-y-3 mb-6">
                        {Object.entries(war.attackerStats).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <p className="text-slate-400 capitalize">{key}</p>
                            <p className="font-bold text-amber-400">{value}</p>
                          </div>
                        ))}
                      </div>
                      {war.status === 'pending' && (
                        <button
                          onClick={() => rollDice(war.id, 'attacker')}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                        >
                          <Dice6 className="w-4 h-4" /> Roll Dice
                        </button>
                      )}
                      {diceRolls[`${war.id}-attacker`] && (
                        <div className="mt-4 bg-amber-500 bg-opacity-20 border border-amber-500 rounded p-4 text-center">
                          <p className="text-sm text-slate-400 mb-1">Dice Roll</p>
                          <p className="text-3xl font-bold text-amber-400">
                            {diceRolls[`${war.id}-attacker`]}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Defender */}
                    <div className="border border-slate-700 rounded p-6">
                      <h4 className="font-bold text-lg mb-4">{war.defenderName} (Defender)</h4>
                      <div className="space-y-3 mb-6">
                        {Object.entries(war.defenderStats).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <p className="text-slate-400 capitalize">{key}</p>
                            <p className="font-bold text-blue-400">{value}</p>
                          </div>
                        ))}
                      </div>
                      {war.status === 'pending' && (
                        <button
                          onClick={() => rollDice(war.id, 'defender')}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                        >
                          <Dice6 className="w-4 h-4" /> Roll Dice
                        </button>
                      )}
                      {diceRolls[`${war.id}-defender`] && (
                        <div className="mt-4 bg-blue-500 bg-opacity-20 border border-blue-500 rounded p-4 text-center">
                          <p className="text-sm text-slate-400 mb-1">Dice Roll</p>
                          <p className="text-3xl font-bold text-blue-400">
                            {diceRolls[`${war.id}-defender`]}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {war.status === 'resolved' && war.result && (
                    <div className="bg-slate-700 rounded p-6 mb-6 text-center">
                      <p className="text-sm text-slate-400 mb-2">War Result</p>
                      <p className="text-2xl font-bold text-amber-400 capitalize">
                        {war.result.replace(/_/g, ' ')}
                      </p>
                      {war.message && <p className="text-slate-300 mt-3">{war.message}</p>}
                    </div>
                  )}

                  {war.status === 'pending' && (
                    <button
                      onClick={() => resolveWar(war.id)}
                      disabled={!diceRolls[`${war.id}-attacker`] || !diceRolls[`${war.id}-defender`]}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:text-slate-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      {loading ? 'Resolving...' : 'Resolve War'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Panel 5: Scoreboard */}
        {activeTab === 'scoreboard' && activePeriod && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-amber-400">Scoreboard</h2>
              <div className="flex gap-2 flex-wrap">
                {(['composite', 'military', 'culture', 'population'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setScorboardView(view)}
                    className={`px-4 py-2 rounded font-semibold capitalize transition-colors ${
                      scorboardView === view
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {view === 'composite' ? 'Overall' : view}
                  </button>
                ))}
              </div>
            </div>

            {studentCivs.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400">No civilizations to rank</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getScoreboardRankings().map((civ, idx) => {
                  const score =
                    scorboardView === 'composite'
                      ? calculateCompositeScore(civ)
                      : scorboardView === 'military'
                        ? civ.stats.martial
                        : scorboardView === 'culture'
                          ? civ.stats.culture
                          : civ.stats.population;

                  const maxScore =
                    scorboardView === 'composite'
                      ? calculateCompositeScore(getScoreboardRankings()[0])
                      : getScoreboardRankings()[0][
                          scorboardView === 'military'
                            ? 'stats'
                            : scorboardView === 'culture'
                              ? 'stats'
                              : 'stats'
                        ][
                          scorboardView === 'military'
                            ? 'martial'
                            : scorboardView === 'culture'
                              ? 'culture'
                              : 'population'
                        ];

                  return (
                    <div
                      key={civ.id}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="min-w-12 text-center">
                          <p className="text-3xl font-bold text-amber-400">#{idx + 1}</p>
                        </div>
                        <div
                          className="w-6 h-6 rounded-full border-2"
                          style={{ backgroundColor: civ.civColor }}
                        />
                        <div className="flex-1">
                          <p className="font-bold text-lg">{civ.civName}</p>
                          <p className="text-sm text-slate-400">{civ.studentName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-amber-400">{Math.round(score)}</p>
                          {scorboardView === 'composite' && (
                            <div className="text-xs text-slate-400 mt-2 space-y-1">
                              <p>M:{civ.stats.martial} D:{civ.stats.defense}</p>
                              <p>F:{civ.stats.faith} I:{civ.stats.industry}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 w-full bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-400 h-3 rounded-full transition-all"
                          style={{ width: `${(score / maxScore) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-semibold">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
