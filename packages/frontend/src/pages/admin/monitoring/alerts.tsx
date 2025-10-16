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
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { AlertsList } from '../../../components/monitoring';
import {
  useGetAlertsQuery,
  useAcknowledgeAlertMutation,
  useSilenceAlertMutation,
} from '../../../services/monitoring.service';
import { GlassCard } from '../../../components/common';

const AlertsMonitoring: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [silenceDialogOpen, setSilenceDialogOpen] = useState(false);
  const [silenceDuration, setSilenceDuration] = useState('1h');
  const [silenceComment, setSilenceComment] = useState('');

  // Fetch alerts data
  const {
    data: alertsData,
    error: alertsError,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useGetAlertsQuery({
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
  });

  // Mutations for alert actions
  const [acknowledgeAlert, { isLoading: isAcknowledging }] = useAcknowledgeAlertMutation();
  const [silenceAlert, { isLoading: isSilencing }] = useSilenceAlertMutation();

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchAlerts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchAlerts]);

  const handleRefresh = () => {
    refetchAlerts();
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert({
        alertId,
        comment: 'Acknowledged from monitoring dashboard',
      }).unwrap();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleSilenceAlert = (alert: any) => {
    setSelectedAlert(alert);
    setSilenceDialogOpen(true);
  };

  const handleConfirmSilence = async () => {
    if (!selectedAlert) return;

    try {
      await silenceAlert({
        alertId: selectedAlert.id,
        duration: silenceDuration,
        comment: silenceComment,
      }).unwrap();
      setSilenceDialogOpen(false);
      setSelectedAlert(null);
      setSilenceComment('');
    } catch (error) {
      console.error('Failed to silence alert:', error);
    }
  };

  const filteredAlerts =
    alertsData?.data?.filter((alert) => {
      if (
        searchTerm &&
        !alert.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !alert.message.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    }) || [];

  const getAlertStats = () => {
    const alerts = alertsData?.data || [];
    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length,
      active: alerts.filter((a) => a.status === 'active').length,
      resolved: alerts.filter((a) => a.status === 'resolved').length,
    };
  };

  if (alertsError) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load alerts data. Please try again later.</Alert>
      </Box>
    );
  }

  const stats = getAlertStats();

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Alerts Management
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

      {/* Alert Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2}>
          <GlassCard>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Alerts
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <GlassCard>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ErrorIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.critical}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <GlassCard>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <WarningIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.warning}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Warning
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <GlassCard>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <InfoIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {stats.info}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Info
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <GlassCard>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <NotificationsActiveIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <GlassCard>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.resolved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resolved
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Filters */}
      <GlassCard sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search alerts..."
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
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="silenced">Silenced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  label="Severity"
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <MenuItem value="">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setStatusFilter('');
                  setSeverityFilter('');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </GlassCard>

      {/* Alerts List */}
      <GlassCard>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Alerts ({filteredAlerts.length})
          </Typography>
          {alertsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <AlertsList
              alerts={filteredAlerts.map((alert) => ({
                id: alert.id,
                name: alert.name,
                severity: alert.severity,
                service: alert.service || 'Unknown',
                summary: alert.message,
                description: alert.message,
                startsAt: alert.timestamp,
                status: {
                  state: alert.status as 'active' | 'suppressed' | 'resolved',
                },
              }))}
              onAcknowledge={handleAcknowledgeAlert}
              onSuppress={handleSilenceAlert}
            />
          )}
        </CardContent>
      </GlassCard>

      {/* Silence Dialog */}
      <Dialog
        open={silenceDialogOpen}
        onClose={() => setSilenceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Silence Alert</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Alert:</strong> {selectedAlert.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedAlert.message}
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Duration</InputLabel>
                <Select
                  value={silenceDuration}
                  label="Duration"
                  onChange={(e) => setSilenceDuration(e.target.value)}
                >
                  <MenuItem value="15m">15 minutes</MenuItem>
                  <MenuItem value="1h">1 hour</MenuItem>
                  <MenuItem value="6h">6 hours</MenuItem>
                  <MenuItem value="24h">24 hours</MenuItem>
                  <MenuItem value="7d">7 days</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                margin="normal"
                label="Comment (optional)"
                multiline
                rows={3}
                value={silenceComment}
                onChange={(e) => setSilenceComment(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSilenceDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmSilence}
            variant="contained"
            color="warning"
            disabled={isSilencing}
          >
            {isSilencing ? 'Silencing...' : 'Silence Alert'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsMonitoring;
