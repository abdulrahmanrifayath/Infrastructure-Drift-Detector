import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, AlertCircle, PieChart, ShieldAlert, RefreshCw, Server, HardDrive } from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const CostAnalyticsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCostAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/recommendations/cost-analysis');
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to calculate FinOps cost analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostAnalytics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FinOps Cost Drift & Waste Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Financial exposure breakdown and optimization opportunities for unmanaged cloud resources.
          </p>
        </div>

        <button
          onClick={fetchCostAnalytics}
          disabled={loading}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Financial Stats</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Calculating financial exposure..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchCostAnalytics} />
      ) : (
        <>
          {/* Key FinOps Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">Total Monthly Exposure</span>
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">${summary?.total_estimated_monthly_cost?.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Estimated total monthly spend across drifted resources</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">Unmanaged Waste</span>
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-3xl font-bold text-amber-400">${summary?.unmanaged_resource_cost?.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Untracked manual console resources</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold">Potential Savings</span>
                <TrendingDown className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-emerald-400">${summary?.potential_monthly_savings?.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Achievable via automated remediation</p>
            </div>
          </div>

          {/* Breakdown by Resource Type */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-base">
              <PieChart className="w-5 h-5 text-sky-400" />
              <h3>Monthly Cost Exposure by Cloud Resource Type</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {Object.entries(summary?.cost_by_resource_type || {}).map(([resType, amount]: [string, any]) => (
                <div key={resType} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">{resType}</span>
                  <p className="text-xl font-bold text-slate-200">${amount.toFixed(2)} / mo</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cost Exposure Items Data Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Top Financial Impact Items</h3>
              <p className="text-xs text-slate-400 mt-0.5">Prioritized by monthly USD waste contribution</p>
            </div>

            {summary?.top_cost_drift_items?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No cost drift findings recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-5">Resource Name & Provider ID</th>
                      <th className="py-3.5 px-5">Type</th>
                      <th className="py-3.5 px-5">Finding Category</th>
                      <th className="py-3.5 px-5">Priority Score</th>
                      <th className="py-3.5 px-5 text-right">Est. Monthly Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {summary?.top_cost_drift_items?.map((item: any) => (
                      <tr key={item.recommendation_id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-5 font-medium text-slate-100">
                          <div>{item.resource_name}</div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">{item.provider_id}</div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-300 font-medium">{item.resource_type}</td>
                        <td className="py-3.5 px-5">
                          <Badge variant="sky">{item.category}</Badge>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-amber-400">{item.priority_score} / 100</span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-purple-300">
                          ${item.estimated_monthly_cost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
