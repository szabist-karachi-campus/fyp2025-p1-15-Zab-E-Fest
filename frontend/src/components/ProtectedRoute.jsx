import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProtectedRoute component to handle route protection based on authentication and roles
 * 
 * @param {Object} props - Component props
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 * @param {string} props.redirectTo - Path to redirect if not authenticated or not authorized
 * @returns {JSX.Element} - Protected route component
 */
const ProtectedRoute = ({ 
  allowedRoles = [], // Array of allowed roles for this route
  redirectTo = '/login' // Default redirect path for unauthenticated users
}) => {
  // Get authentication state and user role from Redux store
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const userRole = useSelector((state) => state.auth.role);
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // If allowedRoles array is empty or includes user's role, grant access
  if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
    return <Outlet />;
  }
  
  // If user's role is not in the allowed roles list, redirect to appropriate dashboard
  const redirectPath = getDashboardByRole(userRole);
  return <Navigate to={redirectPath} replace />;
};

/**
 * Helper function to get the appropriate dashboard path based on user role
 * 
 * @param {string} role - User role
 * @returns {string} - Dashboard path
 */
const getDashboardByRole = (role) => {
  switch (role) {
    case 'admin':
      return '/admindashboard';
    case 'registrationTeam':
      return '/registrationTeam';
    case 'ModuleHead':
      return '/moduleHeadDashboard';
    case 'ModuleLeader':
      return '/moduleLeaderDashboard';
    default:
      return '/login';
  }
};

export default ProtectedRoute; 