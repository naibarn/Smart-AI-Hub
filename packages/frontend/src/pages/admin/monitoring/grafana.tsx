import React, { useState } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  Dashboard as DashboardIcon,
  Fullscreen as FullscreenIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { GlassCard } from '../../../components/common';

const GrafanaDashboards: React.FC = () => {
  const [selectedDashboard, setSelectedDashboard] = useState('api-performance');
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshInterval, setRefreshInterval] = useState('30s');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Grafana configuration
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3001';
  const grafanaDashboards = [
    {
      id: 'api-performance',
      name: 'API Performance',
      description: 'API response times, throughput, and error rates',
      path: '/d/api-performance',
    },
    {
      id: 'database-performance',
      name: 'Database Performance',
      description: 'Database query performance and connection metrics',
      path: '/d/database-performance',
    },
    {
      id: 'system-overview',
      name: 'System Overview',
      description: 'System resource usage and health metrics',
      path: '/d/system-overview',
    },
  ];

  const timeRanges = [
    { value: '5m', label: 'Last 5 minutes' },
    { value: '15m', label: 'Last 15 minutes' },
    { value: '30m', label: 'Last 30 minutes' },
    { value: '1h', label: 'Last hour' },
    { value: '3h', label: 'Last 3 hours' },
    { value: '6h', label: 'Last 6 hours' },
    { value: '12h', label: 'Last 12 hours' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '2d', label: 'Last 2 days' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
  ];

  const refreshIntervals = [
    { value: 'off', label: 'Off' },
    { value: '5s', label: '5 seconds' },
    { value: '10s', label: '10 seconds' },
    { value: '30s', label: '30 seconds' },
    { value: '1m', label: '1 minute' },
    { value: '5m', label: '5 minutes' },
    { value: '15m', label: '15 minutes' },
    { value: '30m', label: '30 minutes' },
    { value: '1h', label: '1 hour' },
    { value: '2h', label: '2 hours' },
    { value: '1d', label: '1 day' },
  ];

  const currentDashboard = grafanaDashboards.find((d) => d.id === selectedDashboard);

  const getGrafanaIframeUrl = () => {
    const baseUrl = `${grafanaUrl}${currentDashboard?.path || ''}`;
    const params = new URLSearchParams();
    params.append('var-timeRange', timeRange);
    params.append('refresh', refreshInterval === 'off' ? 'false' : refreshInterval);
    params.append('theme', 'dark');
    params.append('kiosk', 'tv');
    return `${baseUrl}?${params.toString()}`;
  };

  const handleOpenInNewTab = () => {
    window.open(getGrafanaIframeUrl(), '_blank');
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById('grafana-iframe') as HTMLIFrameElement;
    if (iframe?.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  const handleRefresh = () => {
    const iframe = document.getElementById('grafana-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = getGrafanaIframeUrl();
    }
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Grafana Dashboards
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Settings">
            <IconButton onClick={() => setSettingsOpen(true)} color="primary">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open in new tab">
            <IconButton onClick={handleOpenInNewTab} color="primary">
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton onClick={handleFullscreen} color="primary">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Dashboard Selection */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Dashboard</InputLabel>
            <Select
              value={selectedDashboard}
              label="Dashboard"
              onChange={(e) => setSelectedDashboard(e.target.value)}
            >
              {grafanaDashboards.map((dashboard) => (
                <MenuItem key={dashboard.id} value={dashboard.id}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {dashboard.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dashboard.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {timeRanges.map((range) => (
                <MenuItem key={range.value} value={range.value}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Dashboard Info */}
      {currentDashboard && (
        <GlassCard sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <DashboardIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  {currentDashboard.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentDashboard.description}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={`Time: ${timeRanges.find((r) => r.value === timeRange)?.label}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Refresh: ${refreshIntervals.find((r) => r.value === refreshInterval)?.label}`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </Box>
          </CardContent>
        </GlassCard>
      )}

      {/* Grafana Iframe */}
      <GlassCard>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '800px',
              backgroundColor: 'background.default',
            }}
          >
            <iframe
              id="grafana-iframe"
              src={getGrafanaIframeUrl()}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px',
              }}
              title="Grafana Dashboard"
            />
          </Box>
        </CardContent>
      </GlassCard>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dashboard Settings</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={2}>
            <FormControl fullWidth>
              <InputLabel>Refresh Interval</InputLabel>
              <Select
                value={refreshInterval}
                label="Refresh Interval"
                onChange={(e) => setRefreshInterval(e.target.value)}
              >
                {refreshIntervals.map((interval) => (
                  <MenuItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Grafana URL:</strong> {grafanaUrl}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Configure the Grafana URL in your environment variables (VITE_GRAFANA_URL) if
                needed.
              </Typography>
            </Alert>

            <Alert severity="warning">
              <Typography variant="body2">
                Make sure your Grafana instance is accessible from this domain and that the
                dashboards are properly configured.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
          <Button onClick={handleRefresh} variant="contained" color="primary">
            Apply & Refresh
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GrafanaDashboards;
