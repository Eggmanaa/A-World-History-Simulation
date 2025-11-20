import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GameApp from './GameApp';
import TeacherLogin from './components/auth/TeacherLogin';
import TeacherRegister from './components/auth/TeacherRegister';
import StudentLogin from './components/auth/StudentLogin';
import StudentJoin from './components/auth/StudentJoin';

// Placeholder components for dashboards (to be implemented)
const TeacherDashboard: React.FC = () => (
  <div className="min-h-screen bg-slate-900 text-white p-8">
    <h1 className="text-3xl font-bold">Teacher Dashboard - Coming Soon</h1>
    <p className="text-slate-400 mt-4">Period management, student roster, and timeline controls will be available here.</p>
  </div>
);

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold">Student Dashboard - Coming Soon</h1>
      <p className="text-slate-400 mt-4">Select your civilization and start playing.</p>
      <button
        onClick={() => navigate('/game')}
        className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg"
      >
        Start Game (Demo)
      </button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Teacher Routes */}
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/teacher/register" element={<TeacherRegister />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

        {/* Student Routes */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/join" element={<StudentJoin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />

        {/* Game Route */}
        <Route path="/game" element={<GameApp />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
