import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  DataUsage as DataUsageIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  SlowQueriesTable,
  MetricCard,
  PerformanceChart,
} from '../../../components/monitoring';
import {
  useGetDatabaseQuery,
} from '../../../services/monitoring.service';
import { GlassCard } from '../../../components/common';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`database-tabpanel-${index}`}
      aria-labelledby={`database-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const DatabaseMonitoring: React.FC = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [tabValue, setTabValue] = useState(0);

  // Fetch database data
  const {
    data: databaseData,
    error: databaseError,
    isLoading: databaseLoading,
    refetch: refetchDatabase,
  } = useGetDatabaseQuery({ timeRange });

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchDatabase();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchDatabase]);

  const handleRefresh = () => {
    refetchDatabase();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (databaseError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load database metrics. Please try again later.
        </Alert>
      </Box>
    );
  }

  const formatQueryTimeData = () => {
    if (!databaseData?.data?.queryTime) return [];
    
    return databaseData.data.queryTime.map(item => ({
      timestamp: new Date(item.timestamp).getTime() / 1000,
      value: item.value,
      label: new Date(item.timestamp).toLocaleTimeString()
    }));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Database Monitoring
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="15m">Last 15 minutes</MenuItem>
              <MenuItem value="1h">Last hour</MenuItem>
              <MenuItem value="6h">Last 6 hours</MenuItem>
              <MenuItem value="24h">Last 24 hours</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
            </Select>
          </FormControl>
          <Chip
            label={`Auto-refresh: ${autoRefresh ? 'ON' : 'OFF'}`}
            color={autoRefresh ? 'success' : 'default'}
            size="small"
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ cursor: 'pointer' }}
          />
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Database Overview Cards */}
      {databaseData?.data && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Connection Count"
              value={databaseData.data.connectionCount.toString()}
              status={databaseData.data.connectionCount > 80 ? 'warning' : 'healthy'}
              icon={<DataUsageIcon />}
              description="Active database connections"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Database Size"
              value={formatBytes(databaseData.data.databaseSize)}
              icon={<StorageIcon />}
              description="Total database size"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Slow Queries"
              value={databaseData.data.slowQueries.length.toString()}
              status={databaseData.data.slowQueries.length > 10 ? 'critical' : databaseData.data.slowQueries.length > 5 ? 'warning' : 'healthy'}
              icon={<TimerIcon />}
              description="Queries exceeding threshold"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Avg Query Time"
              value={`${databaseData.data.queryTime.length > 0 ? (databaseData.data.queryTime.reduce((sum, item) => sum + item.value, 0) / databaseData.data.queryTime.length).toFixed(2) : 0}ms`}
              status={databaseData.data.queryTime.length > 0 && (databaseData.data.queryTime.reduce((sum, item) => sum + item.value, 0) / databaseData.data.queryTime.length) > 1000 ? 'warning' : 'healthy'}
              icon={<SpeedIcon />}
              description="Average query execution time"
            />
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Query Performance" />
          <Tab label="Slow Queries" />
          <Tab label="Index Usage" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Query Time Chart */}
          <Grid item xs={12} lg={8}>
            <GlassCard>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Query Execution Time
                </Typography>
                {databaseLoading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <PerformanceChart
                    title="Query Time (ms)"
                    data={formatQueryTimeData()}
                    height={350}
                    color="#8B5CF6"
                    unit="ms"
                  />
                )}
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Database Stats */}
          <Grid item xs={12} lg={4}>
            <GlassCard>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Database Statistics
                </Typography>
                {databaseLoading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box>
                    <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Connections
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {databaseData?.data?.connectionCount || 0}
                      </Typography>
                    </Card>
                    <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Database Size
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {databaseData?.data ? formatBytes(databaseData.data.databaseSize) : '0 B'}
                      </Typography>
                    </Card>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Slow Queries Count
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color={(databaseData?.data?.slowQueries?.length || 0) > 0 ? 'error' : 'success'}>
                        {databaseData?.data?.slowQueries?.length || 0}
                      </Typography>
                    </Card>
                  </Box>
                )}
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <GlassCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Slow Queries Analysis
            </Typography>
            {databaseLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <SlowQueriesTable
                queries={databaseData?.data?.slowQueries?.map(query => ({
                  table: query.query.split(' ').find((word: string) => word.toUpperCase() === 'FROM') ?
                    query.query.split(' ')[query.query.split(' ').indexOf('FROM') + 1] : 'unknown',
                  queryType: query.query.split(' ')[0] || 'unknown',
                  avgDuration: query.duration,
                  maxDuration: query.duration,
                  count: query.frequency,
                  lastSeen: query.timestamp
                })) || []}
              />
            )}
          </CardContent>
        </GlassCard>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <GlassCard>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Index Usage Analysis
            </Typography>
            {databaseLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {databaseData?.data?.indexUsage && Object.keys(databaseData.data.indexUsage).length > 0 ? (
                  Object.entries(databaseData.data.indexUsage).map(([indexName, usage]) => (
                    <Card key={indexName} variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {indexName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Index usage statistics
                          </Typography>
                        </Box>
                        <Box>
                          <Chip
                            label={`${usage}%`}
                            size="small"
                            color={usage > 80 ? 'success' : usage > 50 ? 'warning' : 'error'}
                          />
                        </Box>
                      </Box>
                    </Card>
                  ))
                ) : (
                  <Box textAlign="center" py={4}>
                    <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No index usage data available
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </GlassCard>
      </TabPanel>
    </Box>
  );
};

export default DatabaseMonitoring;