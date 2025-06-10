// src/components/ProtectedRoute.js
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ user, children }) => {
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      alert('Login First'); // 👈 Show alert when unauthenticated
    }
  }, [user, location]);

  if (!user) {
    return <Navigate to="/log" replace />;
  }

  return children;
};

export default ProtectedRoute;
