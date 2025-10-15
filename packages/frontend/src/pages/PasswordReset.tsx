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
  Card,
  CardContent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Mail, ArrowBack, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRequestPasswordResetMutation, useConfirmPasswordResetMutation } from '../services/api';

// Form validation schema for email request
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Form validation schema for password reset
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const PasswordReset: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onBlur',
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onBlur',
  });

  const onEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/request-password-reset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setEmailSent(true);
      } else {
        setApiError(result.message || 'Failed to send reset email');
      }
    } catch (error) {
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [confirmPasswordReset] = useConfirmPasswordResetMutation();

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!token) {
      setApiError('Invalid reset token');
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const result = await confirmPasswordReset({
        token,
        password: data.password,
      }).unwrap();

      if (result.success) {
        setResetSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setApiError(result.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setApiError(err.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // If token is present, show password reset form
  if (token) {
    if (resetSuccess) {
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
            <Card
              sx={{
                p: 4,
                boxShadow: theme.shadows[8],
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, mb: 2, color: theme.palette.success.main }}
                >
                  Password Reset Successful!
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Your password has been successfully reset.
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  You will be redirected to the login page in a few seconds...
                </Typography>
                <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 3 }}>
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </Container>
        </Box>
      );
    }

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
          <Card
            sx={{
              p: 4,
              boxShadow: theme.shadows[8],
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Button startIcon={<ArrowBack />} onClick={() => navigate('/login')} sx={{ mb: 2 }}>
                Back to Login
              </Button>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
              Reset Your Password
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary, mb: 4, textAlign: 'center' }}
            >
              Enter your new password below
            </Typography>

            {apiError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {apiError}
              </Alert>
            )}

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* New Password */}
                <TextField
                  fullWidth
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  {...passwordForm.register('password')}
                  error={!!passwordForm.formState.errors.password}
                  helperText={passwordForm.formState.errors.password?.message}
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

                {/* Confirm Password */}
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...passwordForm.register('confirmPassword')}
                  error={!!passwordForm.formState.errors.confirmPassword}
                  helperText={passwordForm.formState.errors.confirmPassword?.message}
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
                          aria-label="toggle confirm password visibility"
                          onClick={toggleConfirmPasswordVisibility}
                          edge="end"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                  disabled={isLoading || passwordForm.formState.isSubmitting}
                  sx={{ py: 1.5, mt: 2 }}
                >
                  {isLoading || passwordForm.formState.isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </Box>
            </form>
          </Card>
        </Container>
      </Box>
    );
  }

  // Email request form
  if (emailSent) {
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
          <Card
            sx={{
              p: 4,
              boxShadow: theme.shadows[8],
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mb: 2, color: theme.palette.success.main }}
            >
              Reset Email Sent!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              We've sent you an email with instructions to reset your password.
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
              Please check your email and follow the link to reset your password.
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/login')} sx={{ mr: 2 }}>
              Back to Login
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setEmailSent(false);
                emailForm.reset();
              }}
            >
              Send Again
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

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
        <Card
          sx={{
            p: 4,
            boxShadow: theme.shadows[8],
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/login')} sx={{ mb: 2 }}>
              Back to Login
            </Button>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
            Reset Your Password
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary, mb: 4, textAlign: 'center' }}
          >
            Enter your email address and we'll send you a link to reset your password
          </Typography>

          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Email */}
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                {...emailForm.register('email')}
                error={!!emailForm.formState.errors.email}
                helperText={emailForm.formState.errors.email?.message}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail />
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
                disabled={isLoading || emailForm.formState.isSubmitting}
                sx={{ py: 1.5, mt: 2 }}
              >
                {isLoading || emailForm.formState.isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Send Reset Email'
                )}
              </Button>
            </Box>
          </form>
        </Card>
      </Container>
    </Box>
  );
};

export default PasswordReset;
