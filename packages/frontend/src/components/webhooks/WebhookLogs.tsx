import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Pagination,
  Card,
  CardContent,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import GradientButton from '../common/GradientButton';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  webhookService,
  WebhookEndpoint,
  WebhookLog,
  formatWebhookStatus,
  formatDate,
} from '../../services/webhook.service';

interface WebhookLogsProps {
  webhook: WebhookEndpoint;
  onClose: () => void;
}

const WebhookLogs: React.FC<WebhookLogsProps> = ({
  webhook,
  onClose,
}) => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const fetchLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await webhookService.getWebhookLogs(webhook.id, pageNum, 20);
      setLogs(response.logs);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setPage(response.page);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch webhook logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [webhook.id]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    fetchLogs(value);
  };

  const handleViewDetails = (log: WebhookLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircleIcon sx={{ color: '#10b981', fontSize: 16 }} />;
      case 'failed':
        return <ErrorIcon sx={{ color: '#ef4444', fontSize: 16 }} />;
      case 'pending':
        return <ScheduleIcon sx={{ color: '#f59e0b', fontSize: 16 }} />;
      default:
        return <ScheduleIcon sx={{ color: '#6b7280', fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDuration = (createdAt: string, deliveredAt?: string) => {
    if (!deliveredAt) return '-';
    const created = new Date(createdAt);
    const delivered = new Date(deliveredAt);
    const diff = delivered.getTime() - created.getTime();
    return `${diff}ms`;
  };

  const formatPayload = (payload: any) => {
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Webhook Logs
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            URL: {webhook.url}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <GradientButton
            variant="secondary"
            startIcon={<RefreshIcon />}
            onClick={() => fetchLogs(page)}
            disabled={loading}
          >
            Refresh
          </GradientButton>
          <GradientButton
            variant="primary"
            startIcon={<CloseIcon />}
            onClick={onClose}
          >
            Close
          </GradientButton>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Total Deliveries
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                {total}
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Successful
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: '#10b981' }}>
                {logs.filter(log => log.status === 'delivered').length}
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Failed
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: '#ef4444' }}>
                {logs.filter(log => log.status === 'failed').length}
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Pending
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: '#f59e0b' }}>
                {logs.filter(log => log.status === 'pending').length}
              </Typography>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs Table */}
      <GlassCard>
        <TableContainer component={Paper} sx={{ background: 'transparent', boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Event Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Attempt</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Response</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                    <LoadingSpinner size={40} text="Loading logs..." />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      No logs found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Webhook delivery logs will appear here once events are triggered
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    component={motion.tr}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(log.status)}
                        <Chip
                          label={formatWebhookStatus(log.status).label}
                          color={getStatusColor(log.status) as any}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {log.eventType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.attempt} / {log.maxAttempts}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.responseStatus ? (
                        <Chip
                          label={log.responseStatus}
                          color={log.responseStatus >= 200 && log.responseStatus < 300 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(log.createdAt, log.deliveredAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(log.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(log)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Log Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <DialogTitle>Webhook Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Event Type
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.eventType}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getStatusIcon(selectedLog.status)}
                    <Typography variant="body1">
                      {formatWebhookStatus(selectedLog.status).label}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Attempt
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.attempt} / {selectedLog.maxAttempts}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Response Status
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedLog.responseStatus || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatDate(selectedLog.createdAt)}
                  </Typography>
                </Grid>
                {selectedLog.deliveredAt && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Delivered
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formatDate(selectedLog.deliveredAt)}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.errorMessage && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Error Message
                    </Typography>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {selectedLog.errorMessage}
                    </Alert>
                  </Grid>
                )}
              </Grid>

              {/* Payload */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Request Payload</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      p: 2,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      overflow: 'auto',
                      maxHeight: 300,
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {formatPayload(selectedLog.payload)}
                    </pre>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Response */}
              {selectedLog.responseBody && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Response Body</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box
                      sx={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        p: 2,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        overflow: 'auto',
                        maxHeight: 300,
                      }}
                    >
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {selectedLog.responseBody}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebhookLogs;