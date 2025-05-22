import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../styles/profile.css';

function EditProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setForm({
          name: response.data.name || '',
          email: response.data.email || '',
          address: response.data.address || ''
        });
        setLoading(false);
      } catch (err) {
        setError(t('Error al cargar el perfil'));
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [t]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/profile', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem('profileSuccessMessage', t('Perfil actualizado correctamente'));
      navigate('/profile');
    } catch (err) {
      setError(t('Error al actualizar el perfil'));
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="profile-container">
      <div className="profile-card shadow">
        <div className="card-header">
          <span className="header-icon">✏️</span>
          <h2>{t('Editar Perfil')}</h2>
        </div>
        <div className="loading-indicator">{t('Cargando perfil...')}</div>
      </div>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-card shadow">
        <div className="card-header">
          <span className="header-icon">✏️</span>
          <h2>{t('Editar Perfil')}</h2>
        </div>
        
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('Nombre')}:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-input"
              placeholder={t('Introduce tu nombre')}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">{t('Email')}:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="form-input"
              placeholder={t('Introduce tu email')}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">{t('Dirección')}:</label>
            <input
              type="text"
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="form-input"
              placeholder={t('Introduce tu dirección')}
            />
          </div>
          
          <div className="button-group">
            <button 
              type="submit" 
              className="primary-btn"
              disabled={saving}
            >
              {saving ? t('Guardando...') : t('Guardar cambios')}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate('/profile')}
            >
              {t('Cancelar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;