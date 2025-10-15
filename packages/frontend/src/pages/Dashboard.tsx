import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Fab,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  Activity,
  CreditCard,
  Plus,
  Settings,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { GlassCard, GradientButton, CreditBadge, LoadingSpinner } from '../components/common';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'error';
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, delay = 0 }) => {
  const theme = useTheme();

  const getColor = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'accent':
        return (theme.palette as any).accent.main;
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
    >
      <GlassCard
        glow={color === 'primary' ? 'primary' : color === 'secondary' ? 'secondary' : 'none'}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  backgroundColor: `${getColor()}20`,
                  color: getColor(),
                }}
              >
                {icon}
              </Box>
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                {title}
              </Typography>
            </Box>
            {change !== undefined && (
              <Chip
                icon={change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                label={`${change > 0 ? '+' : ''}${change}%`}
                size="small"
                sx={{
                  backgroundColor:
                    change > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: change > 0 ? theme.palette.success.main : theme.palette.error.main,
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          {/* Mini sparkline chart placeholder */}
          <Box sx={{ height: 40, mt: 2 }}>
            <svg width="100%" height="100%" viewBox="0 0 100 40">
              <motion.path
                d="M0,30 L20,25 L40,28 L60,15 L80,20 L100,10"
                fill="none"
                stroke={getColor()}
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: delay + 0.5 }}
              />
            </svg>
          </Box>
        </CardContent>
      </GlassCard>
    </motion.div>
  );
};

interface ActivityItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const recentActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'success',
      title: 'API Call Successful',
      description: 'GPT-4 completion processed successfully',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: '2',
      type: 'info',
      title: 'New API Key Generated',
      description: 'Created new API key for production environment',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      id: '3',
      type: 'warning',
      title: 'Credit Usage Alert',
      description: 'You have used 80% of your monthly credits',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: '4',
      type: 'success',
      title: 'Payment Processed',
      description: 'Successfully added $50 to your account',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      id: '5',
      type: 'error',
      title: 'API Rate Limit',
      description: 'Exceeded rate limit for GPT-3.5 Turbo',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ];

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color={theme.palette.success.main} />;
      case 'error':
        return <AlertCircle size={20} color={theme.palette.error.main} />;
      case 'warning':
        return <AlertCircle size={20} color={theme.palette.warning.main} />;
      default:
        return <Activity size={20} color={theme.palette.info.main} />;
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
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
        <LoadingSpinner overlay text="Loading dashboard..." />
      </Box>
    );
  }

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
            Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
            Welcome back! Here's what's happening with your account today.
          </Typography>
        </motion.div>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Total Credits"
              value={1250}
              change={12}
              icon={<CreditCard size={24} />}
              color="primary"
              delay={0.1}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="API Calls Today"
              value={342}
              change={8}
              icon={<Zap size={24} />}
              color="secondary"
              delay={0.2}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Active Services"
              value={5}
              change={0}
              icon={<Activity size={24} />}
              color="accent"
              delay={0.3}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Team Members"
              value={8}
              change={25}
              icon={<Users size={24} />}
              color="success"
              delay={0.4}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Credit Balance Card */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <GlassCard glow="primary" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Credit Balance
                  </Typography>

                  <CreditBadge
                    credits={1250}
                    change={150}
                    animated
                    showParticles
                    size="large"
                    variant="card"
                    onTopUp={() => navigate('/billing')}
                  />

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      Monthly Usage
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={65}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary, mt: 1 }}
                    >
                      812 of 1,250 credits used (65%)
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                      Usage Forecast
                    </Typography>
                    <Box sx={{ height: 60 }}>
                      <svg width="100%" height="100%" viewBox="0 0 200 60">
                        <motion.path
                          d="M0,40 L40,35 L80,30 L120,25 L160,20 L200,15"
                          fill="none"
                          stroke={theme.palette.primary.main}
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.5, delay: 1 }}
                        />
                        <motion.path
                          d="M0,40 L40,35 L80,30 L120,25 L160,20 L200,15 L200,60 L0,60 Z"
                          fill="url(#gradient)"
                          opacity={0.3}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.3 }}
                          transition={{ duration: 1.5, delay: 1.5 }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={theme.palette.primary.main} />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </Box>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      Based on current usage, you'll need more credits in 12 days
                    </Typography>
                  </Box>
                </CardContent>
              </GlassCard>
            </motion.div>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <GlassCard sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Recent Activity
                    </Typography>
                    <IconButton size="small">
                      <Settings size={20} />
                    </IconButton>
                  </Box>

                  <List sx={{ p: 0 }}>
                    {recentActivities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                      >
                        <ListItem
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
                            {getActivityIcon(activity.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={activity.title}
                            secondary={
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ color: theme.palette.text.secondary }}
                                >
                                  {activity.description}
                                </Typography>
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
                                >
                                  <Clock size={12} color={theme.palette.text.secondary} />
                                  <Typography
                                    variant="caption"
                                    sx={{ color: theme.palette.text.secondary }}
                                  >
                                    {formatRelativeTime(activity.timestamp)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                </CardContent>
              </GlassCard>
            </motion.div>
          </Grid>
        </Grid>

        {/* Quick Actions FAB */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
            },
          }}
        >
          <Plus size={24} />
        </Fab>
      </Container>
    </Box>
  );
};

export default Dashboard;
