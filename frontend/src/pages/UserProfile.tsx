import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Key } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">User Profile & Access</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your account credentials, role permissions, and platform settings.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xl">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{user?.full_name || 'Engineer'}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="sky">{user?.role || 'engineer'}</Badge>
              <Badge variant="emerald">Active Account</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-500" />
              <span>Full Name</span>
            </label>
            <p className="text-sm font-semibold text-slate-200 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              {user?.full_name}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Email Address</span>
            </label>
            <p className="text-sm font-semibold text-slate-200 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              {user?.email}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium flex items-center space-x-2">
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Platform Access Role</span>
            </label>
            <p className="text-sm font-semibold text-slate-200 bg-slate-950/60 border border-slate-800 rounded-xl p-3 uppercase">
              {user?.role}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium flex items-center space-x-2">
              <Key className="w-4 h-4 text-slate-500" />
              <span>Authentication Type</span>
            </label>
            <p className="text-sm font-semibold text-slate-200 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              JWT Bearer Auth
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
