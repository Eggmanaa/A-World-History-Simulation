import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, Globe, Clock, Sparkles } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [yearsCount, setYearsCount] = useState(0);
  const [civsCount, setCivsCount] = useState(0);

  // Animated counter effect
  useEffect(() => {
    const yearsTarget = 30362;
    const civsTarget = 18;
    const duration = 2000; // 2 seconds
    const yearsIncrement = yearsTarget / (duration / 16);
    const civsIncrement = civsTarget / (duration / 16);

    let yearsElapsed = 0;
    let civsElapsed = 0;

    const timer = setInterval(() => {
      yearsElapsed += yearsIncrement;
      civsElapsed += civsIncrement;

      if (yearsElapsed >= yearsTarget) {
        setYearsCount(yearsTarget);
        setCivsCount(civsTarget);
        clearInterval(timer);
      } else {
        setYearsCount(Math.floor(yearsElapsed));
        setCivsCount(Math.floor(civsElapsed));
      }
    }, 16);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Globe className="w-20 h-20 text-amber-500 animate-pulse" />
                <Clock className="w-10 h-10 text-blue-400 absolute -bottom-2 -right-2" />
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Through <span className="text-amber-500">History</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto">
              A World History Simulation Game for High School Students
            </p>

            {/* Description */}
            <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
              Build civilizations, manage resources, and survive from 50,000 BCE to 362 CE
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-16">
            {/* Teachers Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
              <div className="flex items-center justify-center w-16 h-16 bg-amber-500/10 rounded-full mb-6 mx-auto">
                <GraduationCap className="w-8 h-8 text-amber-500" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4 text-center">Teachers</h2>
              
              <p className="text-slate-300 mb-8 text-center">
                Create periods, manage students, and control the timeline
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/teacher/login')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  Teacher Login
                </button>
                
                <button
                  onClick={() => navigate('/teacher/register')}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Register as Teacher
                </button>
              </div>
            </div>

            {/* Students Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-6 mx-auto">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4 text-center">Students</h2>
              
              <p className="text-slate-300 mb-8 text-center">
                Build your civilization and compete with classmates
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/student/login')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  Student Login
                </button>
                
                <button
                  onClick={() => navigate('/student/join')}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Join with Invite Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About the Game Section */}
      <div className="bg-slate-800/30 border-t border-slate-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <BookOpen className="w-10 h-10 text-amber-500" />
              About the Game
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Experience the rise and fall of ancient civilizations through an immersive educational simulation
            </p>
          </div>

          {/* Statistics Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Years of History */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <Clock className="w-12 h-12 text-amber-500" />
              </div>
              <div className="text-5xl font-bold text-amber-500 mb-2">
                {yearsCount.toLocaleString()}
              </div>
              <div className="text-slate-300 text-lg">Years of History</div>
              <div className="text-slate-400 text-sm mt-2">From 50,000 BCE to 362 CE</div>
            </div>

            {/* Historical Civilizations */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <Globe className="w-12 h-12 text-blue-400" />
              </div>
              <div className="text-5xl font-bold text-blue-400 mb-2">
                {civsCount}+
              </div>
              <div className="text-slate-300 text-lg">Historical Civilizations</div>
              <div className="text-slate-400 text-sm mt-2">Egypt, Rome, Greece, and more</div>
            </div>

            {/* Strategic Possibilities */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <Sparkles className="w-12 h-12 text-purple-400" />
              </div>
              <div className="text-5xl font-bold text-purple-400 mb-2">
                ∞
              </div>
              <div className="text-slate-300 text-lg">Strategic Possibilities</div>
              <div className="text-slate-400 text-sm mt-2">Every game is unique</div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[
              { title: 'Resource Management', desc: 'Balance food, production, gold, science, culture, and faith' },
              { title: 'Hex-Based Map', desc: 'Build on diverse terrain from mountains to rivers' },
              { title: 'Timeline Events', desc: 'Experience historical events that shape your civilization' },
              { title: 'Wonder Construction', desc: 'Build legendary structures like the Pyramids' },
              { title: 'Diplomacy System', desc: 'Interact with neighboring civilizations' },
              { title: 'Religion & Culture', desc: 'Develop unique belief systems and traditions' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>&copy; 2025 Through History - Educational Simulation Game</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
