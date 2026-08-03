import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Shield,
  Server,
  Cpu,
  DollarSign,
  Play,
  ArrowRight,
  ShieldAlert,
  Layers,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentDrifts, setRecentDrifts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const [metricsRes, eventsRes]: [any, any] = await Promise.all([
        api.get('/drift/metrics'),
        api.get('/drift/events?limit=5'),
      ]);

      if (metricsRes.success) {
        setMetrics(metricsRes.data);
      }
      if (eventsRes.success) {
        setRecentDrifts(eventsRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      await api.post('/drift/analyze');
      await fetchDashboardMetrics();
    } catch (err: any) {
      alert('Failed to analyze drift: ' + (err.message || 'Unknown error'));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.full_name || 'Engineer'}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Continuous Infrastructure Drift Detection Engine active. Monitoring Terraform IaC state against live AWS cloud APIs.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/20 flex items-center justify-center space-x-2 transition-all whitespace-nowrap disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Analyzing Drift...' : 'Analyze Drift Engine'}</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading Governance Widgets..." />
      ) : (
        <>
          {/* Live Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">Critical Drift</span>
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">{metrics?.critical_count || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Immediate action required</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">High Severity</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400">{metrics?.high_count || 0}</p>
              <p className="text-xs text-slate-500 mt-1">High risk misconfigurations</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">Medium & Low</span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-sky-400">
                {(metrics?.medium_count || 0) + (metrics?.low_count || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Minor attribute variances</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">Total Open Events</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">{metrics?.open_drift_count || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Active governance items</p>
            </div>
          </div>

          {/* Recent Drift Activity Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Recent Drift Detection Events</h3>
                <p className="text-xs text-slate-400 mt-0.5">Top prioritized cloud governance findings</p>
              </div>

              <Link
                to="/drift"
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center space-x-1"
              >
                <span>View All Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentDrifts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No active drift events detected yet. Run the drift engine analysis to scan infrastructure.
              </div>
            ) : (
              <div className="space-y-3">
                {recentDrifts.map((event) => (
                  <div
                    key={event.id}
                    className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200 text-xs">{event.title}</span>
                        <Badge
                          variant={
                            event.severity === 'Critical'
                              ? 'red'
                              : event.severity === 'High'
                              ? 'amber'
                              : event.severity === 'Medium'
                              ? 'purple'
                              : 'slate'
                          }
                        >
                          {event.severity}
                        </Badge>
                        <Badge variant="sky">{event.drift_category}</Badge>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{event.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-500">{event.provider_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
