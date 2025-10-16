import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Grid,
  Alert,
  Button,
  Divider,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  ArrowLeft, 
  TrendingUp, 
  Gift, 
  CreditCard, 
  RefreshCw, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Star,
  Coins,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetPointBalanceQuery,
  useGetPointHistoryQuery,
  useExchangeCreditsToPointsMutation,
  useClaimDailyRewardMutation,
  useGetDailyRewardStatusQuery,
  useGetWalletBalanceQuery,
} from '../services/api';
import { GlassCard, LoadingSpinner } from '../components/common';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`points-tabpanel-${index}`}
      aria-labelledby={`points-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Points: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);
  const [exchangeDialogOpen, setExchangeDialogOpen] = React.useState(false);
  const [exchangeAmount, setExchangeAmount] = React.useState('');
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Fetch data
  const { data: pointBalance, isLoading: pointBalanceLoading } = useGetPointBalanceQuery();
  const { data: walletBalance, isLoading: walletBalanceLoading } = useGetWalletBalanceQuery();
  const { data: pointHistory, isLoading: historyLoading } = useGetPointHistoryQuery();
  const { data: dailyRewardStatus, isLoading: rewardStatusLoading } = useGetDailyRewardStatusQuery();
  
  // Mutations
  const [exchangeCredits, { isLoading: exchangeLoading }] = useExchangeCreditsToPointsMutation();
  const [claimDailyReward, { isLoading: claimLoading }] = useClaimDailyRewardMutation();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExchangeCredits = async () => {
    try {
      const amount = parseInt(exchangeAmount);
      if (isNaN(amount) || amount <= 0) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid amount',
          severity: 'error',
        });
        return;
      }

      if (!walletBalance || walletBalance.credits < amount) {
        setSnackbar({
          open: true,
          message: 'Insufficient credits',
          severity: 'error',
        });
        return;
      }

      await exchangeCredits({ creditAmount: amount }).unwrap();
      setExchangeDialogOpen(false);
      setExchangeAmount('');
      setSnackbar({
        open: true,
        message: `Successfully exchanged ${amount} credits for ${amount * 1000} points`,
        severity: 'success',
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to exchange credits',
        severity: 'error',
      });
    }
  };

  const handleClaimDailyReward = async () => {
    try {
      await claimDailyReward().unwrap();
      setSnackbar({
        open: true,
        message: 'Daily reward claimed successfully!',
        severity: 'success',
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to claim daily reward',
        severity: 'error',
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard size={20} color={theme.palette.success.main} />;
      case 'usage':
        return <Zap size={20} color={theme.palette.error.main} />;
      case 'exchange_from_credit':
        return <RefreshCw size={20} color={theme.palette.primary.main} />;
      case 'auto_topup_from_credit':
        return <ArrowRight size={20} color={theme.palette.warning.main} />;
      case 'daily_reward':
        return <Gift size={20} color={theme.palette.secondary.main} />;
      case 'admin_adjustment':
        return <Info size={20} color={theme.palette.info.main} />;
      default:
        return <Coins size={20} color={theme.palette.text.secondary} />;
    }
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

  if (pointBalanceLoading || walletBalanceLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <LoadingSpinner overlay text="Loading points information..." />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, pb: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ pt: 3, pb: 4 }}>
            <Button startIcon={<ArrowLeft size={20} />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
              Back to Dashboard
            </Button>

            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Points & Rewards
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
              Manage your points, claim rewards, and exchange credits
            </Typography>
          </Box>
        </motion.div>

        {/* Wallet Balance Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassCard glow="primary" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Points Balance
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '50%',
                        backgroundColor: `${theme.palette.primary.main}20`,
                        color: theme.palette.primary.main,
                      }}
                    >
                      <Coins size={32} />
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {pointBalance?.balance.toLocaleString() || '0'} points
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Available for use
                  </Typography>
                </CardContent>
              </GlassCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassCard glow="secondary" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Credits Balance
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '50%',
                        backgroundColor: `${theme.palette.secondary.main}20`,
                        color: theme.palette.secondary.main,
                      }}
                    >
                      <CreditCard size={32} />
                    </Box>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {walletBalance?.credits.toLocaleString() || '0'} credits
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Can be exchanged for points
                  </Typography>
                </CardContent>
              </GlassCard>
            </motion.div>
          </Grid>
        </Grid>

        {/* Daily Reward Card */}
        {dailyRewardStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlassCard glow="primary" sx={{ mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Daily Login Reward
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                      {dailyRewardStatus.canClaim 
                        ? `Claim your daily reward of ${dailyRewardStatus.rewardAmount} points!`
                        : `Next reward available in ${dailyRewardStatus.nextClaimDate 
                            ? new Date(dailyRewardStatus.nextClaimDate).toLocaleDateString()
                            : 'tomorrow'}`
                      }
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '50%',
                      backgroundColor: `${theme.palette.success.main}20`,
                      color: theme.palette.success.main,
                    }}
                  >
                    <Gift size={32} />
                  </Box>
                </Box>
                {dailyRewardStatus.canClaim && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Gift size={20} />}
                    onClick={handleClaimDailyReward}
                    disabled={claimLoading}
                    sx={{ mt: 2 }}
                  >
                    {claimLoading ? 'Claiming...' : 'Claim Daily Reward'}
                  </Button>
                )}
              </CardContent>
            </GlassCard>
          </motion.div>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Tab label="Exchange Credits" icon={<RefreshCw size={20} />} iconPosition="start" />
            <Tab label="Transaction History" icon={<Calendar size={20} />} iconPosition="start" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GlassCard>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Exchange Credits for Points
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                    Convert your credits to points at a rate of 1 Credit = 1,000 Points
                  </Typography>

                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Credits to Exchange"
                        type="number"
                        value={exchangeAmount}
                        onChange={(e) => setExchangeAmount(e.target.value)}
                        inputProps={{ min: 1, max: walletBalance?.credits || 0 }}
                        helperText={`Available: ${walletBalance?.credits || 0} credits`}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          You will receive:
                        </Typography>
                        <Typography variant="h5" color="primary" fontWeight={600}>
                          {exchangeAmount ? parseInt(exchangeAmount) * 1000 : 0} Points
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<RefreshCw size={20} />}
                      onClick={() => setExchangeDialogOpen(true)}
                      disabled={!exchangeAmount || parseInt(exchangeAmount) <= 0 || exchangeLoading}
                    >
                      Exchange Credits
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/billing')}
                      startIcon={<CreditCard size={20} />}
                    >
                      Purchase More Credits
                    </Button>
                  </Box>
                </CardContent>
              </GlassCard>
            </motion.div>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GlassCard>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Transaction History
                  </Typography>

                  {historyLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <LoadingSpinner />
                    </Box>
                  ) : pointHistory?.data && pointHistory.data.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {pointHistory.data.map((transaction: any, index: number) => (
                        <ListItem
                          key={transaction.id}
                          sx={{
                            px: 0,
                            py: 2,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>
                            {getTransactionIcon(transaction.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {transaction.description || transaction.type.replace(/_/g, ' ')}
                                </Typography>
                                {transaction.type === 'auto_topup_from_credit' && (
                                  <Chip
                                    label="Auto Top-up"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ color: theme.palette.text.secondary }}
                                >
                                  {formatRelativeTime(transaction.createdAt)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: transaction.amount > 0 
                                        ? theme.palette.success.main 
                                        : theme.palette.error.main,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} points
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <AlertCircle size={48} color={theme.palette.text.secondary} />
                      <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mt: 2 }}>
                        No transactions yet
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Start by claiming your daily reward or exchanging credits
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </GlassCard>
            </motion.div>
          </TabPanel>
        </Paper>

        {/* Exchange Confirmation Dialog */}
        <Dialog open={exchangeDialogOpen} onClose={() => setExchangeDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Exchange</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to exchange {exchangeAmount} credits for {parseInt(exchangeAmount) * 1000} points?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExchangeDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleExchangeCredits}
              variant="contained"
              color="primary"
              disabled={exchangeLoading}
            >
              {exchangeLoading ? 'Exchanging...' : 'Confirm Exchange'}
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

export default Points;