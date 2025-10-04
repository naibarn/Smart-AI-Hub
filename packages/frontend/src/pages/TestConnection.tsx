import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Refresh,
  CloudQueue,
  Security,
  Storage,
  SmartToy,
} from '@mui/icons-material';
import { testConnection, testAllServices } from '../utils/testConnection';
import { authService, coreService, mcpService } from '../services';

interface ServiceStatus {
  name: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  icon: React.ReactNode;
}

const TestConnection: React.FC = () => {
  const [services, setServices] = React.useState<ServiceStatus[]>([
    {
      name: 'API Gateway',
      status: 'idle',
      icon: <CloudQueue />,
    },
    {
      name: 'Auth API',
      status: 'idle',
      icon: <Security />,
    },
    {
      name: 'Core API',
      status: 'idle',
      icon: <Storage />,
    },
    {
      name: 'MCP Server',
      status: 'idle',
      icon: <SmartToy />,
    },
  ]);

  const [globalStatus, setGlobalStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [globalMessage, setGlobalMessage] = React.useState<string>('');

  const testSingleService = async (serviceName: string, serviceIndex: number) => {
    setServices(prev => {
      const updated = [...prev];
      updated[serviceIndex] = { ...updated[serviceIndex], status: 'loading' };
      return updated;
    });

    try {
      let result;
      switch (serviceName) {
        case 'API Gateway':
          result = await testConnection();
          break;
        case 'Auth API':
          result = await authService.healthCheck().then(() => ({ success: true })).catch(() => ({ success: false }));
          break;
        case 'Core API':
          result = await coreService.healthCheck().then(() => ({ success: true })).catch(() => ({ success: false }));
          break;
        case 'MCP Server':
          result = await mcpService.healthCheck().then(() => ({ success: true })).catch(() => ({ success: false }));
          break;
        default:
          result = { success: false };
      }

      setServices(prev => {
        const updated = [...prev];
        updated[serviceIndex] = {
          ...updated[serviceIndex],
          status: result.success ? 'success' : 'error',
          message: result.success ? 'Connection successful' : 'Connection failed',
        };
        return updated;
      });
    } catch (error) {
      setServices(prev => {
        const updated = [...prev];
        updated[serviceIndex] = {
          ...updated[serviceIndex],
          status: 'error',
          message: (error as Error).message || 'Unknown error',
        };
        return updated;
      });
    }
  };

  const testAllConnections = async () => {
    setGlobalStatus('testing');
    setGlobalMessage('Testing all connections...');

    try {
      const results = await testAllServices();
      
      setServices(prev => {
        const updated = [...prev];
        results.forEach((result, index) => {
          if (index < updated.length) {
            updated[index] = {
              ...updated[index],
              status: result.success ? 'success' : 'error',
              message: result.success ? 'Connection successful' : (result.error as Error)?.message || 'Connection failed',
            };
          }
        });
        return updated;
      });

      const allSuccessful = results.every(result => result.success);
      setGlobalStatus(allSuccessful ? 'success' : 'error');
      setGlobalMessage(allSuccessful ? 'All services are connected successfully!' : 'Some services failed to connect');
    } catch (error) {
      setGlobalStatus('error');
      setGlobalMessage((error as Error).message || 'Unknown error occurred');
    }
  };

  const resetTests = () => {
    setServices(prev => prev.map(service => ({ ...service, status: 'idle', message: undefined })));
    setGlobalStatus('idle');
    setGlobalMessage('');
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'loading': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'loading': return <CircularProgress size={24} />;
      default: return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Connection Test
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Test the connection between the frontend and backend services.
      </Typography>

      {globalStatus !== 'idle' && (
        <Alert 
          severity={globalStatus === 'success' ? 'success' : globalStatus === 'error' ? 'error' : 'info'}
          sx={{ mb: 3 }}
        >
          {globalMessage}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Service Status</Typography>
            <Box>
              <Button 
                variant="contained" 
                onClick={testAllConnections}
                disabled={globalStatus === 'testing'}
                startIcon={<Refresh />}
                sx={{ mr: 1 }}
              >
                Test All
              </Button>
              <Button 
                variant="outlined" 
                onClick={resetTests}
                startIcon={<Refresh />}
              >
                Reset
              </Button>
            </Box>
          </Box>

          <List>
            {services.map((service, index) => (
              <React.Fragment key={service.name}>
                <ListItem>
                  <ListItemIcon>
                    {service.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={service.name}
                    secondary={service.message}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={service.status}
                      color={getStatusColor(service.status)}
                      size="small"
                    />
                    {getStatusIcon(service.status)}
                    <Button 
                      size="small"
                      onClick={() => testSingleService(service.name, index)}
                      disabled={service.status === 'loading'}
                    >
                      Test
                    </Button>
                  </Box>
                </ListItem>
                {index < services.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Frontend URL: http://localhost:5173
          </Typography>
          <Typography variant="body2" color="text.secondary">
            API Gateway URL: http://localhost:3000
          </Typography>
          <Typography variant="body2" color="text.secondary">
            API Base URL: {import.meta.env.VITE_API_URL}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestConnection;