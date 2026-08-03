import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, RefreshCw, AlertTriangle, GitCompare, DollarSign, Sparkles, Activity, TrendingUp, ShieldCheck, User, Cpu } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Resource Inventory',
      path: '/inventory',
      icon: Database,
    },
    {
      label: 'Cloud Synchronization',
      path: '/sync',
      icon: RefreshCw,
    },
    {
      label: 'Drift History Audit',
      path: '/drift',
      icon: AlertTriangle,
    },
    {
      label: 'Resource Comparison',
      path: '/comparison',
      icon: GitCompare,
    },
    {
      label: 'Analytics & Trends',
      path: '/analytics',
      icon: TrendingUp,
    },
    {
      label: 'Compliance Governance',
      path: '/compliance',
      icon: ShieldCheck,
    },
    {
      label: 'Cost Analytics',
      path: '/cost-analytics',
      icon: DollarSign,
    },
    {
      label: 'AI Remediation',
      path: '/recommendations',
      icon: Sparkles,
    },
    {
      label: 'System Monitoring',
      path: '/monitoring',
      icon: Activity,
    },
    {
      label: 'User Profile',
      path: '/profile',
      icon: User,
    },
  ];

  return (
    <aside className="w-64 border-r border-emerald-500/10 bg-slate-950/30 backdrop-blur-2xl flex flex-col justify-between p-4 hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest mb-3">
            Governance Navigation
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-purple-500/10 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 backdrop-blur-md'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border hover:border-white/10'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center space-x-2.5 text-xs text-emerald-300 font-bold mb-1.5">
          <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="aurora-text">Northern Lights Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
          Glassmorphism governance theme initialized with real-time drift telemetry.
        </p>
      </div>
    </aside>
  );
};
