import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  Divider,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  GlassCard,
  AnimatedInput,
  GradientButton,
  LoadingSpinner,
} from '../components/common';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const Login: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = React.useState(0);

  const handleInputChange = (field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'rememberMe' ? event.target.checked : event.target.value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Calculate password strength for registration
    if (field === 'password' && !isLogin) {
      const password = event.target.value;
      let strength = 0;
      if (password.length >= 8) strength += 25;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
      if (/\d/.test(password)) strength += 25;
      if (/[^a-zA-Z\d]/.test(password)) strength += 25;
      setPasswordStrength(strength);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, this would handle authentication
      navigate('/dashboard');
    }, 2000);
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    // Simulate social login
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return theme.palette.error.main;
    if (passwordStrength <= 50) return theme.palette.warning.main;
    if (passwordStrength <= 75) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left side - Animated gradient background */}
      <Box
        sx={{
          flex: 1,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${(theme.palette as any).accent.main} 100%)`,
          position: 'relative',
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Floating shapes */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            top: '10%',
            left: '10%',
          }}
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: 150,
            height: 150,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%',
            bottom: '20%',
            right: '15%',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', color: '#FFFFFF', zIndex: 1 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ marginBottom: 24 }}
          >
            <Zap size={80} />
          </motion.div>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
            Smart AI Hub
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 400, mb: 4, opacity: 0.9 }}>
            Unlock the Power of AI
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <motion.div whileHover={{ scale: 1.1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield size={20} />
                <Typography>Secure</Typography>
              </Box>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Zap size={20} />
                <Typography>Fast</Typography>
              </Box>
            </motion.div>
          </Box>
        </motion.div>
      </Box>

      {/* Right side - Login form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <GlassCard glow="primary" sx={{ p: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: theme.palette.text.secondary, mb: 4, textAlign: 'center' }}
              >
                {isLogin
                  ? 'Sign in to your account to continue'
                  : 'Sign up to get started with Smart AI Hub'}
              </Typography>

              <form onSubmit={handleSubmit}>
                <AnimatedInput
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  startIcon={<Mail size={20} />}
                  sx={{ mb: 3 }}
                />

                <AnimatedInput
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!errors.password}
                  helperText={errors.password}
                  startIcon={<Lock size={20} />}
                  password
                  sx={{ mb: 2 }}
                />

                {/* Password strength indicator for registration */}
                {!isLogin && formData.password && (
                  <Box sx={{ mb: 3 }}>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                        Password Strength:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: getPasswordStrengthColor(),
                        }}
                      >
                        {getPasswordStrengthText()}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength}%` }}
                        transition={{ duration: 0.3 }}
                        style={{
                          height: '100%',
                          backgroundColor: getPasswordStrengthColor(),
                        }}
                      />
                    </Box>
                    </motion.div>
                  </Box>
                )}

                {isLogin && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.rememberMe}
                          onChange={handleInputChange('rememberMe')}
                          sx={{
                            color: theme.palette.primary.main,
                            '&.Mui-checked': {
                              color: theme.palette.primary.main,
                            },
                          }}
                        />
                      }
                      label="Remember me"
                    />
                    <Link
                      href="#"
                      sx={{
                        color: theme.palette.primary.main,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>
                )}

                <GradientButton
                  type="submit"
                  fullWidth
                  variant="primary"
                  glow
                  sx={{ mb: 3 }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner size={24} color="inherit" />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isLogin ? 'Sign In' : 'Sign Up'}
                      <ArrowRight size={20} />
                    </Box>
                  )}
                </GradientButton>
              </form>

              <Divider sx={{ my: 3, borderColor: theme.palette.divider }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  OR
                </Typography>
              </Divider>

              {/* Social login buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleSocialLogin('google')}
                    sx={{
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary,
                      py: 1.5,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      },
                    }}
                    disabled={isLoading}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Box>
                  </Button>
                </motion.div>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </Link>
                </Typography>
              </Box>
            </GlassCard>
          </motion.div>
        </Container>
      </Box>

      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <LoadingSpinner overlay text="Authenticating..." />
        </Box>
      )}
    </Box>
  );
};

export default Login;