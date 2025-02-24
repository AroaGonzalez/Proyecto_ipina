import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChartLine, FaTasks, FaCalendarAlt, FaLightbulb, FaListAlt, FaUser, FaSignOutAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../menu.css';

function Menu() {
  const location = useLocation();
  const [parametrizacionOpen, setParametrizacionOpen] = useState(false);

  return (
    <nav className="menu">
      <div className="menu-content">
        <Link to="/home" className={`menu-item ${location.pathname === '/home' ? 'active' : ''}`}>
          <FaHome className="menu-icon" />
          <span>INICIO</span>
        </Link>

        <div className={`menu-item dropdown ${parametrizacionOpen ? 'open' : ''}`}>
          <button 
            className="dropdown-trigger"
            onClick={() => setParametrizacionOpen(!parametrizacionOpen)}
          >
            <FaChartLine className="menu-icon" />
            <span>PARAMETRIZACIÓN</span>
            {parametrizacionOpen ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </button>
          
          {parametrizacionOpen && (
            <div className="dropdown-content">
              <Link to="/parametrizacion-articulos">
                Parametrización de artículos
              </Link>
              <Link to="/consulta-tienda">
                Consulta de tienda
              </Link>
              <Link to="/nuevo-alias">
                Consulta y nuevo Alias
              </Link>
              <Link to="/consulta-stocks">
                Consulta stocks
              </Link>
            </div>
          )}
        </div>

        <Link to="/tareas" className={`menu-item ${location.pathname === '/tareas' ? 'active' : ''}`}>
          <FaTasks className="menu-icon" />
          <span>TAREAS</span>
        </Link>

        <Link to="/eventos" className={`menu-item ${location.pathname === '/eventos' ? 'active' : ''}`}>
          <FaCalendarAlt className="menu-icon" />
          <span>EVENTOS</span>
        </Link>

        <Link to="/propuestas" className={`menu-item ${location.pathname === '/propuestas' ? 'active' : ''}`}>
          <FaLightbulb className="menu-icon" />
          <span>PROPUESTAS</span>
        </Link>

        <Link to="/recuentos" className={`menu-item ${location.pathname === '/recuentos' ? 'active' : ''}`}>
          <FaListAlt className="menu-icon" />
          <span>RECUENTOS</span>
        </Link>
      </div>

      <div className="menu-footer">
        <Link to="/profile" className={`menu-item ${location.pathname === '/profile' ? 'active' : ''}`}>
          <FaUser className="menu-icon" />
          <span>Mi Perfil</span>
        </Link>
        <button onClick={() => alert('Sesión cerrada')} className="menu-item logout-btn">
          <FaSignOutAlt className="menu-icon" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}

export default Menu;