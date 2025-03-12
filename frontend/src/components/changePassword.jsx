import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/profile.css';

const ChangePassword = () => {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const changePassword = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        'http://localhost:5000/profile/change-password',
        { ...passwordForm },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess(response.data.message);
      setError('');
      setPasswordForm({ currentPassword: '', newPassword: '' });

      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña.');
      setSuccess('');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Cambiar Contraseña</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <label>
        <p>Contraseña Actual:</p>
          <input
            type="password"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
          />
        </label>
        <label>
        <p>Nueva Contraseña:</p>
          <input
            type="password"
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
          />
        </label>
        <div className="button-group">
          <button onClick={changePassword} className="update-button">Actualizar Contraseña</button>
          <button onClick={() => navigate('/profile')} className="cancel-button">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;