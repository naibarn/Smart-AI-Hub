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
  Tab,
  Tabs,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  EndpointTable,
  TrendChart,
  ViolationsList,
  ComparisonView,
  MetricCard,
} from '../../../components/monitoring';
import { GlassCard } from '../../../components/common';
import { monitoringService } from '../../../services/monitoring.service';

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
      id={`response-time-tabpanel-${index}`}
      aria-labelledby={`response-time-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ResponseTimeAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedSLATier, setSelectedSLATier] = useState('');

  // Data states
  const [overviewData, setOverviewData] = useState<any>(null);
  const [endpointsData, setEndpointsData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [violationsData, setViolationsData] = useState<any>(null);
  const [baselinesData, setBaselinesData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Loading states
  const [loading, setLoading] = useState({
    overview: true,
    endpoints: true,
    trends: true,
    violations: true,
    baselines: true,
    comparison: true,
  });

  // Error states
  const [errors, setErrors] = useState<Record<string, any>>({
    overview: null,
    endpoints: null,
    trends: null,
    violations: null,
    baselines: null,
    comparison: null,
  });

  // Fetch functions
  const fetchOverview = async () => {
    try {
      setLoading(prev => ({ ...prev, overview: true }));
      const response = await monitoringService.getResponseTimeOverview();
      setOverviewData(response.data);
      setErrors(prev => ({ ...prev, overview: null }));
    } catch (error) {
      setErrors(prev => ({ ...prev, overview: error as any }));
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  };

  const fetchEndpoints = async () => {
    try {
      setLoading(prev => ({ ...prev, endpoints: true }));
      const response = await monitoringService.getResponseTimeEndpoints({
        service: selectedService,
        sla_tier: selectedSLATier,
      });
      setEndpointsData(response.data);
      setErrors(prev => ({ ...prev, endpoints: null }));
    } catch (error) {
      setErrors(prev => ({ ...prev, endpoints: error as any }));
    } finally {
      setLoading(prev => ({ ...prev, endpoints: false }));
    }
  };

  const fetchTrends = async () => {
    try {
      setLoading(prev => ({ ...prev, trends: true }));
      const response = await monitoringService.getResponseTimeTrends({
        timeframe,
        service: selectedService,
      });
      setTrendsData(response.data);
      setErrors(prev => ({ ...prev, trends: null }));
    } catch (error) {
      setErrors(prev => ({ ...prev, trends: error as any }));
    } finally {
      setLoading(prev => ({ ...prev, trends: false }));
    }
  };

  const fetchViolations = async () => {
    try {
      setLoading(prev => ({ ...prev, violations: true }));
      const response = await monitoringService.getResponseTimeViolations({
        timeframe,
        sla_tier: selectedSLATier,
        service: selectedService,
      });
      setViolationsData(response.data);
      setErrors(prev => ({ ...prev, violations: null }));
    } catch (error) {
      setErrors(prev => ({ ...prev, violations: error as any }));
    } finally {
      setLoading(prev => ({ ...prev, violations: false }));
    }
  };

  const fetchBaselines = async () => {
    try {
      setLoading(prev => ({ ...prev, baselines: true }));
      const response = await monitoringService.getResponseTimeBaselines({
        service: selectedService,
        route: searchTerm,
      });
      setBaselinesData(response.data);
      setErrors(prev => ({ ...prev, baselines: null }));
    } catch (error) {
      setErrors(prev => ({ ...prev, baselines: error as any }));
    } finally {
      setLoading(prev => ({ ...prev, baselines: false }));
    }
  };

  const fetchComparison = async () => {
    try {
      setLoading(prev => ({ ...prev, comparison: true }));
      const response = await monitoringService.getResponseTimeCompare({
        endpoints: 'core-service:/api/v1/users,mcp-server:/api/v1/mcp/chat',
        timeframe,
        metric: 'p95',
      });
      setComparisonData(response.data);
      setErrors(prev => ({ ...prev, comparison: null }));
    } catch (error) {
      setErrors(prev => ({ ...prev, comparison: error as any }));
    } finally {
      setLoading(prev => ({ ...prev, comparison: false }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchOverview();
    fetchEndpoints();
    fetchTrends();
    fetchViolations();
    fetchBaselines();
    fetchComparison();
  }, [timeframe, selectedService, selectedSLATier, searchTerm]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOverview();
      fetchEndpoints();
      fetchTrends();
      fetchViolations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, timeframe, selectedService, selectedSLATier]);

  const handleRefresh = () => {
    fetchOverview();
    fetchEndpoints();
    fetchTrends();
    fetchViolations();
    fetchBaselines();
    fetchComparison();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEndpointClick = (endpoint: any) => {
    // Navigate to detailed endpoint view or open modal
    console.log('Endpoint clicked:', endpoint);
  };

  const hasErrors = Object.values(errors).some(error => error !== null);

  if (hasErrors) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load response time data. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Response Time Analytics
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            size="small"
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeframe}
              label="Time Range"
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <MenuItem value="1h">Last hour</MenuItem>
              <MenuItem value="6h">Last 6 hours</MenuItem>
              <MenuItem value="24h">Last 24 hours</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Service</InputLabel>
            <Select
              value={selectedService}
              label="Service"
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <MenuItem value="">All Services</MenuItem>
              <MenuItem value="auth-service">Auth Service</MenuItem>
              <MenuItem value="core-service">Core Service</MenuItem>
              <MenuItem value="mcp-server">MCP Server</MenuItem>
              <MenuItem value="webhook-service">Webhook Service</MenuItem>
              <MenuItem value="notification-service">Notification Service</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>SLA Tier</InputLabel>
            <Select
              value={selectedSLATier}
              label="SLA Tier"
              onChange={(e) => setSelectedSLATier(e.target.value)}
            >
              <MenuItem value="">All Tiers</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
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

      {/* Overview Cards */}
      {overviewData && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Average Response Time"
              value={`${overviewData.avgResponseTime?.p95 || '0'}ms`}
              status={parseFloat(overviewData.avgResponseTime?.p95 || '0') > 1000 ? 'critical' : 
                     parseFloat(overviewData.avgResponseTime?.p95 || '0') > 500 ? 'warning' : 'healthy'}
              icon={<SpeedIcon />}
              description="P95 response time across all endpoints"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="SLA Compliance"
              value={`${overviewData.slaCompliance?.[0]?.compliance || '100'}%`}
              status={parseFloat(overviewData.slaCompliance?.[0]?.compliance || '100') < 95 ? 'critical' : 
                     parseFloat(overviewData.slaCompliance?.[0]?.compliance || '100') < 98 ? 'warning' : 'healthy'}
              icon={<CheckCircleIcon />}
              description="Overall SLA compliance rate"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Violations Count"
              value={overviewData.violationsCount || '0'}
              status={parseInt(overviewData.violationsCount || '0') > 10 ? 'critical' : 
                     parseInt(overviewData.violationsCount || '0') > 5 ? 'warning' : 'healthy'}
              icon={<ErrorIcon />}
              description="Current SLA violations"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Slowest Endpoint"
              value={`${overviewData.slowestEndpoints?.[0]?.p95 || '0'}ms`}
              status={parseFloat(overviewData.slowestEndpoints?.[0]?.p95 || '0') > 2000 ? 'critical' : 
                     parseFloat(overviewData.slowestEndpoints?.[0]?.p95 || '0') > 1000 ? 'warning' : 'healthy'}
              icon={<TimelineIcon />}
              description={`Slowest: ${overviewData.slowestEndpoints?.[0]?.service || 'N/A'}`}
            />
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Endpoints" />
          <Tab label="Trends" />
          <Tab label="Violations" />
          <Tab label="Baselines" />
          <Tab label="Comparison" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <EndpointTable
          endpoints={endpointsData?.endpoints || []}
          loading={loading.endpoints}
          onEndpointClick={handleEndpointClick}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TrendChart
          title="Response Time Trends"
          data={trendsData?.trends || []}
          loading={loading.trends}
          height={400}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ViolationsList
          violations={violationsData?.violations || []}
          loading={loading.violations}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Baselines</h3>
          {loading.baselines ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <div>
              {/* Baselines content would go here */}
              <Typography color="text.secondary">
                Baseline comparison data will be displayed here
              </Typography>
            </div>
          )}
        </GlassCard>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <ComparisonView
          comparison={comparisonData?.comparison || []}
          loading={loading.comparison}
          metric="p95"
          timeframe={timeframe}
          onMetricChange={(metric) => console.log('Metric changed:', metric)}
          onTimeframeChange={setTimeframe}
        />
      </TabPanel>
    </Box>
  );
};

export default ResponseTimeAnalytics;