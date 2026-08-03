import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Play,
  CheckCircle2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useNavigate } from 'react-router-dom';

export interface DriftEventItem {
  id: number;
  sync_job_id: number;
  resource_name: string;
  provider_id: string;
  resource_type: string;
  drift_category: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  detected_at: string;
  desired_state?: any;
  actual_state?: any;
  diff_details: any;
}

const CATEGORIES = ['All', 'Configuration', 'Missing Resource', 'Unmanaged Resource', 'Security', 'IAM', 'Networking'];
const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

export const DriftHistory: React.FC = () => {
  const [events, setEvents] = useState<DriftEventItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState<number>(0);

  const navigate = useNavigate();

  const fetchDriftEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/drift/events?skip=${(page - 1) * pageSize}&limit=${pageSize}`;
      if (selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedSeverity !== 'All') {
        url += `&severity=${encodeURIComponent(selectedSeverity)}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res: any = await api.get(url);
      if (res.success) {
        setEvents(res.data);
        setTotalCount(res.data.length); // Dynamic count approximation
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve drift events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriftEvents();
  }, [selectedCategory, selectedSeverity, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDriftEvents();
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res: any = await api.post('/drift/analyze');
      if (res.success) {
        fetchDriftEvents();
      }
    } catch (err: any) {
      alert('Analysis failed: ' + (err.message || 'Unknown error'));
    } finally {
      setAnalyzing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Drift History Audit Log</h1>
          <p className="text-slate-400 text-sm mt-1">
            Enterprise audit trail of detected Configuration, Security, IAM, and Networking drifts.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Scanning Infrastructure...' : 'Run Drift Engine Analysis'}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by resource, provider ID, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
            />
          </form>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950/80 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-t border-slate-800/60 pt-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Drift Events Data Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <LoadingSpinner label="Fetching drift event history..." />
        ) : error ? (
          <div className="p-6">
            <ErrorMessage message={error} onRetry={fetchDriftEvents} />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No Drift Events Found</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto mb-4">
              Infrastructure matches desired IaC rules or no drift scan has been executed yet.
            </p>
            <button
              onClick={handleRunAnalysis}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all"
            >
              Run Drift Engine Analysis
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-5">Severity</th>
                  <th className="py-3.5 px-5">Finding & Provider ID</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Detected Time</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5">
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
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-100">{event.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{event.provider_id}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant="sky">{event.drift_category}</Badge>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300 font-medium">
                      {event.resource_type}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {new Date(event.detected_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => navigate('/comparison', { state: { eventId: event.id } })}
                        className="inline-flex items-center space-x-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg border border-sky-500/20 text-xs font-medium transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Compare Diff</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
