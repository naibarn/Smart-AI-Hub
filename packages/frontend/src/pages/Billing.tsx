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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowLeft,
  CreditCard,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetCreditPackagesQuery,
  useCreateCheckoutSessionMutation,
  useGetCreditBalanceQuery,
  CreditPackage,
} from '../services/api';
import CreditPackageCard from '../components/billing/CreditPackageCard';
import { GlassCard, LoadingSpinner } from '../components/common';

const Billing: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Fetch credit packages and user's credit balance
  const { data: packages, isLoading: packagesLoading, error: packagesError } = useGetCreditPackagesQuery();
  const { data: balanceData, isLoading: balanceLoading } = useGetCreditBalanceQuery();
  const [createCheckoutSession, { isLoading: checkoutLoading, error: checkoutError }] = useCreateCheckoutSessionMutation();

  // Define static credit packages as fallback
  const staticPackages: CreditPackage[] = [
    {
      id: 'starter',
      name: 'Starter',
      credits: 100,
      price: 9.99,
      currency: 'USD',
      description: 'Perfect for trying out our platform',
      features: [
        '100 AI credits',
        'Basic support',
        'Access to all models',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      credits: 500,
      price: 39.99,
      currency: 'USD',
      description: 'Great for regular users',
      features: [
        '500 AI credits',
        'Priority support',
        'Access to all models',
        'Advanced features',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      credits: 2000,
      price: 149.99,
      currency: 'USD',
      description: 'For teams and power users',
      features: [
        '2000 AI credits',
        'Dedicated support',
        'Access to all models',
        'Advanced features',
        'Custom integrations',
      ],
    },
  ];

  // Use fetched packages or fallback to static packages
  const creditPackages = packages || staticPackages;

  const handlePurchase = async (packageId: string) => {
    try {
      const result = await createCheckoutSession({ packageId }).unwrap();
      // Redirect to Stripe checkout
      window.location.href = result.url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  if (packagesLoading || balanceLoading) {
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
        <LoadingSpinner overlay text="Loading billing information..." />
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
            <Button
              startIcon={<ArrowLeft size={20} />}
              onClick={handleGoBack}
              sx={{ mb: 2 }}
            >
              Back to Dashboard
            </Button>
            
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Billing & Credits
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
              Manage your credit packages and billing information
            </Typography>
          </Box>
        </motion.div>

        {/* Current Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard glow="primary" sx={{ mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Current Credit Balance
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {balanceData ? balanceData.balance.toLocaleString() : '1,250'} credits
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                    Available for use
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '50%',
                    backgroundColor: `${theme.palette.primary.main}20`,
                    color: theme.palette.primary.main,
                  }}
                >
                  <CreditCard size={32} />
                </Box>
              </Box>
            </CardContent>
          </GlassCard>
        </motion.div>

        {/* Error Display */}
        {packagesError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert severity="error" sx={{ mb: 4 }}>
              Failed to load credit packages. Please try again later.
            </Alert>
          </motion.div>
        )}

        {checkoutError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert severity="error" sx={{ mb: 4 }}>
              Failed to process your request. Please try again.
            </Alert>
          </motion.div>
        )}

        {/* Credit Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
            Choose a Credit Package
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
            Select the package that best fits your needs
          </Typography>

          <Grid container spacing={3}>
            {creditPackages.map((pkg) => (
              <Grid item xs={12} md={6} lg={4} key={pkg.id}>
                <CreditPackageCard
                  id={pkg.id}
                  name={pkg.name}
                  credits={pkg.credits}
                  price={pkg.price}
                  currency={pkg.currency}
                  description={pkg.description}
                  features={pkg.features}
                  popular={pkg.popular}
                  onPurchase={handlePurchase}
                  loading={checkoutLoading}
                />
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Box sx={{ mt: 6 }}>
            <Divider sx={{ mb: 4 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
              Why Choose Our Credits?
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <GlassCard sx={{ height: '100%', p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        backgroundColor: `${theme.palette.primary.main}20`,
                        color: theme.palette.primary.main,
                        mr: 2,
                      }}
                    >
                      <Zap size={24} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Fast Processing
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Your credits are available immediately after purchase
                  </Typography>
                </GlassCard>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <GlassCard sx={{ height: '100%', p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        backgroundColor: `${theme.palette.success.main}20`,
                        color: theme.palette.success.main,
                        mr: 2,
                      }}
                    >
                      <TrendingUp size={24} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Flexible Usage
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Use credits across all available AI models and features
                  </Typography>
                </GlassCard>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <GlassCard sx={{ height: '100%', p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        backgroundColor: `${theme.palette.secondary.main}20`,
                        color: theme.palette.secondary.main,
                        mr: 2,
                      }}
                    >
                      <Shield size={24} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Secure Payments
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Your payment information is processed securely through Stripe
                  </Typography>
                </GlassCard>
              </Grid>
            </Grid>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Billing;