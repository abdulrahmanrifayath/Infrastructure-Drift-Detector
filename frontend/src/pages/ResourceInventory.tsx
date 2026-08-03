import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Layers,
  Shield,
  Network,
  Globe,
  HardDrive,
  Cpu,
  Plus
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export interface ResourceItem {
  id: number;
  resource_name: string;
  resource_type: string;
  provider_id: string;
  provider: string;
  region: str;
  status: string;
  is_managed: boolean;
  last_checked_at: string;
  configuration_metadata?: any;
}

export interface InventoryMetrics {
  total_resources: number;
  managed_resources: number;
  unmanaged_resources: number;
  managed_percentage: number;
  resources_by_type: Record<string, number>;
  resources_by_region: Record<string, number>;
}

const RESOURCE_TYPES = [
  'All',
  'EC2',
  'Security Group',
  'IAM',
  'VPC',
  'Subnet',
  'Load Balancer',
  'Database',
  'S3',
];

export const ResourceInventory: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [managedFilter, setManagedFilter] = useState<string>('all'); // 'all' | 'managed' | 'unmanaged'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/resources?limit=200';
      if (selectedType !== 'All') {
        url += `&resource_type=${encodeURIComponent(selectedType)}`;
      }
      if (managedFilter === 'managed') {
        url += '&is_managed=true';
      } else if (managedFilter === 'unmanaged') {
        url += '&is_managed=false';
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const [resData, metricsData]: [any, any] = await Promise.all([
        api.get(url),
        api.get('/resources/metrics'),
      ]);

      if (resData.success) {
        setResources(resData.data);
      }
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      setError(err.message || 'Unable to communicate with cloud inventory API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedType, managedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      const response: any = await api.post('/resources/seed-demo');
      if (response.success) {
        fetchInventory();
      }
    } catch (err: any) {
      alert('Failed to seed demo data: ' + (err.message || 'Unknown error'));
    } finally {
      setSeeding(false);
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'EC2':
        return <Server className="w-4 h-4 text-sky-400" />;
      case 'Security Group':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'IAM':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'VPC':
        return <Network className="w-4 h-4 text-indigo-400" />;
      case 'Subnet':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'Load Balancer':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'Database':
        return <Database className="w-4 h-4 text-cyan-400" />;
      case 'S3':
        return <HardDrive className="w-4 h-4 text-orange-400" />;
      default:
        return <Server className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cloud Resource Inventory</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time catalog of AWS infrastructure discovered across Terraform IaC state and live APIs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleSeedDemoData}
            disabled={seeding}
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg shadow-sky-600/20 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{seeding ? 'Seeding...' : 'Seed Sample Cloud Data'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Total Discovered</p>
            <p className="text-2xl font-bold text-white">{metrics.total_resources}</p>
            <p className="text-[11px] text-slate-500 mt-1">AWS Resources tracked</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">IaC Managed</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-emerald-400">{metrics.managed_resources}</p>
              <span className="text-xs font-medium text-emerald-400/80">({metrics.managed_percentage}%)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Configured via Terraform</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Unmanaged Cloud Items</p>
            <p className="text-2xl font-bold text-amber-400">{metrics.unmanaged_resources}</p>
            <p className="text-[11px] text-slate-500 mt-1">Manual Console or Drift</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Supported Types</p>
            <p className="text-2xl font-bold text-sky-400">{Object.keys(metrics.resources_by_type).length} / 8</p>
            <p className="text-[11px] text-slate-500 mt-1">EC2, SG, IAM, VPC, Subnet, ELB, RDS, S3</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search resource name or provider ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
            />
          </form>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-400 font-medium mr-1">Management:</span>
            <select
              value={managedFilter}
              onChange={(e) => setManagedFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Resources</option>
              <option value="managed">Managed (Terraform)</option>
              <option value="unmanaged">Unmanaged (Manual)</option>
            </select>
          </div>
        </div>

        {/* Resource Type Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-t border-slate-800/60 pt-3">
          {RESOURCE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                selectedType === type
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inventory Data Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <LoadingSpinner label="Loading Cloud Inventory..." />
        ) : error ? (
          <div className="p-6">
            <ErrorMessage message={error} onRetry={fetchInventory} />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No Resources Found</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto mb-6">
              No cloud inventory items match the selected filter criteria or no resources have been seeded yet.
            </p>
            <button
              onClick={handleSeedDemoData}
              disabled={seeding}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all"
            >
              Seed Sample Cloud Inventory
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-5">Resource Name & Provider ID</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Region</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">IaC State</th>
                  <th className="py-3.5 px-5">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {resources.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-slate-100">{item.resource_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.provider_id}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center space-x-2">
                        {getResourceTypeIcon(item.resource_type)}
                        <span>{item.resource_type}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-slate-300">{item.region}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={item.status === 'active' ? 'emerald' : 'slate'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5">
                      {item.is_managed ? (
                        <Badge variant="sky">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Managed (Terraform)
                        </Badge>
                      ) : (
                        <Badge variant="amber">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Unmanaged
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {new Date(item.last_checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
