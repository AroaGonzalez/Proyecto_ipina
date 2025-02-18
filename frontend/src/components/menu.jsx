import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../menu.css';  // Importar el CSS del menú

function Menu() {
  const [parametrizacionOpen, setParametrizacionOpen] = useState(false);

  return (
    <nav className="menu">
      <ul>
        <li>
          <Link to="/home">🏠 Inicio</Link>
        </li>

        {/* 🔹 Menú desplegable */}
        <li>
          <button 
            className={`dropdown-btn ${parametrizacionOpen ? "open" : ""}`} 
            onClick={() => setParametrizacionOpen(!parametrizacionOpen)}
          >
            ⚙️ Parametrización
            <i className={`fas fa-chevron-${parametrizacionOpen ? "up" : "down"}`}></i>
          </button>
          <ul className={`dropdown-menu ${parametrizacionOpen ? "open" : ""}`}>
            <li>
              <Link to="/parametrizacion-articulos">📄 Parametrización de artículos</Link>
            </li>
            <li>
              <Link to="/consulta-tienda">🏬 Consulta de tienda</Link>
            </li>
            <li>
              <Link to="/nuevo-alias">🔄 Consulta y nuevo Alias</Link>
            </li>
            <li>
              <Link to="/consulta-stocks">📦 Consulta stocks</Link>
            </li>
          </ul>
        </li>

        <li>
          <Link to="/pedidos-pendientes">📌 Pedidos Pendientes</Link>
        </li>
        <li>
          <Link to="/lista-pedidos">✅ Pedidos Completados</Link>
        </li>
      </ul>

      <div className="footer-options">
        <Link to="/profile" className="footer-link">👤 Mi Perfil</Link>
        <button onClick={() => alert('Sesión cerrada')} className="footer-button">🚪 Cerrar Sesión</button>
      </div>
    </nav>
  );
}

export default Menu;