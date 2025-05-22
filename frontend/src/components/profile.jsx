import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../styles/profile.css';

function Profile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    username: '',
    name: '',
    email: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        setError(t('Error al cargar el perfil'));
        setLoading(false);
      }
    };
    fetchUserProfile();

    const message = localStorage.getItem('profileSuccessMessage');
    if (message) {
      setSuccessMessage(message);
      localStorage.removeItem('profileSuccessMessage');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [t]);

  if (loading) return (
    <div className="profile-container">
      <div className="profile-card shadow">
        <div className="card-header">
          <span className="header-icon">👤</span>
          <h2>{t('Mi Perfil')}</h2>
        </div>
        <div className="loading-indicator">{t('Cargando perfil...')}</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="profile-container">
      <div className="profile-card shadow">
        <div className="card-header">
          <span className="header-icon">👤</span>
          <h2>{t('Mi Perfil')}</h2>
        </div>
        <div className="alert alert-danger">
          {error}
        </div>
        <button 
          className="primary-btn" 
          onClick={() => window.location.reload()}
        >
          {t('Intentar nuevamente')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-card shadow">
        <div className="card-header">
          <span className="header-icon">👤</span>
          <h2>{t('Mi Perfil')}</h2>
        </div>
        
        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}
        
        <div className="profile-info">
          <div className="info-group">
            <label>{t('Nombre de usuario')}:</label>
            <p className="info-value">{profile.username}</p>
          </div>
          
          <div className="info-group">
            <label>{t('Nombre')}:</label>
            <p className="info-value">{profile.name || t('No especificado')}</p>
          </div>
          
          <div className="info-group">
            <label>{t('Email')}:</label>
            <p className="info-value">{profile.email || t('No especificado')}</p>
          </div>
          
          <div className="info-group">
            <label>{t('Dirección')}:</label>
            <p className="info-value">{profile.address || t('No especificada')}</p>
          </div>
        </div>
        
        <div className="button-group">
          <Link to="/edit-profile" className="primary-btn">
            ✏️ {t('Editar perfil')}
          </Link>
          <Link to="/change-password" className="secondary-btn">
            🔑 {t('Cambiar contraseña')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Profile;