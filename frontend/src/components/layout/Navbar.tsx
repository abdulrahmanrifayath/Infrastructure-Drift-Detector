import React from 'react';
import { Shield, User, LogOut, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Header */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex items-center space-x-3">
            <span className="font-bold text-white tracking-tight text-lg">Infrastructure Drift Detector</span>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>AWS Connected</span>
            </span>
          </div>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center space-x-4">
          <Link
            to="/profile"
            className="flex items-center space-x-3 p-1.5 px-3 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{user?.full_name || 'Engineer'}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role || 'Engineer'}</p>
            </div>
          </Link>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
