import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, GraduationCap, Users, Sparkles } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url("/images/tower-of-babel.jpg")'
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Main Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden relative z-10 border border-white/20">

        {/* Header Section */}
        <div className="text-center pt-12 pb-8 px-6">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="bg-slate-900 p-3 rounded-xl shadow-lg">
              <Globe className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
              Through History
            </h1>
          </div>

          <p className="text-xl text-slate-700 mb-2 font-medium">
            A World History Simulation Game for High School Students
          </p>
          <p className="text-slate-500 mb-8">
            Build civilizations, manage resources, and survive from 50,000 BCE to 362 CE
          </p>

          {/* Single Player Button */}
          <div className="max-w-md mx-auto mb-4">
            <button
              onClick={() => navigate('/game')}
              className="block w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white font-bold py-5 px-8 rounded-2xl text-center transition-all shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 text-xl relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6" />
                Start Single Player Game
                <Sparkles className="w-6 h-6" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
            <p className="text-xs text-slate-500 mt-2 italic">Jump straight into the action - no account needed!</p>
          </div>
        </div>

        {/* Divider */}
        <div className="px-10 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            <span className="text-slate-400 text-sm font-medium">or join a classroom</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          </div>
        </div>

        {/* Split Sections */}
        <div className="grid md:grid-cols-2 gap-8 px-10 pb-10">

          {/* Teacher Section */}
          <div className="bg-red-50/80 rounded-2xl p-8 border border-red-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Teachers</h2>
                <p className="text-red-600 font-medium">Classroom Management</p>
              </div>
            </div>

            <p className="text-slate-600 mb-8 leading-relaxed">
              Create periods, manage students, and control the timeline. Monitor progress and guide your students through history.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/teacher/login')}
                className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl text-center transition-all shadow-md hover:shadow-lg"
              >
                Teacher Login
              </button>

              <button
                onClick={() => navigate('/teacher/register')}
                className="block w-full bg-white hover:bg-red-50 text-red-600 font-bold py-3.5 px-6 rounded-xl text-center border-2 border-red-100 hover:border-red-200 transition-all"
              >
                Register as Teacher
              </button>
            </div>
          </div>

          {/* Student Section */}
          <div className="bg-blue-50/80 rounded-2xl p-8 border border-blue-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Students</h2>
                <p className="text-blue-600 font-medium">Civilization Builder</p>
              </div>
            </div>

            <p className="text-slate-600 mb-8 leading-relaxed">
              Build your civilization, manage resources, and compete with classmates. Will your civilization stand the test of time?
            </p>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/student/login')}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl text-center transition-all shadow-md hover:shadow-lg"
              >
                Student Login
              </button>

              <button
                onClick={() => navigate('/student/join')}
                className="block w-full bg-white hover:bg-blue-50 text-blue-600 font-bold py-3.5 px-6 rounded-xl text-center border-2 border-blue-100 hover:border-blue-200 transition-all"
              >
                Join with Invite Code
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-slate-50 px-10 py-8 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">Game Features</h3>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>

          <div className="grid grid-cols-3 gap-8 text-center divide-x divide-slate-200">
            <div>
              <div className="text-3xl font-black text-slate-900">30,362</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Years of History</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">18+</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Civilizations</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">&infin;</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Possibilities</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;
