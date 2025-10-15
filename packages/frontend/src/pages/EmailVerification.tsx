import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Mail, CheckCircle, Error as ErrorIcon, Refresh } from '@mui/icons-material';
import { useVerifyEmailMutation, useResendVerificationMutation } from '../services/api';

const EmailVerification: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');

  const [verifyEmail] = useVerifyEmailMutation();
  const [resendVerification] = useResendVerificationMutation();

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (token && email) {
      handleAutoVerify();
    }
  }, [token, email]);

  const handleAutoVerify = async () => {
    setStatus('verifying');
    setMessage('Verifying your email...');

    try {
      const result = await verifyEmail({ email, token }).unwrap();

      if (result.success) {
        setStatus('verified');
        setMessage('Email verified successfully! Redirecting to login...');

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Email verification failed');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.data?.message || 'Email verification failed');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || !email) {
      setMessage('Please enter the verification code');
      return;
    }

    setStatus('verifying');
    setMessage('Verifying your email...');

    try {
      const result = await verifyEmail({ email, token: otp }).unwrap();

      if (result.success) {
        setStatus('verified');
        setMessage('Email verified successfully! Redirecting to login...');

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Invalid verification code');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.data?.message || 'Invalid verification code');
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage('Email address is required');
      return;
    }

    setResendLoading(true);
    setResendMessage('');

    try {
      const result = await resendVerification({ email }).unwrap();

      if (result.success) {
        setResendMessage('Verification code sent successfully. Please check your email.');
      } else {
        setResendMessage(result.message || 'Failed to resend verification code');
      }
    } catch (err: any) {
      setResendMessage(err.data?.message || 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <CircularProgress size={48} />;
      case 'verified':
        return <CheckCircle sx={{ fontSize: 48, color: theme.palette.success.main }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 48, color: theme.palette.error.main }} />;
      default:
        return <Mail sx={{ fontSize: 48, color: theme.palette.primary.main }} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verifying':
        return theme.palette.info.main;
      case 'verified':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
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
        <Card
          sx={{
            p: 4,
            boxShadow: theme.shadows[8],
            textAlign: 'center',
          }}
        >
          <CardContent>
            <Box sx={{ mb: 3 }}>{getStatusIcon()}</Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: getStatusColor(),
              }}
            >
              {status === 'idle' && 'Verify Your Email'}
              {status === 'verifying' && 'Verifying...'}
              {status === 'verified' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                mb: 3,
              }}
            >
              {status === 'idle' && `We've sent a verification code to ${email}`}
              {message}
            </Typography>

            {status === 'error' && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {message}
              </Alert>
            )}

            {status === 'verified' && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {message}
              </Alert>
            )}

            {status === 'idle' && !token && (
              <form onSubmit={handleVerifyOtp}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Verification Code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!otp || otp.length !== 6}
                    sx={{ py: 1.5 }}
                  >
                    Verify Email
                  </Button>
                </Box>
              </form>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                Didn't receive the code?
              </Typography>

              <Button
                variant="outlined"
                startIcon={resendLoading ? <CircularProgress size={20} /> : <Refresh />}
                onClick={handleResendVerification}
                disabled={resendLoading || !email}
                sx={{ mb: 2 }}
              >
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </Button>

              {resendMessage && (
                <Alert
                  severity={resendMessage.includes('success') ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                >
                  {resendMessage}
                </Alert>
              )}

              <Button variant="text" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
                Back to Login
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default EmailVerification;
