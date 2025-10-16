import React from 'react';
import GlassCard from '../common/GlassCard';

interface Service {
  name: string;
  status: 'up' | 'down' | 'unknown';
  uptime: string;
  requestRate: string;
  errorRate: string;
  responseTime: string;
  memoryUsage: string;
}

interface ServiceStatusTableProps {
  services: Service[];
  loading?: boolean;
}

const ServiceStatusTable: React.FC<ServiceStatusTableProps> = ({ services, loading = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return 'text-green-400 bg-green-400/10';
      case 'down':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
        return '●';
      case 'down':
        return '●';
      default:
        return '○';
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Service Status</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-full mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-600 rounded w-full mb-2"></div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Service Status</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Uptime</th>
              <th className="px-4 py-3">Request Rate</th>
              <th className="px-4 py-3">Error Rate</th>
              <th className="px-4 py-3">Response Time</th>
              <th className="px-4 py-3">Memory Usage</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, index) => (
              <tr
                key={service.name}
                className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-white">{service.name}</td>
                <td className="px-4 py-3">
                  <div
                    className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}
                  >
                    <span>{getStatusIcon(service.status)}</span>
                    <span className="uppercase">{service.status}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{service.uptime}</td>
                <td className="px-4 py-3">{service.requestRate}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      parseFloat(service.errorRate) > 0.05
                        ? 'text-red-400'
                        : parseFloat(service.errorRate) > 0.01
                          ? 'text-yellow-400'
                          : 'text-green-400'
                    }
                  >
                    {service.errorRate}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      parseFloat(service.responseTime) > 1
                        ? 'text-red-400'
                        : parseFloat(service.responseTime) > 0.5
                          ? 'text-yellow-400'
                          : 'text-green-400'
                    }
                  >
                    {service.responseTime}s
                  </span>
                </td>
                <td className="px-4 py-3">{service.memoryUsage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

export default ServiceStatusTable;
