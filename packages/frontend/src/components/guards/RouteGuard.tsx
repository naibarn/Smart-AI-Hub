import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedTiers?: string[];
  redirectTo?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  allowedTiers,
  redirectTo = '/dashboard',
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedTiers && !allowedTiers.includes(user.tier)) {
    return <Navigate to={redirectTo} />;
  }

  return <>{children}</>;
};
