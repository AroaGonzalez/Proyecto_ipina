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
  }, [t]);

  if (loading) return <div className="loading">{t('Cargando perfil...')}</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>{t('Mi Perfil')}</h1>
        
        <div className="profile-info">
          <div className="info-group">
            <label>{t('Nombre de usuario')}:</label>
            <p>{profile.username}</p>
          </div>
          
          <div className="info-group">
            <label>{t('Nombre')}:</label>
            <p>{profile.name || t('No especificado')}</p>
          </div>
          
          <div className="info-group">
            <label>{t('Email')}:</label>
            <p>{profile.email || t('No especificado')}</p>
          </div>
          
          <div className="info-group">
            <label>{t('Dirección')}:</label>
            <p>{profile.address || t('No especificada')}</p>
          </div>
        </div>
        
        <div className="profile-actions">
          <Link to="/edit-profile" className="edit-button">
            {t('Editar perfil')}
          </Link>
          <Link to="/change-password" className="password-button">
            {t('Cambiar contraseña')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Profile;