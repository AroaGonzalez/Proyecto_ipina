import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../styles/login.css';
import { LanguageContext } from '../context/LanguageContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { language, setLanguage } = useContext(LanguageContext);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/register', form);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('appLanguage', language);
      alert(t('register.success_message'));
      navigate('/');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setError(t('register.user_exists'));
      } else {
        setError(t('register.error_message'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoginRedirect = () => {
    navigate('/');
  };

  const toggleLanguage = () => {
    const newLang = language === 'es' ? 'en' : 'es';
    setLanguage(newLang);
  };

  return (
    <div className="login-page">
      <div className="logo-container">
        <h1 className="logo">RAM</h1>
      </div>
      
      <div className="language-selector">
        <button onClick={toggleLanguage} className="language-toggle-btn">
          {language === 'es' ? 'EN' : 'ES'}
        </button>
      </div>
      
      <div className="login-form-container">
        <div className="form-header">
          <h2>{t('REGISTRO')}</h2>
          <p>{t('CREAR UNA CUENTA PARA ACCEDER AL SISTEMA')}</p>
        </div>
        
        <form onSubmit={handleRegister} className="login-form">
          <div className="input-label">{t('Nombre de usuario')}</div>
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
          
          <div className="input-label">{t('Contraseña')}</div>
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
            className="register-button"
            disabled={loading}
          >
            {loading ? t('REGISTRANDO...') : t('Registrarse')}
          </button>
          
          <button 
            type="button" 
            className="login-button"
            onClick={handleLoginRedirect}
          >
            {t('Vuelta al inicio de sesión')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;