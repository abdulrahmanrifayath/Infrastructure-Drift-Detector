import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, ShieldAlert, User, Cpu } from 'lucide-react';

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
      label: 'User Profile',
      path: '/profile',
      icon: User,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/60 flex flex-col justify-between p-4 hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Governance Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center space-x-2.5 text-xs text-sky-400 font-medium mb-1">
          <Cpu className="w-4 h-4" />
          <span>Rule Engine Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Modular governance architecture ready for AI/LLM integration.
        </p>
      </div>
    </aside>
  );
};
