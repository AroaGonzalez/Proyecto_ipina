import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', address: '' });
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró el token. Por favor, inicia sesión nuevamente.');
        return;
      }
      try {
        const response = await axios.get('http://localhost:5000/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
        setForm({
          name: response.data.name || '',
          email: response.data.email || '',
          address: response.data.address || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Error al obtener el perfil.');
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        'http://localhost:5000/profile',
        { ...form },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile(response.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar los cambios.');
    }
  };

  if (error) return <p className="error-message">{error}</p>;
  if (!profile) return <p className="loading-message">Cargando perfil...</p>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">Perfil del Usuario</h2>
        {isEditing ? (
          <div>
            <label>
              <p>Nombre:</p>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
              />
            </label>
            <label>
              <p>Correo Electrónico:</p>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
              />
            </label>
            <label>
              <p>Dirección:</p>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleInputChange}
              />
            </label>
            <button onClick={saveProfile}>Guardar</button>
            <button onClick={() => setIsEditing(false)}>Cancelar</button>
          </div>
        ) : (
          <div>
            <p><strong>Nombre de Usuario:</strong> {profile.username}</p>
            <p><strong>Nombre:</strong> {profile.name || 'No disponible'}</p>
            <p><strong>Correo Electrónico:</strong> {profile.email || 'No disponible'}</p>
            <p><strong>Dirección:</strong> {profile.address || 'No disponible'}</p>
            <button onClick={() => setIsEditing(true)}>Editar Perfil</button>
            <button onClick={() => navigate('/change-password')}>Cambiar Contraseña</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;