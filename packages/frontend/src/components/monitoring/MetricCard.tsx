import React from 'react';
import GlassCard from '../common/GlassCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  status?: 'healthy' | 'warning' | 'critical' | 'unknown';
  description?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  status = 'unknown',
  description,
  icon,
  loading = false
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBgColor = () => {
    switch (status) {
      case 'healthy':
        return 'bg-green-400/10';
      case 'warning':
        return 'bg-yellow-400/10';
      case 'critical':
        return 'bg-red-400/10';
      default:
        return 'bg-gray-400/10';
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-red-400';
      case 'down':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-600 rounded w-1/4"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 ${getStatusBgColor()} border-l-4 ${
      status === 'healthy' ? 'border-green-400' :
      status === 'warning' ? 'border-yellow-400' :
      status === 'critical' ? 'border-red-400' : 'border-gray-400'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-gray-300">{icon}</div>}
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${getTrendColor()}`}>
            <span>{getTrendIcon()}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <div className="flex items-baseline space-x-2 mb-2">
        <span className={`text-2xl font-semibold ${getStatusColor()}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-gray-400">{unit}</span>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
    </GlassCard>
  );
};

export default MetricCard;