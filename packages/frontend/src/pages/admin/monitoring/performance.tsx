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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { PerformanceChart, MetricCard } from '../../../components/monitoring';
import { useGetPerformanceQuery, useGetOverviewQuery } from '../../../services/monitoring.service';
import { GlassCard } from '../../../components/common';

const PerformanceMonitoring: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const serviceParam = searchParams.get('service');

  // Fetch performance data
  const {
    data: performanceData,
    error: performanceError,
    isLoading: performanceLoading,
    refetch: refetchPerformance,
  } = useGetPerformanceQuery({ timeRange });

  const {
    data: overviewData,
    error: overviewError,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useGetOverviewQuery();

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchPerformance();
      refetchOverview();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchPerformance, refetchOverview]);

  const handleRefresh = () => {
    refetchPerformance();
    refetchOverview();
  };

  if (performanceError || overviewError) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load performance data. Please try again later.</Alert>
      </Box>
    );
  }

  const formatResponseTimeData = () => {
    if (!performanceData?.data?.responseTime) return [];

    return performanceData.data.responseTime.map((item) => ({
      timestamp: new Date(item.timestamp).getTime() / 1000,
      value: item.value,
      label: new Date(item.timestamp).toLocaleTimeString(),
    }));
  };

  const formatThroughputData = () => {
    if (!performanceData?.data?.throughput) return [];

    return performanceData.data.throughput.map((item) => ({
      timestamp: new Date(item.timestamp).getTime() / 1000,
      value: item.value,
      label: new Date(item.timestamp).toLocaleTimeString(),
    }));
  };

  const formatErrorRateData = () => {
    if (!performanceData?.data?.errorRate) return [];

    return performanceData.data.errorRate.map((item) => ({
      timestamp: new Date(item.timestamp).getTime() / 1000,
      value: item.value,
      label: new Date(item.timestamp).toLocaleTimeString(),
    }));
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Performance Monitoring
          {serviceParam && (
            <Chip label={`Service: ${serviceParam}`} color="primary" size="small" sx={{ ml: 2 }} />
          )}
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

      {/* Performance Overview Cards */}
      {overviewData?.data && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Avg Response Time"
              value={`${overviewData.data.avgResponseTime.toFixed(0)}ms`}
              status={
                overviewData.data.avgResponseTime > 1000
                  ? 'critical'
                  : overviewData.data.avgResponseTime > 500
                    ? 'warning'
                    : 'healthy'
              }
              icon={<SpeedIcon />}
              description="Average API response time"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Error Rate"
              value={`${overviewData.data.errorRate.toFixed(2)}%`}
              status={
                overviewData.data.errorRate > 5
                  ? 'critical'
                  : overviewData.data.errorRate > 1
                    ? 'warning'
                    : 'healthy'
              }
              icon={<ErrorIcon />}
              description="Percentage of failed requests"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Requests"
              value={overviewData.data.totalRequests.toLocaleString()}
              icon={<TrendingUpIcon />}
              description="Total requests in selected period"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="System Health"
              value={overviewData.data.systemHealth.toUpperCase()}
              status={overviewData.data.systemHealth}
              icon={<TimelineIcon />}
              description="Overall system health status"
            />
          </Grid>
        </Grid>
      )}

      {/* Performance Charts */}
      <Grid container spacing={3}>
        {/* Response Time Chart */}
        <Grid item xs={12} lg={6}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Response Time Trends
              </Typography>
              {performanceLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <PerformanceChart
                  title="Response Time (ms)"
                  data={formatResponseTimeData()}
                  height={300}
                  color="#EF4444"
                  unit="ms"
                />
              )}
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Throughput Chart */}
        <Grid item xs={12} lg={6}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Request Throughput
              </Typography>
              {performanceLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <PerformanceChart
                  title="Requests per Second"
                  data={formatThroughputData()}
                  height={300}
                  color="#3B82F6"
                  unit="req/s"
                />
              )}
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Error Rate Chart */}
        <Grid item xs={12} lg={6}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Error Rate Trends
              </Typography>
              {performanceLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <PerformanceChart
                  title="Error Rate (%)"
                  data={formatErrorRateData()}
                  height={300}
                  color="#F59E0B"
                  unit="%"
                />
              )}
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Top Endpoints */}
        <Grid item xs={12} lg={6}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Top API Endpoints
              </Typography>
              {performanceLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {performanceData?.data?.topEndpoints?.map((endpoint, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {endpoint.path}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {endpoint.requestCount} requests
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            label={`${endpoint.avgResponseTime.toFixed(0)}ms`}
                            size="small"
                            color={
                              endpoint.avgResponseTime > 1000
                                ? 'error'
                                : endpoint.avgResponseTime > 500
                                  ? 'warning'
                                  : 'success'
                            }
                          />
                          <Chip
                            label={`${(endpoint.errorRate * 100).toFixed(2)}%`}
                            size="small"
                            color={
                              endpoint.errorRate > 0.05
                                ? 'error'
                                : endpoint.errorRate > 0.01
                                  ? 'warning'
                                  : 'success'
                            }
                          />
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceMonitoring;
