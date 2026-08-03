import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, FileText, Clock, RefreshCw, BarChart2 } from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const DriftAnalyticsPage: React.FC = () => {
  const [trendsData, setTrendsData] = useState<any>(null);
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/analytics/trends?days=${days}`);
      if (res.success) {
        setTrendsData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch historical analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [days]);

  const handleDownloadCSV = () => {
    window.open('/api/v1/analytics/export/csv', '_blank');
  };

  const handleDownloadPDF = () => {
    window.open('/api/v1/analytics/export/pdf', '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Historical Drift Analytics & Export Reports</h1>
          <p className="text-slate-400 text-sm mt-1">
            Historical drift timelines, resolution velocity metrics, and downloadable executive audit reports.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadCSV}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/20 flex items-center space-x-2 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Calculating historical trends..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchTrends} />
      ) : (
        <>
          {/* Time Filter & Resolution Metrics Header */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Mean Resolution Velocity</span>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold text-emerald-400">{trendsData?.resolution_velocity_hours} Hours</p>
                <span className="text-xs text-slate-500">Average time to fix critical drift</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">Time Window:</span>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 font-semibold"
              >
                <option value={7}>Last 7 Days</option>
                <option value={14}>Last 14 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Historical Trend Timeline Visualizer */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-base">
              <BarChart2 className="w-5 h-5 text-sky-400" />
              <h3>Historical Drift Frequency Timeline ({days} Days)</h3>
            </div>

            <div className="space-y-4 pt-2">
              {trendsData?.timeline?.map((item: any, idx: number) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{item.date}</span>
                    <span className="font-bold text-slate-200">{item.total_drifts} Drift Events</span>
                  </div>

                  {/* Visual Bar Stack */}
                  <div className="w-full bg-slate-950 rounded-full h-3 flex overflow-hidden border border-slate-800">
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${(item.critical / (item.total_drifts || 1)) * 100}%` }}
                      title={`Critical: ${item.critical}`}
                    ></div>
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${(item.high / (item.total_drifts || 1)) * 100}%` }}
                      title={`High: ${item.high}`}
                    ></div>
                    <div
                      className="bg-purple-500 h-full"
                      style={{ width: `${(item.medium / (item.total_drifts || 1)) * 100}%` }}
                      title={`Medium: ${item.medium}`}
                    ></div>
                    <div
                      className="bg-slate-600 h-full"
                      style={{ width: `${(item.low / (item.total_drifts || 1)) * 100}%` }}
                      title={`Low: ${item.low}`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Critical</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <span>High</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                <span>Low</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
