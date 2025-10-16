import React from 'react';
import GlassCard from '../common/GlassCard';

interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  service: string;
  summary: string;
  description: string;
  startsAt: string;
  status: {
    state: 'active' | 'suppressed' | 'resolved';
  };
}

interface AlertsListProps {
  alerts: Alert[];
  loading?: boolean;
  onAcknowledge?: (alertId: string) => void;
  onSuppress?: (alertId: string) => void;
}

const AlertsList: React.FC<AlertsListProps> = ({
  alerts,
  loading = false,
  onAcknowledge,
  onSuppress,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'info':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'active':
        return 'text-red-400';
      case 'suppressed':
        return 'text-yellow-400';
      case 'resolved':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Active Alerts</h2>
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-600 rounded mb-3"></div>
          ))}
        </div>
      </GlassCard>
    );
  }

  const activeAlerts = alerts.filter((alert) => alert.status.state === 'active');

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Active Alerts ({activeAlerts.length})</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <span>Critical</span>
          <div className="w-3 h-3 bg-yellow-400 rounded-full ml-2"></div>
          <span>Warning</span>
          <div className="w-3 h-3 bg-blue-400 rounded-full ml-2"></div>
          <span>Info</span>
        </div>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-green-400 text-4xl mb-2">✓</div>
          <p className="text-gray-400">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-white">{alert.name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(alert.severity)}`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">{alert.service}</span>
                  </div>

                  <p className="text-sm text-gray-300 mb-1">{alert.summary}</p>

                  <p className="text-xs text-gray-400 mb-2">{alert.description}</p>

                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>Started: {formatDate(alert.startsAt)}</span>
                    <span className={getStatusColor(alert.status.state)}>
                      Status: {alert.status.state.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {onSuppress && (
                    <button
                      onClick={() => onSuppress(alert.id)}
                      className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                    >
                      Suppress
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default AlertsList;
