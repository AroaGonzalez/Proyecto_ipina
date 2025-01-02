import React from 'react';
import { Link } from 'react-router-dom';

function Menu() {
  return (
    <nav className="menu">
      <ul>
        <li><Link to="/home">Inicio</Link></li>
        <li><Link to="/pedidos">Gestión de Pedidos</Link></li>
        <li><Link to="/pedidos-pendientes">Pedidos Pendientes</Link></li>
        <li><Link to="/lista-pedidos">Pedidos completados</Link></li>
        <li><Link to="/inventario">Inventario</Link></li>
        <li><Link to="/consultar-tiendas">Consultar Tiendas</Link></li>
        <li><Link to="/pedidos-eliminados">Pedidos Eliminados</Link></li>
        <li><Link to="/profile">Mi Perfil</Link></li>
        <li><Link to="/">Cerrar Sesión</Link></li>
      </ul>
    </nav>
  );
}

export default Menu;
