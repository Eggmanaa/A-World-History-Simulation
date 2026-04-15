import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Lock, Loader } from 'lucide-react';
import { CIV_PRESETS } from '../constants';
import type { CivPreset } from '../types';

interface StudentInfo {
  id: string;
  name: string;
  period: string;
  year: number;
  selectedCivId: string | null;
  gameStatus: 'waiting' | 'in_progress' | 'your_turn';
}

interface CivSelection {
  civId: string;
  studentId: string;
  studentName: string;
}

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [selectedCivForGame, setSelectedCivForGame] = useState<string | null>(null);
  const [takenCivs, setTakenCivs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const periodId = localStorage.getItem('periodId');

        if (!token) {
          navigate('/student/login');
          return;
        }

        // Fetch student dashboard data
        const dashResponse = await fetch('/api/student/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!dashResponse.ok) throw new Error('Failed to fetch dashboard');
        const dashData = await dashResponse.json();

        // Fetch taken civilizations from game state
        let takenCivsSet = new Set<string>();
        if (periodId) {
          const stateResponse = await fetch(`/api/game/student/${periodId}/state`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (stateResponse.ok) {
            const stateData = await stateResponse.json();
            // Extract taken civs from other students
            if (stateData.adjacentCivs) {
              takenCivsSet = new Set(stateData.adjacentCivs.map((c: any) => c.civilizationId));
            }
          }
        }

        // API returns { student: {...}, gameSession: {...} }
        const student = dashData.student || dashData;
        const gameSession = dashData.gameSession;
        setStudentInfo({
          id: student.id || 'unknown',
          name: student.name || 'Student',
          period: student.period_name || student.period || 'Unknown Period',
          year: student.current_year || student.currentYear || -3000,
          selectedCivId: gameSession?.civilization_id || student.selectedCivId || null,
          gameStatus: student.gameStatus || 'waiting',
        });

        setTakenCivs(takenCivsSet);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleCivSelection = async (civId: string) => {
    if (takenCivs.has(civId)) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/student/game-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ civilizationId: civId }),
      });

      if (!response.ok) throw new Error('Failed to select civilization');

      setSelectedCivForGame(civId);
      setStudentInfo((prev) =>
        prev ? { ...prev, selectedCivId: civId, gameStatus: 'waiting' } : null
      );
    } catch (error) {
      console.error('Failed to select civilization:', error);
    }
  };

  const handleStartGame = () => {
    if (studentInfo?.selectedCivId) {
      navigate('/game', { state: { civId: studentInfo.selectedCivId } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Unable to load dashboard</h2>
          <p className="text-slate-400">Please try logging in again.</p>
        </div>
      </div>
    );
  }

  const selectedCiv = studentInfo.selectedCivId
    ? CIV_PRESETS.find((c) => c.id === studentInfo.selectedCivId)
    : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">{studentInfo.name}'s Dashboard</h1>
          <div className="flex gap-8 mt-3 text-sm text-slate-400">
            <div>
              <span className="text-slate-500">Period:</span> {studentInfo.period}
            </div>
            <div>
              <span className="text-slate-500">Starting Year:</span> {studentInfo.year}
            </div>
            <div>
              <span className="text-slate-500">Status:</span>
              <span
                className={`ml-2 font-semibold ${
                  studentInfo.gameStatus === 'your_turn'
                    ? 'text-green-400'
                    : studentInfo.gameStatus === 'in_progress'
                      ? 'text-yellow-400'
                      : 'text-slate-400'
                }`}
              >
                {studentInfo.gameStatus === 'your_turn'
                  ? "It's Your Turn!"
                  : studentInfo.gameStatus === 'in_progress'
                    ? 'Game in Progress'
                    : 'Waiting for Teacher to Start'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {selectedCiv && studentInfo.selectedCivId ? (
            /* Civ Already Selected */
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">You are playing as</h2>

              {/* Summary Card */}
              <div className="grid md:grid-cols-2 gap-6">
                <div
                  className="rounded-lg p-6 border-2"
                  style={{
                    backgroundColor: `${selectedCiv.colors.base}15`,
                    borderColor: selectedCiv.colors.base,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-lg"
                      style={{ backgroundColor: selectedCiv.colors.base }}
                    />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold">{selectedCiv.name}</h3>
                      <p className="text-slate-400 text-sm mt-1">
                        Regions: {selectedCiv.regions.join(', ')}
                      </p>
                      <div className="flex gap-2 mt-3">
                        {selectedCiv.traits.map((trait) => (
                          <span
                            key={trait}
                            className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-200"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Base Stats — Defense folded into Martial so we show
                      the combined combat strength, not two separate numbers. */}
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Martial:</span>
                      <span className="ml-2 font-semibold text-red-400">
                        {selectedCiv.baseStats.martial + (selectedCiv.baseStats.defense || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Faith:</span>
                      <span className="ml-2 font-semibold text-purple-400">
                        {selectedCiv.baseStats.faith}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Industry:</span>
                      <span className="ml-2 font-semibold text-yellow-400">
                        {selectedCiv.baseStats.industry}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Fertility:</span>
                      <span className="ml-2 font-semibold text-green-400">
                        {selectedCiv.baseStats.fertility}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Panel */}
                <div className="space-y-4">
                  <button
                    onClick={handleStartGame}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Continue Game
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCivForGame(null);
                      setStudentInfo((prev) =>
                        prev ? { ...prev, selectedCivId: null } : null
                      );
                    }}
                    className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                  >
                    Change Civilization
                  </button>

                  <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-300 font-semibold mb-2">Game Tips</p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>• Build houses to grow your population</li>
                      <li>• Trade with neighbors to gain resources</li>
                      <li>• Unlock wonders for major bonuses</li>
                      <li>• Found a religion to spread your faith</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Civilization Picker */
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Select Your Civilization</h2>
              <p className="text-slate-400">
                Choose the civilization you'll lead through history. Each civ has unique strengths and starting bonuses.
              </p>

              {takenCivs.size > 0 && (
                <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold">{takenCivs.size}</span> civilization
                    {takenCivs.size !== 1 ? 's' : ''} already chosen by other students in this period.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CIV_PRESETS.map((civ) => {
                  const isTaken = takenCivs.has(civ.id);

                  return (
                    <button
                      key={civ.id}
                      onClick={() => !isTaken && handleCivSelection(civ.id)}
                      disabled={isTaken}
                      className={`text-left rounded-lg p-4 border-2 transition-all ${
                        isTaken
                          ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-900'
                          : 'hover:border-opacity-100 hover:shadow-lg hover:shadow-opacity-20 border-opacity-50 cursor-pointer'
                      }`}
                      style={{
                        borderColor: isTaken ? undefined : civ.colors.base,
                        backgroundColor: isTaken ? undefined : `${civ.colors.base}08`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white">{civ.name}</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {civ.regions.slice(0, 2).join(', ')}
                          </p>
                        </div>
                        {isTaken && (
                          <div className="flex-shrink-0">
                            <Lock className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                      </div>

                      {/* Traits */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {civ.traits.map((trait) => (
                          <span
                            key={trait}
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor: `${civ.colors.base}30`,
                              color: civ.colors.base,
                            }}
                          >
                            {trait}
                          </span>
                        ))}
                      </div>

                      {/* Stats Grid — Defense folded into Martial */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Martial</span>
                          <p className="font-semibold text-red-400">{civ.baseStats.martial + (civ.baseStats.defense || 0)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Faith</span>
                          <p className="font-semibold text-purple-400">{civ.baseStats.faith}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Industry</span>
                          <p className="font-semibold text-yellow-400">{civ.baseStats.industry}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Fertility</span>
                          <p className="font-semibold text-green-400">{civ.baseStats.fertility}</p>
                        </div>
                      </div>

                      {isTaken && (
                        <div className="mt-3 p-2 bg-slate-800 rounded text-center text-xs text-slate-400">
                          Already chosen
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
