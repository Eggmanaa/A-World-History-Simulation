import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GameApp from './GameApp';
import TeacherLogin from './components/auth/TeacherLogin';
import TeacherRegister from './components/auth/TeacherRegister';
import StudentLogin from './components/auth/StudentLogin';
import StudentJoin from './components/auth/StudentJoin';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

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
