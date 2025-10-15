import React, { useState } from 'react';
import GlassCard from '../common/GlassCard';

interface ComparisonDataPoint {
  timestamp: string;
  value: number;
}

interface ComparisonSeries {
  endpoint: string;
  data: ComparisonDataPoint[];
}

interface ComparisonViewProps {
  comparison: ComparisonSeries[];
  loading?: boolean;
  metric?: string;
  timeframe?: string;
  onMetricChange?: (metric: string) => void;
  onTimeframeChange?: (timeframe: string) => void;
  onEndpointsChange?: (endpoints: string[]) => void;
}

const METRICS = [
  { value: 'p50', label: 'P50 (Median)' },
  { value: 'p90', label: 'P90' },
  { value: 'p95', label: 'P95' },
  { value: 'p99', label: 'P99' },
  { value: 'avg', label: 'Average' }
];

const TIMEFRAMES = [
  { value: '1h', label: 'Last Hour' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' }
];

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
];

const ComparisonView: React.FC<ComparisonViewProps> = ({
  comparison,
  loading = false,
  metric = 'p95',
  timeframe = '1h',
  onMetricChange,
  onTimeframeChange,
  onEndpointsChange
}) => {
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>(
    comparison.map(c => c.endpoint)
  );

  const handleEndpointToggle = (endpoint: string) => {
    const newSelection = selectedEndpoints.includes(endpoint)
      ? selectedEndpoints.filter(e => e !== endpoint)
      : [...selectedEndpoints, endpoint];
    
    setSelectedEndpoints(newSelection);
    onEndpointsChange?.(newSelection);
  };

  const getFilteredComparison = () => {
    return comparison.filter(c => selectedEndpoints.includes(c.endpoint));
  };

  const getEndpointStats = (endpoint: string) => {
    const series = comparison.find(c => c.endpoint === endpoint);
    if (!series || series.data.length === 0) return null;

    const values = series.data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const current = values[values.length - 1];

    return { min, max, avg, current };
  };

  const metricLabel = METRICS.find(m => m.value === metric)?.label || metric;

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-600 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-600 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  const filteredComparison = getFilteredComparison();

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-lg font-semibold text-white mb-4 md:mb-0">Performance Comparison</h3>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            {onMetricChange && (
              <select
                value={metric}
                onChange={(e) => onMetricChange(e.target.value)}
                className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
              >
                {METRICS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            )}
            
            {onTimeframeChange && (
              <select
                value={timeframe}
                onChange={(e) => onTimeframeChange(e.target.value)}
                className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
              >
                {TIMEFRAMES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {/* Endpoint Selection */}
        <div className="flex flex-wrap gap-2 mb-4">
          {comparison.map((series, index) => (
            <button
              key={series.endpoint}
              onClick={() => handleEndpointToggle(series.endpoint)}
              className={`px-3 py-1 rounded text-sm border transition-colors ${
                selectedEndpoints.includes(series.endpoint)
                  ? 'bg-blue-400/20 border-blue-400 text-blue-400'
                  : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                ></div>
                <span>{series.endpoint}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {filteredComparison.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Select endpoints to compare</p>
        </div>
      ) : (
        <>
          {/* Comparison Chart */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">
              {metricLabel} Response Time Comparison
            </h4>
            <div className="h-64 bg-gray-700/30 rounded-lg p-4">
              <SimpleComparisonChart 
                data={filteredComparison} 
                colors={DEFAULT_COLORS}
                metric={metricLabel}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedEndpoints.map((endpoint, index) => {
              const stats = getEndpointStats(endpoint);
              if (!stats) return null;

              return (
                <div key={endpoint} className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                    ></div>
                    <h5 className="text-sm font-medium text-white">{endpoint}</h5>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current:</span>
                      <span className="text-white font-medium">{stats.current.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Average:</span>
                      <span className="text-gray-300">{stats.avg.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Min:</span>
                      <span className="text-gray-300">{stats.min.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Max:</span>
                      <span className="text-gray-300">{stats.max.toFixed(2)}ms</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </GlassCard>
  );
};

// Simple comparison chart component
interface SimpleComparisonChartProps {
  data: ComparisonSeries[];
  colors: string[];
  metric: string;
}

const SimpleComparisonChart: React.FC<SimpleComparisonChartProps> = ({ data, colors, metric }) => {
  if (data.length === 0) return null;

  // Calculate average values for each endpoint
  const averages = data.map(series => {
    const values = series.data.map(d => d.value);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  });

  const maxValue = Math.max(...averages);

  return (
    <div className="h-full flex items-end justify-around">
      {data.map((series, index) => {
        const average = averages[index];
        const height = (average / maxValue) * 100;
        
        return (
          <div key={series.endpoint} className="flex flex-col items-center flex-1">
            <div className="w-full flex flex-col items-center">
              <div className="text-xs text-gray-400 mb-1">
                {average.toFixed(2)}ms
              </div>
              <div 
                className="w-16 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-500 hover:to-blue-300"
                style={{ 
                  height: `${height}%`,
                  backgroundColor: colors[index % colors.length]
                }}
                title={`${series.endpoint}: ${average.toFixed(2)}ms (${metric})`}
              ></div>
            </div>
            <div className="text-xs text-gray-400 mt-2 text-center max-w-16 truncate">
              {series.endpoint}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ComparisonView;