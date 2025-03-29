// Login.jsx - Solución radical para el cambio de idioma
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../styles/login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem('appLanguage') || 'es');
  
  useEffect(() => {
    const storedLanguage = localStorage.getItem('appLanguage') || 'es';
    setCurrentLanguage(storedLanguage);
    
    i18n.changeLanguage(storedLanguage);
    
    document.title = storedLanguage === 'es' ? 'RAM - Español' : 'RAM - English';
    
    console.log('Idioma actualizado en Login:', storedLanguage);
  }, [i18n]);

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
      localStorage.setItem('token', response.data.token);
      navigate('/home');
    } catch (error) {
      setError(error.response?.data?.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  const handleForgotPassword = () => {
    alert(t('Función de recuperar contraseña en desarrollo'));
  };
  const toggleLanguage = () => {
    const newLang = currentLanguage === 'es' ? 'en' : 'es';
    console.log('Cambiando idioma de', currentLanguage, 'a', newLang);
    
    localStorage.setItem('appLanguage', newLang);
    
    setCurrentLanguage(newLang);
    i18n.changeLanguage(newLang);
    
    window.location.href = window.location.pathname;
  };

  return (
    <div className="login-page">
      <div className="logo-container">
        <h1 className="logo">RAM</h1>
      </div>
      
      <div className="language-selector">
      <button 
        onClick={toggleLanguage} 
        className="language-toggle-btn"
      >
        {currentLanguage === 'es' ? 'ES' : 'EN'}
      </button>
      </div>
      
      <div className="login-form-container">
        <div className="form-header">
          <h2>{t('WELCOME TO RAM')}</h2>
          <p>{t('SIGN IN WITH YOUR EMAIL OR USER ACCOUNT')}</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-label">{t('Username')}</div>
          <div className="form-field">
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="input-label">{t('Password')}</div>
          <div className="form-field password-field">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="form-input"
            />
            <button 
              type="button" 
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? t('INICIANDO...') : t('SIGN IN')}
          </button>
          
          <button 
            type="button" 
            className="register-button"
            onClick={handleRegisterRedirect}
          >
            {t('REGISTER')}
          </button>
          
          <div className="forgot-password">
            <button type="button" onClick={handleForgotPassword}>
              {t('FORGOT YOUR PASSWORD?')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;