import React, { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/home.css';
import { LanguageContext } from '../context/LanguageContext';
import { jwtDecode } from 'jwt-decode';

const Home = () => {
  const { t } = useTranslation();
  const { language } = useContext(LanguageContext);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get the user's name from token or localStorage
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        setUserName(decoded.username || '');
      }
    } catch (error) {
      console.error('Error getting username:', error);
    }
  }, []);

  return (
    <div className="home-container">
      <div className="welcome-message">
        <h1>{t('HOLA')}, {userName.toUpperCase()}</h1>
        <p>{t('Te damos la bienvenida a la herramienta de reposición automática de materiales')}</p>
      </div>
      
      <div className="dashboard-grid">
                  <div className="dashboard-card">
          <div className="card-icon material-icon">
            <i className="fas fa-box"></i>
          </div>
          <div className="card-content">
            <h3>{t('Gestión de materiales')}</h3>
            <p>{t('Consulta y modifica los materiales disponibles en el sistema')}</p>
            <Link to="/parametrizacion-articulos" className="card-link">{t('Acceder')}</Link>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-icon store-icon">
            <i className="fas fa-store"></i>
          </div>
          <div className="card-content">
            <h3>{t('Consulta de tiendas')}</h3>
            <p>{t('Visualiza información detallada de las tiendas registradas')}</p>
            <Link to="/consulta-tienda" className="card-link">{t('Acceder')}</Link>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-icon task-icon">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="card-content">
            <h3>{t('Tareas pendientes')}</h3>
            <p>{t('Gestiona las tareas asignadas y pendientes')}</p>
            <Link to="/tareas" className="card-link">{t('Acceder')}</Link>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-icon report-icon">
            <i className="fas fa-chart-bar"></i>
          </div>
          <div className="card-content">
            <h3>{t('Informes y estadísticas')}</h3>
            <p>{t('Visualiza informes sobre reposición y consumo')}</p>
            <Link to="/informes" className="card-link">{t('Acceder')}</Link>
          </div>
        </div>
      </div>
      
      <div className="quick-access">
        <h2>{t('Acceso rápido')}</h2>
        <div className="quick-links">
          <Link to="/parametrizacion-articulos" className="quick-link-item">
            <span className="quick-link-icon"><i className="fas fa-cog"></i></span>
            <span>{t('Parametrización de artículos')}</span>
          </Link>
          <Link to="/nuevo-alias" className="quick-link-item">
            <span className="quick-link-icon"><i className="fas fa-tag"></i></span>
            <span>{t('Consulta y nuevo Alias')}</span>
          </Link>
          <Link to="/consulta-stocks" className="quick-link-item">
            <span className="quick-link-icon"><i className="fas fa-warehouse"></i></span>
            <span>{t('Consulta stocks')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;