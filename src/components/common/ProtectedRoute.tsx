// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <LoadingSpinner />;
  }

  if (requiredRoles && !requiredRoles.includes(user.rol as UserRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
