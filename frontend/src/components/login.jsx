// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/login.css';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/login', form);
      
      // Guardar token en localStorage
      localStorage.setItem('token', response.data.token);
      
      // Redirigir al home
      navigate('/home');
    } catch (error) {
      setError(error.response?.data?.message || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>BIENVENIDO A INDITEX</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Usuario o correo corporativo:</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Contraseña:</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="button-group">
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
            <button 
              type="button" 
              className="register-button"
              onClick={handleRegisterRedirect}
            >
              Registrarse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;