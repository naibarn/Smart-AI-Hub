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
  LinearProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  NetworkCheck as NetworkIcon,
  Computer as ComputerIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { ResourceUsageChart, MetricCard } from '../../../components/monitoring';
import { useGetSystemQuery } from '../../../services/monitoring.service';
import { GlassCard } from '../../../components/common';

const SystemMonitoring: React.FC = () => {
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch system data
  const {
    data: systemData,
    error: systemError,
    isLoading: systemLoading,
    refetch: refetchSystem,
  } = useGetSystemQuery({ timeRange });

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchSystem();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchSystem]);

  const handleRefresh = () => {
    refetchSystem();
  };

  if (systemError) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load system metrics. Please try again later.</Alert>
      </Box>
    );
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getLatestValue = (data: any[]) => {
    if (!data || data.length === 0) return 0;
    return data[data.length - 1].value;
  };

  const getAverageValue = (data: any[]) => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, item) => sum + item.value, 0) / data.length;
  };

  const formatResourceData = (data: any[]) => {
    if (!data) return [];

    return data.map((item) => ({
      timestamp: new Date(item.timestamp).getTime() / 1000,
      cpu: item.value,
      memory: item.value,
      disk: item.value,
      network: item.value,
    }));
  };

  const latestCpuUsage = getLatestValue(systemData?.data?.cpu || []);
  const latestMemoryUsage = getLatestValue(systemData?.data?.memory || []);
  const latestDiskUsage = getLatestValue(systemData?.data?.disk || []);
  const latestNetworkUsage = getLatestValue(systemData?.data?.network || []);

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          System Resource Monitoring
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

      {/* System Overview */}
      {systemData?.data && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="System Uptime"
              value={formatUptime(systemData.data.uptime)}
              icon={<ComputerIcon />}
              description="Time since last restart"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Version"
              value={systemData.data.version}
              icon={<TimelineIcon />}
              description="System version"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Load Average"
              value={getAverageValue(systemData.data.cpu || []).toFixed(2)}
              status={getAverageValue(systemData.data.cpu || []) > 80 ? 'warning' : 'healthy'}
              icon={<SpeedIcon />}
              description="Average system load"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Health Status"
              value="HEALTHY"
              status="healthy"
              icon={<TimelineIcon />}
              description="Overall system health"
            />
          </Grid>
        </Grid>
      )}

      {/* Resource Usage Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SpeedIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  CPU Usage
                </Typography>
              </Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={
                  latestCpuUsage > 80
                    ? 'error.main'
                    : latestCpuUsage > 60
                      ? 'warning.main'
                      : 'success.main'
                }
              >
                {latestCpuUsage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={latestCpuUsage}
                color={latestCpuUsage > 80 ? 'error' : latestCpuUsage > 60 ? 'warning' : 'success'}
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" mt={1}>
                Average: {getAverageValue(systemData?.data?.cpu || []).toFixed(1)}%
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MemoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Memory Usage
                </Typography>
              </Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={
                  latestMemoryUsage > 80
                    ? 'error.main'
                    : latestMemoryUsage > 60
                      ? 'warning.main'
                      : 'success.main'
                }
              >
                {latestMemoryUsage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={latestMemoryUsage}
                color={
                  latestMemoryUsage > 80 ? 'error' : latestMemoryUsage > 60 ? 'warning' : 'success'
                }
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" mt={1}>
                Average: {getAverageValue(systemData?.data?.memory || []).toFixed(1)}%
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Disk Usage
                </Typography>
              </Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={
                  latestDiskUsage > 80
                    ? 'error.main'
                    : latestDiskUsage > 60
                      ? 'warning.main'
                      : 'success.main'
                }
              >
                {latestDiskUsage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={latestDiskUsage}
                color={
                  latestDiskUsage > 80 ? 'error' : latestDiskUsage > 60 ? 'warning' : 'success'
                }
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" mt={1}>
                Average: {getAverageValue(systemData?.data?.disk || []).toFixed(1)}%
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NetworkIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Network Usage
                </Typography>
              </Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={
                  latestNetworkUsage > 80
                    ? 'error.main'
                    : latestNetworkUsage > 60
                      ? 'warning.main'
                      : 'success.main'
                }
              >
                {latestNetworkUsage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={latestNetworkUsage}
                color={
                  latestNetworkUsage > 80
                    ? 'error'
                    : latestNetworkUsage > 60
                      ? 'warning'
                      : 'success'
                }
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" mt={1}>
                Average: {getAverageValue(systemData?.data?.network || []).toFixed(1)}%
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Resource Usage Charts */}
      <Grid container spacing={3}>
        {/* CPU Usage Chart */}
        <Grid item xs={12} lg={6}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                CPU Usage Trends
              </Typography>
              {systemLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResourceUsageChart
                  title="CPU Usage (%)"
                  data={formatResourceData(systemData?.data?.cpu || [])}
                  height={300}
                  showCpu={true}
                  showMemory={false}
                  showDisk={false}
                  showNetwork={false}
                />
              )}
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Memory Usage Chart */}
        <Grid item xs={12} lg={6}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Memory Usage Trends
              </Typography>
              {systemLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResourceUsageChart
                  title="Memory Usage (%)"
                  data={formatResourceData(systemData?.data?.memory || [])}
                  height={300}
                  showCpu={false}
                  showMemory={true}
                  showDisk={false}
                  showNetwork={false}
                />
              )}
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Disk Usage Chart */}
        <Grid item xs={12} lg={6}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Disk Usage Trends
              </Typography>
              {systemLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResourceUsageChart
                  title="Disk Usage (%)"
                  data={formatResourceData(systemData?.data?.disk || [])}
                  height={300}
                  showCpu={false}
                  showMemory={false}
                  showDisk={true}
                  showNetwork={false}
                />
              )}
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Network Usage Chart */}
        <Grid item xs={12} lg={6}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Network Usage Trends
              </Typography>
              {systemLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResourceUsageChart
                  title="Network Usage (%)"
                  data={formatResourceData(systemData?.data?.network || [])}
                  height={300}
                  showCpu={false}
                  showMemory={false}
                  showDisk={false}
                  showNetwork={true}
                />
              )}
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemMonitoring;
