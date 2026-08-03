import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Server, AlertTriangle, Cpu, DollarSign, LogOut, Layers, RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">Infrastructure Drift Detector</span>
              <span className="ml-3 px-2 py-0.5 text-xs font-semibold bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20">
                v1.0 Foundation
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-200">{user?.full_name || 'Engineer'}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Welcome Hero Card */}
        <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Cloud Governance & Drift Monitoring Platform</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Continuously compare Infrastructure as Code (Terraform) states against live AWS cloud resources to prioritize security, cost, and IAM configurations.
            </p>
          </div>
        </div>

        {/* Stats Grid Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold">Total Resources</span>
              <Server className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-slate-500 mt-1">Foundation Ready</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold">Detected Drifts</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-slate-500 mt-1">Engine Initialized</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold">AI Risk Score</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">0 / 100</p>
            <p className="text-xs text-slate-500 mt-1">Rule Engine Active</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold">Cost Exposure</span>
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">$0.00</p>
            <p className="text-xs text-slate-500 mt-1">AWS FinOps Ready</p>
          </div>
        </div>

        {/* Feature Modules Placeholder Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Desired vs Actual Infrastructure</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Supports Terraform state file parsing (.tfstate) matched against real-time AWS SDK boto3 queries for EC2, S3, RDS, Security Groups, and IAM configurations.
            </p>
            <div className="flex items-center text-xs text-sky-400 font-medium space-x-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Foundation Layer Online</span>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">AI Prioritization & Governance</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Modular rule engine evaluating risk severity, compliance violations, security drift, unmanaged resources, and actionable remediation steps.
            </p>
            <div className="flex items-center text-xs text-purple-400 font-medium space-x-1">
              <span>Rule Engine Module Loaded</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
