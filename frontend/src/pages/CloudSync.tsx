import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  FileCode,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock,
  Layers,
  ArrowRight,
  Code2
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

interface SyncJob {
  id: number;
  status: string;
  started_at: string;
  completed_at?: string;
  desired_resources_count: number;
  actual_resources_count: number;
  error_message?: string;
}

interface ComparisonPair {
  provider_id: string;
  resource_type: string;
  state: string;
  desired?: any;
  actual?: any;
}

export const CloudSync: React.FC = () => {
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [comparisonPairs, setComparisonPairs] = useState<ComparisonPair[]>([]);
  const [terraformStateRaw, setTerraformStateRaw] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, compRes]: [any, any] = await Promise.all([
        api.get('/sync/jobs?limit=10'),
        api.get('/sync/comparison-ready'),
      ]);

      if (jobsRes.success) {
        setSyncJobs(jobsRes.data);
      }
      if (compRes.success) {
        setComparisonPairs(compRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with synchronization engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
  }, []);

  const handleLoadSampleState = async () => {
    try {
      const res: any = await api.get('/sync/sample-tfstate');
      if (res.success && res.data?.raw_json) {
        setTerraformStateRaw(res.data.raw_json);
      }
    } catch (err: any) {
      alert('Failed to load sample state: ' + err.message);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncProgress(15);
    setError(null);

    const interval = setInterval(() => {
      setSyncProgress((prev) => (prev < 85 ? prev + 25 : prev));
    }, 300);

    try {
      const payload = terraformStateRaw.trim()
        ? { terraform_state_raw: terraformStateRaw.trim() }
        : undefined;

      const response: any = await api.post('/sync/run', payload);

      setSyncProgress(100);
      clearInterval(interval);

      if (response.success) {
        setTimeout(() => {
          setSyncing(false);
          setSyncProgress(0);
          fetchSyncData();
        }, 500);
      }
    } catch (err: any) {
      clearInterval(interval);
      setSyncing(false);
      setSyncProgress(0);
      setError(err.message || 'Synchronization execution failed.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cloud Infrastructure Synchronization</h1>
          <p className="text-slate-400 text-sm mt-1">
            Engine comparing Desired IaC (Terraform State) against Actual Live Cloud Discovery (AWS SDK).
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={syncing}
          className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Synchronizing Infrastructure...' : 'Run Full Sync Job'}</span>
        </button>
      </div>

      {/* Sync Execution Progress Indicator */}
      {syncing && (
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-6 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-sky-400 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Parsing Terraform .tfstate & Querying AWS APIs...</span>
            </span>
            <span className="text-slate-300 font-mono">{syncProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${syncProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchSyncData} />}

      {/* Dual Panel: Terraform State Editor + Live Discovery Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desired State Input Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 text-slate-200">
              <FileCode className="w-5 h-5 text-sky-400" />
              <h3 className="font-semibold text-sm">Desired State (Terraform .tfstate)</h3>
            </div>
            <button
              onClick={handleLoadSampleState}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1 font-medium bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 transition-all"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Load Sample JSON</span>
            </button>
          </div>

          <textarea
            value={terraformStateRaw}
            onChange={(e) => setTerraformStateRaw(e.target.value)}
            placeholder="Paste raw terraform.tfstate JSON here or click 'Load Sample JSON' to test parsing..."
            rows={8}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all"
          ></textarea>
        </div>

        {/* Live Cloud Discovery Status Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2.5 text-slate-200">
            <Cloud className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm">Actual Live Cloud Discovery (AWS SDK)</h3>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">AWS Provider Engine:</span>
              <span className="font-mono text-emerald-400 font-semibold">boto3 SDK Active</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target AWS Region:</span>
              <span className="font-mono text-slate-200">us-east-1 (Default)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Discovered Categories:</span>
              <span className="text-slate-300">EC2, SG, IAM, VPC, Subnet, ELB, RDS, S3</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The discovery engine scans live AWS resource attributes and pairs them directly against Terraform declared state entries to build comparison snapshot tuples.
          </p>
        </div>
      </div>

      {/* Comparison Snapshot Preview Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Comparison-Ready Infrastructure Snapshot</h3>
            <p className="text-xs text-slate-400 mt-0.5">Paired desired IaC elements vs actual cloud instances</p>
          </div>
          <Badge variant="sky">{comparisonPairs.length} Paired Items</Badge>
        </div>

        {loading ? (
          <LoadingSpinner label="Generating comparison tuples..." />
        ) : comparisonPairs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No comparison snapshot available yet. Run a synchronization job to populate tuples.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-5">Provider ID & Resource</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Desired IaC State</th>
                  <th className="py-3.5 px-5">Actual Cloud Discovery</th>
                  <th className="py-3.5 px-5">Snapshot State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {comparisonPairs.map((pair, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-300">
                      {pair.provider_id}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-slate-200">{pair.resource_type}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      {pair.desired ? (
                        <div className="text-emerald-400 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Declared in IaC</span>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-medium">Not in Terraform</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {pair.actual ? (
                        <div className="text-emerald-400 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Discovered Live</span>
                        </div>
                      ) : (
                        <span className="text-red-400 font-medium">Missing in Cloud</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {pair.state === 'in_sync' && <Badge variant="emerald">In Sync</Badge>}
                      {pair.state === 'drifted' && <Badge variant="amber">Drift Detected</Badge>}
                      {pair.state === 'missing_in_cloud' && <Badge variant="red">Missing in Cloud</Badge>}
                      {pair.state === 'unmanaged_in_cloud' && <Badge variant="purple">Unmanaged Resource</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sync Jobs Execution History */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-sm text-white">Synchronization Execution Log History</h3>

        {syncJobs.length === 0 ? (
          <p className="text-xs text-slate-500">No sync execution history recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {syncJobs.map((job) => (
              <div
                key={job.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                    #{job.id}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-200 capitalize">Sync Run #{job.id}</span>
                      <Badge
                        variant={
                          job.status === 'completed'
                            ? 'emerald'
                            : job.status === 'failed'
                            ? 'red'
                            : 'sky'
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(job.started_at).toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-slate-400 text-right">
                  <div>
                    <p className="font-semibold text-slate-200">{job.desired_resources_count}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Desired IaC</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">{job.actual_resources_count}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Discovered AWS</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
