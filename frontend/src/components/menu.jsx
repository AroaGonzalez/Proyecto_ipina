import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaChartLine, FaTasks, FaCalendarAlt, FaLightbulb, FaListAlt, FaUser, FaSignOutAlt, FaChevronDown, FaChevronUp, FaGlobe } from 'react-icons/fa';
import { LanguageContext } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import '../styles/menu.css';

function Menu() {
  const location = useLocation();
  const navigate = useNavigate();
  const [parametrizacionOpen, setParametrizacionOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { language, setLanguage } = useContext(LanguageContext);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = language === 'es' ? 'en' : 'es';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/'); // Redirige al login
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <nav className="menu">
      <div className="menu-content">
        <Link to="/home" className={`menu-item ${location.pathname === '/home' ? 'active' : ''}`}>
          <FaHome className="menu-icon" />
          <span>{t('INICIO')}</span>
        </Link>

        <div className={`menu-item dropdown ${parametrizacionOpen ? 'open' : ''}`}>
          <button 
            className="dropdown-trigger"
            onClick={() => setParametrizacionOpen(!parametrizacionOpen)}
          >
            <FaChartLine className="menu-icon" />
            <span>{t('PARAMETRIZACIÓN')}</span>
            {parametrizacionOpen ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </button>
          
          {parametrizacionOpen && (
            <div className="dropdown-content">
              <Link to="/parametrizacion-articulos">
                {t('Parametrización de artículos')}
              </Link>
              <Link to="/consulta-tienda">
                {t('Consulta de tienda')}
              </Link>
              <Link to="/consulta-nuevo-alias">
                {t('Consulta y nuevo Alias')}
              </Link>
              <Link to="/consulta-stocks">
                {t('Consulta stocks')}
              </Link>
            </div>
          )}
        </div>

        <Link to="/tareas" className={`menu-item ${location.pathname === '/tareas' ? 'active' : ''}`}>
          <FaTasks className="menu-icon" />
          <span>{t('TAREAS')}</span>
        </Link>

        <Link to="/eventos" className={`menu-item ${location.pathname === '/eventos' ? 'active' : ''}`}>
          <FaCalendarAlt className="menu-icon" />
          <span>{t('EVENTOS')}</span>
        </Link>

        <Link to="/propuestas" className={`menu-item ${location.pathname === '/propuestas' ? 'active' : ''}`}>
          <FaLightbulb className="menu-icon" />
          <span>{t('PROPUESTAS')}</span>
        </Link>

        <Link to="/recuentos" className={`menu-item ${location.pathname === '/recuentos' ? 'active' : ''}`}>
          <FaListAlt className="menu-icon" />
          <span>{t('RECUENTOS')}</span>
        </Link>
      </div>

      <div className="menu-footer">
        <button onClick={toggleLanguage} className="menu-item language-toggle">
          <FaGlobe className="menu-icon" />
          <span>{language === 'es' ? 'ES' : 'EN'}</span>
        </button>
        <Link to="/profile" className={`menu-item ${location.pathname === '/profile' ? 'active' : ''}`}>
          <FaUser className="menu-icon" />
          <span>{t('Mi Perfil')}</span>
        </Link>
        <button onClick={handleLogoutClick} className="menu-item logout-btn">
          <FaSignOutAlt className="menu-icon" />
          <span>{t('Cerrar Sesión')}</span>
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar cierre de sesión</h3>
            <p>¿Estás seguro de que deseas cerrar la sesión?</p>
            <div className="modal-buttons">
              <button onClick={confirmLogout} className="confirm-btn">Sí, cerrar sesión</button>
              <button onClick={cancelLogout} className="cancel-btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Menu;