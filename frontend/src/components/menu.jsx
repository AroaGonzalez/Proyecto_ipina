import React from 'react';
import { Link } from 'react-router-dom';

function Menu() {
  return (
    <nav className="menu">
      <ul>
        <li><Link to="/home">Inicio</Link></li> {/* Cambia "/" a "/home" */}
        <li><Link to="/pedidos">Gestión de Pedidos</Link></li>
        <li><Link to="/">Iniciar Sesión</Link></li> {/* Login ahora es "/" */}
      </ul>
    </nav>
  );
}

export default Menu;
