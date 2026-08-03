import React from 'react';
import { Shield, LogOut, Activity, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-emerald-500/10 bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-40 shadow-xl shadow-cyan-950/20">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-purple-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-white tracking-tight text-lg aurora-text">
              Infrastructure Drift Detector
            </span>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/30 backdrop-blur-md shadow-sm">
              <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Aurora Active</span>
            </span>
          </div>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center space-x-4">
          <Link
            to="/profile"
            className="flex items-center space-x-3 p-1.5 px-3 rounded-2xl glass-panel hover:border-emerald-500/30 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-sky-600 border border-emerald-300/40 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">{user?.full_name || 'Engineer'}</p>
              <p className="text-[10px] text-slate-400 capitalize font-medium">{user?.role || 'Engineer'}</p>
            </div>
          </Link>

          <button
            onClick={logout}
            className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl border border-white/5 hover:border-rose-500/20 transition-all backdrop-blur-md"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
