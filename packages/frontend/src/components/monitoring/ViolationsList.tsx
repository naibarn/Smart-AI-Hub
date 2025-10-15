import React, { useState } from 'react';
import GlassCard from '../common/GlassCard';

interface ViolationDataPoint {
  timestamp: string;
  value: number;
}

interface SLAViolation {
  service: string;
  route: string;
  method: string;
  slaTier: string;
  slaThreshold: string;
  violationRate: string;
  trend: ViolationDataPoint[];
}

interface ViolationsListProps {
  violations: SLAViolation[];
  loading?: boolean;
  timeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
}

const ViolationsList: React.FC<ViolationsListProps> = ({
  violations,
  loading = false,
  timeframe = '1h',
  onTimeframeChange
}) => {
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);

  const getSeverityColor = (violationRate: string) => {
    const rate = parseFloat(violationRate);
    if (rate > 20) return 'text-red-400 bg-red-400/10';
    if (rate > 10) return 'text-orange-400 bg-orange-400/10';
    if (rate > 5) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-blue-400 bg-blue-400/10';
  };

  const getSeverityLabel = (violationRate: string) => {
    const rate = parseFloat(violationRate);
    if (rate > 20) return 'Critical';
    if (rate > 10) return 'High';
    if (rate > 5) return 'Medium';
    return 'Low';
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

  const toggleExpansion = (violationId: string) => {
    setExpandedViolation(prev => prev === violationId ? null : violationId);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-600 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">SLA Violations</h3>
          
          {onTimeframeChange && (
            <select
              value={timeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          )}
        </div>
        
        {violations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-400 text-4xl mb-2">✓</div>
            <p className="text-gray-400">No SLA violations detected</p>
          </div>
        ) : (
          <div className="space-y-4">
            {violations.map((violation, index) => {
              const violationId = `${violation.service}-${violation.route}-${violation.method}`;
              const isExpanded = expandedViolation === violationId;
              
              return (
                <div
                  key={index}
                  className="border border-gray-600 rounded-lg overflow-hidden hover:border-gray-500 transition-colors"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => toggleExpansion(violationId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-300 font-medium">{violation.service}</span>
                          <span className="text-gray-500">/</span>
                          <span className="text-gray-300 font-mono text-sm">{violation.route}</span>
                          <span className="px-2 py-1 bg-blue-400/20 text-blue-400 rounded text-xs">
                            {violation.method}
                          </span>
                        </div>
                        
                        <span className={`px-2 py-1 rounded text-xs ${getSLATierColor(violation.slaTier)}`}>
                          {violation.slaTier.charAt(0).toUpperCase() + violation.slaTier.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getSeverityColor(violation.violationRate)}`}>
                            {getSeverityLabel(violation.violationRate)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {violation.violationRate}% violations
                          </div>
                        </div>
                        
                        <div className="text-gray-400">
                          {isExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        SLA Threshold: {violation.slaThreshold}ms
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        {violation.trend.length > 0 && (
                          <>Last violation: {formatTimestamp(violation.trend[violation.trend.length - 1].timestamp)}</>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && violation.trend.length > 0 && (
                    <div className="border-t border-gray-600 p-4 bg-gray-700/30">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Violation Trend</h4>
                      
                      <div className="h-32 relative">
                        {/* Simple trend visualization */}
                        <div className="absolute inset-0 flex items-end space-x-1">
                          {violation.trend.map((point, pointIndex) => {
                            const maxValue = Math.max(...violation.trend.map(p => p.value));
                            const height = (point.value / maxValue) * 100;
                            
                            return (
                              <div
                                key={pointIndex}
                                className="flex-1 bg-red-400/30 hover:bg-red-400/50 transition-colors relative group"
                                style={{ height: `${height}%` }}
                                title={`${point.value.toFixed(2)}% - ${formatTimestamp(point.timestamp)}`}
                              >
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {point.value.toFixed(2)}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-400">
                        <div>Time range: {formatTimestamp(violation.trend[0].timestamp)} - {formatTimestamp(violation.trend[violation.trend.length - 1].timestamp)}</div>
                        <div>Peak violation rate: {Math.max(...violation.trend.map(p => p.value)).toFixed(2)}%</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {violations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Total violations: {violations.length}</span>
            <span>Average violation rate: {(violations.reduce((sum, v) => sum + parseFloat(v.violationRate), 0) / violations.length).toFixed(2)}%</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default ViolationsList;