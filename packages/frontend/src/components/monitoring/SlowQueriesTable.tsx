import React from 'react';
import GlassCard from '../common/GlassCard';

interface SlowQuery {
  table: string;
  queryType: string;
  avgDuration: number;
  maxDuration: number;
  count: number;
  lastSeen: string;
}

interface SlowQueriesTableProps {
  queries: SlowQuery[];
  loading?: boolean;
}

const SlowQueriesTable: React.FC<SlowQueriesTableProps> = ({ queries, loading = false }) => {
  const getDurationColor = (duration: number) => {
    if (duration > 5) return 'text-red-400';
    if (duration > 2) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getQueryTypeIcon = (queryType: string) => {
    switch (queryType.toLowerCase()) {
      case 'select':
        return '🔍';
      case 'insert':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      default:
        return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Slow Database Queries</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-full mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-600 rounded w-full mb-2"></div>
          ))}
        </div>
      </GlassCard>
    );
  }

  const sortedQueries = [...queries].sort((a, b) => b.avgDuration - a.avgDuration);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Slow Database Queries</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <span>{'> 5s'}</span>
          <div className="w-3 h-3 bg-yellow-400 rounded-full ml-2"></div>
          <span>2-5s</span>
          <div className="w-3 h-3 bg-green-400 rounded-full ml-2"></div>
          <span>{'< 2s'}</span>
        </div>
      </div>

      {sortedQueries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-green-400 text-4xl mb-2">⚡</div>
          <p className="text-gray-400">No slow queries detected</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
              <tr>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Avg Duration</th>
                <th className="px-4 py-3">Max Duration</th>
                <th className="px-4 py-3">Count</th>
                <th className="px-4 py-3">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {sortedQueries.map((query, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{query.table}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span>{getQueryTypeIcon(query.queryType)}</span>
                      <span className="uppercase text-xs">{query.queryType}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${getDurationColor(query.avgDuration)}`}>
                      {query.avgDuration.toFixed(3)}s
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={getDurationColor(query.maxDuration)}>
                      {query.maxDuration.toFixed(3)}s
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        query.count > 100
                          ? 'text-red-400'
                          : query.count > 50
                            ? 'text-yellow-400'
                            : 'text-gray-400'
                      }
                    >
                      {query.count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(query.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sortedQueries.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded">
          <p className="text-sm text-yellow-400">
            ⚠️ Performance optimization recommended for queries with average duration {'>'} 2s
          </p>
        </div>
      )}
    </GlassCard>
  );
};

export default SlowQueriesTable;
