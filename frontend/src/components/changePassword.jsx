import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../styles/profile.css';

function ChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [passwordForm, setPasswordForm] = useState({ 
    currentPassword: '', 
    newPassword: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError(t('Debes completar ambos campos'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError(t('La nueva contraseña debe tener al menos 6 caracteres'));
      return;
    }

    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.put(
        'http://localhost:5000/profile/change-password',
        { ...passwordForm },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess(response.data.message || t('Contraseña actualizada con éxito'));
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setLoading(false);

      localStorage.setItem('profileSuccessMessage', t('Contraseña actualizada correctamente'));
      
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || t('Error al cambiar la contraseña'));
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card shadow">
        <div className="card-header">
          <span className="header-icon">🔒</span>
          <h2>{t('Cambiar Contraseña')}</h2>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <div className="form-group">
          <label htmlFor="currentPassword">{t('Contraseña Actual')}:</label>
          <div className="password-input-container">
            <input
              type={showCurrentPassword ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="form-input"
              placeholder={t('Ingresa tu contraseña actual')}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={showCurrentPassword ? t('Ocultar contraseña') : t('Mostrar contraseña')}
            >
              {showCurrentPassword ? "👁️‍🗨️" : "👁️"}
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="newPassword">{t('Nueva Contraseña')}:</label>
          <div className="password-input-container">
            <input
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="form-input"
              placeholder={t('Ingresa tu nueva contraseña')}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? t('Ocultar contraseña') : t('Mostrar contraseña')}
            >
              {showNewPassword ? "👁️‍🗨️" : "👁️"}
            </button>
          </div>
          {passwordForm.newPassword && passwordForm.newPassword.length < 6 && (
            <div className="password-hint">{t('La contraseña debe tener al menos 6 caracteres')}</div>
          )}
        </div>
        
        <div className="button-group">
          <button 
            onClick={changePassword} 
            className="primary-btn"
            disabled={loading}
          >
            {loading ? t('Actualizando...') : t('Actualizar Contraseña')}
          </button>
          <button 
            onClick={() => navigate('/profile')} 
            className="secondary-btn"
          >
            {t('Cancelar')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;