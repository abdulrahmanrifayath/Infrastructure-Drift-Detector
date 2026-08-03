import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const ComplianceDashboardPage: React.FC = () => {
  const [compliance, setCompliance] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompliance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/analytics/compliance');
      if (res.success) {
        setCompliance(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to calculate compliance framework readiness.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, []);

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Compliance Governance Frameworks</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time compliance scorecards across CIS AWS Foundations, SOC 2 Type II, ISO 27001, and HIPAA.
          </p>
        </div>

        <button
          onClick={fetchCompliance}
          disabled={loading}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Compliance</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Evaluating compliance frameworks..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchCompliance} />
      ) : (
        <>
          {/* Overall Compliance Score Card */}
          <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Aggregated Security Score</span>
              <p className="text-4xl font-extrabold text-emerald-400 mt-1">
                {compliance?.overall_compliance_score}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Weighted average readiness across all active frameworks</p>
            </div>

            <Badge variant="emerald" size="md">
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>Audit Ready Baseline</span>
            </Badge>
          </div>

          {/* Framework Scorecard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CIS AWS Benchmark</span>
              <p className="text-2xl font-bold text-white">{compliance?.frameworks?.cis_aws_benchmark?.score}%</p>
              <Badge variant={compliance?.frameworks?.cis_aws_benchmark?.score >= 80 ? 'emerald' : 'red'}>
                {compliance?.frameworks?.cis_aws_benchmark?.status}
              </Badge>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SOC 2 Type II</span>
              <p className="text-2xl font-bold text-white">{compliance?.frameworks?.soc2_type_2?.score}%</p>
              <Badge variant={compliance?.frameworks?.soc2_type_2?.score >= 80 ? 'emerald' : 'red'}>
                {compliance?.frameworks?.soc2_type_2?.status}
              </Badge>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ISO 27001</span>
              <p className="text-2xl font-bold text-white">{compliance?.frameworks?.iso_27001?.score}%</p>
              <Badge variant={compliance?.frameworks?.iso_27001?.score >= 80 ? 'emerald' : 'red'}>
                {compliance?.frameworks?.iso_27001?.status}
              </Badge>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">HIPAA Security Rule</span>
              <p className="text-2xl font-bold text-white">{compliance?.frameworks?.hipaa?.score}%</p>
              <Badge variant={compliance?.frameworks?.hipaa?.score >= 80 ? 'emerald' : 'red'}>
                {compliance?.frameworks?.hipaa?.status}
              </Badge>
            </div>
          </div>

          {/* Compliance Controls Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Compliance Control Evaluation Matrix</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-5">Control ID</th>
                    <th className="py-3.5 px-5">Framework</th>
                    <th className="py-3.5 px-5">Requirement Description</th>
                    <th className="py-3.5 px-5">Severity</th>
                    <th className="py-3.5 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {compliance?.controls?.map((ctrl: any) => (
                    <tr key={ctrl.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-semibold text-sky-400">{ctrl.id}</td>
                      <td className="py-3.5 px-5 text-slate-300 font-medium">{ctrl.framework}</td>
                      <td className="py-3.5 px-5 text-slate-200 font-medium">{ctrl.control}</td>
                      <td className="py-3.5 px-5">
                        <Badge variant={ctrl.severity === 'Critical' ? 'red' : 'amber'}>
                          {ctrl.severity}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {ctrl.status === 'PASS' ? (
                          <Badge variant="emerald">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            PASS
                          </Badge>
                        ) : (
                          <Badge variant="red">
                            <XCircle className="w-3 h-3 mr-1" />
                            FAIL
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
