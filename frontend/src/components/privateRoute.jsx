import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const isExpired = decodedToken.exp * 1000 < Date.now();
    
    if (isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" />;
    }
  } catch (error) {
    console.error('Token inválido:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;