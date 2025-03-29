import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/userOptions.css';

const UserOptions = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="footer-options">
            <Link to="/profile" className="footer-link">{t('Mi Perfil')}</Link>
            <button onClick={handleLogout} className="footer-button">{t('Cerrar Sesión')}</button>
        </div>
    );
};

export default UserOptions;