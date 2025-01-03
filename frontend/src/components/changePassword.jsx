import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../profile.css';

const ChangePassword = () => {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate(); // Hook para navegar entre rutas

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

      // Redirigir al perfil después de 2 segundos
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña.');
      setSuccess('');
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <h2>Cambiar Contraseña</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <label>
          Contraseña Actual:
          <input
            type="password"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange}
          />
        </label>
        <label>
          Nueva Contraseña:
          <input
            type="password"
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
          />
        </label>
        <button onClick={changePassword}>Actualizar Contraseña</button>
      </div>
    </div>
  );
};

export default ChangePassword;