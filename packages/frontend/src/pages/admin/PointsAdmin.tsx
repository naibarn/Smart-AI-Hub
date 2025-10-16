import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Tab,
  Tabs,
  Divider,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Edit,
  Settings,
  TrendingUp,
  Users,
  Coins,
  RefreshCw,
  ArrowUpRight,
  Info,
  Save,
} from 'lucide-react';
import { GlassCard, LoadingSpinner } from '../../components/common';

interface ExchangeRate {
  id: string;
  name: string;
  rate: number;
  description: string | null;
}

interface PointsStats {
  totalPoints: number;
  totalUsers: number;
  activeUsers: number;
  averageBalance: number;
  totalTransactions: number;
}

interface AutoTopupStats {
  totalAutoTopups: number;
  totalCreditsConverted: number;
  totalPointsGenerated: number;
  recentAutoTopups: Array<{
    id: string;
    user: {
      id: string;
      email: string;
    };
    amount: number;
    createdAt: string;
  }>;
}

const PointsAdmin: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedRate, setSelectedRate] = React.useState<ExchangeRate | null>(null);
  const [editRate, setEditRate] = React.useState('');
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Mock data - in real app, this would come from API
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRate[]>([
    {
      id: '1',
      name: 'credit_to_points',
      rate: 1000,
      description: 'Credits to Points conversion rate (1 Credit = 1000 Points)',
    },
    {
      id: '2',
      name: 'points_per_usd',
      rate: 10000,
      description: 'Points per USD purchase rate (1 USD = 10000 Points)',
    },
    {
      id: '3',
      name: 'daily_reward_amount',
      rate: 50,
      description: 'Daily login reward amount in points',
    },
    {
      id: '4',
      name: 'auto_topup_threshold',
      rate: 10,
      description: 'Auto top-up threshold in points',
    },
  ]);

  const [pointsStats] = React.useState<PointsStats>({
    totalPoints: 2500000,
    totalUsers: 1250,
    activeUsers: 890,
    averageBalance: 2000,
    totalTransactions: 15420,
  });

  const [autoTopupStats] = React.useState<AutoTopupStats>({
    totalAutoTopups: 342,
    totalCreditsConverted: 342,
    totalPointsGenerated: 342000,
    recentAutoTopups: [
      {
        id: '1',
        user: { id: 'user1', email: 'user1@example.com' },
        amount: 1000,
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        user: { id: 'user2', email: 'user2@example.com' },
        amount: 1000,
        createdAt: '2024-01-15T09:45:00Z',
      },
    ],
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditRate = (rate: ExchangeRate) => {
    setSelectedRate(rate);
    setEditRate(rate.rate.toString());
    setEditDialogOpen(true);
  };

  const handleSaveRate = () => {
    if (!selectedRate || !editRate) return;

    const newRate = parseFloat(editRate);
    if (isNaN(newRate) || newRate <= 0) {
      setSnackbar({
        open: true,
        message: 'Rate must be a positive number',
        severity: 'error',
      });
      return;
    }

    // Update the rate in the local state
    setExchangeRates(rates =>
      rates.map(rate =>
        rate.id === selectedRate.id ? { ...rate, rate: newRate } : rate
      )
    );

    setEditDialogOpen(false);
    setSelectedRate(null);
    setEditRate('');
    setSnackbar({
      open: true,
      message: 'Exchange rate updated successfully',
      severity: 'success',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, p: 3 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Points System Admin
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
            Manage exchange rates, view statistics, and monitor the points system
          </Typography>
        </motion.div>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassCard glow="primary" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                      Total Points
                    </Typography>
                    <Coins size={24} color={theme.palette.primary.main} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatNumber(pointsStats.totalPoints)}
                  </Typography>
                  <Chip
                    label={`${pointsStats.totalUsers} users`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </GlassCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassCard glow="primary" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                      Active Users
                    </Typography>
                    <Users size={24} color={theme.palette.success.main} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatNumber(pointsStats.activeUsers)}
                  </Typography>
                  <Chip
                    label={`${Math.round((pointsStats.activeUsers / pointsStats.totalUsers) * 100)}% of total`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </GlassCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GlassCard glow="secondary" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                      Auto Top-ups
                    </Typography>
                    <RefreshCw size={24} color={theme.palette.secondary.main} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatNumber(autoTopupStats.totalAutoTopups)}
                  </Typography>
                  <Chip
                    label={`${formatNumber(autoTopupStats.totalCreditsConverted)} credits`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </GlassCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlassCard glow="accent" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                      Transactions
                    </Typography>
                    <TrendingUp size={24} color={theme.palette.secondary.main} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatNumber(pointsStats.totalTransactions)}
                  </Typography>
                  <Chip
                    label="All time"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </GlassCard>
            </motion.div>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Tab label="Exchange Rates" icon={<Settings size={20} />} iconPosition="start" />
            <Tab label="Auto Top-up Stats" icon={<RefreshCw size={20} />} iconPosition="start" />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Exchange Rates Management
                </Typography>

                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rate Name</TableCell>
                        <TableCell align="right">Current Rate</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exchangeRates.map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {rate.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {formatNumber(rate.rate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {rate.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit Rate">
                              <IconButton
                                size="small"
                                onClick={() => handleEditRate(rate)}
                              >
                                <Edit size={18} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info size={20} />
                    <Typography variant="body2">
                      Changes to exchange rates will take effect immediately and affect all future transactions.
                    </Typography>
                  </Box>
                </Alert>
              </motion.div>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ p: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Auto Top-up Statistics
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={4}>
                    <GlassCard>
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                          {formatNumber(autoTopupStats.totalAutoTopups)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Auto Top-ups
                        </Typography>
                      </CardContent>
                    </GlassCard>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <GlassCard>
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                          {formatNumber(autoTopupStats.totalCreditsConverted)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Credits Converted
                        </Typography>
                      </CardContent>
                    </GlassCard>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <GlassCard>
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                          {formatNumber(autoTopupStats.totalPointsGenerated)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Points Generated
                        </Typography>
                      </CardContent>
                    </GlassCard>
                  </Grid>
                </Grid>

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Recent Auto Top-ups
                </Typography>

                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Points Added</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {autoTopupStats.recentAutoTopups.map((topup) => (
                        <TableRow key={topup.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {topup.user.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`+${formatNumber(topup.amount)}`}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatRelativeTime(topup.createdAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </motion.div>
            </Box>
          )}
        </Paper>

        {/* Edit Rate Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Exchange Rate</DialogTitle>
          <DialogContent>
            {selectedRate && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {selectedRate.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedRate.description}
                </Typography>
                <TextField
                  fullWidth
                  label="New Rate"
                  type="number"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  inputProps={{ min: 0, step: 1 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveRate}
              variant="contained"
              color="primary"
              startIcon={<Save size={18} />}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default PointsAdmin;