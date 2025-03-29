import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';

const PrivateRoute = ({ children }) => {
  const { t } = useTranslation();
  const token = localStorage.getItem('token');

  if (!token) {
    console.log(t('session_required'));
    return <Navigate to="/login" />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const isExpired = decodedToken.exp * 1000 < Date.now();
    
    if (isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log(t('session_expired'));
      return <Navigate to="/login" />;
    }
  } catch (error) {
    console.error(t('invalid_token'), error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;