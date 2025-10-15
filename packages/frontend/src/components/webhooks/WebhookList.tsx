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
  IconButton,
  Chip,
  Switch,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Pagination,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import GradientButton from '../common/GradientButton';
import LoadingSpinner from '../common/LoadingSpinner';
import { webhookService, WebhookEndpoint, formatWebhookStatus, formatDate } from '../../services/webhook.service';

interface WebhookListProps {
  onEdit?: (webhook: WebhookEndpoint) => void;
  onViewLogs?: (webhook: WebhookEndpoint) => void;
  onCreateNew?: () => void;
}

const WebhookList: React.FC<WebhookListProps> = ({
  onEdit,
  onViewLogs,
  onCreateNew,
}) => {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpoint | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await webhookService.getWebhooks();
      setWebhooks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch webhooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, webhook: WebhookEndpoint) => {
    setAnchorEl(event.currentTarget);
    setSelectedWebhook(webhook);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedWebhook(null);
  };

  const handleToggleActive = async (webhook: WebhookEndpoint) => {
    try {
      await webhookService.toggleWebhook(webhook.id);
      await fetchWebhooks();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle webhook');
    }
  };

  const handleDelete = async () => {
    if (!selectedWebhook) return;
    
    try {
      await webhookService.deleteWebhook(selectedWebhook.id);
      setDeleteDialogOpen(false);
      handleMenuClose();
      await fetchWebhooks();
    } catch (err: any) {
      setError(err.message || 'Failed to delete webhook');
    }
  };

  const handleTest = async () => {
    if (!selectedWebhook) return;
    
    try {
      setTestingWebhook(true);
      const result = await webhookService.testWebhook(selectedWebhook.id, {
        eventType: 'user.created',
        data: { test: true, timestamp: new Date().toISOString() },
      });
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Test failed' });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleTestDialogOpen = () => {
    setTestDialogOpen(true);
    setTestResult(null);
    handleMenuClose();
  };

  const getEventTypesDisplay = (eventTypes: string[]) => {
    if (eventTypes.length === 0) return 'No events';
    if (eventTypes.length === 1) return eventTypes[0];
    return `${eventTypes.length} events`;
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircleIcon sx={{ color: '#10b981', fontSize: 16 }} />
    ) : (
      <ErrorIcon sx={{ color: '#ef4444', fontSize: 16 }} />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <LoadingSpinner size={60} text="Loading webhooks..." />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Webhooks
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <GradientButton
            variant="secondary"
            startIcon={<RefreshIcon />}
            onClick={fetchWebhooks}
            sx={{ minWidth: 'auto' }}
          >
            Refresh
          </GradientButton>
          <GradientButton
            variant="primary"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
          >
            Create Webhook
          </GradientButton>
        </Box>
      </Box>

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

      {/* Webhooks Table */}
      <GlassCard>
        <TableContainer component={Paper} sx={{ background: 'transparent', boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>URL</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Events</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        No webhooks configured
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Create your first webhook to start receiving real-time notifications
                      </Typography>
                      <GradientButton
                        variant="primary"
                        startIcon={<AddIcon />}
                        onClick={onCreateNew}
                      >
                        Create Webhook
                      </GradientButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                webhooks.map((webhook, index) => (
                  <TableRow
                    key={webhook.id}
                    component={motion.tr}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(webhook.isActive)}
                        <Switch
                          checked={webhook.isActive}
                          onChange={() => handleToggleActive(webhook)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={webhook.url}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {webhook.url}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={webhook.eventTypes.join(', ')}>
                        <Chip
                          label={getEventTypesDisplay(webhook.eventTypes)}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(webhook.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, webhook)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <MoreVertIcon />
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
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <MenuItem onClick={() => selectedWebhook && onEdit?.(selectedWebhook)}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedWebhook && onViewLogs?.(selectedWebhook)}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 18 }} />
          View Logs
        </MenuItem>
        <MenuItem onClick={handleTestDialogOpen}>
          <RefreshIcon sx={{ mr: 1, fontSize: 18 }} />
          Test
        </MenuItem>
        <MenuItem onClick={handleDeleteDialogOpen} sx={{ color: '#ef4444' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <DialogTitle>Delete Webhook</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this webhook? This action cannot be undone.
          </Typography>
          {selectedWebhook && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                URL: {selectedWebhook.url}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Events: {selectedWebhook.eventTypes.join(', ')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <GradientButton variant="primary" onClick={handleDelete}>
            Delete
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Test Webhook Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <DialogTitle>Test Webhook</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Send a test event to your webhook endpoint to verify it's working correctly.
          </Typography>
          {selectedWebhook && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                URL: {selectedWebhook.url}
              </Typography>
            </Box>
          )}
          {testResult && (
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {testResult.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
          <GradientButton
            variant="primary"
            onClick={handleTest}
            disabled={testingWebhook}
          >
            {testingWebhook ? 'Testing...' : 'Send Test'}
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebhookList;