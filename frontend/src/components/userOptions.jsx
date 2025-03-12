import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/userOptions.css';

const UserOptions = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="footer-options">
            <Link to="/profile" className="footer-link">Mi Perfil</Link>
            <button onClick={handleLogout} className="footer-button">Cerrar Sesión</button>
        </div>
    );
};

export default UserOptions;