import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { login } from '../App';

const OAuthSuccess: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Processing authentication...');

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const verificationCode = searchParams.get('verification_code');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          return;
        }

        if (verificationCode) {
          // Handle session-based OAuth flow
          setStatus('success');
          setMessage('Authentication successful! You can now return to the application.');

          // Store verification code for the extension to pick up
          localStorage.setItem('oauth_verification_code', verificationCode);

          // Redirect back to the extension or app after 3 seconds
          setTimeout(() => {
            const returnTo = searchParams.get('return_to') || 'chatgpt';
            if (returnTo === 'chatgpt') {
              window.close();
            } else {
              navigate('/');
            }
          }, 3000);
        } else if (accessToken && refreshToken) {
          // Traditional OAuth flow with tokens
          // Get user info from the token
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (response.ok) {
            const userData = await response.json();

            // Store tokens
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Format user data for Redux store
            const formattedUserData = {
              name:
                `${userData.user?.firstName || ''} ${userData.user?.lastName || ''}`.trim() ||
                userData.user?.email,
              email: userData.user?.email,
              avatar: undefined,
            };

            localStorage.setItem('user', JSON.stringify(formattedUserData));

            // Dispatch login action
            dispatch(login(formattedUserData));

            setStatus('success');
            setMessage('Successfully logged in! Redirecting to dashboard...');

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Failed to fetch user information');
          }
        } else {
          setStatus('error');
          setMessage('Invalid authentication response');
        }
      } catch (error) {
        console.error('OAuth success handler error:', error);
        setStatus('error');
        setMessage('An error occurred during authentication');
      }
    };

    handleOAuthSuccess();
  }, [searchParams, navigate, dispatch]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <CircularProgress size={48} />;
      case 'success':
        return <CheckCircle sx={{ fontSize: 48, color: theme.palette.success.main }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 48, color: theme.palette.error.main }} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return theme.palette.info.main;
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.text.primary;
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
              {status === 'loading' && 'Authentication in Progress'}
              {status === 'success' && 'Authentication Successful'}
              {status === 'error' && 'Authentication Failed'}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                mb: 3,
              }}
            >
              {message}
            </Typography>

            {status === 'error' && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Please try again or contact support if the problem persists.
              </Alert>
            )}

            {status === 'success' && (
              <Alert severity="success" sx={{ mb: 3 }}>
                You will be redirected automatically. If not, click the button below.
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {status === 'error' && (
                <>
                  <Button variant="contained" onClick={() => navigate('/login')}>
                    Back to Login
                  </Button>
                  <Button variant="outlined" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </>
              )}

              {status === 'success' && (
                <Button variant="contained" onClick={() => navigate('/')}>
                  Go to Dashboard
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default OAuthSuccess;
