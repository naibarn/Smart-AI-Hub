import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  MetricCard,
  ServiceStatusTable,
  PerformanceChart,
  AlertsList,
  ResourceUsageChart,
} from '../../../components/monitoring';
import {
  useGetOverviewQuery,
  useGetSystemQuery,
  useGetAlertsQuery,
} from '../../../services/monitoring.service';
import { GlassCard } from '../../../components/common';

const MonitoringDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch monitoring data
  const {
    data: overviewData,
    error: overviewError,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useGetOverviewQuery();

  const {
    data: systemData,
    error: systemError,
    isLoading: systemLoading,
    refetch: refetchSystem,
  } = useGetSystemQuery({ timeRange: '1h' });

  const {
    data: alertsData,
    error: alertsError,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useGetAlertsQuery({ status: 'active' });

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchOverview();
      refetchSystem();
      refetchAlerts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchOverview, refetchSystem, refetchAlerts]);

  const handleRefresh = () => {
    refetchOverview();
    refetchSystem();
    refetchAlerts();
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircleIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'critical':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  if (overviewError || systemError || alertsError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load monitoring data. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          System Monitoring Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
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

      {/* System Health Overview */}
      {overviewData?.data && (
        <GlassCard sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                System Health Overview
              </Typography>
              <Chip
                icon={getSystemHealthIcon(overviewData.data.systemHealth)}
                label={overviewData.data.systemHealth.toUpperCase()}
                color={getSystemHealthColor(overviewData.data.systemHealth) as any}
                variant="outlined"
              />
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Total Requests"
                  value={overviewData.data.totalRequests.toLocaleString()}
                  icon={<InfoIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Error Rate"
                  value={`${overviewData.data.errorRate.toFixed(2)}%`}
                  status={overviewData.data.errorRate > 5 ? 'critical' : overviewData.data.errorRate > 1 ? 'warning' : 'healthy'}
                  icon={overviewData.data.errorRate > 5 ? <ErrorIcon /> : <CheckCircleIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Avg Response Time"
                  value={`${overviewData.data.avgResponseTime.toFixed(0)}ms`}
                  status={overviewData.data.avgResponseTime > 1000 ? 'critical' : overviewData.data.avgResponseTime > 500 ? 'warning' : 'healthy'}
                  icon={overviewData.data.avgResponseTime > 500 ? <WarningIcon /> : <CheckCircleIcon />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Active Users"
                  value={overviewData.data.activeUsers.toLocaleString()}
                  icon={<InfoIcon />}
                />
              </Grid>
            </Grid>
          </CardContent>
        </GlassCard>
      )}

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Service Status */}
        <Grid item xs={12} lg={6}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Service Status
              </Typography>
              {overviewLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <ServiceStatusTable
                  services={overviewData?.data?.services?.map(service => ({
                    name: service.name,
                    status: service.status === 'healthy' ? 'up' : service.status === 'critical' ? 'down' : 'unknown',
                    uptime: `${service.uptime.toFixed(1)}%`,
                    requestRate: 'N/A',
                    errorRate: `${(service.errorRate || 0).toFixed(2)}%`,
                    responseTime: `${(service.responseTime || 0).toFixed(0)}ms`,
                    memoryUsage: 'N/A'
                  })) || []}
                />
              )}
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Active Alerts */}
        <Grid item xs={12} lg={6}>
          <GlassCard>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Active Alerts
                </Typography>
                <Chip
                  label={alertsData?.data?.length || 0}
                  color={(alertsData?.data?.length || 0) > 0 ? 'error' : 'success'}
                  size="small"
                />
              </Box>
              {alertsLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <AlertsList
                  alerts={alertsData?.data?.map(alert => ({
                    id: alert.id,
                    name: alert.name,
                    severity: alert.severity,
                    service: alert.service || 'Unknown',
                    summary: alert.message,
                    description: alert.message,
                    startsAt: alert.timestamp,
                    status: {
                      state: alert.status as 'active' | 'suppressed' | 'resolved'
                    }
                  })) || []}
                />
              )}
            </CardContent>
          </GlassCard>
        </Grid>

        {/* System Resource Usage */}
        <Grid item xs={12} lg={8}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                System Resource Usage
              </Typography>
              {systemLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResourceUsageChart
                  title="System Resource Usage"
                  data={systemData?.data?.cpu?.map((item, index) => ({
                    timestamp: new Date(item.timestamp).getTime() / 1000,
                    cpu: item.value,
                    memory: systemData?.data?.memory?.[index]?.value || 0,
                    disk: systemData?.data?.disk?.[index]?.value || 0,
                    network: systemData?.data?.network?.[index]?.value || 0
                  })) || []}
                  height={300}
                  showCpu={true}
                  showMemory={true}
                  showDisk={true}
                  showNetwork={true}
                />
              )}
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={4}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Card
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => navigate('/admin/monitoring/performance')}
                >
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Performance Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View detailed performance metrics
                    </Typography>
                  </CardContent>
                </Card>
                <Card
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => navigate('/admin/monitoring/database')}
                >
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Database Metrics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monitor database performance
                    </Typography>
                  </CardContent>
                </Card>
                <Card
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => navigate('/admin/monitoring/system')}
                >
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold">
                      System Resources
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Detailed system resource usage
                    </Typography>
                  </CardContent>
                </Card>
                <Card
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => navigate('/admin/monitoring/grafana')}
                >
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Grafana Dashboards
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View advanced monitoring dashboards
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonitoringDashboard;