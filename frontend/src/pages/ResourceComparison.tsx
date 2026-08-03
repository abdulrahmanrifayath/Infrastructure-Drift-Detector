import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GitCompare, FileCode, Cloud, AlertCircle, ArrowRight, ShieldAlert, Check } from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const ResourceComparison: React.FC = () => {
  const location = useLocation();
  const initialEventId = location.state?.eventId;

  const [eventId, setEventId] = useState<number | null>(initialEventId || null);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [diffData, setDiffData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initComparison = async () => {
      setLoading(true);
      setError(null);
      try {
        const eventsRes: any = await api.get('/drift/events?limit=50');
        if (eventsRes.success && eventsRes.data.length > 0) {
          setEventsList(eventsRes.data);
          const targetId = eventId || eventsRes.data[0].id;
          setEventId(targetId);
          fetchEventDiff(targetId);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load drift comparison data.');
        setLoading(false);
      }
    };

    initComparison();
  }, []);

  const fetchEventDiff = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/drift/compare/${id}`);
      if (res.success) {
        setDiffData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch diff details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (id: number) => {
    setEventId(id);
    fetchEventDiff(id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Side-by-Side Resource Comparison</h1>
          <p className="text-slate-400 text-sm mt-1">
            Deep attribute inspection contrasting Desired Terraform State against Live AWS Infrastructure.
          </p>
        </div>

        {/* Dropdown Selector */}
        {eventsList.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Target Finding:</span>
            <select
              value={eventId || ''}
              onChange={(e) => handleSelectEvent(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 max-w-xs truncate"
            >
              {eventsList.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.severity}] {item.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading Side-by-Side Diff..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !diffData ? (
        <div className="text-center py-16 text-slate-500 text-xs">
          No drift comparison selected or available. Run a drift scan first.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Finding Header Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    diffData.severity === 'Critical'
                      ? 'red'
                      : diffData.severity === 'High'
                      ? 'amber'
                      : 'sky'
                  }
                >
                  {diffData.severity} Severity
                </Badge>
                <Badge variant="purple">{diffData.drift_category}</Badge>
                <span className="text-xs font-semibold text-white">{diffData.resource_name}</span>
              </div>
              <p className="text-xs font-mono text-slate-400">{diffData.provider_id}</p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-400">Resource Type:</span>
              <span className="font-semibold text-slate-200 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {diffData.resource_type}
              </span>
            </div>
          </div>

          {/* Side-by-Side JSON Attribute Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desired State Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs">
                  <FileCode className="w-4 h-4" />
                  <span>Desired State (Terraform IaC)</span>
                </div>
                <Badge variant="sky">Declared Rules</Badge>
              </div>

              <pre className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96">
                {JSON.stringify(diffData.desired_state || { status: 'Not Declared in IaC' }, null, 2)}
              </pre>
            </div>

            {/* Actual State Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
                  <Cloud className="w-4 h-4" />
                  <span>Actual State (Live AWS Cloud)</span>
                </div>
                <Badge variant="emerald">Live API Discovery</Badge>
              </div>

              <pre className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96">
                {JSON.stringify(diffData.actual_state || { status: 'Missing in Live AWS Cloud' }, null, 2)}
              </pre>
            </div>
          </div>

          {/* Key Mismatches Delta Breakdown */}
          {diffData.diff_keys && diffData.diff_keys.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-semibold text-white">Attribute Discrepancies Breakdown</h4>
              <div className="space-y-3">
                {diffData.diff_keys.map((key: string) => {
                  const delta = diffData.differences[key];
                  return (
                    <div
                      key={key}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"
                    >
                      <div className="font-mono font-semibold text-sky-400 self-center">{key}</div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Desired IaC Value</p>
                        <code className="bg-slate-900 px-2 py-1 rounded text-red-300 font-mono block truncate">
                          {JSON.stringify(delta?.desired ?? 'None')}
                        </code>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Actual Live Value</p>
                        <code className="bg-slate-900 px-2 py-1 rounded text-emerald-300 font-mono block truncate">
                          {JSON.stringify(delta?.actual ?? 'None')}
                        </code>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
