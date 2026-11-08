import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import { Activity } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'reports'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200 animate-pulse mb-3">
          <Activity className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
          Loading Sweety...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1">
        {currentView === 'dashboard' ? <DashboardPage /> : <ReportsPage />}
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Sweety Blood Glucose Tracker • Designed for Kenpath Assessment
      </footer>
    </div>
  );
}
