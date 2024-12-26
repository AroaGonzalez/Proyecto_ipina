import React from 'react';
import { Link } from 'react-router-dom';

function Menu() {
  return (
    <nav className="menu">
      <ul>
        <li><Link to="/home">Inicio</Link></li>
        <li><Link to="/pedidos">Gestión de Pedidos</Link></li>
        <li><Link to="/lista-pedidos">Lista de Pedidos</Link></li>
        <li><Link to="/inventario">Inventario</Link></li>
        <li><Link to="/">Iniciar Sesión</Link></li>
      </ul>
    </nav>
  );
}

export default Menu;
