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
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/profile', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/profile');
    } catch (err) {
      setError(t('Error al actualizar el perfil'));
    }
  };

  if (loading) return <div className="loading">{t('Cargando perfil...')}</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>{t('Editar Perfil')}</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('Nombre')}:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
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
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-button">
              {t('Guardar cambios')}
            </button>
            <button 
              type="button" 
              className="cancel-button" 
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