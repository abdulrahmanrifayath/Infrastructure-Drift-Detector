import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  RefreshCw,
  Play,
  Bell,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Send,
  Globe,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const SystemMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [scanInterval, setScanInterval] = useState<number>(60);
  const [activeTab, setActiveTab] = useState<'notifications' | 'audit'>('notifications');
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);
  const [savingInterval, setSavingInterval] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, notifRes, auditRes]: [any, any, any] = await Promise.all([
        api.get('/monitoring/dashboard'),
        api.get('/monitoring/notifications?limit=50'),
        api.get('/monitoring/audit-logs?limit=50'),
      ]);

      if (metricsRes.success) {
        setMetrics(metricsRes.data);
        setScanInterval(metricsRes.data.scan_interval_minutes);
      }
      if (notifRes.success) {
        setNotifications(notifRes.data);
      }
      if (auditRes.success) {
        setAuditLogs(auditRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve system monitoring metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const handleUpdateInterval = async () => {
    setSavingInterval(true);
    try {
      const res: any = await api.put('/monitoring/scheduler', { interval_minutes: scanInterval });
      if (res.success) {
        fetchMonitoringData();
      }
    } catch (err: any) {
      alert('Failed to update scan interval: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingInterval(false);
    }
  };

  const handleManualTrigger = async () => {
    setTriggering(true);
    try {
      const res: any = await api.post('/monitoring/trigger-scan');
      if (res.success) {
        fetchMonitoringData();
      }
    } catch (err: any) {
      alert('Manual scan trigger failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Monitoring & Background Scheduler</h1>
          <p className="text-slate-400 text-sm mt-1">
            Automated periodic drift scanning, interval frequency management, and multi-channel notification dispatch logs.
          </p>
        </div>

        <button
          onClick={handleManualTrigger}
          disabled={triggering}
          className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${triggering ? 'animate-spin' : ''}`} />
          <span>{triggering ? 'Executing Worker Scan...' : 'Trigger Immediate Scan'}</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Retrieving scheduler monitoring data..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchMonitoringData} />
      ) : (
        <>
          {/* Key Monitoring Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Last Scan</span>
              <p className="text-sm font-bold text-slate-100 mt-1">
                {metrics?.last_scan ? new Date(metrics.last_scan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Automated Worker</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Next Scheduled Scan</span>
              <p className="text-sm font-bold text-sky-400 mt-1">
                {metrics?.next_scan ? new Date(metrics.next_scan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">APScheduler Active</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Resources Scanned</span>
              <p className="text-2xl font-bold text-white mt-0.5">{metrics?.resources_scanned_count || 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">AWS Inventory</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Drifts Found</span>
              <p className="text-2xl font-bold text-amber-400 mt-0.5">{metrics?.drifts_found_count || 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Active Findings</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Notifications Sent</span>
              <p className="text-2xl font-bold text-purple-400 mt-0.5">{metrics?.notifications_sent_count || 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Alert Dispatches</p>
            </div>
          </div>

          {/* Configurable Scan Interval Controls */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-white font-semibold text-base">
                <Sliders className="w-5 h-5 text-sky-400" />
                <h3>Periodic Drift Scan Frequency Settings</h3>
              </div>
              <p className="text-xs text-slate-400">
                Configure background worker execution frequency for continuous cloud governance checks.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={scanInterval}
                onChange={(e) => setScanInterval(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500 font-semibold"
              >
                <option value={15}>Every 15 Minutes</option>
                <option value={30}>Every 30 Minutes</option>
                <option value={60}>Every 1 Hour (Default)</option>
                <option value={360}>Every 6 Hours</option>
                <option value={720}>Every 12 Hours</option>
                <option value={1440}>Every 24 Hours</option>
              </select>

              <button
                onClick={handleUpdateInterval}
                disabled={savingInterval}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {savingInterval ? 'Saving...' : 'Save Interval'}
              </button>
            </div>
          </div>

          {/* Multi-Channel Notification Integration Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>Slack Integration</span>
                </div>
                <Badge variant="emerald">Active</Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Channel: #cloud-governance-alerts</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>Email Dispatch</span>
                </div>
                <Badge variant="emerald">Active</Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">To: devops-alerts@enterprise.com</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>HTTPS Webhooks</span>
                </div>
                <Badge variant="emerald">Active</Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Endpoint: https://api.enterprise.com/webhooks</p>
            </div>
          </div>

          {/* Logs Tabs: Notification Logs vs Audit Trail */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
            <div className="flex items-center space-x-4 border-b border-slate-800 px-6 pt-4">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`pb-3 text-xs font-semibold transition-all border-b-2 ${
                  activeTab === 'notifications'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Notification Dispatch Logs ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-3 text-xs font-semibold transition-all border-b-2 ${
                  activeTab === 'audit'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                System Audit Log Trail ({auditLogs.length})
              </button>
            </div>

            <div className="px-6 pb-6">
              {activeTab === 'notifications' ? (
                notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No notification alert history recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                          <th className="py-3 px-4">Channel</th>
                          <th className="py-3 px-4">Recipient</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Sent Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {notifications.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <Badge variant={log.channel === 'slack' ? 'sky' : log.channel === 'email' ? 'purple' : 'emerald'}>
                                {log.channel}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">{log.recipient}</td>
                            <td className="py-3 px-4 font-medium text-slate-100">{log.subject}</td>
                            <td className="py-3 px-4">
                              <Badge variant="emerald">{log.status}</Badge>
                            </td>
                            <td className="py-3 px-4 text-right text-slate-400">
                              {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No audit logs recorded.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                          <th className="py-3 px-4">Action</th>
                          <th className="py-3 px-4">Actor</th>
                          <th className="py-3 px-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-100">{log.action}</td>
                            <td className="py-3 px-4 text-slate-300">{log.actor}</td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
