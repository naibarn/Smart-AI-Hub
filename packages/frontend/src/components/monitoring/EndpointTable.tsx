import React, { useState, useMemo } from 'react';
import GlassCard from '../common/GlassCard';

interface EndpointMetrics {
  service: string;
  route: string;
  method: string;
  slaTier: string;
  metrics: {
    p50: string;
    p90: string;
    p95: string;
    p99: string;
    avg: string;
    count: number;
    slaCompliance: number;
  };
}

interface EndpointTableProps {
  endpoints: EndpointMetrics[];
  loading?: boolean;
  onEndpointClick?: (endpoint: EndpointMetrics) => void;
}

const EndpointTable: React.FC<EndpointTableProps> = ({
  endpoints,
  loading = false,
  onEndpointClick
}) => {
  const [filters, setFilters] = useState({
    service: '',
    slaTier: '',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof EndpointMetrics['metrics'] | 'service' | 'route' | 'method';
    direction: 'asc' | 'desc';
  }>({
    key: 'p95',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter and sort endpoints
  const filteredAndSortedEndpoints = useMemo(() => {
    let filtered = endpoints.filter(endpoint => {
      if (filters.service && endpoint.service !== filters.service) return false;
      if (filters.slaTier && endpoint.slaTier !== filters.slaTier) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          endpoint.service.toLowerCase().includes(searchLower) ||
          endpoint.route.toLowerCase().includes(searchLower) ||
          endpoint.method.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'service' || sortConfig.key === 'route' || sortConfig.key === 'method') {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      } else {
        aValue = parseFloat(String(a.metrics[sortConfig.key]));
        bValue = parseFloat(String(b.metrics[sortConfig.key]));
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [endpoints, filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEndpoints.length / itemsPerPage);
  const paginatedEndpoints = filteredAndSortedEndpoints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSLATierColor = (tier: string) => {
    switch (tier) {
      case 'critical': return 'text-red-400 bg-red-400/10';
      case 'high': return 'text-orange-400 bg-orange-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return 'text-green-400';
    if (compliance >= 90) return 'text-yellow-400';
    return 'text-red-400';
  };

  const uniqueServices = [...new Set(endpoints.map(e => e.service))];
  const uniqueSLATiers = [...new Set(endpoints.map(e => e.slaTier))];

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-600 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Endpoint Analysis</h3>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search endpoints..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
          />
          
          <select
            value={filters.service}
            onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
          >
            <option value="">All Services</option>
            {uniqueServices.map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
          
          <select
            value={filters.slaTier}
            onChange={(e) => setFilters(prev => ({ ...prev, slaTier: e.target.value }))}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
          >
            <option value="">All SLA Tiers</option>
            {uniqueSLATiers.map(tier => (
              <option key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>
            ))}
          </select>
          
          <div className="text-sm text-gray-400 flex items-center">
            {filteredAndSortedEndpoints.length} endpoints
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th 
                className="text-left py-3 px-2 text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('service')}
              >
                Service {sortConfig.key === 'service' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="text-left py-3 px-2 text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('route')}
              >
                Route {sortConfig.key === 'route' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="text-left py-3 px-2 text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('method')}
              >
                Method {sortConfig.key === 'method' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-2 text-gray-300">SLA Tier</th>
              <th 
                className="text-right py-3 px-2 text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('p50')}
              >
                P50 {sortConfig.key === 'p50' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="text-right py-3 px-2 text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('p90')}
              >
                P90 {sortConfig.key === 'p90' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="text-right py-3 px-2 text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('p95')}
              >
                P95 {sortConfig.key === 'p95' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="text-right py-3 px-2 text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('p99')}
              >
                P99 {sortConfig.key === 'p99' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="text-right py-3 px-2 text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('avg')}
              >
                Avg {sortConfig.key === 'avg' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="text-right py-3 px-2 text-gray-300 cursor-pointer hover:text-white"
                onClick={() => handleSort('count')}
              >
                Requests {sortConfig.key === 'count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right py-3 px-2 text-gray-300">SLA Compliance</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEndpoints.map((endpoint, index) => (
              <tr 
                key={index}
                className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                onClick={() => onEndpointClick?.(endpoint)}
              >
                <td className="py-3 px-2 text-gray-300">{endpoint.service}</td>
                <td className="py-3 px-2 text-gray-300 font-mono text-xs">{endpoint.route}</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-1 bg-blue-400/20 text-blue-400 rounded text-xs">
                    {endpoint.method}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded text-xs ${getSLATierColor(endpoint.slaTier)}`}>
                    {endpoint.slaTier.charAt(0).toUpperCase() + endpoint.slaTier.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-2 text-right text-gray-300">{endpoint.metrics.p50}ms</td>
                <td className="py-3 px-2 text-right text-gray-300">{endpoint.metrics.p90}ms</td>
                <td className="py-3 px-2 text-right text-gray-300">{endpoint.metrics.p95}ms</td>
                <td className="py-3 px-2 text-right text-gray-300">{endpoint.metrics.p99}ms</td>
                <td className="py-3 px-2 text-right text-gray-300">{endpoint.metrics.avg}ms</td>
                <td className="py-3 px-2 text-right text-gray-300">{endpoint.metrics.count.toLocaleString()}</td>
                <td className="py-3 px-2 text-right">
                  <span className={getComplianceColor(endpoint.metrics.slaCompliance)}>
                    {endpoint.metrics.slaCompliance.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </GlassCard>
  );
};

export default EndpointTable;