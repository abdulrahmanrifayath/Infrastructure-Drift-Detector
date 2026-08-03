import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Shield,
  Briefcase,
  DollarSign,
  Clock,
  Code,
  Copy,
  Check,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export interface RecommendationItem {
  id: number;
  drift_event_id: number;
  provider_id: string;
  priority_score: number;
  explanation: string;
  business_impact: string;
  security_impact: str;
  estimated_monthly_cost: number;
  recommended_fix: string;
  estimated_fix_time: string;
  created_at: string;
}

export const AIRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/recommendations?limit=100');
      if (res.success) {
        setRecommendations(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve AI recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const res: any = await api.post('/recommendations/generate');
      if (res.success) {
        fetchRecommendations();
      }
    } catch (err: any) {
      alert('Generation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPriorityBadgeVariant = (score: number) => {
    if (score >= 90) return 'red';
    if (score >= 75) return 'amber';
    if (score >= 50) return 'sky';
    return 'slate';
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Cloud Governance & Remediation</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Modular AI Engine</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Automated priority scoring, financial impact estimation, and executable Terraform / CLI fixes.
          </p>
        </div>

        <button
          onClick={handleGenerateAI}
          disabled={generating}
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          <span>{generating ? 'Synthesizing AI Guidance...' : 'Generate AI Recommendations'}</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Evaluating Cloud Governance Guidance..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchRecommendations} />
      ) : recommendations.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Cpu className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">No AI Recommendations Generated Yet</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto mb-4">
            Run the AI recommendation engine to synthesize actionable remediation steps for detected drift findings.
          </p>
          <button
            onClick={handleGenerateAI}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all"
          >
            Generate AI Guidance Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl hover:border-slate-700/80 transition-all"
            >
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-medium">Priority Score:</span>
                    <span className="font-extrabold text-sm text-amber-400">{rec.priority_score} / 100</span>
                  </div>
                  <Badge variant={getPriorityBadgeVariant(rec.priority_score)}>
                    Priority {rec.priority_score >= 80 ? 'Critical' : 'High'}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">{rec.provider_id}</span>
                </div>

                <div className="flex items-center space-x-4 text-xs">
                  <span className="flex items-center space-x-1 text-purple-400 font-medium">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>${rec.estimated_monthly_cost.toFixed(2)} / mo</span>
                  </span>
                  <span className="flex items-center space-x-1 text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{rec.estimated_fix_time}</span>
                  </span>
                </div>
              </div>

              {/* Explanation & Impact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span>Technical Finding</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{rec.explanation}</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    <span>Business Impact</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{rec.business_impact}</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span>Security Exposure</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{rec.security_impact}</p>
                </div>
              </div>

              {/* Actionable Code Remediation Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                    <Code className="w-4 h-4" />
                    <span>Recommended Executable Fix (AWS CLI / Terraform)</span>
                  </div>

                  <button
                    onClick={() => handleCopyCode(rec.id, rec.recommended_fix)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 transition-all"
                  >
                    {copiedId === rec.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Fix Code</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-2 leading-relaxed">
                  {rec.recommended_fix}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
