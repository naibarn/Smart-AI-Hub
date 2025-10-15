import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, Typography, Alert, Button } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

interface AdminProtectedRouteProps {
  children?: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  children, 
  requiredRoles = ['admin', 'manager'],
  requiredPermissions = ['monitoring:read', 'system:read']
}) => {
  const { isAuthenticated, user } = useSelector((state: { app: any }) => state.app.auth);

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Mock user roles and permissions for now
  // In a real implementation, this would come from the user object or API
  const userRoles = user?.roles || ['user']; // Default to 'user' if no roles
  const userPermissions = user?.permissions || []; // Default to empty if no permissions

  // Check if user has required role
  const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

  // Check if user has required permissions
  const hasRequiredPermissions = requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );

  // If user doesn't have required role or permissions, show access denied
  if (!hasRequiredRole || !hasRequiredPermissions) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        p={3}
      >
        <Alert 
          severity="error" 
          sx={{ mb: 3, maxWidth: 500 }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body2">
            You don't have the required permissions to access the monitoring dashboard.
            This area is restricted to administrators and managers only.
          </Typography>
        </Alert>
        
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary" mb={2}>
            Required roles: {requiredRoles.join(', ')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Your current roles: {userRoles.join(', ') || 'None'}
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => window.location.href = '/dashboard'}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  // If children are provided, render them, otherwise render the Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default AdminProtectedRoute;