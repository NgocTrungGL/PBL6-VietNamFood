import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthAPI } from '../api';

const ProtectedRoute = ({ children }) => {
  if (!AuthAPI.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
