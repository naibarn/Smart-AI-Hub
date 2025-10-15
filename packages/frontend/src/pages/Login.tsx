import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Mail, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginUserMutation, LoginRequest } from '../services/api';
import { login } from '../App';

// Form validation schema with zod
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const [loginUser, { isLoading, error }] = useLoginUserMutation();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await loginUser(data as LoginRequest).unwrap();

      if (result.success && result.user && result.token) {
        // Store token and user data in localStorage
        localStorage.setItem('token', result.token);
        if (result.refreshToken) {
          localStorage.setItem('refreshToken', result.refreshToken);
        }

        // Format user data for Redux store
        const userData = {
          name:
            `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() ||
            result.user.email,
          email: result.user.email,
          avatar: undefined,
        };

        localStorage.setItem('user', JSON.stringify(userData));

        // Dispatch login action to update Redux store
        dispatch(login(userData));

        // Redirect to dashboard
        navigate('/');
      }
    } catch (err: any) {
      // Handle API errors
      if (err.data?.message) {
        setError('root', { message: err.data.message });
      } else {
        setError('root', { message: 'Login failed. Please try again.' });
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleOAuth = () => {
    // Redirect to backend's Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/google`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            p: 4,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
            Welcome Back
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary, mb: 4, textAlign: 'center' }}
          >
            Sign in to your Smart AI Hub account
          </Typography>

          {/* Root level error message */}
          {errors.root && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.root.message}
            </Alert>
          )}

          {/* API error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {'status' in error && (error as any).data?.message
                ? (error as any).data.message
                : 'An error occurred during login'}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Email */}
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password */}
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || isSubmitting}
                sx={{ py: 1.5, mt: 2 }}
              >
                {isLoading || isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              OR
            </Typography>
          </Divider>

          {/* Google OAuth Button */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
                />
                <path
                  fill="#34A853"
                  d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.1A8 8 0 0 0 8.98 17z"
                />
                <path
                  fill="#FBBC05"
                  d="M4.5 10.48a4.8 4.8 0 0 1 0-3.04V5.34H1.83a8 8 0 0 0 0 7.28L4.5 10.48z"
                />
                <path
                  fill="#EA4335"
                  d="M8.98 4.18a4.4 4.4 0 0 1 3.04 1.18l2.3-2.3A8 8 0 0 0 1.83 5.34L4.5 7.44a4.77 4.77 0 0 1 4.48-3.26z"
                />
              </svg>
            }
            onClick={handleGoogleOAuth}
            sx={{ py: 1.5, mb: 2 }}
          >
            Sign in with Google
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              onClick={() => navigate('/password-reset')}
              sx={{
                color: theme.palette.primary.main,
                textTransform: 'none',
                fontWeight: 600,
                p: 0,
                mb: 2,
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
              }}
            >
              Forgot your password?
            </Button>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, display: 'block' }}
            >
              Don't have an account?{' '}
              <Button
                onClick={() => navigate('/register')}
                sx={{
                  color: theme.palette.primary.main,
                  textTransform: 'none',
                  fontWeight: 600,
                  p: 0,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign up
              </Button>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
